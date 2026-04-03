// --- Auth module ---

const AUTH_TOKEN_KEY = "loadsheet_token";

function getToken() {
  return sessionStorage.getItem(AUTH_TOKEN_KEY);
}

function setToken(token) {
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
}

function clearToken() {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
}

function isLoggedIn() {
  const token = getToken();
  if (!token) return false;
  // Check expiry from JWT payload
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

async function login(username, password) {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erreur de connexion");
  setToken(data.token);
  return true;
}

function logout() {
  clearToken();
  showLogin();
}

function authHeaders() {
  return { Authorization: "Bearer " + getToken() };
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

// --- Login form handler ---
function initAuth() {
  if (isLoggedIn()) {
    showApp();
    return;
  }
  showLogin();

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("loginBtn");
    const errEl = document.getElementById("loginError");
    const username = document.getElementById("loginUser").value.trim();
    const password = document.getElementById("loginPass").value;

    btn.disabled = true;
    btn.textContent = "Connexion...";
    errEl.textContent = "";

    try {
      await login(username, password);
      showApp();
    } catch (err) {
      errEl.textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = "Se connecter";
    }
  });
}

document.addEventListener("DOMContentLoaded", initAuth);
