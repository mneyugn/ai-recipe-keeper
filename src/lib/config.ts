import type { OpenRouterConfig } from "../types";

/**
 * Central configuration for all external services.
 */

/**
 * Configuration for the OpenRouter API.
 */
export const openRouterConfig: OpenRouterConfig = {
  apiKey: import.meta.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || "",
  baseUrl: "https://openrouter.ai/api/v1",
  defaultModel: "google/gemini-2.0-flash-001",
  timeout: 60000,
  maxRetries: 2,
  retryDelay: 2000,
};

/**
 * Validates whether the required configuration is set.
 */
export function validateConfiguration(): void {
  if (!openRouterConfig.apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set in environment variables");
  }
}
