import type { APIContext } from "astro";
import { inject, injectable } from "tsyringe";
import type { RecipeService } from "./recipe.service";
import { withErrorHandler } from "../../api/middleware/errorHandler";
import { success, created, noContent } from "../../api/responses";
import {
  validateRecipeListQuery,
  validateRecipeId,
  validateCreateRecipeCommand,
  validateUpdateRecipeCommand,
} from "../../validations/recipe";
import { ApiError } from "../../errors";
import { ZodError } from "zod";

@injectable()
export class RecipeController {
  constructor(@inject("RecipeService") private recipeService: RecipeService) {}

  /**
   * GET /api/recipes - Fetch user's recipe list with pagination and filtering
   */
  getRecipes = withErrorHandler(async (context: APIContext) => {
    // 1. Check authentication
    const userId = context.locals.user?.id;
    if (!userId) {
      throw new ApiError(401, "Authentication required", "authentication_required");
    }

    // 2. Validate query parameters
    let validatedParams;
    try {
      validatedParams = validateRecipeListQuery(context.url.searchParams);
    } catch (error) {
      console.error("Validation error:", error);
      throw new ApiError(
        400,
        "Invalid query parameters",
        "validation_error",
        error instanceof ZodError ? error.flatten().fieldErrors : undefined
      );
    }

    // 3. Fetch recipe list
    try {
      const recipeList = await this.recipeService.getRecipeList(userId, validatedParams);
      return success(recipeList);
    } catch (error) {
      console.error("Error fetching recipe list:", error);
      throw new ApiError(500, "Failed to fetch recipe list", "database_error");
    }
  });

  /**
   * GET /api/recipes/[id] - Fetch recipe details
   */
  getRecipeById = withErrorHandler(async (context: APIContext) => {
    // 1. Check authentication
    const userId = context.locals.user?.id;
    if (!userId) {
      throw new ApiError(401, "Authentication required", "authentication_required");
    }

    // 2. Validate recipe ID
    const { id } = context.params;
    if (!id) {
      throw new ApiError(400, "Missing recipe ID", "missing_recipe_id");
    }

    let validatedId: string;
    try {
      validatedId = validateRecipeId(id);
    } catch (error) {
      console.error("Validation error:", error);
      throw new ApiError(400, "Invalid recipe ID", "invalid_recipe_id");
    }

    // 3. Fetch recipe details
    try {
      const recipeDetails = await this.recipeService.getRecipeDetails(validatedId, userId);
      return success(recipeDetails);
    } catch (error) {
      console.error("Error fetching recipe details:", error);

      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("Recipe not found") || errorMessage.includes("No permissions")) {
        throw new ApiError(404, "Recipe not found", "not_found");
      }

      throw new ApiError(500, "Failed to fetch recipe details", "database_error");
    }
  });

  /**
   * POST /api/recipes - Create new recipe
   */
  createRecipe = withErrorHandler(async (context: APIContext) => {
    // 1. Check authentication
    const userId = context.locals.user?.id;
    if (!userId) {
      throw new ApiError(401, "Authentication required", "authentication_required");
    }

    // 2. Validate Content-Type
    const contentType = context.request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      throw new ApiError(400, "Content-Type must be application/json", "invalid_content_type");
    }

    // 3. Parse JSON
    let requestBody;
    try {
      requestBody = await context.request.json();
    } catch {
      throw new ApiError(400, "Invalid JSON format", "invalid_json");
    }

    // 4. Validate input data
    let validatedCommand;
    try {
      validatedCommand = validateCreateRecipeCommand(requestBody);
    } catch (error) {
      console.error("Validation error:", error);
      throw new ApiError(
        400,
        "Invalid recipe data",
        "validation_error",
        error instanceof ZodError ? error.flatten().fieldErrors : undefined
      );
    }

    // 5. Create recipe
    try {
      const createdRecipe = await this.recipeService.createRecipe(userId, validatedCommand);
      return created(createdRecipe);
    } catch (error) {
      console.error("Error creating recipe:", error);

      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Check if error is related to tags
      if (errorMessage.includes("Non-existent tags")) {
        throw new ApiError(400, errorMessage, "invalid_tags");
      }

      throw new ApiError(500, "Failed to create recipe", "database_error");
    }
  });

  /**
   * PUT /api/recipes/[id] - Update existing recipe
   */
  updateRecipe = withErrorHandler(async (context: APIContext) => {
    // 1. Check authentication
    const userId = context.locals.user?.id;
    if (!userId) {
      throw new ApiError(401, "Authentication required", "authentication_required");
    }

    // 2. Validate recipe ID
    const { id } = context.params;
    if (!id) {
      throw new ApiError(400, "Missing recipe ID", "missing_recipe_id");
    }

    let validatedId: string;
    try {
      validatedId = validateRecipeId(id);
    } catch (error) {
      console.error("Validation error:", error);
      throw new ApiError(400, "Invalid recipe ID", "invalid_recipe_id");
    }

    // 3. Validate Content-Type
    const contentType = context.request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      throw new ApiError(400, "Content-Type must be application/json", "invalid_content_type");
    }

    // 4. Parse JSON
    let requestBody;
    try {
      requestBody = await context.request.json();
    } catch {
      throw new ApiError(400, "Invalid JSON format", "invalid_json");
    }

    // 5. Validate input data
    let validatedCommand;
    try {
      validatedCommand = validateUpdateRecipeCommand(requestBody);
    } catch (error) {
      console.error("Validation error:", error);
      throw new ApiError(
        400,
        "Invalid recipe data",
        "validation_error",
        error instanceof ZodError ? error.flatten().fieldErrors : undefined
      );
    }

    // 6. Update recipe
    try {
      const updatedRecipe = await this.recipeService.updateRecipe(validatedId, userId, validatedCommand);
      return success(updatedRecipe);
    } catch (error) {
      console.error("Error updating recipe:", error);

      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("Recipe not found") || errorMessage.includes("No permissions")) {
        throw new ApiError(404, "Recipe not found", "not_found");
      }

      if (errorMessage.includes("Non-existent tags")) {
        throw new ApiError(400, errorMessage, "invalid_tags");
      }

      throw new ApiError(500, "Failed to update recipe", "database_error");
    }
  });

  /**
   * DELETE /api/recipes/[id] - Delete recipe
   */
  deleteRecipe = withErrorHandler(async (context: APIContext) => {
    // 1. Check authentication
    const userId = context.locals.user?.id;
    if (!userId) {
      throw new ApiError(401, "Authentication required", "authentication_required");
    }

    // 2. Validate recipe ID
    const { id } = context.params;
    if (!id) {
      throw new ApiError(400, "Missing recipe ID", "missing_recipe_id");
    }

    let validatedId: string;
    try {
      validatedId = validateRecipeId(id);
    } catch (error) {
      console.error("Validation error:", error);
      throw new ApiError(400, "Invalid recipe ID", "invalid_recipe_id");
    }

    // 3. Delete recipe
    try {
      await this.recipeService.deleteRecipe(validatedId, userId);
      return noContent();
    } catch (error) {
      console.error("Error deleting recipe:", error);

      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("Recipe not found") || errorMessage.includes("No permissions")) {
        throw new ApiError(404, "Recipe not found", "not_found");
      }

      throw new ApiError(500, "Failed to delete recipe", "database_error");
    }
  });
}
