import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let statusCode = err.statusCode || (err.status ? err.status : 500);
  let message = err.message || 'Internal Server Error';

  // Handle Zod Validation Errors as HTTP 400
  if (err.name === 'ZodError' || (err.issues && Array.isArray(err.issues))) {
    statusCode = 400;
    message = err.issues ? err.issues.map((i: any) => i.message).join(', ') : 'Validation error';
  }

  // Log error internally for debugging
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error ${statusCode}]: ${message}`, err.stack);
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { details: err.details || err.issues })
  });
}
