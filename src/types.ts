import type { Tables } from "./db/database.types";

// ===== User Profile DTOs =====

/**
 * DTO for the user profile returned by GET /api/users/profile
 * Extends data from the users table with additional information (number of recipes, extraction limits)
 */
export interface UserProfileDTO extends Pick<Tables<"users">, "id" | "email" | "is_admin" | "created_at"> {
  recipe_count: number;
  extraction_limit: {
    used: number;
    limit: number;
    date: string;
  };
}

// ===== Recipe DTOs =====

/**
 * DTO for a single recipe in the list
 * Used in GET /api/recipes as an array element
 */
export interface RecipeListItemDTO
  extends Pick<Tables<"recipes">, "id" | "name" | "image_url" | "preparation_time" | "created_at"> {
  tags: string[]; // Only tag names, not full objects
}

/**
 * DTO for the recipe list response
 * Contains an array of recipes and pagination information
 */
export interface RecipeListResponseDTO {
  recipes: RecipeListItemDTO[];
  pagination: PaginationDTO;
}

/**
 * DTO for recipe details
 * Returned by GET /api/recipes/{id}
 */
export interface RecipeDetailDTO extends Omit<Tables<"recipes">, "user_id" | "image_hash"> {
  tags: TagDTO[]; // Full tag objects
}

// ===== Recipe Commands =====

/**
 * Command model for creating a recipe
 * Used in POST /api/recipes
 */
export interface CreateRecipeCommand {
  name: string;
  ingredients: string[];
  steps: string[];
  preparation_time?: string | null;
  source_type: "manual" | "url" | "text";
  source_url?: string | null;
  image_url?: string | null;
  notes?: string | null;
  tag_ids?: string[]; // UUIDs of tags to assign
}

/**
 * Command model for updating a recipe
 * Used in PUT /api/recipes/{id}
 */
export type UpdateRecipeCommand = CreateRecipeCommand;

// ===== Recipe Extraction DTOs and Commands =====

/**
 * Command model for extracting recipe from text
 * Used in POST /api/recipe/extract-from-text
 */
export interface ExtractFromTextCommand {
  text: string;
}

/**
 * Command model for extracting recipe from URL
 * Used in POST /api/recipe/extract-from-url
 */
export interface ExtractFromUrlCommand {
  url: string;
}

/**
 * DTO for extracted recipe data
 * Part of the response payload for extraction endpoints
 */
export interface ExtractedRecipeDataDTO {
  name: string;
  ingredients: string[];
  steps: string[];
  preparation_time?: string;
  suggested_tags: string[]; // Suggested tags as slugs
  image_url?: string; // Only for URL extraction
  source_url?: string; // Only for URL extraction
}

/**
 * Result of extraction validation with potential warnings
 */
export interface ExtractionValidationResult {
  data: ExtractedRecipeDataDTO;
  warnings: string[]; // Lista ostrzeżeń dla użytkownika
  hasErrors: boolean; // Czy są jakieś krytyczne problemy
}

/**
 * DTO for text extraction response
 * Returned by POST /api/recipe/extract-from-text
 */
export interface ExtractFromTextResponseDTO {
  extraction_log_id: string;
  extracted_data: ExtractedRecipeDataDTO;
  original_text: string;
  warnings?: string[]; // Ostrzeżenia z procesu ekstrakcji
}

/**
 * DTO for URL extraction response
 * Returned by POST /api/recipe/extract-from-url
 */
export interface ExtractFromUrlResponseDTO {
  extraction_log_id: string;
  extracted_data: ExtractedRecipeDataDTO;
  warnings?: string[]; // Ostrzeżenia z procesu ekstrakcji
}

/**
 * Command model for extraction feedback
 * Used in POST /api/recipe/extraction/{logId}/feedback
 */
export interface ExtractionFeedbackCommand {
  feedback: "positive" | "negative";
}

// ===== Tag DTOs =====

/**
 * DTO for a single tag
 * Used in tag lists and recipe details
 */
export interface TagDTO extends Pick<Tables<"tags">, "id" | "name" | "slug"> {
  color_hex?: string; // Opcjonalne, jeśli nie będzie w bazie danych
}

/**
 * DTO for tag list
 * Returned by GET /api/tags
 */
export interface TagListResponseDTO {
  tags: TagDTO[];
}

// ===== Upload DTOs =====

/**
 * DTO for image upload response
 * Returned by POST /api/upload/recipe-image
 */
export interface UploadImageResponseDTO {
  url: string;
  hash: string;
}

// ===== Common DTOs =====

/**
 * DTO for pagination information
 * Used in list responses
 */
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * DTO for API errors
 * Standard format for errors returned by the API
 */
export interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

// ===== Query Parameters Types =====

/**
 * Typ sortowania dla list przepisów
 */
export type RecipeSortOption = "created_at:asc" | "created_at:desc" | "name:asc" | "name:desc";

/**
 * Query parameters for GET /api/recipes
 */
export interface RecipeListQueryParams {
  page?: number;
  limit?: number;
  sort?: RecipeSortOption;
  tag?: string;
}

// ===== Type Guards =====

/**
 * Type guard checking if an object is ErrorResponseDTO
 */
export function isErrorResponse(response: unknown): response is ErrorResponseDTO {
  return (
    typeof response === "object" &&
    response !== null &&
    "error" in response &&
    typeof (response as Record<string, unknown>).error === "object"
  );
}

// ===== Utility Types =====

/**
 * Helper type for source_type
 * Based on values from API validation
 */
export type RecipeSourceType = "manual" | "url" | "text";

/**
 * Helper type for feedback
 * Based on values from API validation
 */
export type FeedbackType = "positive" | "negative";

// ===== Profile View Types =====

/**
 * State for the profile view component
 * Manages loading, error and data states
 */
export interface ProfileViewState {
  data: UserProfileViewModel | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * View model for user profile with formatted data
 * Transforms UserProfileDTO into user-friendly format
 */
export interface UserProfileViewModel {
  id: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  recipeCount: number;
  extractionLimit: ExtractionLimitInfo;
  memberSinceFormatted: string; // "Członek od: Styczeń 2024"
}

/**
 * Information about extraction limits with calculations and formatting
 * Used for displaying usage progress and reset dates
 */
export interface ExtractionLimitInfo {
  used: number;
  limit: number;
  date: string;
  percentageUsed: number; // used/limit * 100
  isLimitExceeded: boolean; // used >= limit
  resetDateFormatted: string; // "Limit odnawia się jutro" lub "Limit odnawia się 15.01.2024"
  daysTillReset: number;
}

/**
 * Props for UserInfoCard component
 * Displays basic user information
 */
export interface UserInfoCardProps {
  email: string;
  recipeCount: number;
  memberSince: string;
}

/**
 * Props for ExtractionLimitCard component
 * Displays extraction limit information with progress
 */
export interface ExtractionLimitCardProps {
  extractionLimit: ExtractionLimitInfo;
}

/**
 * Props for LogoutButton component
 * Handles user logout with loading state
 */
export interface LogoutButtonProps {
  onLogout: () => Promise<void>;
  isLoading?: boolean;
}

// ===== OpenRouter Service Types =====

/**
 * Konfiguracja serwisu OpenRouter
 */
export interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Request do OpenRouter API dla chat completion
 */
export interface ChatCompletionRequest {
  systemMessage: string;
  userMessage: string;
  modelName?: string;
  responseFormat?: ResponseFormat;
  modelParameters?: ModelParameters;
}

/**
 * Format odpowiedzi z JSON schema
 */
export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: object;
  };
}

/**
 * Parametry modelu AI
 */
export interface ModelParameters {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

/**
 * Wiadomość w formacie OpenRouter API
 */
export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Odpowiedź z OpenRouter API
 */
export interface ChatCompletionResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Konfiguracja retry logic
 */
export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
}

/**
 * Błąd OpenRouter API
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorType?: "network" | "auth" | "rate_limit" | "model" | "validation" | "response_format"
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}
