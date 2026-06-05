import express from 'express';
import { supabase } from '../services/supabase.js';
import { requireAuth, requireHCPC } from '../middleware/auth.js';
import { sendAnnouncementToDiscord } from '../services/discord.js';

const router = express.Router();

for (const table of ['documents', 'vacancies', 'information_pages', 'announcements']) {
  router.get(`/${table}`, async (req, res) => {
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  router.post(`/${table}`, requireAuth, requireHCPC, async (req, res) => {
    const { data, error } = await supabase.from(table).insert({ ...req.body, created_by: req.user.staffId }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    if (table === 'announcements' && req.body.send_to_discord) await sendAnnouncementToDiscord(data);
    res.json(data);
  });

  router.patch(`/${table}/:id`, requireAuth, requireHCPC, async (req, res) => {
    const { data, error } = await supabase.from(table).update(req.body).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });
}

export default router;
