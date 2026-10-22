import { Router } from 'express';
import { getPlayer } from './player.controllers.js';

const router = Router();
router.get('/:tag', getPlayer);

// Named export exactly like your BroadcastTickerRoutes
export const PlayerRoutes = router;