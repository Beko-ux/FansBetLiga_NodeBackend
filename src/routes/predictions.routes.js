import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { index, store, storeBatch } from '../controllers/predictions.controller.js';

const r = Router();
r.use(auth);
r.get('/', index);
r.post('/', store);
r.post('/batch', storeBatch);

export default r;
