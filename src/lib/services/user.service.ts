import type { SupabaseClient } from "../../db/supabase.client";
import type { UserProfileDTO } from "../../types";

/**
 * Service for user-related operations
 */
export class UserService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Pobiera pełny profil użytkownika z dodatkowymi danymi
   * @param userId ID użytkownika
   * @returns Promise z danymi profilu użytkownika
   */
  async getUserProfile(userId: string): Promise<UserProfileDTO> {
    try {
      // Pobieranie podstawowych danych użytkownika
      const { data: user, error: userError } = await this.supabase
        .from("users")
        .select("id, email, is_admin, created_at")
        .eq("id", userId)
        .single();

      if (userError) {
        throw new Error(`Błąd pobierania danych użytkownika: ${userError.message}`);
      }

      if (!user) {
        throw new Error("Użytkownik nie został znaleziony");
      }

      // Równoległe pobieranie recipe_count i extraction_limit
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
      console.error("Błąd w getUserProfile:", error);
      throw error;
    }
  }

  /**
   * Pobiera liczbę przepisów użytkownika
   * @param userId ID użytkownika
   * @returns Promise z liczbą przepisów
   */
  private async getRecipeCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("recipes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      console.error("Błąd pobierania liczby przepisów:", error);
      return 0; // Zwracamy 0 w przypadku błędu
    }

    return count || 0;
  }

  /**
   * Pobiera dzisiejszy limit ekstrakcji użytkownika
   * @param userId ID użytkownika
   * @returns Promise z informacjami o limicie ekstrakcji
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
      // PGRST116 = brak wyniku - to jest OK
      console.error("Błąd pobierania limitu ekstrakcji:", error);
    }

    const used = data?.count || 0;
    const limit = 100; // Domyślny limit dzienny

    return {
      used,
      limit,
      date: today,
    };
  }
}
