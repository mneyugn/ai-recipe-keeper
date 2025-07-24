import type { APIRoute } from "astro";
import { createRequestContainer } from "../../../lib/core/container";
import { RecipeController } from "../../../lib/modules/recipe/recipe.controller";

export const prerender = false;

/**
 * GET /api/recipes/[id]
 * Fetches details of a specific recipe
 */
export const GET: APIRoute = async (context) => {
  const container = createRequestContainer(context);
  const recipeController = container.resolve(RecipeController);

  return recipeController.getRecipeById(context);
};

/**
 * PUT /api/recipes/[id]
 * Updates an existing recipe
 */
export const PUT: APIRoute = async (context) => {
  const container = createRequestContainer(context);
  const recipeController = container.resolve(RecipeController);

  return recipeController.updateRecipe(context);
};

/**
 * DELETE /api/recipes/[id]
 * Deletes a recipe
 */
export const DELETE: APIRoute = async (context) => {
  const container = createRequestContainer(context);
  const recipeController = container.resolve(RecipeController);

  return recipeController.deleteRecipe(context);
};
