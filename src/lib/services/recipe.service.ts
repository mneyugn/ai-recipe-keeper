import { injectable, inject } from "tsyringe";
import type { SupabaseClient } from "../../db/supabase.client";
import type {
  RecipeListResponseDTO,
  RecipeDetailDTO,
  RecipeListItemDTO,
  TagDTO,
  CreateRecipeCommand,
  UpdateRecipeCommand,
  PaginationDTO,
} from "../../types";
import type { TablesInsert, TablesUpdate } from "../../db/database.types";
import type { ValidatedRecipeListParams, RecipeOwnershipCheck } from "../validations/recipe";

@injectable()
export class RecipeService {
  constructor(@inject("SupabaseClient") private supabase: SupabaseClient) {}

  /**
   * Fetches user's recipe list with pagination and filtering
   */
  async getRecipeList(userId: string, params: ValidatedRecipeListParams): Promise<RecipeListResponseDTO> {
    const { page, limit, sort, tags } = params;
    const offset = (page - 1) * limit;

    // build query with sorting
    const [sortField, sortDirection] = sort.split(":") as [string, "asc" | "desc"];

    // basic query without forcing inner join for tags
    let query = this.supabase
      .from("recipes")
      .select(
        `
        id,
        name,
        image_url,
        preparation_time,
        created_at,
        recipe_tags (
          tags (
            name
          )
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", userId);

    // filtering by tags if provided - requires new query with inner join
    if (tags && tags.length > 0) {
      query = this.supabase
        .from("recipes")
        .select(
          `
          id,
          name,
          image_url,
          preparation_time,
          created_at,
          recipe_tags!inner (
            tags!inner (
              name
            )
          )
        `,
          { count: "exact" }
        )
        .eq("user_id", userId)
        .in("recipe_tags.tags.slug", tags);
    }

    // sorting
    query = query.order(sortField, { ascending: sortDirection === "asc" });

    // pagination
    query = query.range(offset, offset + limit - 1);

    const { data: recipes, count, error } = await query;

    if (error) {
      console.error("Error fetching recipe list:", error);
      throw new Error("Failed to fetch recipe list");
    }

    // mapping to DTO
    const recipeItems: RecipeListItemDTO[] =
      recipes?.map((recipe) => ({
        id: recipe.id,
        name: recipe.name,
        image_url: recipe.image_url,
        preparation_time: recipe.preparation_time,
        created_at: recipe.created_at,
        tags: recipe.recipe_tags?.map((rt) => rt.tags?.name).filter(Boolean) || [],
      })) || [];

    const pagination: PaginationDTO = {
      page,
      limit,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / limit),
    };

    return {
      recipes: recipeItems,
      pagination,
    };
  }

  /**
   * Fetches details of a specific recipe
   */
  async getRecipeDetails(recipeId: string, userId: string): Promise<RecipeDetailDTO> {
    const { data: recipe, error } = await this.supabase
      .from("recipes")
      .select(
        `
        id,
        name,
        ingredients,
        steps,
        preparation_time,
        source_type,
        source_url,
        image_url,
        notes,
        source_metadata,
        created_at,
        updated_at,
        recipe_tags (
          tags (
            id,
            name,
            slug
          )
        )
      `
      )
      .eq("id", recipeId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("Recipe not found");
      }
      console.error("Error fetching recipe details:", error);
      throw new Error("Failed to fetch recipe details");
    }

    // mapping tags
    const tags: TagDTO[] =
      recipe.recipe_tags
        ?.map((rt) => {
          if (!rt.tags) return null;
          return {
            id: rt.tags.id,
            name: rt.tags.name,
            slug: rt.tags.slug,
          };
        })
        .filter((tag): tag is TagDTO => tag !== null) || [];

    return {
      id: recipe.id,
      name: recipe.name,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      preparation_time: recipe.preparation_time,
      source_type: recipe.source_type,
      source_url: recipe.source_url,
      image_url: recipe.image_url,
      notes: recipe.notes,
      source_metadata: recipe.source_metadata,
      created_at: recipe.created_at,
      updated_at: recipe.updated_at,
      tags,
    };
  }

  /**
   * Creates a new recipe with tag handling
   */
  async createRecipe(userId: string, command: CreateRecipeCommand): Promise<RecipeDetailDTO> {
    // validate tag_ids if provided
    if (command.tag_ids && command.tag_ids.length > 0) {
      await this.validateTagIds(command.tag_ids);
    }

    // prepare data to insert
    const recipeData: TablesInsert<"recipes"> = {
      user_id: userId,
      name: command.name,
      ingredients: command.ingredients,
      steps: command.steps,
      preparation_time: command.preparation_time || null,
      source_type: command.source_type,
      source_url: command.source_url || null,
      image_url: command.image_url || null,
      notes: command.notes || null,
    };

    // transaction: create recipe + assign tags
    const { data: recipe, error: recipeError } = await this.supabase
      .from("recipes")
      .insert(recipeData)
      .select()
      .single();

    if (recipeError) {
      console.error("Error creating recipe:", recipeError);
      throw new Error("Failed to create recipe");
    }

    // assign tags if provided
    if (command.tag_ids && command.tag_ids.length > 0) {
      const recipeTags = command.tag_ids.map((tagId) => ({
        recipe_id: recipe.id,
        tag_id: tagId,
      }));

      const { error: tagsError } = await this.supabase.from("recipe_tags").insert(recipeTags);

      if (tagsError) {
        console.error("Error assigning tags:", tagsError);
        // rollback - delete created recipe
        await this.supabase.from("recipes").delete().eq("id", recipe.id);
        throw new Error("Failed to assign tags to recipe");
      }
    }

    // fetch created recipe with tags
    return await this.getRecipeDetails(recipe.id, userId);
  }

  /**
   * Updates an existing recipe
   */
  async updateRecipe(recipeId: string, userId: string, command: UpdateRecipeCommand): Promise<RecipeDetailDTO> {
    // check recipe ownership
    await this.checkOwnership(recipeId, userId);

    // validate tag_ids if provided
    if (command.tag_ids && command.tag_ids.length > 0) {
      await this.validateTagIds(command.tag_ids);
    }

    // prepare data to update
    const updateData: TablesUpdate<"recipes"> = {
      name: command.name,
      ingredients: command.ingredients,
      steps: command.steps,
      preparation_time: command.preparation_time || null,
      source_type: command.source_type,
      source_url: command.source_url || null,
      image_url: command.image_url || null,
      notes: command.notes || null,
      updated_at: new Date().toISOString(),
    };

    // update recipe
    const { error: updateError } = await this.supabase
      .from("recipes")
      .update(updateData)
      .eq("id", recipeId)
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating recipe:", updateError);
      throw new Error("Failed to update recipe");
    }

    // update tags - delete old and add new
    const { error: deleteTagsError } = await this.supabase.from("recipe_tags").delete().eq("recipe_id", recipeId);

    if (deleteTagsError) {
      console.error("Error deleting old tags:", deleteTagsError);
      throw new Error("Failed to update recipe tags");
    }

    // add new tags if provided
    if (command.tag_ids && command.tag_ids.length > 0) {
      const recipeTags = command.tag_ids.map((tagId) => ({
        recipe_id: recipeId,
        tag_id: tagId,
      }));

      const { error: insertTagsError } = await this.supabase.from("recipe_tags").insert(recipeTags);

      if (insertTagsError) {
        console.error("Error adding new tags:", insertTagsError);
        throw new Error("Failed to update recipe tags");
      }
    }

    // fetch updated recipe
    return await this.getRecipeDetails(recipeId, userId);
  }

  /**
   * Deletes a recipe
   */
  async deleteRecipe(recipeId: string, userId: string): Promise<void> {
    // check recipe ownership
    await this.checkOwnership(recipeId, userId);

    const { error } = await this.supabase.from("recipes").delete().eq("id", recipeId).eq("user_id", userId);

    if (error) {
      console.error("Error deleting recipe:", error);
      throw new Error("Failed to delete recipe");
    }
  }

  /**
   * Checks if user is the owner of the recipe
   */
  async checkOwnership(recipeId: string, userId: string): Promise<RecipeOwnershipCheck> {
    const { data: recipe, error } = await this.supabase
      .from("recipes")
      .select("id, user_id")
      .eq("id", recipeId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return {
          recipeId,
          userId,
          exists: false,
          isOwner: false,
        };
      }
      console.error("Error checking recipe ownership:", error);
      throw new Error("Failed to check recipe ownership");
    }

    const isOwner = recipe.user_id === userId;
    const result: RecipeOwnershipCheck = {
      recipeId,
      userId,
      exists: true,
      isOwner,
    };

    if (!isOwner) {
      throw new Error("No permissions to this recipe");
    }

    return result;
  }

  /**
   * Validates if the provided tag_ids exist in the database
   */
  private async validateTagIds(tagIds: string[]): Promise<void> {
    const { data: tags, error } = await this.supabase.from("tags").select("id").in("id", tagIds).eq("is_active", true);

    if (error) {
      console.error("Error validating tags:", error);
      throw new Error("Failed to validate tags");
    }

    const existingTagIds = tags?.map((tag) => tag.id) || [];
    const missingTagIds = tagIds.filter((id) => !existingTagIds.includes(id));

    if (missingTagIds.length > 0) {
      throw new Error(`Non-existent tags: ${missingTagIds.join(", ")}`);
    }
  }
}
