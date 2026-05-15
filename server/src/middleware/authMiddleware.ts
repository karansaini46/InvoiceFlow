import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { getJwtSecret } from "../config/jwt";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/httpError";
import { toPublicPlan } from "../utils/plan";

type AccessTokenPayload = {
  id: string;
  email: string;
  plan: string;
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

export const authMiddleware = async (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  try {
    const payload = jwt.verify(getBearerToken(request), getJwtSecret("JWT_SECRET"));

    if (!isAccessTokenPayload(payload)) {
      throw new HttpError(401, "Authorization token is invalid.");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        plan: true,
      },
    });

    if (!user) {
      throw new HttpError(401, "Session is no longer valid. Please sign in again.");
    }

    request.user = {
      id: user.id,
      email: user.email,
      plan: toPublicPlan(user.plan),
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
