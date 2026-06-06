import express from 'express';

const router = express.Router();

router.get('/roblox', (req, res) => {
  res.json({
    ok: true,
    message: 'Roblox login route placeholder'
  });
});

router.get('/roblox/callback', (req, res) => {
  res.json({
    ok: true,
    message: 'Roblox callback placeholder'
  });
});

router.post('/verify-hcpc', (req, res) => {
  res.json({
    ok: true,
    message: 'HCPC PIN verification placeholder'
  });
});

export default router;
