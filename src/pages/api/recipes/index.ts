import type { APIRoute } from "astro";
import { createRequestContainer } from "../../../lib/core/container";
import { RecipeController } from "../../../lib/modules/recipe/recipe.controller";

export const prerender = false;

/**
 * GET /api/recipes
 * Fetches a list of user's recipes with filtering and pagination options
 */
export const GET: APIRoute = async (context) => {
  const container = createRequestContainer(context);
  const recipeController = container.resolve(RecipeController);

  return recipeController.getRecipes(context);
};

/**
 * POST /api/recipes
 * Creates a new recipe
 */
export const POST: APIRoute = async (context) => {
  const container = createRequestContainer(context);
  const recipeController = container.resolve(RecipeController);

  return recipeController.createRecipe(context);
};
