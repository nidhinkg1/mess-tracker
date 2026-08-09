import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'mess_expense_tracker_super_secret_jwt_key_2026';

export interface TokenPayload {
  userId: string;
  email: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
