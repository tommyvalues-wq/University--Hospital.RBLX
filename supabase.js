import express from 'express';
import { supabase } from '../services/supabase.js';
import { requireAuth, requireHCPC } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('staff').select('id,name,roblox_id,rank,roles,speciality,status,loa_until').eq('id', req.user.staffId).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/', requireAuth, requireHCPC, async (req, res) => {
  const { data, error } = await supabase.from('staff').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', requireAuth, requireHCPC, async (req, res) => {
  const payload = req.body;
  const { data, error } = await supabase.from('staff').insert(payload).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.patch('/:id', requireAuth, requireHCPC, async (req, res) => {
  const { data, error } = await supabase.from('staff').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  await supabase.from('audit_logs').insert({ actor_staff_id: req.user.staffId, action: 'staff_updated', target_id: req.params.id, details: req.body });
  res.json(data);
});

export default router;
