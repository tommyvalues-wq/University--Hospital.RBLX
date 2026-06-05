import express from 'express';
import { supabase } from '../services/supabase.js';
import { requireAuth, requireHCPC } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  const { type, reason, requested_speciality, leave_until } = req.body;
  const { data, error } = await supabase.from('staff_requests').insert({
    staff_id: req.user.staffId, type, reason, requested_speciality, leave_until, status: 'Pending'
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/', requireAuth, async (req, res) => {
  let query = supabase.from('staff_requests').select('*, staff(name,rank,speciality)').order('created_at', { ascending: false });
  if (!(req.user.roles || []).some(r => ['HCPC','Administrator','Clinical Director','Medical Director','Chief Executive Officer'].includes(r))) {
    query = query.eq('staff_id', req.user.staffId);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.patch('/:id/decision', requireAuth, requireHCPC, async (req, res) => {
  const { decision, note } = req.body;
  if (!['Approved', 'Denied'].includes(decision)) return res.status(400).json({ error: 'Decision must be Approved or Denied' });

  const { data: request, error: loadError } = await supabase.from('staff_requests').select('*').eq('id', req.params.id).single();
  if (loadError) return res.status(404).json({ error: 'Request not found' });

  const { data, error } = await supabase.from('staff_requests').update({
    status: decision, decision_note: note || null, decided_by: req.user.staffId, decided_at: new Date().toISOString()
  }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });

  if (decision === 'Approved') {
    if (request.type === 'speciality_change') {
      await supabase.from('staff').update({ speciality: request.requested_speciality }).eq('id', request.staff_id);
    }
    if (request.type === 'leave_of_absence') {
      await supabase.from('staff').update({ status: 'LOA', loa_until: request.leave_until }).eq('id', request.staff_id);
    }
    if (request.type === 'discharge') {
      await supabase.from('staff').update({ status: 'Discharged' }).eq('id', request.staff_id);
    }
  }

  await supabase.from('audit_logs').insert({ actor_staff_id: req.user.staffId, action: `request_${decision.toLowerCase()}`, target_id: req.params.id, details: data });
  res.json(data);
});

export default router;
