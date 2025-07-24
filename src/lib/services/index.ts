// Legacy exports for backward compatibility during transition
// Most services have been migrated to the new module structure

import { openRouterConfig, validateConfiguration } from "../config";
import { OpenRouterService } from "./openrouter.service";

// Initialize main service that remains in services (shared service)
validateConfiguration();

export const openRouterService = new OpenRouterService(openRouterConfig);

// Export classes for DI container
export { OpenRouterService };

// Re-export DI container utilities
export { getService, createRequestContainer } from "../core/container";
