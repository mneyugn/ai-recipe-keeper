import { z } from "zod";
import type { ExtractedRecipeDataDTO, ExtractionValidationResult } from "../../types";
import { ALLOWED_TAGS } from "../constants";

/**
 * Zod schema for validating the structured recipe data returned by the AI model.
 * It ensures type safety and applies transformations like trimming strings.
 */
export const extractedRecipeDataSchema = z
  .object({
    name: z.string().trim().min(1, "Recipe name cannot be empty."),
    ingredients: z.array(z.string().trim().min(1)).min(1, "At least one ingredient is required."),
    steps: z.array(z.string().trim().min(1)).min(1, "At least one preparation step is required."),
    preparation_time: z.string().trim().optional(),
    suggested_tags: z.array(z.string()).default([]),
  })
  .strip(); // Removes any properties not defined in the schema

/**
 * Shared JSON Schema for instructing the AI model.
 * This is still needed to guide the model's response format.
 */
export const RECIPE_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    name: {
      type: "string",
      description: "Recipe name in Polish (EXACTLY this field name: 'name')",
    },
    ingredients: {
      type: "array",
      items: {
        type: "string",
      },
      description:
        "List of ingredients, each as separate string with quantity and unit (EXACTLY this field name: 'ingredients')",
    },
    steps: {
      type: "array",
      items: {
        type: "string",
      },
      description: "List of preparation steps, each as separate string (EXACTLY this field name: 'steps')",
    },
    preparation_time: {
      type: "string",
      description: "Preparation time as string (EXACTLY this field name: 'preparation_time')",
    },
    suggested_tags: {
      type: "array",
      items: {
        type: "string",
        enum: [...ALLOWED_TAGS],
      },
      description: "Suggested tags from allowed list only (EXACTLY this field name: 'suggested_tags')",
    },
  },
  required: ["name", "ingredients", "steps", "suggested_tags"],
  additionalProperties: false,
};

/**
 * Validates the extracted recipe data from the AI model using Zod.
 *
 * @param data - The unknown data received from the AI model.
 * @returns An object containing the validated data, a list of warnings, and a flag indicating critical errors.
 */
export function validateExtractedData(data: unknown): ExtractionValidationResult {
  const validationResult = extractedRecipeDataSchema.safeParse(data);

  if (validationResult.success) {
    // even if validation succeeds, we might want to add non-critical warnings,
    // like for invalid tags which are handled gracefully
    const warnings: string[] = [];
    const validatedData = validationResult.data;

    // filter suggested_tags against the allowed list
    const allowedTagsSet = new Set<string>(ALLOWED_TAGS);

    const originalTags = (data as { suggested_tags?: string[] })?.suggested_tags || [];
    const validTags: string[] = [];
    const invalidTags: string[] = [];

    for (const tag of originalTags) {
      if (typeof tag === "string" && allowedTagsSet.has(tag)) {
        validTags.push(tag);
      } else if (typeof tag === "string") {
        invalidTags.push(tag);
      }
    }

    if (invalidTags.length > 0) {
      warnings.push(`Invalid tags have been omitted: ${invalidTags.join(", ")}`);
    }

    validatedData.suggested_tags = validTags;

    return {
      data: validatedData,
      warnings,
      hasErrors: false,
    };
  }

  // if validation fails, map Zod errors to user-friendly warnings
  const warnings = validationResult.error.issues.map((issue) => {
    switch (issue.path[0]) {
      case "name":
        return "Recipe name was not detected. Please fill it in manually.";
      case "ingredients":
        return "No ingredients were detected. Please add them manually.";
      case "steps":
        return "No preparation steps were detected. Please add them manually.";
      default:
        return `A validation error occurred: ${issue.message}`;
    }
  });

  // default data for the form
  const defaultData: ExtractedRecipeDataDTO = {
    name: "New Recipe",
    ingredients: [],
    steps: [],
    suggested_tags: [],
  };

  return {
    data: defaultData,
    warnings,
    hasErrors: true, // failure implies critical errors
  };
}
