// Core services and utilities

import { openRouterConfig, validateConfiguration } from "../config";
import { OpenRouterService } from "./openrouter.service";

// Initialize configuration validation
validateConfiguration();

// Export the main OpenRouter service instance (for legacy compatibility)
export const openRouterService = new OpenRouterService(openRouterConfig);

// Export classes for DI container
export { OpenRouterService };

// Re-export DI container utilities
export { getService, createRequestContainer } from "./container";
