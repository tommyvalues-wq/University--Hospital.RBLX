// Put this in your website JS and change the URL after you deploy the backend.
const API_BASE = 'https://https://uhh-backend.onrender.com';

function getToken() {
  return localStorage.getItem('uhh_auth_token');
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...(options.headers || {})
    }
  });
 const redirectUrl = new URL(
  `${process.env.PUBLIC_SITE_URL}/staff-portal.html`
);
}

function startRobloxLogin() {
  window.location.href = `${API_BASE}/auth/roblox`;
}
