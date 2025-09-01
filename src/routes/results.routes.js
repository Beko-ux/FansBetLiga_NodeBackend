import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { index, store } from '../controllers/results.controller.js';

const publicRouter = Router();
publicRouter.get('/', index);

const protectedRouter = Router();
protectedRouter.use(auth);
protectedRouter.post('/', store);

export default {
  public: publicRouter,
  protected: protectedRouter
};
