import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '../models/User';

export const verifyToken: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header',
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;

    req.auth = {
      userId: decoded.userId, 
    };
    User.findById(decoded.userId)
      .then(user => {
        if (!user) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'User no longer exists',
          });
        }
        req.user = user;
        next();
      })
      .catch(err => next(err));
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
};

export const requireRole = (role: 'consumer' | 'creator'): RequestHandler => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Role '${role}' required to access this resource`,
      });
    }

    next();
  };
};

export const optionalAuth: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    req.auth = {
      userId: decoded.userId,
    };
    
     User.findById(decoded.userId)
      .then(user => {
        if (user) {
          req.user = user;
        }
        next();
      })
      .catch(() => next());
  } catch (error) {
    next();
  }
};
