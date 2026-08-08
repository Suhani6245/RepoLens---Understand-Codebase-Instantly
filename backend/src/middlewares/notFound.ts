import { Request, Response } from "express";
import { ApiErrorBody } from "../types/api";

export function notFound(req: Request, res: Response): void {
  const body: ApiErrorBody = {
    success: false,
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      code: "NOT_FOUND",
    },
  };
  res.status(404).json(body);
}
