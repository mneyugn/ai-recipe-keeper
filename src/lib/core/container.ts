import "reflect-metadata";
import { container, instanceCachingFactory } from "tsyringe";
import type { APIContext } from "astro";
import { createSupabaseServerInstance } from "../../db/supabase.client";
import { openRouterConfig, validateConfiguration } from "../config";

// Import all services and controllers
import { AuthService } from "../modules/auth/auth.service";
import { AuthController } from "../modules/auth/auth.controller";
import { TagService } from "../modules/tag/tag.service";
import { TagController } from "../modules/tag/tag.controller";
import { RecipeService } from "../modules/recipe/recipe.service";
import { RecipeController } from "../modules/recipe/recipe.controller";
import { UserService } from "../modules/user/user.service";
import { UserController } from "../modules/user/user.controller";
import { OpenRouterService } from "../services/openrouter.service";
import { ExtractionService } from "../modules/extraction/extraction.service";
import { UrlScraperService } from "../modules/extraction/url-scraper.service";
import { ExtractionController } from "../modules/extraction/extraction.controller";

/**
 * Configures and registers all services in the DI container.
 * This function is called once during application startup.
 */
function configureGlobalDependencies(): void {
  // Validate configuration before registering services
  validateConfiguration();

  // Register OpenRouterService as a singleton with its configuration
  container.register("OpenRouterService", {
    useValue: new OpenRouterService(openRouterConfig),
  });

  // Register application services
  // These are stateless and can be singletons
  container.register("RecipeService", { useClass: RecipeService });
  container.register("TagService", { useClass: TagService });
  container.register("UserService", { useClass: UserService });
  container.register("ExtractionService", { useClass: ExtractionService });
  container.register("UrlScraperService", { useClass: UrlScraperService });
  container.register("IAuthService", { useClass: AuthService });

  // Register controllers
  // Controllers are instantiated per-request, so we register the class
  container.register("AuthController", { useClass: AuthController });
  container.register("TagController", { useClass: TagController });
  container.register("RecipeController", { useClass: RecipeController });
  container.register("UserController", { useClass: UserController });
  container.register("ExtractionController", { useClass: ExtractionController });
}

/**
 * Creates a request-specific DI container.
 *
 * This function should be called at the beginning of each API request.
 * It creates a child container and registers request-specific instances,
 * like the Supabase client, which depends on request headers and cookies.
 *
 * @param context - The Astro API context for the current request.
 * @returns A child container for the request.
 */
export function createRequestContainer(context: APIContext) {
  const requestContainer = container.createChildContainer();

  // Register SupabaseClient as a factory to create a new instance per request
  requestContainer.register("SupabaseClient", {
    useFactory: instanceCachingFactory(() =>
      createSupabaseServerInstance({
        headers: context.request.headers,
        cookies: context.cookies,
      })
    ),
  });

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

// Immediately configure global dependencies when this module is imported
configureGlobalDependencies();
