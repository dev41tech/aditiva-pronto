import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    // Erros esperados (4xx): log simples, sem stack
    if (err.statusCode >= 500) {
      logger.error(`[${req.method} ${req.path}] AppError ${err.statusCode}: ${err.message}`);
    } else {
      logger.warn(`[${req.method} ${req.path}] AppError ${err.statusCode}: ${err.message}`);
    }
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Erros inesperados: log completo com stack
  logger.error(`[${req.method} ${req.path}] Erro não tratado: ${err.message}`, {
    error: err.message,
    stack: err.stack,
  });

  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({
    error: 'Erro interno do servidor.',
    ...(isDev && { detail: err.message, stack: err.stack }),
  });
}
