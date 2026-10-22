import { Router } from 'express';
import { getLiveRaid } from './capital.controllers.js';
import { verifyUser } from '../../middlewares/verifyToken.js';

const router = Router();

router.get('/live', verifyUser, getLiveRaid);
router.get('/live/:tag', verifyUser, getLiveRaid);

export const CapitalRoutes = router;