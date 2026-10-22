// src/modules/war/war.routes.js
import { Router } from 'express';
import { getClanWar, getPlayerWarAttacks } from './war.controllers.js';
import { verifyUser } from '../../middlewares/verifyToken.js';

const router = Router();

// Live Clan War + Archived Clan Wars
router.get('/clan/:tag', verifyUser, getClanWar);

// Player's Recent War Attacks (Classic + CWL) for Player Terminal
router.get('/player/:tag', verifyUser, getPlayerWarAttacks);

export const WarRoutes = router;