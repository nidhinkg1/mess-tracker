import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createExceptionSchema, updateExceptionSchema } from '../validators/exception.validator';
import * as exceptionService from '../services/exception.service';

export async function createException(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    // Validate date and type, ignoring any user-submitted amount field
    const validated = createExceptionSchema.parse(req.body);
    const exception = await exceptionService.createException(userId, validated);
    res.status(201).json(exception);
  } catch (error) {
    next(error);
  }
}

export async function getExceptions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
    const exceptions = await exceptionService.getUserExceptions(userId, page, limit);
    res.status(200).json(exceptions);
  } catch (error) {
    next(error);
  }
}

export async function getExceptionById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const exception = await exceptionService.getExceptionById(userId, id);
    res.status(200).json(exception);
  } catch (error) {
    next(error);
  }
}

export async function updateException(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const validated = updateExceptionSchema.parse(req.body);
    const exception = await exceptionService.updateException(userId, id, validated);
    res.status(200).json(exception);
  } catch (error) {
    next(error);
  }
}

export async function deleteException(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const result = await exceptionService.deleteException(userId, id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
