import { z } from "zod";

/**
 * Validation schema for extracting recipe from text
 * Checks for the presence of the text field and its length (max 10,000 characters)
 */
export const extractFromTextSchema = z.object({
  text: z.string().min(1, "The 'text' field is required").max(10000, "Text cannot exceed 10,000 characters").trim(),
});

/**
 * Type for validated extract-from-text request body
 */
export type ExtractFromTextInput = z.infer<typeof extractFromTextSchema>;
