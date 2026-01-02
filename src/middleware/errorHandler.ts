import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
  stack?: string;
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  // Zod validation errors
  if (err instanceof z.ZodError) {
    const response: ErrorResponse = {
      error: 'Validation Error',
      message: 'Request validation failed',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    };
    res.status(400).json(response);
    return;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const response: ErrorResponse = {
      error: 'Validation Error',
      message: err.message,
      details: Object.values(err.errors).map((e: any) => ({
        field: e.path,
        message: e.message,
      })),
    };
    res.status(400).json(response);
    return;
  }

  // Mongoose cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    const response: ErrorResponse = {
      error: 'Invalid ID',
      message: `Invalid ${err.path}: ${err.value}`,
    };
    res.status(400).json(response);
    return;
  }

  // Duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const response: ErrorResponse = {
      error: 'Duplicate Entry',
      message: `${field} already exists`,
    };
    res.status(409).json(response);
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    const response: ErrorResponse = {
      error: 'Authentication Error',
      message: 'Invalid or expired token',
    };
    res.status(401).json(response);
    return;
  }

  // Default error
  const response: ErrorResponse = {
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(err.status || 500).json(response);
};
