import OpenAI from "openai";
import { env } from "@/lib/env";

/**
 * Server-only OpenAI client singleton.
 * The API key lives in env (server) and is NEVER imported into client components.
 */
const globalForOpenAI = globalThis as unknown as { openai?: OpenAI };

export const openai =
  globalForOpenAI.openai ??
  new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

if (process.env.NODE_ENV !== "production") {
  globalForOpenAI.openai = openai;
}
