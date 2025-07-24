import "reflect-metadata";
import { container } from "tsyringe";
import type { SupabaseClient } from "../../db/supabase.client";
import { openRouterConfig, validateConfiguration } from "../config";

// Import all services
import { RecipeService } from "../services/recipe.service";
import { TagService } from "../services/tag.service";
import { UserService } from "../services/user.service";
import { OpenRouterService } from "../services/openrouter.service";
import { RecipeExtractionService } from "../services/recipe-extraction.service";
import { UrlScraperService } from "../services/url-scraper.service";

// Token constants for injection
export const TOKENS = {
  SupabaseClient: "SupabaseClient",
  OpenRouterService: "OpenRouterService",
  RecipeService: "RecipeService",
  TagService: "TagService",
  UserService: "UserService",
  RecipeExtractionService: "RecipeExtractionService",
  UrlScraperService: "UrlScraperService",
} as const;

/**
 * Configures and registers all services in the DI container
 * This function should be called once during application startup
 */
export function configureDependencies(): void {
  // Validate configuration before registering services
  validateConfiguration();

  // Register OpenRouterService as singleton with config
  container.register(TOKENS.OpenRouterService, {
    useValue: new OpenRouterService(openRouterConfig),
  });

  // Register all other services as transient (new instance per request)
  container.register(TOKENS.RecipeService, RecipeService);
  container.register(TOKENS.TagService, TagService);
  container.register(TOKENS.UserService, UserService);
  container.register(TOKENS.RecipeExtractionService, RecipeExtractionService);
  container.register(TOKENS.UrlScraperService, UrlScraperService);
}

/**
 * Registers a Supabase client instance for the current request context
 * This should be called at the beginning of each API request
 */
export function registerSupabaseClient(supabaseClient: SupabaseClient): void {
  container.registerInstance(TOKENS.SupabaseClient, supabaseClient);
}

/**
 * Creates a child container for request-scoped dependencies
 * This isolates each request and prevents cross-request contamination
 */
export function createRequestContainer(supabaseClient: SupabaseClient) {
  const requestContainer = container.createChildContainer();
  requestContainer.registerInstance(TOKENS.SupabaseClient, supabaseClient);
  return requestContainer;
}

/**
 * Resolves a service from the container
 */
export function getService<T>(token: string): T {
  return container.resolve<T>(token);
}

/**
 * Resolves a service from a specific container instance
 */
export function getServiceFromContainer<T>(containerInstance: typeof container, token: string): T {
  return containerInstance.resolve<T>(token);
}

// Configure dependencies on module load
configureDependencies();
