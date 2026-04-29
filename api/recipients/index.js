// ============================================
// Azure Function /api/recipients (Phase 4 — LST-08, LST-09, LST-10, LST-12)
// ============================================
// GET  /api/recipients  → returns array of distribution lists from Azure Blob Storage.
//                         First access (BlobNotFound 404) returns [] (D-19 / LST-12).
// PUT  /api/recipients  → replaces the blob entirely with payload (last-write-wins).
//                         Defense-in-depth email validation per list (D-14).
// Auth: header `x-auth-token` (JWT, JWT_SECRET) — Azure SWA strips Authorization.
// ============================================

var jwt = require("jsonwebtoken");
var { BlobServiceClient } = require("@azure/storage-blob");

var CONTAINER = process.env.RECIPIENTS_CONTAINER || "loadsheet-data";
var BLOB_NAME = process.env.RECIPIENTS_BLOB_NAME || "recipients-lists.json";

// --- Auth (pattern identique à send-email/index.js verifyToken) ---
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

// --- Validation emails (regex source de vérité — copie de send-email validateEmails) ---
var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var angleBracketRegex = /<([^>]+)>/;
function validateEmails(str) {
  return String(str || '').split(/[,;]/).map(function(e) { return e.trim(); })
    .filter(Boolean).map(function(e) {
      var m = angleBracketRegex.exec(e);
      return m ? m[1].trim() : e;
    }).filter(function(e) { return emailRegex.test(e); });
}

// --- Validation payload de listes (defense in depth D-14) ---
function validateLists(payload) {
  if (!Array.isArray(payload)) return { ok: false, error: "Payload doit etre un array." };
  for (var i = 0; i < payload.length; i++) {
    var l = payload[i];
    if (!l || typeof l !== 'object') return { ok: false, error: "Liste " + i + " invalide." };
    if (typeof l.id !== 'string' || !l.id) return { ok: false, error: "Liste " + i + " : id manquant." };
    if (typeof l.name !== 'string' || !l.name.trim()) return { ok: false, error: "Liste " + i + " : nom manquant." };
    if (typeof l.recipients !== 'string') return { ok: false, error: "Liste " + i + " : recipients manquant." };
    // D-14 : revérifier les adresses au PUT (le frontend les a déjà validées au save)
    var raw = l.recipients.split(/[,;]/).map(function(e){ return e.trim(); }).filter(Boolean);
    var valid = validateEmails(l.recipients);
    if (raw.length !== valid.length) {
      return { ok: false, error: "Liste \"" + l.name + "\" contient des adresses invalides." };
    }
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

async function readLists() {
  var bbc = getBlockBlobClient();
  try {
    var buf = await bbc.downloadToBuffer();
    var parsed = JSON.parse(buf.toString('utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    // D-19 / LST-12 : Blob inexistant au premier accès → état initial vide
    if (err && (err.statusCode === 404 || (err.details && err.details.errorCode === 'BlobNotFound'))) {
      return [];
    }
    throw err;
  }
}

async function writeLists(lists) {
  var bbc = getBlockBlobClient();
  var body = JSON.stringify(lists);
  // upload(body, contentLength, options) — overwrite par défaut pour BlockBlob.
  // Pitfall 5 : Buffer.byteLength('utf-8') au lieu de body.length pour gérer les caractères multi-bytes (é, →).
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
      var lists = await readLists();
      context.res = {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: lists
      };
      return;
    }

    if (req.method === 'PUT') {
      var body = req.body;
      var v = validateLists(body);
      if (!v.ok) {
        context.res = { status: 400, body: { error: v.error } };
        return;
      }
      await writeLists(body);
      context.res = { status: 200, body: { success: true, count: body.length } };
      return;
    }

    context.res = { status: 405, body: { error: "Method not allowed." } };
  } catch (err) {
    if (context && context.log && context.log.error) {
      context.log.error("Recipients error:", err.message);
    }
    context.res = { status: 500, body: { error: "Erreur stockage: " + err.message } };
  }
};
