import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import prisma from '../prisma/client';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export async function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  // Read token from HttpOnly cookie first, fallback to Authorization header
  const tokenFromCookie = req.cookies?.auth_token;
  const tokenFromHeader = req.headers?.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;

  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    res.status(401).json({ error: 'Authentication token required' });
    return;
  }

  try {
    const payload = verifyToken(token);

    // Verify that the user still exists in database to prevent foreign key issues
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true }
    });

    if (!dbUser) {
      res.status(401).json({ error: 'Session expired or user no longer exists. Please sign in again.' });
      return;
    }

    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token. Please sign in again.' });
  }
}
