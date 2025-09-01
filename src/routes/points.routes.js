import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { index, store } from '../controllers/points.controller.js';

const r = Router();
r.use(auth);
r.get('/', index);
r.post('/', store);

export default r;
