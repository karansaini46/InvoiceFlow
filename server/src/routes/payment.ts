import { Router } from "express";

import { authMiddleware } from "../middleware/authMiddleware";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/httpError";
import { toPublicPlan } from "../utils/plan";

export const paymentRouter = Router();

paymentRouter.use(authMiddleware);

paymentRouter.get("/status", async (request, response, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      select: { plan: true },
    });

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    response.json({ plan: toPublicPlan(user.plan) });
  } catch (error) {
    next(error);
  }
});

paymentRouter.post("/mock-upgrade", async (request, response, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      select: { id: true },
    });

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { plan: "PRO" },
    });

    response.json({ success: true, plan: "pro" });
  } catch (error) {
    next(error);
  }
});
