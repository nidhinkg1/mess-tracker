import { Router } from 'express';
import { getMonthlyBilling } from '../controllers/billing.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/monthly', getMonthlyBilling);

export default router;
