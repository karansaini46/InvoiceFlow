import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { HttpError } from "../utils/httpError";

type AccessTokenPayload = {
  id: string;
  email: string;
  plan: string;
};

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is required.");
  }

  return secret;
};

const getBearerToken = (request: Request) => {
  const authorization = request.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError(401, "Authorization token is required.");
  }

  return authorization.slice("Bearer ".length);
};

const isAccessTokenPayload = (payload: unknown): payload is AccessTokenPayload =>
  typeof payload === "object" &&
  payload !== null &&
  "id" in payload &&
  "email" in payload &&
  "plan" in payload &&
  typeof payload.id === "string" &&
  typeof payload.email === "string" &&
  typeof payload.plan === "string";

export const authMiddleware = (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  try {
    const payload = jwt.verify(getBearerToken(request), getJwtSecret());

    if (!isAccessTokenPayload(payload)) {
      throw new HttpError(401, "Authorization token is invalid.");
    }

    request.user = {
      id: payload.id,
      email: payload.email,
      plan: payload.plan,
    };

    next();
  } catch (error) {
    if (error instanceof HttpError) {
      next(error);
      return;
    }

    next(new HttpError(401, "Authorization token is invalid."));
  }
};
