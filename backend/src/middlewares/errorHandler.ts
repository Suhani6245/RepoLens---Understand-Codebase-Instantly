import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { ApiErrorBody } from "../types/api";
import { env } from "../config/env";

/**
 * Must be registered last, after all routes. Express recognizes it as an
 * error handler because it declares four parameters.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    const body: ApiErrorBody = {
      success: false,
      error: { message: err.message, code: err.code },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  const message = err instanceof Error ? err.message : "Unexpected error.";

  if (env.nodeEnv !== "production") {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  const body: ApiErrorBody = {
    success: false,
    error: {
      message: env.nodeEnv === "production" ? "Internal server error." : message,
      code: "INTERNAL_ERROR",
    },
  };
  res.status(500).json(body);
}
