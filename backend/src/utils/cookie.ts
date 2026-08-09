import { CookieOptions } from 'express';

export function getAuthCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax', // Lax works for same-origin proxy and provides stronger default CSRF protection across mobile & incognito
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days (matches JWT expiration)
  };
}
