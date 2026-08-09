import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as billingService from '../services/billing.service';

export async function getMonthlyBilling(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const currentDate = new Date();

    const year = req.query.year ? String(req.query.year) : String(currentDate.getFullYear());
    const month = req.query.month ? String(req.query.month) : String(currentDate.getMonth() + 1);

    const billing = await billingService.calculateMonthlyBilling(userId, year, month);
    res.status(200).json(billing);
  } catch (error) {
    next(error);
  }
}
