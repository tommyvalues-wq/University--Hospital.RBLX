require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
let latestVacancyUpdates = [];
let lastWebsiteStatus = null;

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'UHH backend' }));
app.get('/api/vacancy-updates', (req, res) => res.json(latestVacancyUpdates));

// Placeholder route. Implement Roblox OAuth token exchange here using your Roblox OAuth app.
app.get('/auth/roblox/start', (req, res) => {
  res.status(501).send('Configure Roblox OAuth client details, then redirect users to Roblox authorization here.');
});

async function postWebhook(content) {
  const url = process.env.DISCORD_UPDATES_WEBHOOK_URL;
  if (!url) return;
  await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'UHH Website Monitor', content }) });
}

async function checkWebsite() {
  const site = process.env.SITE_URL;
  if (!site) return;
  try {
    const r = await fetch(site, { method: 'GET' });
    const up = r.ok;
    if (lastWebsiteStatus !== null && up !== lastWebsiteStatus) await postWebhook(up ? `✅ Website is back up: ${site}` : `🚨 Website appears down. Status ${r.status}: ${site}`);
    lastWebsiteStatus = up;
  } catch (err) {
    if (lastWebsiteStatus !== false) await postWebhook(`🚨 Website check failed: ${err.message}`);
    lastWebsiteStatus = false;
  }
}
setInterval(checkWebsite, 5 * 60 * 1000);
checkWebsite();

if (process.env.DISCORD_BOT_TOKEN) {
  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
  client.on('messageCreate', msg => {
    if (msg.channelId !== process.env.DISCORD_VACANCIES_CHANNEL_ID || msg.author.bot) return;
    const update = { id: msg.id, title: 'Discord vacancy update', content: msg.content, author: msg.author.username, createdAt: msg.createdAt.toISOString(), url: msg.url };
    latestVacancyUpdates.unshift(update);
    latestVacancyUpdates = latestVacancyUpdates.slice(0, 50);
  });
  client.login(process.env.DISCORD_BOT_TOKEN).catch(err => console.error('Discord login failed:', err.message));
}

app.listen(PORT, () => console.log(`UHH backend running on port ${PORT}`));
