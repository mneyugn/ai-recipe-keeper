import { useState, useEffect } from "react";
import type { UserProfileViewModel, UserProfileDTO } from "../../types";
import { transformUserProfileData } from "../../lib/utils";

interface UseUserProfileReturn {
  profile: UserProfileViewModel | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing user profile data
 * Fetches user profile from API and transforms it to view model format
 */
export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfileViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/users/profile", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - redirect to login
          window.location.href = "/login";
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const profileDto: UserProfileDTO = await response.json();
      const transformedProfile = transformUserProfileData(profileDto);
      setProfile(transformedProfile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd";
      setError(errorMessage);
      console.error("Error fetching user profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = async (): Promise<void> => {
    await fetchProfile();
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    isLoading,
    error,
    refetch,
  };
}
