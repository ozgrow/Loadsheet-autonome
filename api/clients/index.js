// ============================================
// Azure Function /api/clients (Phase 5 — CLI-01, CLI-02, CLI-05, CLI-07)
// ============================================
// GET  /api/clients  -> returns array of clients from Azure Blob Storage.
//                       First access (BlobNotFound 404) returns [] (D-20 / CLI-01).
// PUT  /api/clients  -> replaces the blob entirely with payload (last-write-wins).
//                       Defense-in-depth validation : Array + id + code non-vide + unicite case-sensitive (D-05/D-06 / CLI-05).
// Auth: header `x-auth-token` (JWT, JWT_SECRET) — Azure SWA strips Authorization.
// ============================================

var jwt = require("jsonwebtoken");
var { BlobServiceClient } = require("@azure/storage-blob");

var CONTAINER = process.env.CLIENTS_CONTAINER || "loadsheet-data";
var BLOB_NAME = process.env.CLIENTS_BLOB_NAME || "clients.json";

// --- Auth (pattern identique a send-email/index.js verifyToken) ---
function verifyToken(req) {
  // Azure SWA strips Authorization header, so check x-auth-token header
  var token = req.headers["x-auth-token"] || null;
  if (!token) {
    var auth = req.headers["authorization"] || "";
    token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  }
  if (!token) return null;
  try { return jwt.verify(token, process.env.JWT_SECRET); }
  catch (e) { return null; }
}

// --- Validation payload clients (defense in depth D-05/D-06 — CLI-05) ---
// Schema attendu : Array d'objets { id: string non-vide, code: string non-vide apres trim }
// Unicite des `code` case-sensitive (D-05).
function validateClients(payload) {
  if (!Array.isArray(payload)) return { ok: false, error: "Payload doit etre un array." };
  var seen = {};
  for (var i = 0; i < payload.length; i++) {
    var c = payload[i];
    if (!c || typeof c !== 'object') return { ok: false, error: "Client " + i + " invalide." };
    if (typeof c.id !== 'string' || !c.id) return { ok: false, error: "Client " + i + " : id manquant." };
    if (typeof c.code !== 'string' || !c.code.trim()) return { ok: false, error: "Client " + i + " : code manquant." };
    // D-05 unicite case-sensitive (pas de toLowerCase)
    if (seen[c.code]) return { ok: false, error: "Code deja existant : \"" + c.code + "\"" };
    seen[c.code] = true;
  }
  return { ok: true };
}

// --- Storage helpers ---
function getBlockBlobClient() {
  var conn = process.env.STORAGE_CONNECTION_STRING;
  if (!conn) throw new Error("STORAGE_CONNECTION_STRING manquante.");
  var svc = BlobServiceClient.fromConnectionString(conn);
  var container = svc.getContainerClient(CONTAINER);
  return container.getBlockBlobClient(BLOB_NAME);
}

async function readClients() {
  var bbc = getBlockBlobClient();
  try {
    var buf = await bbc.downloadToBuffer();
    var parsed = JSON.parse(buf.toString('utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    // D-20 / CLI-01 : Blob inexistant au premier acces -> etat initial vide
    if (err && (err.statusCode === 404 || (err.details && err.details.errorCode === 'BlobNotFound'))) {
      return [];
    }
    throw err;
  }
}

async function writeClients(clients) {
  var bbc = getBlockBlobClient();
  var body = JSON.stringify(clients);
  // upload(body, contentLength, options) — overwrite par defaut pour BlockBlob.
  // Buffer.byteLength('utf-8') au lieu de body.length pour gerer caracteres multi-bytes (e, accents codes clients).
  await bbc.upload(body, Buffer.byteLength(body, 'utf-8'), {
    blobHTTPHeaders: { blobContentType: 'application/json; charset=utf-8' }
  });
}

// --- Main handler ---
module.exports = async function (context, req) {
  var user = verifyToken(req);
  if (!user) {
    context.res = { status: 401, body: { error: "Non autorise." } };
    return;
  }

  try {
    if (req.method === 'GET') {
      var clients = await readClients();
      context.res = {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: clients
      };
      return;
    }

    if (req.method === 'PUT') {
      var body = req.body;
      var v = validateClients(body);
      if (!v.ok) {
        context.res = { status: 400, body: { error: v.error } };
        return;
      }
      await writeClients(body);
      context.res = { status: 200, body: { success: true, count: body.length } };
      return;
    }

    context.res = { status: 405, body: { error: "Method not allowed." } };
  } catch (err) {
    if (context && context.log && context.log.error) {
      context.log.error("Clients error:", err.message);
    }
    context.res = { status: 500, body: { error: "Erreur stockage: " + err.message } };
  }
};
