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

export class RecipeService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Pobiera listę przepisów użytkownika z paginacją i filtrowaniem
   */
  async getRecipeList(userId: string, params: ValidatedRecipeListParams): Promise<RecipeListResponseDTO> {
    const { page, limit, sort, tags } = params;
    const offset = (page - 1) * limit;

    // Budowanie zapytania z sortowaniem
    const [sortField, sortDirection] = sort.split(":") as [string, "asc" | "desc"];

    // Podstawowe zapytanie bez wymuszania inner join dla tagów
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

    // Filtrowanie po tagach jeśli podane - wymaga nowe zapytanie z inner join
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

    // Sortowanie
    query = query.order(sortField, { ascending: sortDirection === "asc" });

    // Paginacja
    query = query.range(offset, offset + limit - 1);

    const { data: recipes, count, error } = await query;

    if (error) {
      console.error("Błąd podczas pobierania listy przepisów:", error);
      throw new Error("Nie udało się pobrać listy przepisów");
    }

    // Mapowanie na DTO
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
   * Pobiera szczegóły konkretnego przepisu
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
        throw new Error("Przepis nie został znaleziony");
      }
      console.error("Błąd podczas pobierania szczegółów przepisu:", error);
      throw new Error("Nie udało się pobrać szczegółów przepisu");
    }

    // Mapowanie tagów
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
   * Tworzy nowy przepis z obsługą tagów
   */
  async createRecipe(userId: string, command: CreateRecipeCommand): Promise<RecipeDetailDTO> {
    // Walidacja tag_ids jeśli podane
    if (command.tag_ids && command.tag_ids.length > 0) {
      await this.validateTagIds(command.tag_ids);
    }

    // Przygotowanie danych do wstawienia
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

    // Transakcja: tworzenie przepisu + przypisanie tagów
    const { data: recipe, error: recipeError } = await this.supabase
      .from("recipes")
      .insert(recipeData)
      .select()
      .single();

    if (recipeError) {
      console.error("Błąd podczas tworzenia przepisu:", recipeError);
      throw new Error("Nie udało się utworzyć przepisu");
    }

    // Przypisanie tagów jeśli podane
    if (command.tag_ids && command.tag_ids.length > 0) {
      const recipeTags = command.tag_ids.map((tagId) => ({
        recipe_id: recipe.id,
        tag_id: tagId,
      }));

      const { error: tagsError } = await this.supabase.from("recipe_tags").insert(recipeTags);

      if (tagsError) {
        console.error("Błąd podczas przypisywania tagów:", tagsError);
        // Rollback - usunięcie utworzonego przepisu
        await this.supabase.from("recipes").delete().eq("id", recipe.id);
        throw new Error("Nie udało się przypisać tagów do przepisu");
      }
    }

    // Pobieranie utworzonego przepisu z tagami
    return await this.getRecipeDetails(recipe.id, userId);
  }

  /**
   * Aktualizuje istniejący przepis
   */
  async updateRecipe(recipeId: string, userId: string, command: UpdateRecipeCommand): Promise<RecipeDetailDTO> {
    // Sprawdzenie własności przepisu
    await this.checkOwnership(recipeId, userId);

    // Walidacja tag_ids jeśli podane
    if (command.tag_ids && command.tag_ids.length > 0) {
      await this.validateTagIds(command.tag_ids);
    }

    // Przygotowanie danych do aktualizacji
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

    // Aktualizacja przepisu
    const { error: updateError } = await this.supabase
      .from("recipes")
      .update(updateData)
      .eq("id", recipeId)
      .eq("user_id", userId);

    if (updateError) {
      console.error("Błąd podczas aktualizacji przepisu:", updateError);
      throw new Error("Nie udało się zaktualizować przepisu");
    }

    // Aktualizacja tagów - usunięcie starych i dodanie nowych
    const { error: deleteTagsError } = await this.supabase.from("recipe_tags").delete().eq("recipe_id", recipeId);

    if (deleteTagsError) {
      console.error("Błąd podczas usuwania starych tagów:", deleteTagsError);
      throw new Error("Nie udało się zaktualizować tagów przepisu");
    }

    // Dodanie nowych tagów jeśli podane
    if (command.tag_ids && command.tag_ids.length > 0) {
      const recipeTags = command.tag_ids.map((tagId) => ({
        recipe_id: recipeId,
        tag_id: tagId,
      }));

      const { error: insertTagsError } = await this.supabase.from("recipe_tags").insert(recipeTags);

      if (insertTagsError) {
        console.error("Błąd podczas dodawania nowych tagów:", insertTagsError);
        throw new Error("Nie udało się zaktualizować tagów przepisu");
      }
    }

    // Pobieranie zaktualizowanego przepisu
    return await this.getRecipeDetails(recipeId, userId);
  }

  /**
   * Usuwa przepis
   */
  async deleteRecipe(recipeId: string, userId: string): Promise<void> {
    // Sprawdzenie własności przepisu
    await this.checkOwnership(recipeId, userId);

    const { error } = await this.supabase.from("recipes").delete().eq("id", recipeId).eq("user_id", userId);

    if (error) {
      console.error("Błąd podczas usuwania przepisu:", error);
      throw new Error("Nie udało się usunąć przepisu");
    }
  }

  /**
   * Sprawdza czy użytkownik jest właścicielem przepisu
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
      console.error("Błąd podczas sprawdzania własności przepisu:", error);
      throw new Error("Nie udało się sprawdzić własności przepisu");
    }

    const isOwner = recipe.user_id === userId;
    const result: RecipeOwnershipCheck = {
      recipeId,
      userId,
      exists: true,
      isOwner,
    };

    if (!isOwner) {
      throw new Error("Brak uprawnień do tego przepisu");
    }

    return result;
  }

  /**
   * Waliduje czy podane tag_ids istnieją w bazie
   */
  private async validateTagIds(tagIds: string[]): Promise<void> {
    const { data: tags, error } = await this.supabase.from("tags").select("id").in("id", tagIds).eq("is_active", true);

    if (error) {
      console.error("Błąd podczas walidacji tagów:", error);
      throw new Error("Nie udało się zwalidować tagów");
    }

    const existingTagIds = tags?.map((tag) => tag.id) || [];
    const missingTagIds = tagIds.filter((id) => !existingTagIds.includes(id));

    if (missingTagIds.length > 0) {
      throw new Error(`Nieistniejące tagi: ${missingTagIds.join(", ")}`);
    }
  }
}
