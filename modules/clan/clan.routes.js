import { Router } from 'express';
import { getClan, registerClan } from './clan.controllers.js';
import { verifyUser } from '../../middlewares/verifyToken.js';

const router = Router();

// The middleware runs first. If they don't have a token, it stops here.
router.use(verifyUser); 

router.get('/:tag', getClan);
router.post('/register', registerClan);

export const ClanRoutes = router;