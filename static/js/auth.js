// --- Auth module (provisoire — mot de passe partagé côté client) ---

const AUTH_SESSION_KEY = "loadsheet_auth";
const RATE_LIMIT_KEY = "loadsheet_rl";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8h
const COOLDOWN_MS = 5000; // 5s entre chaque tentative
const MAX_ATTEMPTS_PER_HOUR = 100;
const HOUR_MS = 60 * 60 * 1000;

// SHA-256 hash du mot de passe (ne PAS mettre le mot de passe en clair ici)
// Pour generer un nouveau hash : console navigateur →
//   crypto.subtle.digest('SHA-256', new TextEncoder().encode('NEW_PASSWORD'))
//     .then(b => Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join(''))
//     .then(console.log)
const VALID_PASSWORD_HASH = "1a1acba0fae420eb939f616a75b92beee82f1c983f89c8f20a4806e75c9241b8";

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// --- Rate limiting (localStorage pour persister entre onglets/refreshs) ---
function getRateLimit() {
  try {
    const data = JSON.parse(localStorage.getItem(RATE_LIMIT_KEY));
    if (!data) return { attempts: [], lastAttempt: 0 };
    return data;
  } catch {
    return { attempts: [], lastAttempt: 0 };
  }
}

function saveRateLimit(rl) {
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(rl));
}

function checkRateLimit() {
  const now = Date.now();
  const rl = getRateLimit();

  // Cooldown 5s depuis la dernière tentative
  const sinceLastAttempt = now - rl.lastAttempt;
  if (sinceLastAttempt < COOLDOWN_MS) {
    const wait = Math.ceil((COOLDOWN_MS - sinceLastAttempt) / 1000);
    return { allowed: false, message: `Patientez ${wait}s avant de réessayer.` };
  }

  // Max 100 tentatives par heure glissante
  const oneHourAgo = now - HOUR_MS;
  const recentAttempts = rl.attempts.filter((t) => t > oneHourAgo);
  if (recentAttempts.length >= MAX_ATTEMPTS_PER_HOUR) {
    const oldestRecent = Math.min(...recentAttempts);
    const unlocksIn = Math.ceil((oldestRecent + HOUR_MS - now) / 60000);
    return { allowed: false, message: `Trop de tentatives. Réessayez dans ~${unlocksIn} min.` };
  }

  return { allowed: true };
}

function recordAttempt() {
  const now = Date.now();
  const rl = getRateLimit();
  const oneHourAgo = now - HOUR_MS;
  rl.attempts = rl.attempts.filter((t) => t > oneHourAgo);
  rl.attempts.push(now);
  rl.lastAttempt = now;
  saveRateLimit(rl);
}

// --- Session ---
function isLoggedIn() {
  const session = sessionStorage.getItem(AUTH_SESSION_KEY);
  if (!session) return false;
  try {
    const data = JSON.parse(session);
    // Guard defensif (Phase 3 D-03) : rejet strict si expiry manquant, non-numerique, NaN, Infinity ou null.
    // Evite le bug ou `undefined <= Date.now()` retourne false et isLoggedIn retourne true sans expiry valide.
    if (!data || typeof data.expiry !== 'number' || !isFinite(data.expiry)) return false;
    if (data.expiry <= Date.now()) return false;
    // Crypto key must be present for encrypted storage
    if (!sessionStorage.getItem('loadsheet_ck')) return false;
    return true;
  } catch {
    return false;
  }
}

function setSession(jwtToken) {
  var data = { expiry: Date.now() + SESSION_DURATION_MS };
  if (jwtToken) data.jwt = jwtToken;
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(data));
}

function getJwt() {
  try {
    var data = JSON.parse(sessionStorage.getItem(AUTH_SESSION_KEY));
    return data && data.jwt ? data.jwt : null;
  } catch (e) { return null; }
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
  if (typeof initApp === "function") initApp();
}

// --- Countdown timer on button ---
function startCooldownTimer(btn) {
  const rl = getRateLimit();
  const remaining = COOLDOWN_MS - (Date.now() - rl.lastAttempt);
  if (remaining <= 0) return;

  btn.disabled = true;
  const interval = setInterval(() => {
    const left = COOLDOWN_MS - (Date.now() - rl.lastAttempt);
    if (left <= 0) {
      clearInterval(interval);
      btn.disabled = false;
      btn.textContent = "Se connecter";
      return;
    }
    btn.textContent = `Patientez ${Math.ceil(left / 1000)}s...`;
  }, 250);
}

// --- Login form handler ---
async function initAuth() {
  // Show version on login screen
  var verEl = document.getElementById("loginVersion");
  if (verEl && typeof APP_VERSION !== "undefined") verEl.textContent = "v" + APP_VERSION;

  if (isLoggedIn()) {
    showApp();
    return;
  }
  showLogin();

  const btn = document.getElementById("loginBtn");
  // Restore cooldown state on page load
  startCooldownTimer(btn);

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = document.getElementById("loginError");
    const password = document.getElementById("loginPass").value;

    // Rate limit check
    const rl = checkRateLimit();
    if (!rl.allowed) {
      errEl.textContent = rl.message;
      return;
    }

    btn.disabled = true;
    btn.textContent = "Vérification...";
    errEl.textContent = "";

    recordAttempt();

    const hash = await sha256(password);

    if (hash === VALID_PASSWORD_HASH) {
      // Derive AES key for encrypted localStorage
      if (typeof deriveAndStoreKey === 'function') {
        await deriveAndStoreKey(password);
      }
      // Also get JWT from backend for API calls
      var jwtToken = null;
      try {
        var res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "loadsheet", password: password })
        });
        if (res.ok) {
          var d = await res.json();
          jwtToken = d.token;
        }
      } catch (e) { /* backend not available, OK for local dev */ }
      setSession(jwtToken);
      showApp();
    } else {
      errEl.textContent = "Mot de passe incorrect.";
      startCooldownTimer(btn);
    }
  });
}

document.addEventListener("DOMContentLoaded", initAuth);
