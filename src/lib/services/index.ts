import { openRouterConfig, validateConfiguration } from "../config";
import { OpenRouterService } from "../openrouter.service";
import { RecipeExtractionService } from "./recipe-extraction.service";
import { UrlScraperService } from "./url-scraper.service";

// Service container: initializes and shares all main services

validateConfiguration();

const openRouterService = new OpenRouterService(openRouterConfig);

export const recipeExtractionService = new RecipeExtractionService(openRouterService);
export const urlScraperService = new UrlScraperService(openRouterService);

export { OpenRouterService, RecipeExtractionService, UrlScraperService };
