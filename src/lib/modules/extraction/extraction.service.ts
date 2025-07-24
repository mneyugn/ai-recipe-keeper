import { injectable, inject } from "tsyringe";
import type { ExtractedRecipeDataDTO, ExtractionValidationResult } from "../../../types";
import type { SupabaseClient } from "../../../db/supabase.client";
import type { Database, Json } from "../../../db/database.types";
import type { OpenRouterService } from "../../services/openrouter.service";
import type { ChatCompletionRequest, ResponseFormat } from "../../../types";
import { RECIPE_EXTRACTION_SCHEMA, validateExtractedData } from "../../validations/recipe.validation";

/**
 * System prompt for recipe extraction from text
 */
const RECIPE_EXTRACTION_SYSTEM_PROMPT = `You are an expert at analyzing Polish culinary recipes. Your task is to extract structured recipe data from the provided text.

CRITICAL REQUIREMENTS - JSON FIELD NAMES:
- Use EXACTLY these field names: "name", "ingredients", "steps", "preparation_time", "suggested_tags"
- DO NOT use Polish field names like "nazwa", "składniki", "przygotowanie", "tagi"
- DO NOT use alternative names like "instructions", "description", "opis"
- Follow the JSON schema EXACTLY

EXTRACTION RULES:
1. Extract ONLY information that is actually present in the text
2. Each ingredient as separate array item with quantity, unit and name (e.g. "2 szklanki mąki pszennej")
3. Each preparation step as separate array item
4. For suggested_tags use ONLY from this list: obiad, śniadanie, kolacja, deser, ciasto, zupa, makaron, mięso, ryby, wegetariańskie, wegańskie, latwe, szybkie, trudne
5. If recipe name is not found, try to deduce it from context
6. Ignore ads, comments and other irrelevant content

Return JSON response following the schema EXACTLY.`;

/**
 * Service responsible for extracting recipe data from various sources (text, URL)
 * Includes rate limiting and database logging functionality
 */
@injectable()
export class ExtractionService {
  constructor(@inject("OpenRouterService") public openRouterService: OpenRouterService) {}

  /**
   * Logs extraction attempt to database
   * @param supabase - The Supabase client instance from context
   * @param userId - UUID of the user
   * @param inputText - original text that was processed
   * @param extractedData - result of extraction (null if failed)
   * @param errorMessage - error message if extraction failed
   * @param tokensUsed - number of tokens used in AI request
   * @param generationDuration - time taken for AI generation in milliseconds
   * @returns Promise<string> - UUID of created log entry
   */
  async logExtractionAttempt(
    supabase: SupabaseClient,
    userId: string,
    inputText: string,
    extractedData: ExtractedRecipeDataDTO | null = null,
    errorMessage: string | null = null,
    tokensUsed: number | null = null,
    generationDuration: number | null = null
  ): Promise<string> {
    try {
      const logEntry: Database["public"]["Tables"]["extraction_logs"]["Insert"] = {
        user_id: userId,
        module: "text",
        input_data: inputText,
        extraction_result: extractedData as Json,
        error_message: errorMessage,
        tokens_used: tokensUsed,
        generation_duration: generationDuration,
      };

      const { data, error } = await supabase.from("extraction_logs").insert(logEntry).select("id").single();

      if (error) {
        console.error("Error inserting extraction log:", error);
        throw new Error("Failed to log extraction attempt");
      }

      return data.id;
    } catch (error) {
      console.error("Error in logExtractionAttempt:", error);
      throw error;
    }
  }

  /**
   * Checks if user has not exceeded daily extraction limit (100/day)
   * @param supabase - The Supabase client instance from context
   * @param userId - UUID of the user to check
   * @returns Promise<boolean> - true if under limit, false if exceeded
   */
  async checkDailyLimit(supabase: SupabaseClient, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("check_extraction_limit", {
        p_user_id: userId,
      });

      if (error) {
        console.error("Error checking daily extraction limit:", error);
        throw new Error("Failed to check daily extraction limit");
      }

      return data;
    } catch (error) {
      console.error("Error in checkDailyLimit:", error);
      throw error;
    }
  }

  /**
   * Increments the daily extraction counter for user
   * @param supabase - The Supabase client instance from context
   * @param userId - UUID of the user
   * @returns Promise<void>
   */
  async incrementDailyCount(supabase: SupabaseClient, userId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc("increment_extraction_count", {
        p_user_id: userId,
      });

      if (error) {
        console.error("Error incrementing extraction count:", error);
        throw new Error("Failed to increment daily extraction count");
      }
    } catch (error) {
      console.error("Error in incrementDailyCount:", error);
      throw error;
    }
  }

  /**
   * Extracts recipe data from unstructured text using AI
   * @param text - text containing recipe to extract
   * @returns Promise with extracted recipe data and potential warnings
   */
  async extractFromText(text: string): Promise<ExtractionValidationResult> {
    try {
      const responseFormat: ResponseFormat = {
        type: "json_schema",
        json_schema: {
          name: "recipe_extraction",
          strict: true,
          schema: RECIPE_EXTRACTION_SCHEMA,
        },
      };

      const chatRequest: ChatCompletionRequest = {
        systemMessage: RECIPE_EXTRACTION_SYSTEM_PROMPT,
        userMessage: `Wyekstraktuj dane przepisu z następującego tekstu:\n\n${text}`,
        responseFormat,
        modelParameters: {
          temperature: 1,
          max_tokens: 3000,
        },
      };

      const response = await this.openRouterService.createChatCompletion(chatRequest);

      const assistantMessage = response.choices[0]?.message?.content;
      if (!assistantMessage) {
        throw new Error("No response from AI model");
      }

      let extractedData: ExtractedRecipeDataDTO;
      try {
        extractedData = JSON.parse(assistantMessage);
      } catch (parseError) {
        throw new Error(
          `Invalid JSON response format: ${parseError instanceof Error ? parseError.message : "Unknown error"}`
        );
      }

      const validationResult = validateExtractedData(extractedData);

      return validationResult;
    } catch (error) {
      console.error("Error in extractFromText:", error);

      // throw error to endpoint to handle it properly
      throw error;
    }
  }
}
