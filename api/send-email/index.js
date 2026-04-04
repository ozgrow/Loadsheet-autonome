var jwt = require("jsonwebtoken");
var nodemailer = require("nodemailer");

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

  // Sanitize subject (strip CRLF to prevent header injection)
  body.subject = String(body.subject).replace(/[\r\n]/g, ' ').substring(0, 500);

  // Validate email addresses
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function validateEmails(str) {
    return str.split(",").map(function(e) { return e.trim(); }).filter(Boolean).filter(function(e) {
      return emailRegex.test(e);
    });
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

  var validTo = validateEmails(body.recipients);
  if (validTo.length === 0) {
    context.res = { status: 400, body: { error: "Aucune adresse email valide dans recipients." } };
    return;
  }
  var toList = validTo.join(", ");
  // Merge CC from request + env var
  var ccParts = body.cc ? validateEmails(body.cc) : [];
  if (process.env.SMTP_CC_DEFAULT) {
    validateEmails(process.env.SMTP_CC_DEFAULT).forEach(function(addr) {
      if (ccParts.indexOf(addr) === -1) ccParts.push(addr);
    });
  }
  var ccList = ccParts.join(", ");

  try {
    var mailOptions = {
      from: fromAddr,
      to: toList,
      cc: ccList || undefined,
      subject: body.subject,
      html: body.htmlBody
    };

    if (body.pdfBase64 && body.pdfFilename) {
      mailOptions.attachments = [{
        filename: body.pdfFilename,
        content: Buffer.from(body.pdfBase64, 'base64'),
        contentType: 'application/pdf'
      }];
    }

    var info = await transporter.sendMail(mailOptions);

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
