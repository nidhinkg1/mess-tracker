import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createPaymentSchema, updatePaymentSchema } from '../validators/payment.validator';
import * as paymentService from '../services/payment.service';

export async function createPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const validated = createPaymentSchema.parse(req.body);
    const payment = await paymentService.createPayment(userId, validated);
    res.status(201).json(payment);
  } catch (error) {
    next(error);
  }
}

export async function getPayments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const payments = await paymentService.getUserPayments(userId);
    res.status(200).json(payments);
  } catch (error) {
    next(error);
  }
}

export async function getPaymentById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const payment = await paymentService.getPaymentById(userId, id);
    res.status(200).json(payment);
  } catch (error) {
    next(error);
  }
}

export async function updatePayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const validated = updatePaymentSchema.parse(req.body);
    const payment = await paymentService.updatePayment(userId, id, validated);
    res.status(200).json(payment);
  } catch (error) {
    next(error);
  }
}

export async function deletePayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const result = await paymentService.deletePayment(userId, id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
