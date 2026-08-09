import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as shareService from '../services/share.service';

export async function createShareLink(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { year, month } = req.body;
    const result = await shareService.createOrGetShareToken(userId, year, month);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function revokeShareLink(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { year, month } = req.body;
    const result = await shareService.revokeShareToken(userId, year, month);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getShareStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const year = req.query.year ? String(req.query.year) : String(new Date().getFullYear());
    const month = req.query.month ? String(req.query.month) : String(new Date().getMonth() + 1);

    const result = await shareService.getShareStatus(userId, year, month);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getPublicStatement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.params;
    const statement = await shareService.getPublicMonthlyStatement(token);
    res.status(200).json(statement);
  } catch (error) {
    next(error);
  }
}
