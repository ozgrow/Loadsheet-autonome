const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

module.exports = async function (context, req) {
  const { username, password } = req.body || {};

  if (!username || !password) {
    context.res = { status: 400, body: { error: "Identifiant et mot de passe requis." } };
    return;
  }

  const validUsername = process.env.AUTH_USERNAME;
  const passwordHash = process.env.AUTH_PASSWORD_HASH;
  const jwtSecret = process.env.JWT_SECRET;

  if (!validUsername || !passwordHash || !jwtSecret) {
    context.res = { status: 500, body: { error: "Configuration serveur manquante." } };
    return;
  }

  if (username !== validUsername) {
    context.res = { status: 401, body: { error: "Identifiants invalides." } };
    return;
  }

  const valid = await bcrypt.compare(password, passwordHash);
  if (!valid) {
    context.res = { status: 401, body: { error: "Identifiants invalides." } };
    return;
  }

  const token = jwt.sign({ sub: username }, jwtSecret, { expiresIn: "8h" });

  context.res = {
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: { token },
  };
};
