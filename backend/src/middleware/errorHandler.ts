// src/middleware/errorHandler.ts
// Centralized error handler (same pattern proven in the TaskForge project):
// one function, last in the stack, that shapes every error response.

import { Request, Response, NextFunction } from "express";

export interface HttpError extends Error {
  status?: number;
}

export function errorHandler(err: HttpError, req: Request, res: Response, _next: NextFunction) {
  const status = err.status ?? 500;
  console.error(`[error] ${req.method} ${req.originalUrl} -> ${status}: ${err.message}`);
  res.status(status).json({ error: err.message || "Something went wrong" });
}

export function httpError(status: number, message: string): HttpError {
  const err = new Error(message) as HttpError;
  err.status = status;
  return err;
}
