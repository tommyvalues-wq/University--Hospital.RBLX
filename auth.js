const API_BASE = "https://uhh-backend.onrender.com";

function getToken() {
  return localStorage.getItem("uhh_auth_token");
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

  return response.json();
}

function startRobloxLogin() {
  window.location.href = `${API_BASE}/auth/roblox`;
}
