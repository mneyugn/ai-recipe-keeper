import { injectable, inject } from "tsyringe";
import type { ExtractedRecipeDataDTO, ExtractionValidationResult } from "../../types";
import { OpenRouterService } from "./openrouter.service";
import type { ChatCompletionRequest, ResponseFormat } from "../../types";
import { RECIPE_EXTRACTION_SCHEMA, validateExtractedData } from "../validations/recipe.validation";
import { SUPPORTED_URL_DOMAINS, type SupportedUrlDomain } from "../constants";
import { ApiError } from "../errors";

/**
 * System prompt for recipe extraction from HTML/URL content
 */
const RECIPE_URL_EXTRACTION_SYSTEM_PROMPT = `You are an expert at analyzing Polish culinary recipes from websites. Your task is to extract structured recipe data from content scraped from culinary websites.

CRITICAL REQUIREMENTS - JSON FIELD NAMES:
- Use EXACTLY these field names: "name", "ingredients", "steps", "preparation_time", "suggested_tags"
- DO NOT use Polish field names like "nazwa", "składniki", "przygotowanie", "tagi"
- DO NOT use alternative names like "instructions", "description", "opis"
- Follow the JSON schema EXACTLY

EXTRACTION RULES:
1. Extract ONLY information that is actually present in the recipe content
2. Ignore ads, comments, navigation, footers and other irrelevant page elements
3. Each ingredient as separate array item with quantity, unit and name (e.g. "2 szklanki mąki pszennej")
4. Each preparation step as separate array item
5. For suggested_tags use ONLY from this list: obiad, śniadanie, kolacja, deser, ciasto, zupa, makaron, mięso, ryby, wegetariańskie, wegańskie, latwe, szybkie, trudne
6. Focus on the main recipe, ignore variants and additional suggestions
7. If recipe name is not found, try to deduce it from page title or context

Return JSON response following the schema EXACTLY.`;

/**
 * Interface for scraping result
 */
interface ScrapingResult {
  content: string;
  imageUrl?: string;
  title?: string;
}

/**
 * Service for scraping recipes from supported URLs
 */
@injectable()
export class UrlScraperService {
  constructor(@inject("OpenRouterService") private openRouterService: OpenRouterService) {}

  /**
   * Checks if a URL is from a supported domain
   */
  isSupportedUrl(url: string): url is SupportedUrlDomain {
    try {
      const parsedUrl = new URL(url);
      return SUPPORTED_URL_DOMAINS.some(
        (domain) => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }

  /**
   * Fetches and parses content from URL
   */
  private async scrapeUrl(url: string): Promise<ScrapingResult> {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "pl-PL,pl;q=0.9,en;q=0.8",
        },
        signal: AbortSignal.timeout(30000), // 30 sekund timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      return this.extractContentFromHtml(html, url);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "TimeoutError") {
          throw new Error("Timeout while waiting for response from the page");
        }
        throw new Error(`Error while fetching the page: ${error.message}`);
      }
      throw new Error("Unknown error while fetching the page");
    }
  }

  /**
   * Extracts recipe content from HTML
   */
  private extractContentFromHtml(html: string, url: string): ScrapingResult {
    // basic HTML cleaning - removing scripts, styles, etc.
    const cleanHtml = html
      .replace(/<script[^>]*>.*?<\/script>/gis, "")
      .replace(/<style[^>]*>.*?<\/style>/gis, "")
      .replace(/<nav[^>]*>.*?<\/nav>/gis, "")
      .replace(/<footer[^>]*>.*?<\/footer>/gis, "")
      .replace(/<header[^>]*>.*?<\/header>/gis, "")
      .replace(/<!--.*?-->/gs, "");

    // try to extract title
    const titleMatch = cleanHtml.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    // enhanced image extraction with priority for higher resolution
    let imageUrl = this.extractHighResolutionImage(cleanHtml, url);

    // convert relative URLs to absolute
    if (imageUrl && !imageUrl.startsWith("http")) {
      try {
        const baseUrl = new URL(url);
        imageUrl = new URL(imageUrl, baseUrl.origin).href;
      } catch {
        imageUrl = undefined;
      }
    }

    // remove HTML tags and convert to text
    const textContent = cleanHtml
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      content: textContent,
      imageUrl,
      title,
    };
  }

  /**
   * Enhanced image extraction that prioritizes higher resolution images
   */
  private extractHighResolutionImage(html: string, _url: string): string | undefined {
    // priority 1: high-resolution meta tags
    const highResMetaTags = [
      /<meta[^>]*property="og:image:secure_url"[^>]*content="([^"]*)"[^>]*>/i,
      /<meta[^>]*property="og:image:url"[^>]*content="([^"]*)"[^>]*>/i,
      /<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i,
      /<meta[^>]*name="twitter:image"[^>]*content="([^"]*)"[^>]*>/i,
      /<meta[^>]*name="twitter:image:src"[^>]*content="([^"]*)"[^>]*>/i,
    ];

    for (const pattern of highResMetaTags) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const imageUrl = match[1];
        // check if it looks like a high-resolution image
        if (this.isHighResolutionImageUrl(imageUrl)) {
          return imageUrl;
        }
      }
    }

    // priority 2: JSON-LD structured data
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis);
    if (jsonLdMatch) {
      for (const jsonLdScript of jsonLdMatch) {
        try {
          const jsonContent = jsonLdScript.replace(/<script[^>]*type="application\/ld\+json"[^>]*>|<\/script>/gi, "");
          const data = JSON.parse(jsonContent);
          const imageUrl = this.extractImageFromJsonLd(data);
          if (imageUrl && this.isHighResolutionImageUrl(imageUrl)) {
            return imageUrl;
          }
        } catch {
          // ignore malformed JSON-LD
        }
      }
    }

    // priority 3: high-resolution image attributes (srcset, data-src, etc.)
    const highResImagePatterns = [
      // srcset with high DPI
      /<img[^>]*srcset="([^"]*)"[^>]*>/gi,
      // data attributes often contain full-size images
      /<img[^>]*data-src="([^"]*)"[^>]*>/gi,
      /<img[^>]*data-original="([^"]*)"[^>]*>/gi,
      /<img[^>]*data-lazy="([^"]*)"[^>]*>/gi,
      /<img[^>]*data-full="([^"]*)"[^>]*>/gi,
    ];

    for (const pattern of highResImagePatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        if (match[1]) {
          // for srcset, take the highest resolution option
          if (pattern.source.includes("srcset")) {
            const srcsetUrl = this.getBestImageFromSrcset(match[1]);
            if (srcsetUrl && this.isRecipeRelatedImage(match[0])) {
              return srcsetUrl;
            }
          } else {
            // for data attributes, check if it's recipe-related
            if (this.isRecipeRelatedImage(match[0]) && this.isHighResolutionImageUrl(match[1])) {
              return match[1];
            }
          }
        }
      }
    }

    // priority 4: regular img tags with recipe-related context
    const recipeImagePatterns = [
      /<img[^>]*src="([^"]*)"[^>]*alt="[^"]*przepis[^"]*"/gi,
      /<img[^>]*alt="[^"]*przepis[^"]*"[^>]*src="([^"]*)"/gi,
      /<img[^>]*src="([^"]*)"[^>]*class="[^"]*recipe[^"]*"/gi,
      /<img[^>]*class="[^"]*recipe[^"]*"[^>]*src="([^"]*)"/gi,
    ];

    for (const pattern of recipeImagePatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        if (match[1] && this.isHighResolutionImageUrl(match[1])) {
          return match[1];
        }
      }
    }

    // fallback: first meta og:image (original behavior)
    const fallbackMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i);
    return fallbackMatch ? fallbackMatch[1] : undefined;
  }

  /**
   * Extracts image URL from JSON-LD structured data
   */
  private extractImageFromJsonLd(data: unknown): string | undefined {
    if (!data || typeof data !== "object") return undefined;

    const recipeData = data as Record<string, unknown>;

    // handle arrays of objects
    if (Array.isArray(recipeData)) {
      for (const item of recipeData) {
        const imageUrl = this.extractImageFromJsonLd(item);
        if (imageUrl) return imageUrl;
      }
      return undefined;
    }

    // Look for image property
    if ("image" in recipeData) {
      if (typeof recipeData.image === "string") {
        return recipeData.image;
      }
      if (Array.isArray(recipeData.image)) {
        return typeof recipeData.image[0] === "string" ? recipeData.image[0] : undefined;
      }
      if (typeof recipeData.image === "object" && recipeData.image && "url" in recipeData.image) {
        return typeof recipeData.image.url === "string" ? recipeData.image.url : undefined;
      }
    }

    // Recipe-specific schemas
    if ("@type" in recipeData && recipeData["@type"] === "Recipe" && "image" in recipeData) {
      return this.extractImageFromJsonLd(recipeData.image);
    }

    return undefined;
  }

  /**
   * Checks if the URL likely points to a high-resolution image
   */
  private isHighResolutionImageUrl(url: string): boolean {
    if (!url) return false;

    // check for high-resolution indicators in URL
    const highResIndicators = [
      /large|big|full|original|hd|high|xl|xxl/i,
      /\d{3,4}x\d{3,4}/, // Resolution like 800x600
      /\d{3,4}w/, // Width like 800w
      /_\d{3,4}\./, // Underscore with number like _800.
    ];

    const hasHighResIndicator = highResIndicators.some((pattern) => pattern.test(url));

    // Avoid thumbnail indicators
    const thumbnailIndicators = [
      /thumb|small|tiny|mini|preview|icon/i,
      /_\d{1,2}x\d{1,2}/, // Small dimensions like _32x32
      /_[st]\./, // _s. or _t. for small/thumbnail
    ];

    const hasThumbnailIndicator = thumbnailIndicators.some((pattern) => pattern.test(url));

    return hasHighResIndicator && !hasThumbnailIndicator;
  }

  /**
   * Checks if an img tag is likely related to the recipe
   */
  private isRecipeRelatedImage(imgTag: string): boolean {
    const recipeKeywords = ["recipe", "przepis", "dish", "food", "meal", "potrawa", "jedzenie"];

    return recipeKeywords.some((keyword) => imgTag.toLowerCase().includes(keyword.toLowerCase()));
  }

  /**
   * Extracts the best (highest resolution) image from srcset attribute
   */
  private getBestImageFromSrcset(srcset: string): string | undefined {
    const sources = srcset.split(",").map((src) => {
      const parts = src.trim().split(/\s+/);
      const url = parts[0];
      const descriptor = parts[1]; // 2x, 300w, etc.

      let width = 0;
      if (descriptor) {
        if (descriptor.endsWith("w")) {
          width = parseInt(descriptor.slice(0, -1));
        } else if (descriptor.endsWith("x")) {
          // assume 2x means 800px base width
          width = parseInt(descriptor.slice(0, -1)) * 400;
        }
      }

      return { url, width };
    });

    // sort by width and return the highest resolution
    sources.sort((a, b) => b.width - a.width);
    return sources[0]?.url;
  }

  /**
   * Extracts a recipe from a URL by scraping and using AI
   */
  async extractFromUrl(url: string): Promise<ExtractionValidationResult> {
    if (!this.isSupportedUrl(url)) {
      throw new ApiError(
        400,
        `The provided website is not supported. Supported domains: ${SUPPORTED_URL_DOMAINS.join(", ")}`,
        "UNSUPPORTED_DOMAIN"
      );
    }

    try {
      // 1. scraping content
      const scrapingResult = await this.scrapeUrl(url);

      if (!scrapingResult.content || scrapingResult.content.length < 100) {
        throw new Error("Failed to fetch sufficient content from the page");
      }

      // 2. prepare response format with JSON schema
      const responseFormat: ResponseFormat = {
        type: "json_schema",
        json_schema: {
          name: "recipe_url_extraction",
          strict: true,
          schema: RECIPE_EXTRACTION_SCHEMA,
        },
      };

      // 3. prepare request for OpenRouter
      const chatRequest: ChatCompletionRequest = {
        systemMessage: RECIPE_URL_EXTRACTION_SYSTEM_PROMPT,
        userMessage: `Wyekstraktuj dane przepisu z następującej treści strony internetowej:

URL: ${url}
${scrapingResult.title ? `Tytuł strony: ${scrapingResult.title}` : ""}

Treść:
${scrapingResult.content.slice(0, 8000)}`, // limit for tokens
        responseFormat,
        modelParameters: {
          temperature: 1,
          max_tokens: 3000,
        },
      };

      const response = await this.openRouterService.createChatCompletion(chatRequest);

      const assistantMessage = response.choices[0]?.message?.content;
      if (!assistantMessage) {
        throw new Error("No response from AI model");
      }

      let extractedData: ExtractedRecipeDataDTO;
      try {
        extractedData = JSON.parse(assistantMessage);
      } catch (parseError) {
        throw new Error(
          `Invalid JSON response format: ${parseError instanceof Error ? parseError.message : "Unknown error"}`
        );
      }

      // validate extracted data
      const validationResult = validateExtractedData(extractedData);

      // add source URL and image URL if available
      validationResult.data.source_url = url;
      if (scrapingResult.imageUrl) {
        validationResult.data.image_url = scrapingResult.imageUrl;
      }

      return validationResult;
    } catch (error) {
      console.error("Error in extractFromUrl:", error);
      // throw error to endpoint to handle it properly
      throw error;
    }
  }
}
