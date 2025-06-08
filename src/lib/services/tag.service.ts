import type { SupabaseClient } from "../../db/supabase.client";
import type { TagDTO } from "../../types";

export class TagService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Pobiera wszystkie aktywne tagi z bazy danych
   * @returns Lista aktywnych tagów posortowana alfabetycznie
   */
  async getActiveTags(): Promise<TagDTO[]> {
    try {
      const { data, error } = await this.supabase
        .from("tags")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) {
        console.error("TagService.getActiveTags: Database error:", error);
        throw new Error("Nie udało się pobrać tagów z bazy danych");
      }

      return data || [];
    } catch (error) {
      console.error("TagService.getActiveTags: Unexpected error:", error);
      throw error instanceof Error ? error : new Error("Nieoczekiwany błąd podczas pobierania tagów");
    }
  }
}
