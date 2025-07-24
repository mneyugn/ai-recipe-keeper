import { injectable, inject } from "tsyringe";
import type { SupabaseClient } from "../../../db/supabase.client";
import type { TagDTO } from "../../../types";

@injectable()
export class TagService {
  constructor(@inject("SupabaseClient") private supabase: SupabaseClient) {}

  /**
   * Fetches all active tags from the database
   * @returns List of active tags sorted alphabetically
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
        throw new Error("Failed to fetch tags from the database");
      }

      return data || [];
    } catch (error) {
      console.error("TagService.getActiveTags: Unexpected error:", error);
      throw error instanceof Error ? error : new Error("Unexpected error while fetching tags");
    }
  }
}
