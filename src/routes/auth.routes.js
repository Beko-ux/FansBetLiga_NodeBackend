// import { Router } from 'express';
// import { register, login } from '../controllers/auth.controller.js';

// const r = Router();
// r.post('/register', register);
// r.post('/login', login);

// export default r;


import { Router } from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { auth } from '../middleware/auth.js';

const r = Router();
r.post('/register', register);
r.post('/login', login);

// Test: retourne l'utilisateur décodé si le token est bon
r.get('/me', auth, (req, res) => {
  res.json({ user: req.user });
});

export default r;
