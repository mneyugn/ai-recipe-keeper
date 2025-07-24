// Legacy exports for backward compatibility during transition
// These will be removed once all API endpoints are updated to use DI

import { openRouterConfig, validateConfiguration } from "../config";
import { OpenRouterService } from "./openrouter.service";
import { RecipeExtractionService } from "./recipe-extraction.service";
import { UrlScraperService } from "./url-scraper.service";

// Initialize and share main services (legacy approach)
validateConfiguration();

export const openRouterService = new OpenRouterService(openRouterConfig);
export const recipeExtractionService = new RecipeExtractionService(openRouterService);
export const urlScraperService = new UrlScraperService(openRouterService);

// Export classes for DI container
export { OpenRouterService, RecipeExtractionService, UrlScraperService };

export { UserService } from "./user.service";

// Re-export DI container utilities
export { getService, createRequestContainer } from "../core/container";
