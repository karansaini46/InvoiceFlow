import type { ErrorRequestHandler } from "express";

const getStatusCode = (error: unknown): number => {
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

  response.status(statusCode).json({
    message: statusCode === 500 ? "Internal server error" : "Request failed"
  });
};
