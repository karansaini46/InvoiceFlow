import rateLimit from "express-rate-limit";

const windowMs = Number(process.env.AI_RATE_LIMIT_WINDOW_MS) || 60_000;
const max = Number(process.env.AI_RATE_LIMIT_MAX_REQUESTS) || 20;

export const aiRateLimiter = rateLimit({
  windowMs,
  max,
  keyGenerator: (request) => request.user?.id ?? "anonymous",
  handler: (_request, response) => {
    response.status(429).json({
      message: "AI rate limit exceeded. Please wait before making more AI requests.",
      retryAfter: Math.ceil(windowMs / 1_000),
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});
