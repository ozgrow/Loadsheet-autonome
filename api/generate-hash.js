/**
 * Utilitaire pour générer le hash bcrypt du mot de passe partagé.
 * Usage : node generate-hash.js MON_MOT_DE_PASSE
 * Copier le résultat dans la variable AUTH_PASSWORD_HASH sur Azure.
 */
const bcrypt = require("bcryptjs");

const password = process.argv[2];
if (!password) {
  console.error("Usage : node generate-hash.js <mot_de_passe>");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log("\nHash bcrypt à configurer dans AUTH_PASSWORD_HASH :");
console.log(hash);
