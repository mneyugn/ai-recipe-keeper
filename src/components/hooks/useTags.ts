import { useState, useEffect, useCallback } from "react";
import type { TagDTO } from "../../types";

interface UseTagsReturn {
  tags: TagDTO[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useTags = (): UseTagsReturn => {
  const [tags, setTags] = useState<TagDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/tags");

      if (!response.ok) {
        if (response.status >= 500) {
          throw new Error("Błąd serwera. Spróbuj ponownie później.");
        }
        throw new Error("Nie udało się pobrać tagów");
      }

      const data = await response.json();
      setTags(data.tags || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Wystąpił błąd");
      setTags([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return {
    tags,
    isLoading,
    error,
    refetch,
  };
};
