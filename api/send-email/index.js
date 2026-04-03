const jwt = require("jsonwebtoken");
const { EmailClient } = require("@azure/communication-email");

function verifyToken(req) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

module.exports = async function (context, req) {
  // Auth check
  const user = verifyToken(req);
  if (!user) {
    context.res = { status: 401, body: { error: "Non autorisé. Veuillez vous connecter." } };
    return;
  }

  const { recipients, cc, subject, htmlBody } = req.body || {};

  if (!recipients || !subject || !htmlBody) {
    context.res = { status: 400, body: { error: "Champs requis : recipients, subject, htmlBody." } };
    return;
  }

  const connectionString = process.env.ACS_CONNECTION_STRING;
  const senderAddress = process.env.ACS_SENDER_ADDRESS;

  if (!connectionString || !senderAddress) {
    context.res = { status: 500, body: { error: "Configuration ACS manquante." } };
    return;
  }

  // Build recipient list
  const toRecipients = recipients
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean)
    .map((address) => ({ address }));

  const ccRecipients = cc
    ? cc.split(",").map((e) => e.trim()).filter(Boolean).map((address) => ({ address }))
    : [];

  try {
    const client = new EmailClient(connectionString);

    const message = {
      senderAddress,
      content: { subject, html: htmlBody },
      recipients: {
        to: toRecipients,
        ...(ccRecipients.length > 0 && { cc: ccRecipients }),
      },
    };

    const poller = await client.beginSend(message);
    const result = await poller.pollUntilDone();

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { success: true, messageId: result.id },
    };
  } catch (err) {
    context.log.error("ACS send error:", err.message);
    context.res = { status: 500, body: { error: "Erreur lors de l'envoi de l'email." } };
  }
};
