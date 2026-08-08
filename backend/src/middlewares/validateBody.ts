import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

/**
 * Lightweight body validator: ensures the listed fields exist and are
 * non-empty strings. Kept dependency-free; swap for zod/yup if the
 * validation surface grows.
 */
export function requireFields(fields: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const missing = fields.filter((field) => {
      const value = req.body?.[field];
      return typeof value !== "string" || value.trim().length === 0;
    });

    if (missing.length > 0) {
      next(
        new AppError(
          `Missing or invalid field(s): ${missing.join(", ")}`,
          "VALIDATION_ERROR",
          400
        )
      );
      return;
    }

    next();
  };
}
