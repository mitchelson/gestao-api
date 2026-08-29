import type { NextFunction, Request, Response } from 'express';

/**
 * Compatibilidade com pib-app / legado Next: paths `/api/*` → `/v1/*`.
 * Permite OTA só trocando EXPO_PUBLIC_API_URL sem reescrever cada chamada.
 */
export function apiCompatMiddleware(req: Request, _res: Response, next: NextFunction) {
  const raw = req.url ?? '';
  if (raw === '/api' || raw.startsWith('/api/') || raw.startsWith('/api?')) {
    req.url = `/v1${raw.slice(4) || ''}`;
  }
  next();
}
