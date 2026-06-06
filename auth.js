const API_BASE = "https://uhh-backend.onrender.com";

function getToken() {
  return localStorage.getItem("uhh_auth_token");
}

function setToken(token) {
  localStorage.setItem("uhh_auth_token", token);
}

function logout() {
  localStorage.removeItem("uhh_auth_token");
  window.location.href = "login.html";
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }

  return data;
}

function startRobloxLogin() {
  window.location.href = `${API_BASE}/auth/roblox`;
}

function handleLoginRedirect() {
  const params = new URLSearchParams(window.location.search);

  if (params.get("login") === "success") {
    const robloxId = params.get("robloxId");
    const robloxName = params.get("robloxName");

    if (robloxId) {
      localStorage.setItem("uhh_roblox_id", robloxId);
    }

    if (robloxName) {
      localStorage.setItem("uhh_roblox_name", robloxName);
    }

    window.history.replaceState({}, document.title, "staff-portal.html");

    const loginBox = document.getElementById("loginBox");
    const portal = document.getElementById("staffPortalContent");

    if (loginBox) loginBox.style.display = "none";
    if (portal) portal.style.display = "block";
  }

  if (params.get("login") === "failed") {
    alert("Login failed. Please try again.");
  }
}

document.addEventListener("DOMContentLoaded", handleLoginRedirect);
