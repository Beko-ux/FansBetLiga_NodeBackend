// import jwt from 'jsonwebtoken';

// export function auth(req, res, next) {
//   const header = req.headers.authorization || '';
//   const token = header.startsWith('Bearer ') ? header.slice(7) : null;

//   if (!token) return res.status(401).json({ message: 'Unauthorized' });

//   try {
//     const payload = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = { id: payload.id, email: payload.email };
//     next();
//   } catch {
//     return res.status(401).json({ message: 'Invalid token' });
//   }
// }



import jwt from 'jsonwebtoken';

export function auth(req, res, next) {
  const raw = req.get('authorization') || '';
  const token = raw.replace(/^Bearer\s+/i, '').trim();

  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.user = { id: payload.id, email: payload.email };
    return next();
  } catch (err) {
    // Utile pour debug (voir `docker compose logs -f api`)
    console.error('JWT verify error:', err.name, err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
}
