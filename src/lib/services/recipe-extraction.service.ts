import type { ExtractedRecipeDataDTO } from "../../types";
import { supabaseClient, DEFAULT_USER_ID } from "../../db/supabase.client";
import type { Database, Json } from "../../db/database.types";

/**
 * Service responsible for extracting recipe data from various sources (text, URL)
 * Includes rate limiting and database logging functionality
 */
export class RecipeExtractionService {
  /**
   * Logs extraction attempt to database
   * @param userId - UUID of the user
   * @param inputText - original text that was processed
   * @param extractedData - result of extraction (null if failed)
   * @param errorMessage - error message if extraction failed
   * @returns Promise<string> - UUID of created log entry
   */
  async logExtractionAttempt(
    userId: string = DEFAULT_USER_ID,
    inputText: string,
    extractedData: ExtractedRecipeDataDTO | null = null,
    errorMessage: string | null = null
  ): Promise<string> {
    try {
      const logEntry: Database["public"]["Tables"]["extraction_logs"]["Insert"] = {
        user_id: userId,
        module: "text",
        input_data: inputText,
        extraction_result: extractedData as Json,
        error_message: errorMessage,
        tokens_used: null, // Will be filled when real AI is implemented
        generation_duration: null, // Will be filled when real AI is implemented
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
  async checkDailyLimit(userId: string = DEFAULT_USER_ID): Promise<boolean> {
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
  async incrementDailyCount(userId: string = DEFAULT_USER_ID): Promise<void> {
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
   * @returns Promise with extracted recipe data
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async extractFromText(text: string): Promise<ExtractedRecipeDataDTO> {
    // Simulate API delay (2-5 seconds as per plan)
    await this.simulateApiDelay();

    // Mock data - in the future, it will be replaced with real AI
    const mockExtractedData: ExtractedRecipeDataDTO = {
      name: "Kurczak z ziemniakami",
      ingredients: ["2 szklanki mąki", "3 jajka", "1 szklanka mleka", "1 łyżeczka soli"],
      steps: [
        "Wymieszaj suche składniki w misce",
        "Dodaj jajka i mleko",
        "Mieszaj do uzyskania gładkiego ciasta",
        "Smaż na patelni do złocenia",
      ],
      preparation_time: "30 minut",
      suggested_tags: ["obiad", "latwe", "szybkie"],
    };

    return mockExtractedData;
  }

  /**
   * Simulates AI API delay
   * @private
   */
  private async simulateApiDelay(): Promise<void> {
    const delay = Math.random() * 3000 + 2000; // 2-5 seconds
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}
