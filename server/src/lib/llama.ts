import OpenAI from "openai";

import { HttpError } from "../utils/httpError";

export const LLAMA_MODEL =
  process.env.LLAMA_MODEL ?? "meta/llama-4-scout-17b-16e-instruct";

let llamaClient: OpenAI | null = null;

export const getLlamaClient = () => {
  if (!process.env.NVIDIA_API_KEY) {
    throw new HttpError(503, "AI service is not configured.");
  }

  llamaClient ??= new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: process.env.NVIDIA_BASE_URL ?? "https://integrate.api.nvidia.com/v1",
    timeout: 30_000,
    maxRetries: 2,
  });

  return llamaClient;
};
