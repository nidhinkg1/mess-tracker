import { Router } from 'express';
import { register, login, logout, me, resetPassword } from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateJWT, me);
router.post('/reset-password', authenticateJWT, resetPassword);

export default router;
