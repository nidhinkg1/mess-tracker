import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema, resetPasswordSchema } from '../validators/auth.validator';
import * as authService from '../services/auth.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = registerSchema.parse(req.body);
    const result = await authService.registerUser(validated);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await authService.loginUser(validated);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }
    const user = await authService.getUserProfile(req.user.userId);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }
    const validated = resetPasswordSchema.parse(req.body);
    const result = await authService.resetPassword(req.user.userId, validated);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
