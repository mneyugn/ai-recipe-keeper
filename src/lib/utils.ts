import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { UserProfileDTO, UserProfileViewModel, ExtractionLimitInfo } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Transforms UserProfileDTO to UserProfileViewModel with formatted data
 * @param dto Raw user profile data from API
 * @returns Formatted user profile view model
 */
export function transformUserProfileData(dto: UserProfileDTO): UserProfileViewModel {
  const extractionLimit = transformExtractionLimitData(dto.extraction_limit);
  const memberSinceFormatted = formatMemberSinceDate(dto.created_at);

  return {
    id: dto.id,
    email: dto.email,
    username: dto.username || dto.email.split("@")[0], // Fallback do części przed @ jeśli username null
    isAdmin: dto.is_admin,
    createdAt: dto.created_at,
    recipeCount: dto.recipe_count,
    extractionLimit,
    memberSinceFormatted,
  };
}

/**
 * Transforms extraction limit data with calculations and formatting
 * @param limitData Raw extraction limit data
 * @returns Formatted extraction limit information
 */
function transformExtractionLimitData(limitData: { used: number; limit: number; date: string }): ExtractionLimitInfo {
  const percentageUsed = Math.round((limitData.used / limitData.limit) * 100);
  const isLimitExceeded = limitData.used >= limitData.limit;
  const daysTillReset = calculateDaysTillReset(limitData.date);
  const resetDateFormatted = formatResetDate(limitData.date, daysTillReset);

  return {
    used: limitData.used,
    limit: limitData.limit,
    date: limitData.date,
    percentageUsed,
    isLimitExceeded,
    resetDateFormatted,
    daysTillReset,
  };
}

/**
 * Formats member since date in Polish format
 * @param createdAt ISO date string
 * @returns Formatted date like "Członek od: Styczeń 2024"
 */
function formatMemberSinceDate(createdAt: string): string {
  try {
    const date = new Date(createdAt);
    const monthNames = [
      "Styczeń",
      "Luty",
      "Marzec",
      "Kwiecień",
      "Maj",
      "Czerwiec",
      "Lipiec",
      "Sierpień",
      "Wrzesień",
      "Październik",
      "Listopad",
      "Grudzień",
    ];

    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `Członek od: ${month} ${year}`;
  } catch (error) {
    console.error("Error formatting member since date:", error);
    return "Członek od: -";
  }
}

/**
 * Calculates days until reset date
 * @param resetDate ISO date string
 * @returns Number of days till reset
 */
function calculateDaysTillReset(resetDate: string): number {
  try {
    const reset = new Date(resetDate);
    const now = new Date();
    const diffTime = reset.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  } catch (error) {
    console.error("Error calculating days till reset:", error);
    return 0;
  }
}

/**
 * Formats reset date with relative or absolute format
 * @param resetDate ISO date string
 * @param daysTillReset Number of days till reset
 * @returns Formatted reset date message
 */
function formatResetDate(resetDate: string, daysTillReset: number): string {
  try {
    if (daysTillReset === 0) {
      return "Limit odnawia się dzisiaj";
    } else if (daysTillReset === 1) {
      return "Limit odnawia się jutro";
    } else if (daysTillReset <= 7) {
      return `Limit odnawia się za ${daysTillReset} dni`;
    } else {
      const date = new Date(resetDate);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();

      return `Limit odnawia się ${day}.${month}.${year}`;
    }
  } catch (error) {
    console.error("Error formatting reset date:", error);
    return "Limit odnawia się: nieznana data";
  }
}
