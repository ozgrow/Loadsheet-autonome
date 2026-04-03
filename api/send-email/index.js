var jwt = require("jsonwebtoken");
var nodemailer = require("nodemailer");

function verifyToken(req) {
  var auth = req.headers["authorization"] || "";
  var token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  try { return jwt.verify(token, process.env.JWT_SECRET); }
  catch (e) { return null; }
}

module.exports = async function (context, req) {
  var user = verifyToken(req);
  if (!user) {
    context.res = { status: 401, body: { error: "Non autorise." } };
    return;
  }

  var body = req.body || {};
  if (!body.recipients || !body.subject || !body.htmlBody) {
    context.res = { status: 400, body: { error: "Champs requis : recipients, subject, htmlBody." } };
    return;
  }

  var host = process.env.SMTP_HOST;
  var port = parseInt(process.env.SMTP_PORT) || 587;
  var smtpUser = process.env.SMTP_USER;
  var smtpPass = process.env.SMTP_PASS;
  var fromAddr = process.env.SMTP_FROM;

  if (!host || !smtpUser || !smtpPass || !fromAddr) {
    context.res = { status: 500, body: { error: "Configuration SMTP manquante." } };
    return;
  }

  var transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: false,
    requireTLS: true,
    auth: { user: smtpUser, pass: smtpPass }
  });

  var toList = body.recipients.split(",").map(function(e) { return e.trim(); }).filter(Boolean).join(", ");
  var ccList = body.cc ? body.cc.split(",").map(function(e) { return e.trim(); }).filter(Boolean).join(", ") : "";

  try {
    var info = await transporter.sendMail({
      from: fromAddr,
      to: toList,
      cc: ccList || undefined,
      subject: body.subject,
      html: body.htmlBody
    });

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { success: true, messageId: info.messageId }
    };
  } catch (err) {
    context.log.error("SMTP error:", err.message);
    context.res = { status: 500, body: { error: "Erreur envoi email: " + err.message } };
  }
};
