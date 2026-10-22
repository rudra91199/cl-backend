import { Router } from 'express';
import { getCwl } from './cwl.controllers.js';
import { verifyUser } from '../../middlewares/verifyToken.js'; // 1. Import the bouncer

const router = Router();

// 2. Add verifyUser BEFORE getCwl so req.user gets populated
router.get('/:tag', verifyUser, getCwl);

export const CwlRoutes = router;