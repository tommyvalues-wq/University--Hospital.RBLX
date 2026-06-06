require('dotenv').config();

const WEBSITE_URL = process.env.WEBSITE_URL;
const STATUS_WEBHOOK_URL = process.env.STATUS_WEBHOOK_URL;
const CHECK_EVERY_SECONDS = Number(process.env.CHECK_EVERY_SECONDS || 300);

let lastOnline = null;

if (!WEBSITE_URL || !STATUS_WEBHOOK_URL) {
  console.error('Missing WEBSITE_URL or STATUS_WEBHOOK_URL in .env');
  process.exit(1);
}

async function postDiscord(content) {
  const res = await fetch(STATUS_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'UHH Website Status', content })
  });
  if (!res.ok) console.error(`Discord webhook failed: ${res.status}`);
}

async function checkWebsite() {
  const started = Date.now();
  try {
    const res = await fetch(WEBSITE_URL, { method: 'GET', cache: 'no-store' });
    const ms = Date.now() - started;
    const online = res.ok;

    if (lastOnline === null) {
      lastOnline = online;
      await postDiscord(`${online ? '✅' : '🚨'} Initial website status: **${online ? 'UP' : 'DOWN'}** (${res.status}) — ${WEBSITE_URL}`);
      return;
    }

    if (online !== lastOnline) {
      lastOnline = online;
      await postDiscord(`${online ? '✅ Website is back UP' : '🚨 Website is DOWN'} — status ${res.status}, ${ms}ms
${WEBSITE_URL}`);
    } else {
      console.log(`${new Date().toISOString()} ${online ? 'UP' : 'DOWN'} ${res.status} ${ms}ms`);
    }
  } catch (error) {
    if (lastOnline !== false) {
      lastOnline = false;
      await postDiscord(`🚨 Website check failed, likely DOWN: ${error.message}
${WEBSITE_URL}`);
    }
    console.error(error);
  }
}

checkWebsite();
setInterval(checkWebsite, CHECK_EVERY_SECONDS * 1000);
