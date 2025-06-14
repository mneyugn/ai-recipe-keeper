import type { ExtractedRecipeDataDTO, ExtractionValidationResult } from "../../types";
import { supabaseClient } from "../../db/supabase.client";
import type { Database, Json } from "../../db/database.types";
import { OpenRouterService } from "../openrouter.service";
import type { OpenRouterConfig, ChatCompletionRequest, ResponseFormat } from "../../types";

/**
 * JSON Schema dla odpowiedzi AI - wyekstraktowane dane przepisu
 */
const RECIPE_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    name: {
      type: "string",
      description: "Recipe name in Polish (EXACTLY this field name: 'name')",
    },
    ingredients: {
      type: "array",
      items: {
        type: "string",
      },
      description:
        "List of ingredients, each as separate string with quantity and unit (EXACTLY this field name: 'ingredients')",
    },
    steps: {
      type: "array",
      items: {
        type: "string",
      },
      description: "List of preparation steps, each as separate string (EXACTLY this field name: 'steps')",
    },
    preparation_time: {
      type: "string",
      description: "Preparation time as string (EXACTLY this field name: 'preparation_time')",
    },
    suggested_tags: {
      type: "array",
      items: {
        type: "string",
        enum: [
          "obiad",
          "śniadanie",
          "kolacja",
          "deser",
          "ciasto",
          "zupa",
          "makaron",
          "mięso",
          "ryby",
          "wegetariańskie",
          "wegańskie",
          "latwe",
          "szybkie",
          "trudne",
        ],
      },
      description: "Suggested tags from allowed list only (EXACTLY this field name: 'suggested_tags')",
    },
  },
  required: ["name", "ingredients", "steps", "suggested_tags"],
  additionalProperties: false,
};

/**
 * System prompt dla ekstrakcji przepisów z tekstu
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
export class RecipeExtractionService {
  private openRouterService: OpenRouterService;

  constructor() {
    // Inicjalizacja OpenRouter Service
    const config: OpenRouterConfig = {
      apiKey: import.meta.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || "",
      baseUrl: "https://openrouter.ai/api/v1",
      defaultModel: "google/gemini-2.0-flash-001",
      timeout: 60000, // 60 sekund dla dłuższych requestów
      maxRetries: 2,
      retryDelay: 2000,
    };

    if (!config.apiKey) {
      throw new Error("OPENROUTER_API_KEY nie jest ustawiony w zmiennych środowiskowych");
    }

    this.openRouterService = new OpenRouterService(config);
  }

  /**
   * Logs extraction attempt to database
   * @param userId - UUID of the user
   * @param inputText - original text that was processed
   * @param extractedData - result of extraction (null if failed)
   * @param errorMessage - error message if extraction failed
   * @param tokensUsed - number of tokens used in AI request
   * @param generationDuration - time taken for AI generation in milliseconds
   * @returns Promise<string> - UUID of created log entry
   */
  async logExtractionAttempt(
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

      const { data, error } = await supabaseClient.from("extraction_logs").insert(logEntry).select("id").single();

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
   * @param userId - UUID of the user to check
   * @returns Promise<boolean> - true if under limit, false if exceeded
   */
  async checkDailyLimit(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseClient.rpc("check_extraction_limit", {
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
   * @param userId - UUID of the user
   * @returns Promise<void>
   */
  async incrementDailyCount(userId: string): Promise<void> {
    try {
      const { error } = await supabaseClient.rpc("increment_extraction_count", {
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
      // Przygotowanie response format z JSON schema
      const responseFormat: ResponseFormat = {
        type: "json_schema",
        json_schema: {
          name: "recipe_extraction",
          strict: true,
          schema: RECIPE_EXTRACTION_SCHEMA,
        },
      };

      // Przygotowanie requestu do OpenRouter
      const chatRequest: ChatCompletionRequest = {
        systemMessage: RECIPE_EXTRACTION_SYSTEM_PROMPT,
        userMessage: `Wyekstraktuj dane przepisu z następującego tekstu:\n\n${text}`,
        responseFormat,
        modelParameters: {
          temperature: 0.1, // Niska temperatura dla większej konsystencji
          max_tokens: 2000,
        },
      };

      // Wywołanie OpenRouter API
      const response = await this.openRouterService.createChatCompletion(chatRequest);

      // Parsowanie odpowiedzi JSON
      const assistantMessage = response.choices[0]?.message?.content;
      if (!assistantMessage) {
        throw new Error("Brak odpowiedzi od modelu AI");
      }

      let extractedData: ExtractedRecipeDataDTO;
      try {
        extractedData = JSON.parse(assistantMessage);
      } catch (parseError) {
        throw new Error(
          `Nieprawidłowy format odpowiedzi JSON: ${parseError instanceof Error ? parseError.message : "Unknown error"}`
        );
      }

      // Walidacja wyekstraktowanych danych
      const validationResult = this.validateExtractedData(extractedData);

      return validationResult;
    } catch (error) {
      console.error("Error in extractFromText:", error);

      // Rzucamy error dalej, żeby endpoint mógł go odpowiednio obsłużyć
      throw error;
    }
  }

  /**
   * Waliduje wyekstraktowane dane przepisu i zwraca dane z ostrzeżeniami
   * @private
   */
  private validateExtractedData(data: unknown): ExtractionValidationResult {
    const warnings: string[] = [];
    let hasErrors = false;

    if (!data || typeof data !== "object") {
      hasErrors = true;
      warnings.push("Otrzymano nieprawidłowe dane z AI - spróbuj ponownie z innym tekstem");
      return {
        data: this.getDefaultRecipeData(),
        warnings,
        hasErrors,
      };
    }

    const obj = data as Record<string, unknown>;

    // Inicjalizacja wyniku z domyślnymi wartościami
    const result: ExtractedRecipeDataDTO = {
      name: "",
      ingredients: [],
      steps: [],
      preparation_time: undefined,
      suggested_tags: [],
    };

    // Walidacja nazwy
    if (!obj.name || typeof obj.name !== "string" || obj.name.trim().length === 0) {
      warnings.push("W przepisie nie wykryto nazwy - uzupełnij ją samodzielnie");
      result.name = "Nowy przepis"; // Domyślna nazwa
    } else {
      result.name = obj.name.trim();
    }

    // Walidacja składników
    if (!Array.isArray(obj.ingredients) || obj.ingredients.length === 0) {
      warnings.push("Nie wykryto składników - dodaj je samodzielnie");
      hasErrors = true;
    } else {
      const validIngredients: string[] = [];
      for (const ingredient of obj.ingredients) {
        if (typeof ingredient === "string" && ingredient.trim().length > 0) {
          validIngredients.push(ingredient.trim());
        }
      }

      if (validIngredients.length === 0) {
        warnings.push("Wykryte składniki były puste - dodaj je samodzielnie");
        hasErrors = true;
      } else if (validIngredients.length < obj.ingredients.length) {
        warnings.push("Część składników była nieprawidłowa i została pominięta");
      }

      result.ingredients = validIngredients;
    }

    // Walidacja kroków
    if (!Array.isArray(obj.steps) || obj.steps.length === 0) {
      warnings.push("Nie wykryto kroków przygotowania - dodaj je samodzielnie");
      hasErrors = true;
    } else {
      const validSteps: string[] = [];
      for (const step of obj.steps) {
        if (typeof step === "string" && step.trim().length > 0) {
          validSteps.push(step.trim());
        }
      }

      if (validSteps.length === 0) {
        warnings.push("Wykryte kroki były puste - dodaj je samodzielnie");
        hasErrors = true;
      } else if (validSteps.length < obj.steps.length) {
        warnings.push("Część kroków była nieprawidłowa i została pominięta");
      }

      result.steps = validSteps;
    }

    // Walidacja czasu przygotowania
    if (obj.preparation_time && typeof obj.preparation_time === "string" && obj.preparation_time.trim().length > 0) {
      result.preparation_time = obj.preparation_time.trim();
    }

    // Walidacja tagów
    const allowedTags = [
      "obiad",
      "śniadanie",
      "kolacja",
      "deser",
      "ciasto",
      "zupa",
      "makaron",
      "mięso",
      "ryby",
      "wegetariańskie",
      "wegańskie",
      "latwe",
      "szybkie",
      "trudne",
    ];

    if (Array.isArray(obj.suggested_tags)) {
      const validTags: string[] = [];
      const invalidTags: string[] = [];

      for (const tag of obj.suggested_tags) {
        if (typeof tag === "string" && allowedTags.includes(tag)) {
          validTags.push(tag);
        } else if (typeof tag === "string") {
          invalidTags.push(tag);
        }
      }

      result.suggested_tags = validTags;

      if (invalidTags.length > 0) {
        warnings.push(`Nieprawidłowe tagi zostały pominięte: ${invalidTags.join(", ")}`);
      }
    }

    return {
      data: result,
      warnings,
      hasErrors,
    };
  }

  /**
   * Zwraca domyślne dane przepisu w przypadku krytycznego błędu
   * @private
   */
  private getDefaultRecipeData(): ExtractedRecipeDataDTO {
    return {
      name: "Nowy przepis",
      ingredients: [],
      steps: [],
      suggested_tags: [],
    };
  }
}
