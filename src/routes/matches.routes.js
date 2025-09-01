import { Router } from 'express';

const r = Router();

// Dans ton Laravel, le controller est vide => on renvoie un placeholder explicite
r.get('/:matchday/:matchId', (req, res) => {
  return res.status(501).json({ message: 'Not implemented yet' });
});

export default r;
