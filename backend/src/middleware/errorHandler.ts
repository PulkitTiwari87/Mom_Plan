import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';
import { safeLogger } from './sanitize';

const GENERIC_SERVER_MESSAGE = 'Something went wrong. Please try again later.';
const GENERIC_UNAVAILABLE_MESSAGE = 'Service temporarily unavailable. Please try again.';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  // Determine if it is a client-side error (4xx) or an internal server error (500+)
  let isInternalError = true;
  let statusCode = 500;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    isInternalError = statusCode >= 500;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    isInternalError = false;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    isInternalError = false;
  }

  if (isInternalError) {
    safeLogger.error('Internal error caught by middleware:', err);
  } else {
    safeLogger.warn(`Client error (${statusCode}) caught by middleware: ${err.message}`);
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        statusCode: err.statusCode,
      },
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: err.flatten().fieldErrors,
        statusCode: 400,
      },
    });
  }

  // Handle JWT errors gracefully
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid or expired session token',
        statusCode: 401,
      },
    });
  }

  // Database errors — log details server-side, never expose to client
  if (
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientValidationError ||
    err instanceof Prisma.PrismaClientInitializationError
  ) {
    safeLogger.error('Database error caught by middleware:', err);
    return res.status(503).json({
      success: false,
      error: {
        message: GENERIC_UNAVAILABLE_MESSAGE,
        statusCode: 503,
      },
    });
  }

  // Fallback — never expose raw stack traces or internal messages to clients
  safeLogger.error('Unhandled error caught by middleware:', err);
  return res.status(500).json({
    success: false,
    error: {
      message: GENERIC_SERVER_MESSAGE,
      statusCode: 500,
    },
  });
};
