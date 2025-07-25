import { z } from "zod";

// ===== UUID Validation =====
export const uuidSchema = z.string().uuid("Nieprawidłowy format UUID");

// ===== Query Parameters Validation =====
export const recipeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["created_at:asc", "created_at:desc", "name:asc", "name:desc"]).default("created_at:desc"),
  tags: z.string().optional(), // comma-separated slugs
});

// ===== Recipe Command Validation =====
export const createRecipeCommandSchema = z.object({
  name: z.string().min(1, "Nazwa przepisu jest wymagana").max(200, "Nazwa może mieć maksymalnie 200 znaków"),
  ingredients: z
    .array(z.string().min(1, "Składnik nie może być pusty"))
    .min(1, "Przepis musi mieć przynajmniej jeden składnik")
    .max(50, "Przepis może mieć maksymalnie 50 składników"),
  steps: z
    .array(z.string().min(1, "Krok nie może być pusty"))
    .min(1, "Przepis musi mieć przynajmniej jeden krok")
    .max(30, "Przepis może mieć maksymalnie 30 kroków"),
  preparation_time: z.string().max(50, "Czas przygotowania może mieć maksymalnie 50 znaków").nullable().optional(),
  source_type: z.enum(["manual", "url", "text"], {
    errorMap: () => ({ message: "Typ źródła musi być: manual, url lub text" }),
  }),
  source_url: z
    .string()
    .url("Nieprawidłowy format URL")
    .max(500, "URL może mieć maksymalnie 500 znaków")
    .nullable()
    .optional(),
  image_url: z
    .string()
    .url("Nieprawidłowy format URL obrazu")
    .max(500, "URL obrazu może mieć maksymalnie 500 znaków")
    .nullable()
    .optional(),
  notes: z.string().max(1000, "Notatki mogą mieć maksymalnie 1000 znaków").nullable().optional(),
  tag_ids: z.array(uuidSchema).max(20, "Przepis może mieć maksymalnie 20 tagów").optional(),
});

export const updateRecipeCommandSchema = createRecipeCommandSchema;

// ===== Helper Types =====
export interface ValidatedRecipeListParams {
  page: number;
  limit: number;
  sort: string;
  tags?: string[];
}

export interface RecipeOwnershipCheck {
  recipeId: string;
  userId: string;
  exists: boolean;
  isOwner: boolean;
}

// ===== Validation Helper Functions =====

/**
 * Parsuje i waliduje query parametry dla listy przepisów
 */
export function validateRecipeListQuery(searchParams: URLSearchParams): ValidatedRecipeListParams {
  const rawParams = {
    page: searchParams.get("page") || "1",
    limit: searchParams.get("limit") || "20",
    sort: searchParams.get("sort") || "created_at:desc",
    tags: searchParams.get("tags") || undefined,
  };

  const validated = recipeListQuerySchema.parse(rawParams);

  return {
    page: validated.page,
    limit: validated.limit,
    sort: validated.sort,
    tags: validated.tags
      ? validated.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : undefined,
  };
}

/**
 * Waliduje UUID przepisu
 */
export function validateRecipeId(id: string): string {
  return uuidSchema.parse(id);
}

/**
 * Waliduje dane do tworzenia przepisu
 */
export function validateCreateRecipeCommand(data: unknown) {
  return createRecipeCommandSchema.parse(data);
}

/**
 * Waliduje dane do aktualizacji przepisu
 */
export function validateUpdateRecipeCommand(data: unknown) {
  return updateRecipeCommandSchema.parse(data);
}
