import type { SupabaseClient } from "../../db/supabase.client";
import type { UserProfileDTO } from "../../types";

/**
 * Service for user-related operations
 */
export class UserService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Fetches full user profile with additional data
   * @param userId User ID
   * @returns Promise with user profile data
   */
  async getUserProfile(userId: string): Promise<UserProfileDTO> {
    try {
      // fetch basic user data
      const { data: user, error: userError } = await this.supabase
        .from("users")
        .select("id, email, is_admin, created_at")
        .eq("id", userId)
        .maybeSingle();

      if (userError) {
        console.error("Error fetching user data:", userError);
        throw new Error(`Error fetching user data: ${userError.message}`);
      }

      if (!user) {
        console.error("User not found in database:", userId);
        throw new Error("User not found");
      }

      // fetch recipe_count and extraction_limit in parallel
      const [recipeCountResult, extractionLimitResult] = await Promise.all([
        this.getRecipeCount(userId),
        this.getExtractionLimit(userId),
      ]);

      return {
        ...user,
        recipe_count: recipeCountResult,
        extraction_limit: extractionLimitResult,
      };
    } catch (error) {
      console.error("Error in getUserProfile:", error);
      throw error;
    }
  }

  /**
   * Fetches user's recipe count
   * @param userId User ID
   * @returns Promise with recipe count
   */
  private async getRecipeCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("recipes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching recipe count:", error);
      return 0; // return 0 in case of error
    }

    return count || 0;
  }

  /**
   * Fetches user's daily extraction limit
   * @param userId User ID
   * @returns Promise with extraction limit information
   */
  private async getExtractionLimit(userId: string): Promise<{
    used: number;
    limit: number;
    date: string;
  }> {
    const today = new Date().toISOString().split("T")[0]; // Format YYYY-MM-DD

    const { data, error } = await this.supabase
      .from("daily_extraction_limits")
      .select("count")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no result - this is OK
      console.error("Error fetching extraction limit:", error);
    }

    const used = data?.count || 0;
    const limit = 100; // default daily limit

    return {
      used,
      limit,
      date: today,
    };
  }
}
