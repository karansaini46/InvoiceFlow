import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { Router } from "express";
import multer from "multer";
import path from "path";
import { z } from "zod";

import { authMiddleware } from "../middleware/authMiddleware";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/httpError";

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new HttpError(400, "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."));
    }
  },
});

// Profile update schema
const profileUpdateSchema = z.object({
  businessName: z.string().optional(),
  businessAddress: z.string().optional(),
  businessPhone: z.string().optional(),
  businessWebsite: z.string().url().optional().or(z.literal("")),
  defaultCurrency: z.string().length(3).optional(),
  defaultTaxRate: z.number().min(0).max(100).optional(),
  defaultPaymentTerms: z.string().optional(),
  defaultNotes: z.string().optional(),
});

// Password change schema
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "Password must be at least 8 characters."),
});

const getAuthenticatedUser = (req: Request) => {
  if (!req.user) {
    throw new HttpError(401, "Authorization token is required.");
  }

  return req.user;
};

// GET /settings/profile - Get user profile
router.get("/profile", authMiddleware, async (req: Request, res: Response) => {
  const authUser = getAuthenticatedUser(req);
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      businessName: true,
      businessAddress: true,
      businessPhone: true,
      businessWebsite: true,
      logoUrl: true,
      defaultCurrency: true,
      defaultTaxRate: true,
      defaultPaymentTerms: true,
      defaultNotes: true,
      plan: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new HttpError(404, "User not found.");
  }

  res.json(user);
});

// PATCH /settings/profile - Update user profile
router.patch("/profile", authMiddleware, async (req: Request, res: Response) => {
  const body = profileUpdateSchema.parse(req.body);
  const authUser = getAuthenticatedUser(req);

  const user = await prisma.user.update({
    where: { id: authUser.id },
    data: body,
    select: {
      id: true,
      email: true,
      name: true,
      businessName: true,
      businessAddress: true,
      businessPhone: true,
      businessWebsite: true,
      logoUrl: true,
      defaultCurrency: true,
      defaultTaxRate: true,
      defaultPaymentTerms: true,
      defaultNotes: true,
      plan: true,
    },
  });

  res.json(user);
});

// POST /settings/logo - Upload logo
router.post("/logo", authMiddleware, upload.single("logo"), async (req: Request, res: Response) => {
  if (!req.file) {
    throw new HttpError(400, "No file uploaded.");
  }

  const logoUrl = `/uploads/${req.file.filename}`;
  const authUser = getAuthenticatedUser(req);

  const user = await prisma.user.update({
    where: { id: authUser.id },
    data: { logoUrl },
    select: {
      id: true,
      logoUrl: true,
    },
  });

  res.json({ logoUrl: user.logoUrl });
});

// PATCH /settings/password - Change password
router.patch("/password", authMiddleware, async (req: Request, res: Response) => {
  const body = passwordChangeSchema.parse(req.body);
  const authUser = getAuthenticatedUser(req);

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { passwordHash: true },
  });

  if (!user) {
    throw new HttpError(404, "User not found.");
  }

  const isCurrentPasswordValid = await bcrypt.compare(body.currentPassword, user.passwordHash);
  if (!isCurrentPasswordValid) {
    throw new HttpError(400, "Current password is incorrect.");
  }

  const newPasswordHash = await bcrypt.hash(body.newPassword, 12);

  await prisma.user.update({
    where: { id: authUser.id },
    data: { passwordHash: newPasswordHash },
  });

  res.status(204).send();
});

// DELETE /settings/account - Delete user account
router.delete("/account", authMiddleware, async (req: Request, res: Response) => {
  const authUser = getAuthenticatedUser(req);

  await prisma.user.delete({
    where: { id: authUser.id },
  });

  res.status(204).send();
});

export { router as settingsRouter };
