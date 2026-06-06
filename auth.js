const API_BASE = "https://uhh-backend.onrender.com";

function getToken() {
  return localStorage.getItem("uhh_auth_token");
}

function setToken(token) {
  if (token) {
    localStorage.setItem("uhh_auth_token", token);
  }
}

function clearLogin() {
  localStorage.removeItem("uhh_auth_token");
  localStorage.removeItem("uhh_roblox_id");
  localStorage.removeItem("uhh_roblox_name");
}

function logout() {
  clearLogin();
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
  const loginStatus = params.get("login");

  if (loginStatus === "success") {
    const robloxId = params.get("robloxId");
    const robloxName = params.get("robloxName");
    const token = params.get("token");

    if (robloxId) localStorage.setItem("uhh_roblox_id", robloxId);
    if (robloxName) localStorage.setItem("uhh_roblox_name", robloxName);
    if (token) setToken(token);

    showStaffPortal();

    window.history.replaceState({}, document.title, "staff-portal.html");
  }

  if (loginStatus === "failed") {
    clearLogin();
    alert("Roblox login failed. Please try again.");
  }
}

function showStaffPortal() {
  const loginBox = document.getElementById("loginBox");
  const portalContent = document.getElementById("staffPortalContent");
  const robloxNameBox = document.getElementById("robloxName");

  if (loginBox) loginBox.style.display = "none";
  if (portalContent) portalContent.style.display = "block";

  const robloxName = localStorage.getItem("uhh_roblox_name");
  if (robloxNameBox && robloxName) {
    robloxNameBox.textContent = robloxName;
  }
}

function requireLogin() {
  const robloxId = localStorage.getItem("uhh_roblox_id");

  if (robloxId) {
    showStaffPortal();
    return true;
  }

  const loginBox = document.getElementById("loginBox");
  const portalContent = document.getElementById("staffPortalContent");

  if (loginBox) loginBox.style.display = "block";
  if (portalContent) portalContent.style.display = "none";

  return false;
}

document.addEventListener("DOMContentLoaded", () => {
  handleLoginRedirect();
  requireLogin();
});
