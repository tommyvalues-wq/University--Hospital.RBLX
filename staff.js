import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.uhh_token;
  if (!token) return res.status(401).json({ error: 'Not logged in' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired login' });
  }
}

export function requireHCPC(req, res, next) {
  const roles = req.user?.roles || [];
  const hcpcRoles = ['HCPC', 'Clinical Director', 'Medical Director', 'Director of Nursing', 'Chief Executive Officer', 'Administrator'];
  if (!roles.some(r => hcpcRoles.includes(r))) return res.status(403).json({ error: 'HCPC access required' });
  next();
}
