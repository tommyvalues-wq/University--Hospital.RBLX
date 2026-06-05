import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import axios from 'axios';
import authRoutes from './routes/auth.js';
import staffRoutes from './routes/staff.js';
import requestRoutes from './routes/requests.js';
import contentRoutes from './routes/content.js';
import { sendWebhook } from './services/discord.js';

const app = express();
app.use(cors({ origin: process.env.PUBLIC_SITE_URL, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 60_000, max: 120 }));

app.get('/', (req, res) => res.json({ ok: true, service: 'UHH secure backend' }));
app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use('/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api', contentRoutes);

let lastWebsiteUp = null;
async function checkWebsiteStatus() {
  const url = process.env.WEBSITE_TO_MONITOR;
  if (!url || !process.env.STATUS_WEBHOOK_URL) return;
  let up = false;
  try {
    const response = await axios.get(url, { timeout: 15000 });
    up = response.status >= 200 && response.status < 400;
  } catch { up = false; }
  if (lastWebsiteUp !== null && up !== lastWebsiteUp) {
    await sendWebhook(process.env.STATUS_WEBHOOK_URL, {
      username: 'UHH Website Status',
      content: up ? `✅ UHH website is back online: ${url}` : `🚨 UHH website appears to be down: ${url}`
    });
  }
  lastWebsiteUp = up;
}

const minutes = Number(process.env.CHECK_EVERY_MINUTES || 5);
cron.schedule(`*/${minutes} * * * *`, checkWebsiteStatus);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`UHH backend running on port ${port}`));
