// // src/routes/index.js
// import { Router } from 'express';

// import authRoutes from './auth.routes.js';
// import predictionsRoutes from './predictions.routes.js';
// import pointsRoutes from './points.routes.js';
// import resultsRoutes from './results.routes.js';
// import rankingsRoutes from './rankings.routes.js';
// import matchesRoutes from './matches.routes.js';
// import crestsRoutes from './crests.routes.js';

// const router = Router();

// // --- Public
// router.use('/', authRoutes);                 // /register, /login
// router.use('/results', resultsRoutes.public); // GET /api/results
// router.use('/rankings', rankingsRoutes);      // GET /api/rankings/...
// router.use('/matches', matchesRoutes);        // GET /api/matches & /api/matches/current
// router.use('/crests', crestsRoutes);          // proxy logos

// // --- Protégées (JWT)
// router.use('/predictions', predictionsRoutes); // GET/POST /api/predictions
// router.use('/points', pointsRoutes);           // GET/POST /api/points

// export default router;




// // src/routes/index.js
// import { Router } from 'express';
// import authRoutes from './auth.routes.js';
// import predictionsRoutes from './predictions.routes.js';
// import pointsRoutes from './points.routes.js';
// import resultsRoutes from './results.routes.js';
// import rankings from '../controllers/rankings.controller.js';
// import matchesRoutes from './matches.routes.js';
// import crestsRoutes from './crests.routes.js';

// const router = Router();

// // Public
// router.use('/', authRoutes);
// router.use('/results', resultsRoutes.public);
// router.get('/rankings/daily', rankings.daily);
// router.get('/rankings/first-round', rankings.firstRound);
// router.get('/rankings/overall', rankings.overall);
// router.use('/matches', matchesRoutes);
// router.use('/crests', crestsRoutes);

// // Protegées
// router.use('/predictions', predictionsRoutes);
// router.use('/points', pointsRoutes);

// export default router;




// src/routes/index.js
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import predictionsRoutes from './predictions.routes.js';
import pointsRoutes from './points.routes.js';
import resultsRoutes from './results.routes.js';
import * as rankings from '../controllers/rankings.controller.js'; // << ICI
import matchesRoutes from './matches.routes.js';
import crestsRoutes from './crests.routes.js';

const router = Router();

// Public
router.use('/', authRoutes);
router.use('/results', resultsRoutes.public);
router.get('/rankings/daily', rankings.daily);
router.get('/rankings/first-round', rankings.firstRound);
router.get('/rankings/overall', rankings.overall);
router.use('/matches', matchesRoutes);
router.use('/crests', crestsRoutes);

// Protégées
router.use('/predictions', predictionsRoutes);
router.use('/points', pointsRoutes);

export default router;
