import "reflect-metadata";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "../../../db/supabase.client";
import { TagService } from "./tag.service";
import type { TagDTO } from "../../../types";

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          // This will be the final resolved value
        })),
      })),
    })),
  })),
} as unknown as SupabaseClient;

describe("TagService", () => {
  let tagService: TagService;

  beforeEach(() => {
    vi.clearAllMocks();
    tagService = new TagService(mockSupabaseClient);
  });

  describe("getActiveTags", () => {
    it("should return list of active tags sorted alphabetically", async () => {
      const mockTags: TagDTO[] = [
        { id: "1", name: "Breakfast", slug: "breakfast" },
        { id: "2", name: "Dinner", slug: "dinner" },
        { id: "3", name: "Lunch", slug: "lunch" },
      ];

      // Setup the mock chain
      const orderMock = vi.fn().mockResolvedValue({
        data: mockTags,
        error: null,
      });
      const eqMock = vi.fn().mockReturnValue({
        order: orderMock,
      });
      const selectMock = vi.fn().mockReturnValue({
        eq: eqMock,
      });
      const fromMock = vi.fn().mockReturnValue({
        select: selectMock,
      });

      mockSupabaseClient.from = fromMock;

      const result = await tagService.getActiveTags();

      expect(fromMock).toHaveBeenCalledWith("tags");
      expect(selectMock).toHaveBeenCalledWith("id, name, slug");
      expect(eqMock).toHaveBeenCalledWith("is_active", true);
      expect(orderMock).toHaveBeenCalledWith("name", { ascending: true });
      expect(result).toEqual(mockTags);
    });

    it("should return empty array when no tags found", async () => {
      // Setup the mock chain for empty result
      const orderMock = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const eqMock = vi.fn().mockReturnValue({
        order: orderMock,
      });
      const selectMock = vi.fn().mockReturnValue({
        eq: eqMock,
      });
      const fromMock = vi.fn().mockReturnValue({
        select: selectMock,
      });

      mockSupabaseClient.from = fromMock;

      const result = await tagService.getActiveTags();

      expect(result).toEqual([]);
    });

    it("should throw error when database query fails", async () => {
      const mockError = { message: "Database connection failed", code: "CONNECTION_ERROR" };

      // Setup the mock chain for database error
      const orderMock = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });
      const eqMock = vi.fn().mockReturnValue({
        order: orderMock,
      });
      const selectMock = vi.fn().mockReturnValue({
        eq: eqMock,
      });
      const fromMock = vi.fn().mockReturnValue({
        select: selectMock,
      });

      mockSupabaseClient.from = fromMock;

      await expect(tagService.getActiveTags()).rejects.toThrow("Failed to fetch tags from the database");
    });

    it("should handle unexpected errors gracefully", async () => {
      // Setup the mock to throw an unexpected error
      const fromMock = vi.fn().mockImplementation(() => {
        throw new Error("Unexpected error occurred");
      });

      mockSupabaseClient.from = fromMock;

      await expect(tagService.getActiveTags()).rejects.toThrow("Unexpected error occurred");
    });

    it("should handle non-Error exceptions", async () => {
      // Setup the mock to throw a non-Error object
      const fromMock = vi.fn().mockImplementation(() => {
        throw "String error";
      });

      mockSupabaseClient.from = fromMock;

      await expect(tagService.getActiveTags()).rejects.toThrow("Unexpected error while fetching tags");
    });
  });
});
