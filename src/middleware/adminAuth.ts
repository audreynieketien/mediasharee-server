import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

/**
 * Middleware to protect admin routes
 * Requires x-admin-secret header to match the configured secret
 */
export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const adminSecret = req.headers['x-admin-secret'];

  if (!adminSecret || adminSecret !== config.adminApiSecret) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing admin secret',
    });
  }

  next();
};
