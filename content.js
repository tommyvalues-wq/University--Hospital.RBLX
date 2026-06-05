import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { supabase } from '../services/supabase.js';

const router = express.Router();

router.get('/roblox', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.ROBLOX_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.ROBLOX_REDIRECT_URI,
    scope: 'openid profile'
  });
  res.redirect(`https://apis.roblox.com/oauth/v1/authorize?${params.toString()}`);
});

router.get('/roblox/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send('Missing Roblox auth code.');

    const tokenResponse = await axios.post('https://apis.roblox.com/oauth/v1/token', new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.ROBLOX_CLIENT_ID,
      client_secret: process.env.ROBLOX_CLIENT_SECRET,
      redirect_uri: process.env.ROBLOX_REDIRECT_URI
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }});

    const userInfo = await axios.get('https://apis.roblox.com/oauth/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
    });

    const robloxId = String(userInfo.data.sub);
    const { data: staff, error } = await supabase
      .from('staff')
      .select('*')
      .eq('roblox_id', robloxId)
      .eq('status', 'Active')
      .single();

    if (error || !staff) {
      return res.redirect(`${process.env.PUBLIC_SITE_URL}/login.html?error=not_registered`);
    }

    const pendingToken = jwt.sign({ robloxId, staffId: staff.id, pendingPin: true }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.redirect(`${process.env.PUBLIC_SITE_URL}/login.html?verify=${encodeURIComponent(pendingToken)}`);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.redirect(`${process.env.PUBLIC_SITE_URL}/login.html?error=roblox_failed`);
  }
});

router.post('/verify-hcpc-pin', async (req, res) => {
  try {
    const { pendingToken, pin } = req.body;
    const decoded = jwt.verify(pendingToken, process.env.JWT_SECRET);
    if (!decoded.pendingPin) return res.status(400).json({ error: 'Invalid verification token' });

    const { data: staff, error } = await supabase.from('staff').select('*').eq('id', decoded.staffId).single();
    if (error || !staff) return res.status(404).json({ error: 'Staff record not found' });
    if (String(staff.hcpc_pin) !== String(pin).trim()) return res.status(403).json({ error: 'Incorrect HCPC PIN' });

    const token = jwt.sign({
      staffId: staff.id,
      robloxId: staff.roblox_id,
      name: staff.name,
      roles: staff.roles || [],
      speciality: staff.speciality
    }, process.env.JWT_SECRET, { expiresIn: '8h' });

    res.json({ token, staff: { id: staff.id, name: staff.name, roles: staff.roles, rank: staff.rank, speciality: staff.speciality }});
  } catch {
    res.status(401).json({ error: 'Verification expired. Please log in again.' });
  }
});

export default router;
