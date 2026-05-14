import bcrypt from "bcrypt";
import type { CookieOptions, Request, Response } from "express";
import { Router } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { z } from "zod";

import { getJwtSecret } from "../config/jwt";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/httpError";
import { toPublicPlan } from "../utils/plan";

const refreshCookieName = "refreshToken";
const accessTokenExpiry = "7d";
const refreshTokenExpiry = "7d";
const refreshTokenMaxAge = 7 * 24 * 60 * 60 * 1000;

const authPayloadSelect = {
  id: true,
  email: true,
  name: true,
  plan: true,
} as const;

const registerSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").toLowerCase(),
  name: z.string().trim().min(1, "Name is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").toLowerCase(),
  password: z.string().min(1, "Password is required."),
});

type TokenUser = {
  id: string;
  email: string;
  plan: string;
};

type AuthUser = TokenUser & {
  name: string;
};

const toTokenUser = (user: AuthUser): TokenUser => ({
  id: user.id,
  email: user.email,
  plan: toPublicPlan(user.plan),
});

const signAccessToken = (user: AuthUser) =>
  jwt.sign(toTokenUser(user), getJwtSecret("JWT_SECRET"), {
    expiresIn: accessTokenExpiry,
  });

const signRefreshToken = (user: AuthUser) =>
  jwt.sign(toTokenUser(user), getJwtSecret("JWT_REFRESH_SECRET"), {
    expiresIn: refreshTokenExpiry,
  });

const getRefreshCookieOptions = (includeMaxAge = true): CookieOptions => ({
  httpOnly: true,
  ...(includeMaxAge ? { maxAge: refreshTokenMaxAge } : {}),
  sameSite: "none",
  secure: true,
});

const sendAuthResponse = (response: Response, user: AuthUser) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const authUser = {
    ...user,
    plan: toPublicPlan(user.plan),
  };

  response.cookie(refreshCookieName, refreshToken, getRefreshCookieOptions());
  response.status(200).json({ accessToken, user: authUser });
};

const getRefreshToken = (request: Request) => {
  const token = request.cookies?.[refreshCookieName];

  if (typeof token !== "string" || !token) {
    throw new HttpError(401, "Refresh token is required.");
  }

  return token;
};

const getRefreshPayload = (token: string) => {
  try {
    const payload = jwt.verify(token, getJwtSecret("JWT_REFRESH_SECRET"));

    if (
      typeof payload !== "object" ||
      payload === null ||
      typeof (payload as JwtPayload).id !== "string"
    ) {
      throw new HttpError(401, "Refresh token is invalid.");
    }

    return payload as JwtPayload & { id: string };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(401, "Refresh token is invalid.");
  }
};

export const authRouter = Router();

authRouter.post("/register", async (request, response) => {
  const body = registerSchema.parse(request.body);
  const existingUser = await prisma.user.findUnique({
    where: {
      email: body.email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    throw new HttpError(409, "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(body.password, 12);
  const user = await prisma.user.create({
    data: {
      email: body.email,
      name: body.name,
      passwordHash,
    },
    select: authPayloadSelect,
  });

  sendAuthResponse(response, user);
});

authRouter.post("/login", async (request, response) => {
  const body = loginSchema.parse(request.body);
  const user = await prisma.user.findUnique({
    where: {
      email: body.email,
    },
    select: {
      ...authPayloadSelect,
      passwordHash: true,
    },
  });

  if (!user) {
    throw new HttpError(401, "Email or password is incorrect.");
  }

  const isPasswordValid = await bcrypt.compare(body.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new HttpError(401, "Email or password is incorrect.");
  }

  const { passwordHash: _passwordHash, ...authUser } = user;
  sendAuthResponse(response, authUser);
});

authRouter.post("/refresh", async (request, response) => {
  const payload = getRefreshPayload(getRefreshToken(request));
  const user = await prisma.user.findUnique({
    where: {
      id: payload.id,
    },
    select: authPayloadSelect,
  });

  if (!user) {
    throw new HttpError(401, "Refresh token is invalid.");
  }

  const authUser = {
    ...user,
    plan: toPublicPlan(user.plan),
  };
  const accessToken = signAccessToken(user);

  response.status(200).json({ accessToken, user: authUser });
});

authRouter.post("/logout", (_request, response) => {
  response.clearCookie(refreshCookieName, getRefreshCookieOptions(false));
  response.status(204).send();
});
