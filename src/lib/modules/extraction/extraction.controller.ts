import { injectable, inject } from "tsyringe";
import type { APIContext } from "astro";
import { ApiError } from "../../errors";
import { success } from "../../api/responses";
import { extractFromTextSchema, extractFromUrlSchema } from "./extraction.validation";
import type { ExtractionService, UrlScraperService } from ".";
import type { ExtractFromUrlResponseDTO, ExtractFromTextResponseDTO } from "../../../types";
import { withErrorHandler } from "../../api/middleware/errorHandler";

/**
 * Controller handling extraction-related HTTP operations
 */
@injectable()
export class ExtractionController {
  constructor(
    @inject("ExtractionService") private extractionService: ExtractionService,
    @inject("UrlScraperService") private urlScraperService: UrlScraperService
  ) {}

  /**
   * POST /api/recipe/extract-from-url
   * Extracts recipe data from a supported URL using web scraping and AI
   */
  extractFromUrl = withErrorHandler(async (context: APIContext): Promise<Response> => {
    const userId = context.locals.user?.id;
    if (!userId) {
      throw new ApiError(401, "Authentication required.", "AUTH_REQUIRED");
    }

    const contentType = context.request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      throw new ApiError(400, "Content-Type must be application/json.", "INVALID_CONTENT_TYPE");
    }

    let requestBody;
    try {
      requestBody = await context.request.json();
    } catch {
      throw new ApiError(400, "Invalid JSON format.", "INVALID_JSON");
    }

    const validationResult = extractFromUrlSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      throw new ApiError(400, firstError.message, "INVALID_URL");
    }

    const { url } = validationResult.data;

    // check daily extraction limit
    const isUnderLimit = await this.extractionService.checkDailyLimit(context.locals.supabase, userId);
    if (!isUnderLimit) {
      throw new ApiError(429, "Daily extraction limit exceeded (100/day).", "DAILY_LIMIT_EXCEEDED");
    }

    const startTime = Date.now();
    const extractionResult = await this.urlScraperService.extractFromUrl(url);
    const generationDuration = Date.now() - startTime;

    if (extractionResult.hasErrors) {
      // log failed extraction attempt and throw an error
      await this.extractionService.logExtractionAttempt(
        context.locals.supabase,
        userId,
        url,
        null,
        `Validation errors: ${extractionResult.warnings.join(", ")}`,
        null,
        generationDuration
      );
      throw new ApiError(
        422,
        "Failed to extract key recipe data from the provided URL. Please ensure it contains a valid recipe.",
        "AI_EXTRACTION_ERROR"
      );
    }

    // log successful extraction and increment daily counter
    const extractionLogId = await this.extractionService.logExtractionAttempt(
      context.locals.supabase,
      userId,
      url, // URL as input data
      extractionResult.data,
      extractionResult.warnings.length > 0 ? `Warnings: ${extractionResult.warnings.join(", ")}` : null,
      null, // tokens will be available in future update
      generationDuration
    );
    await this.extractionService.incrementDailyCount(context.locals.supabase, userId);

    // prepare and return the successful response
    const response: ExtractFromUrlResponseDTO = {
      extraction_log_id: extractionLogId,
      extracted_data: extractionResult.data,
      warnings: extractionResult.warnings.length > 0 ? extractionResult.warnings : undefined,
    };

    return success(response);
  });

  /**
   * POST /api/recipe/extract-from-text
   * Extracts recipe data from unstructured text using AI and returns structured data
   */
  extractFromText = withErrorHandler(async (context: APIContext): Promise<Response> => {
    // 1. Check authentication
    const userId = context.locals.user?.id;
    if (!userId) {
      throw new ApiError(401, "Authentication required.", "AUTH_REQUIRED");
    }

    // 2. Validate Content-Type
    const contentType = context.request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      throw new ApiError(400, "Content-Type must be application/json.", "INVALID_CONTENT_TYPE");
    }

    // 3. Parse JSON
    let requestBody;
    try {
      requestBody = await context.request.json();
    } catch {
      throw new ApiError(400, "Invalid JSON format.", "INVALID_JSON");
    }

    // 4. Validate request body using Zod
    const validationResult = extractFromTextSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      const errorCode = firstError.code === "too_small" && firstError.minimum === 1 ? "MISSING_TEXT" : "TEXT_TOO_LONG";
      throw new ApiError(400, firstError.message, errorCode);
    }

    const { text } = validationResult.data;

    // 5. Check daily extraction limit
    const isUnderLimit = await this.extractionService.checkDailyLimit(context.locals.supabase, userId);
    if (!isUnderLimit) {
      throw new ApiError(429, "Daily extraction limit exceeded (100/day).", "DAILY_LIMIT_EXCEEDED");
    }

    // 6. Extract recipe data from text using AI
    const startTime = Date.now();
    const extractionResult = await this.extractionService.extractFromText(text);
    const generationDuration = Date.now() - startTime;

    if (extractionResult.hasErrors) {
      // Log failed extraction attempt and throw an error
      await this.extractionService.logExtractionAttempt(
        context.locals.supabase,
        userId,
        text,
        null,
        `Validation errors: ${extractionResult.warnings.join(", ")}`,
        null,
        generationDuration
      );
      throw new ApiError(
        422,
        "Failed to extract key recipe data from the provided text. Please ensure it contains a valid recipe.",
        "AI_EXTRACTION_ERROR"
      );
    }

    // 7. Log successful extraction and increment daily counter
    const extractionLogId = await this.extractionService.logExtractionAttempt(
      context.locals.supabase,
      userId,
      text,
      extractionResult.data,
      extractionResult.warnings.length > 0 ? `Warnings: ${extractionResult.warnings.join(", ")}` : null,
      null, // tokens will be available in future update
      generationDuration
    );
    await this.extractionService.incrementDailyCount(context.locals.supabase, userId);

    // 8. Prepare and return the successful response
    const response: ExtractFromTextResponseDTO = {
      extraction_log_id: extractionLogId,
      extracted_data: extractionResult.data,
      original_text: text,
      warnings: extractionResult.warnings.length > 0 ? extractionResult.warnings : undefined,
    };

    return success(response);
  });
}
