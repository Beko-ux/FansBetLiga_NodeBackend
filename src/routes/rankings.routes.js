import { Router } from 'express';
import { daily, firstRound, overall } from '../controllers/rankings.controller.js';

const r = Router();
r.get('/daily', daily);
r.get('/first-round', firstRound);
r.get('/overall', overall);

export default r;
