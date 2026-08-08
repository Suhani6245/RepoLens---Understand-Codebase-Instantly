export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_REPO_URL"
  | "REPOSITORY_NOT_FOUND"
  | "CLONE_FAILED"
  | "PARSE_FAILED"
  | "AI_REQUEST_FAILED"
  | "NOT_FOUND"
  | "NOT_IMPLEMENTED"
  | "INTERNAL_ERROR";

/**
 * Domain-level error carrying an HTTP status and a machine-readable code,
 * so controllers can translate failures into consistent API responses.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: AppErrorCode;

  constructor(message: string, code: AppErrorCode, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
