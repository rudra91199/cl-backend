import { Router } from 'express';
import {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  linkVillage,
  unlinkVillage,
  getMe
} from './auth.controllers.js';
import { verifyUser } from '../../middlewares/verifyToken.js';

const router = Router();

// Public Auth Routes
router.post('/register', register);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected Profile & Multi-Village Management Routes
router.get('/me', verifyUser, getMe);
router.post('/link-village', verifyUser, linkVillage);
router.delete('/unlink-village/:tag', verifyUser, unlinkVillage);

export const AuthRoutes = router;