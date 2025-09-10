import { Router } from 'express';
import authRoutes from './auth.routes.js';
import predictionsRoutes from './predictions.routes.js';
import pointsRoutes from './points.routes.js';
import resultsRoutes from './results.routes.js';
import rankingsRoutes from './rankings.routes.js';
import matchesRoutes from './matches.routes.js';
import crestsRoutes from './crests.routes.js';

const router = Router();

// Public
router.use('/', authRoutes);
router.use('/results', resultsRoutes.public);
router.use('/rankings', rankingsRoutes);
router.use('/matches', matchesRoutes);   // ⬅️ important
router.use('/crests', crestsRoutes);

// Protégées
router.use('/predictions', predictionsRoutes);
router.use('/points', pointsRoutes);

export default router;
