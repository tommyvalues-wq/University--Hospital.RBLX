// Put this in your website JS and change the URL after you deploy the backend.
const API_BASE = 'https://YOUR_BACKEND_URL';

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
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'API request failed');
  return data;
}

function startRobloxLogin() {
  window.location.href = `${API_BASE}/auth/roblox`;
}
export default router;
