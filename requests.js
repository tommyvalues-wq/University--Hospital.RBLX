import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ ok: true, requests: [] });
});

router.post('/', (req, res) => {
  res.json({ ok: true, message: 'Request received', request: req.body });
});

export default router;
