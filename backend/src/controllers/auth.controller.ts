import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema, resetPasswordSchema } from '../validators/auth.validator';
import * as authService from '../services/auth.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { getAuthCookieOptions } from '../utils/cookie';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = registerSchema.parse(req.body);
    const result = await authService.registerUser(validated);

    // Set HttpOnly cookie
    res.cookie('auth_token', result.token, getAuthCookieOptions());

    res.status(201).json({
      user: result.user
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await authService.loginUser(validated);

    // Set HttpOnly cookie
    res.cookie('auth_token', result.token, getAuthCookieOptions());

    res.status(200).json({
      user: result.user
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Clear HttpOnly auth cookie using matching options (omitting maxAge)
    const { maxAge, ...clearOptions } = getAuthCookieOptions();
    res.clearCookie('auth_token', clearOptions);
    res.status(200).json({ message: 'Logged out successfully' });
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
