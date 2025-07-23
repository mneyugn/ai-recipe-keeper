import { openRouterConfig, validateConfiguration } from "../config";
import { OpenRouterService } from "./openrouter.service";
import { RecipeExtractionService } from "./recipe-extraction.service";
import { UrlScraperService } from "./url-scraper.service";

// Initialize and share main services

validateConfiguration();

export const openRouterService = new OpenRouterService(openRouterConfig);
export const recipeExtractionService = new RecipeExtractionService(openRouterService);
export const urlScraperService = new UrlScraperService(openRouterService);

export { OpenRouterService, RecipeExtractionService, UrlScraperService };
