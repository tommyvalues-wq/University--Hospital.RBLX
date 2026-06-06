import express from 'express';

const router = express.Router();

router.get('/announcements', (req, res) => {
  res.json({ ok: true, announcements: [] });
});

router.get('/vacancies', (req, res) => {
  res.json({ ok: true, vacancies: [] });
});

router.get('/information', (req, res) => {
  res.json({ ok: true, information: [] });
});

export default router;
