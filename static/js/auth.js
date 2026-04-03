// --- Auth module (provisoire — mot de passe partagé côté client) ---

const AUTH_SESSION_KEY = "loadsheet_auth";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8h

// SHA-256 hash of the password (generated below for "Loadsheet2024!")
// To change: run in browser console:
//   crypto.subtle.digest('SHA-256', new TextEncoder().encode('NEW_PASSWORD'))
//     .then(b => Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join(''))
//     .then(console.log)
const VALID_PASSWORD_HASH = "1a1acba0fae420eb939f616a75b92beee82f1c983f89c8f20a4806e75c9241b8";

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function isLoggedIn() {
  const session = sessionStorage.getItem(AUTH_SESSION_KEY);
  if (!session) return false;
  try {
    const { expiry } = JSON.parse(session);
    return expiry > Date.now();
  } catch {
    return false;
  }
}

function setSession() {
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ expiry: Date.now() + SESSION_DURATION_MS }));
}

function logout() {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  showLogin();
}

// --- UI toggle ---
function showLogin() {
  document.getElementById("loginScreen").style.display = "flex";
  document.getElementById("appScreen").style.display = "none";
}

function showApp() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("appScreen").style.display = "block";
}

// --- Compute actual hash on first load, then use it ---
let actualPasswordHash = null;

async function initPasswordHash() {
  // Hash the real password once to set VALID_PASSWORD_HASH
  // For "Loadsheet2024!" — run this once, then hardcode
  actualPasswordHash = VALID_PASSWORD_HASH;
}

// --- Login form handler ---
async function initAuth() {
  await initPasswordHash();

  if (isLoggedIn()) {
    showApp();
    return;
  }
  showLogin();

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("loginBtn");
    const errEl = document.getElementById("loginError");
    const password = document.getElementById("loginPass").value;

    btn.disabled = true;
    btn.textContent = "Connexion...";
    errEl.textContent = "";

    const hash = await sha256(password);

    if (hash === actualPasswordHash) {
      setSession();
      showApp();
    } else {
      errEl.textContent = "Mot de passe incorrect.";
    }

    btn.disabled = false;
    btn.textContent = "Se connecter";
  });
}

document.addEventListener("DOMContentLoaded", initAuth);
