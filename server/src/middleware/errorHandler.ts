import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

const getStatusCode = (error: unknown): number => {
  if (error instanceof ZodError) {
    return 400;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number" &&
    error.status >= 400 &&
    error.status < 600
  ) {
    return error.status;
  }

  return 500;
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const statusCode = getStatusCode(error);
  const validationErrors = error instanceof ZodError ? error.flatten().fieldErrors : undefined;
  const message =
    error instanceof ZodError
      ? "Validation failed"
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof error.message === "string" &&
          statusCode !== 500
        ? error.message
        : statusCode === 500
          ? "Internal server error"
          : "Request failed";

  response.status(statusCode).json({
    errors: validationErrors,
    message,
  });
};
