// import { Router } from 'express';
// import { auth } from '../middleware/auth.js';
// import { index, store, storeBatch } from '../controllers/predictions.controller.js';

// const r = Router();
// r.use(auth);
// r.get('/', index);
// r.post('/', store);
// r.post('/batch', storeBatch);

// export default r;



// src/routes/predictions.routes.js
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { index, store, storeBatch } from '../controllers/predictions.controller.js';

const r = Router();

// Réponses CORS pour les préflights sur ce segment
r.options('/', (_req, res) => res.sendStatus(204));
r.options('/batch', (_req, res) => res.sendStatus(204));

// Protéger ensuite les routes par JWT
r.use(auth);

r.get('/', index);
r.post('/', store);
r.post('/batch', storeBatch);

export default r;
