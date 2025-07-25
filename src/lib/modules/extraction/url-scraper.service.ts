import { injectable, inject } from "tsyringe";
import type { ExtractionValidationResult } from "../../../types";
import type { OpenRouterService } from "../../core/openrouter.service";
import type { ChatCompletionRequest, ResponseFormat } from "../../../types";
import { RECIPE_EXTRACTION_SCHEMA, validateExtractedData } from "./extraction.validation";
import type { ExtractedRecipeDataDTO } from "../../../types";

/**
 * System prompt for recipe extraction from URL content
 */
const URL_EXTRACTION_SYSTEM_PROMPT = `You are an expert at analyzing Polish culinary recipes. Your task is to extract structured recipe data from the provided webpage content.

CRITICAL REQUIREMENTS - JSON FIELD NAMES:
- Use EXACTLY these field names: "name", "ingredients", "steps", "preparation_time", "suggested_tags", "image_url", "source_url"
- DO NOT use Polish field names like "nazwa", "składniki", "przygotowanie", "tagi"
- DO NOT use alternative names like "instructions", "description", "opis"
- Follow the JSON schema EXACTLY

EXTRACTION RULES:
1. Extract ONLY information that is actually present in the webpage content
2. Ignore navigation, ads, comments, and other irrelevant content
3. Focus on the actual recipe content
4. Each ingredient as separate array item with quantity, unit and name (e.g. "2 szklanki mąki pszennej")
5. Each preparation step as separate array item
6. For suggested_tags use ONLY from this list: obiad, śniadanie, kolacja, deser, ciasto, zupa, makaron, mięso, ryby, wegetariańskie, wegańskie, latwe, szybkie, trudne
7. If recipe name is not found, try to deduce it from context or page title
8. For image_url: extract the main recipe image URL from the provided content (look for largest/main food image)
9. For source_url: use the provided source URL
10. Ignore duplicate or redundant information

Return JSON response following the schema EXACTLY.`;

/**
 * Configuration for different domains and their specific scraping needs
 */
const DOMAIN_CONFIG = {
  "kwestiasmaku.com": {
    selectors: [
      ".entry-content", // Main content area
      ".recipe-content", // Recipe specific content
      "article", // Article tag
    ],
    removeSelectors: [".social-sharing", ".advertisement", ".related-posts", "nav", "footer", ".comments"],
  },
  "aniagotuje.pl": {
    selectors: [".post-content", ".recipe-content", "article", ".content"],
    removeSelectors: [".social-media", ".advertisement", ".related-recipes", "nav", "footer", ".comments"],
  },
  "gotujmy.pl": {
    selectors: [".recipe-body", ".post-content", "article", ".content"],
    removeSelectors: [".social-buttons", ".advertisement", ".related-content", "nav", "footer", ".comments"],
  },
  // Generic fallback for other domains
  default: {
    selectors: ["article", ".content", ".post-content", ".entry-content", ".recipe-content", "main", ".main-content"],
    removeSelectors: [
      "nav",
      "footer",
      ".advertisement",
      ".ads",
      ".social-sharing",
      ".comments",
      ".sidebar",
      ".related-posts",
      ".related-recipes",
    ],
  },
};

/**
 * Service responsible for scraping and extracting recipe data from URLs
 */
@injectable()
export class UrlScraperService {
  constructor(@inject("OpenRouterService") private openRouterService: OpenRouterService) {}

  /**
   * Extracts recipe data from a given URL
   * @param url - The URL to extract recipe data from
   * @returns Promise with extracted recipe data and potential warnings
   */
  async extractFromUrl(url: string): Promise<ExtractionValidationResult> {
    try {
      // Fetch the webpage content
      const htmlContent = await this.fetchWebpageContent(url);

      // Extract the main content and images based on domain-specific configuration
      const extractedText = this.extractMainContent(htmlContent, url);
      const extractedImageUrl = this.extractMainImage(htmlContent, url);

      if (!extractedText || extractedText.trim().length < 100) {
        throw new Error("Unable to extract sufficient content from the webpage");
      }

      // Use AI to extract recipe data from the cleaned text
      const responseFormat: ResponseFormat = {
        type: "json_schema",
        json_schema: {
          name: "recipe_extraction",
          strict: true,
          schema: RECIPE_EXTRACTION_SCHEMA,
        },
      };

      const imageInfo = extractedImageUrl
        ? `\n\nMain image URL found: ${extractedImageUrl}`
        : "\n\nNo main image found.";

      const chatRequest: ChatCompletionRequest = {
        systemMessage: URL_EXTRACTION_SYSTEM_PROMPT,
        userMessage: `Wyekstraktuj dane przepisu z następującej treści strony internetowej:\n\nSource URL: ${url}${imageInfo}\n\nTreść:\n${extractedText}`,
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

      // Ensure source_url and image_url are set correctly
      extractedData.source_url = url;
      if (extractedImageUrl) {
        extractedData.image_url = extractedImageUrl;
      }

      const validationResult = validateExtractedData(extractedData);

      return validationResult;
    } catch (error) {
      console.error("Error in extractFromUrl:", error);
      throw error;
    }
  }

  /**
   * Fetches the HTML content of a webpage
   * @param url - The URL to fetch
   * @returns Promise with the HTML content as string
   */
  private async fetchWebpageContent(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "pl-PL,pl;q=0.9,en;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        // Add timeout
        signal: AbortSignal.timeout(30000), // 30 seconds timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const content = await response.text();

      if (!content || content.trim().length === 0) {
        throw new Error("Received empty content from the webpage");
      }

      return content;
    } catch (error) {
      console.error("Error fetching webpage content:", error);
      if (error instanceof Error) {
        if (error.name === "TimeoutError") {
          throw new Error("Request timeout - the webpage took too long to respond");
        }
        if (error.message.includes("fetch")) {
          throw new Error("Network error - unable to reach the webpage");
        }
      }
      throw new Error(`Failed to fetch webpage content: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Extracts the main content from HTML using domain-specific configuration
   * @param html - The HTML content
   * @param url - The original URL (used for domain-specific extraction)
   * @returns Cleaned text content
   */
  private extractMainContent(html: string, url: string): string {
    try {
      // Simple regex-based content extraction since we can't use DOM parser in serverless
      const domain = new URL(url).hostname;
      const config = this.getDomainConfig(domain);

      // First, remove unwanted sections
      let cleanedHtml = html;
      for (const selector of config.removeSelectors) {
        // Convert CSS selector to approximate regex (basic implementation)
        const classRegex = new RegExp(
          `<[^>]*class=["'][^"']*${selector.replace(".", "")}[^"']*["'][^>]*>.*?</[^>]+>`,
          "gis"
        );
        const tagRegex = new RegExp(`<${selector}[^>]*>.*?</${selector}>`, "gis");
        cleanedHtml = cleanedHtml.replace(classRegex, "");
        cleanedHtml = cleanedHtml.replace(tagRegex, "");
      }

      // Extract content from preferred selectors
      let extractedContent = "";
      for (const selector of config.selectors) {
        if (selector.startsWith(".")) {
          // Class selector
          const className = selector.replace(".", "");
          const classRegex = new RegExp(`<[^>]*class=["'][^"']*${className}[^"']*["'][^>]*>(.*?)</[^>]+>`, "gis");
          const matches = classRegex.exec(cleanedHtml);
          if (matches && matches[1]) {
            extractedContent = matches[1];
            break;
          }
        } else {
          // Tag selector
          const tagRegex = new RegExp(`<${selector}[^>]*>(.*?)</${selector}>`, "gis");
          const matches = tagRegex.exec(cleanedHtml);
          if (matches && matches[1]) {
            extractedContent = matches[1];
            break;
          }
        }
      }

      // If no specific content found, extract from body
      if (!extractedContent) {
        const bodyRegex = /<body[^>]*>(.*?)<\/body>/gis;
        const bodyMatch = bodyRegex.exec(cleanedHtml);
        if (bodyMatch && bodyMatch[1]) {
          extractedContent = bodyMatch[1];
        } else {
          extractedContent = cleanedHtml;
        }
      }

      // Clean up HTML tags and normalize text
      let cleanText = extractedContent
        .replace(/<script[^>]*>.*?<\/script>/gis, "") // Remove scripts
        .replace(/<style[^>]*>.*?<\/style>/gis, "") // Remove styles
        .replace(/<[^>]+>/g, " ") // Remove HTML tags
        .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
        .replace(/&amp;/g, "&") // Replace HTML entities
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim();

      // Remove common unwanted phrases
      const unwantedPhrases = [
        "cookie",
        "cookies",
        "reklam",
        "newsletter",
        "subskryb",
        "facebook",
        "instagram",
        "twitter",
        "social",
        "udostępnij",
        "komentarz",
        "więcej przepisów",
        "podobne przepisy",
      ];

      for (const phrase of unwantedPhrases) {
        const regex = new RegExp(`[^.!?]*${phrase}[^.!?]*[.!?]?`, "gi");
        cleanText = cleanText.replace(regex, "");
      }

      return cleanText.trim();
    } catch (error) {
      console.error("Error extracting main content:", error);
      throw new Error("Failed to extract content from HTML");
    }
  }

  /**
   * Extracts the main recipe image from HTML content
   * @param html - The HTML content
   * @param url - The original URL (used for resolving relative URLs)
   * @returns The main image URL or null if not found
   */
  private extractMainImage(html: string, url: string): string | null {
    try {
      const domain = new URL(url).hostname;

      // 1. Try to find Open Graph image
      const ogImageRegex = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i;
      const ogImageMatch = ogImageRegex.exec(html);
      if (ogImageMatch && ogImageMatch[1]) {
        return this.resolveImageUrl(ogImageMatch[1], url);
      }

      // 2. Try to find Twitter Card image
      const twitterImageRegex = /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i;
      const twitterImageMatch = twitterImageRegex.exec(html);
      if (twitterImageMatch && twitterImageMatch[1]) {
        return this.resolveImageUrl(twitterImageMatch[1], url);
      }

      // 3. Domain-specific image extraction
      if (domain.includes("aniagotuje.pl")) {
        // Look for main recipe image in article content
        const recipeImageRegex = /<img[^>]*class=["'][^"']*recipe[^"']*["'][^>]*src=["']([^"']+)["'][^>]*>/i;
        const recipeImageMatch = recipeImageRegex.exec(html);
        if (recipeImageMatch && recipeImageMatch[1]) {
          return this.resolveImageUrl(recipeImageMatch[1], url);
        }

        // Fallback: look for first large image in content
        const contentImageRegex = /<img[^>]*src=["']([^"']+)["'][^>]*(?:width=["'](\d+)["'])?[^>]*>/gi;
        let match;
        while ((match = contentImageRegex.exec(html)) !== null) {
          const imageUrl = match[1];
          const width = parseInt(match[2] || "0");

          // Skip small images (icons, etc.)
          if (width > 300 || width === 0) {
            // Skip ads and social media images
            if (
              !imageUrl.includes("facebook") &&
              !imageUrl.includes("twitter") &&
              !imageUrl.includes("instagram") &&
              !imageUrl.includes("ads") &&
              !imageUrl.includes("banner")
            ) {
              return this.resolveImageUrl(imageUrl, url);
            }
          }
        }
      }

      if (domain.includes("kwestiasmaku.com")) {
        // Look for featured image
        const featuredImageRegex = /<img[^>]*class=["'][^"']*featured[^"']*["'][^>]*src=["']([^"']+)["'][^>]*>/i;
        const featuredImageMatch = featuredImageRegex.exec(html);
        if (featuredImageMatch && featuredImageMatch[1]) {
          return this.resolveImageUrl(featuredImageMatch[1], url);
        }

        // Look for entry content image
        const entryImageRegex =
          /<div[^>]*class=["'][^"']*entry-content[^"']*["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["'][^>]*>/i;
        const entryImageMatch = entryImageRegex.exec(html);
        if (entryImageMatch && entryImageMatch[1]) {
          return this.resolveImageUrl(entryImageMatch[1], url);
        }
      }

      // 4. Generic fallback: look for first large image in article/main content
      const mainContentRegex =
        /<(?:article|main|div[^>]*class=["'][^"']*(?:content|post|recipe)[^"']*["'])[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["'][^>]*>/i;
      const mainContentMatch = mainContentRegex.exec(html);
      if (mainContentMatch && mainContentMatch[1]) {
        const imageUrl = mainContentMatch[1];
        // Basic filtering of non-content images
        if (
          !imageUrl.includes("avatar") &&
          !imageUrl.includes("logo") &&
          !imageUrl.includes("ads") &&
          !imageUrl.includes("social")
        ) {
          return this.resolveImageUrl(imageUrl, url);
        }
      }

      return null;
    } catch (error) {
      console.error("Error extracting main image:", error);
      return null;
    }
  }

  /**
   * Resolves relative image URLs to absolute URLs
   * @param imageUrl - The image URL (may be relative or absolute)
   * @param baseUrl - The base URL to resolve against
   * @returns Absolute image URL
   */
  private resolveImageUrl(imageUrl: string, baseUrl: string): string {
    try {
      // If already absolute URL, return as-is
      if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        return imageUrl;
      }

      // If protocol-relative URL, add https
      if (imageUrl.startsWith("//")) {
        return `https:${imageUrl}`;
      }

      // If relative URL, resolve against base URL
      const base = new URL(baseUrl);
      if (imageUrl.startsWith("/")) {
        return `${base.protocol}//${base.hostname}${imageUrl}`;
      } else {
        return `${base.protocol}//${base.hostname}${base.pathname.replace(/\/[^/]*$/, "")}/${imageUrl}`;
      }
    } catch (error) {
      console.error("Error resolving image URL:", error);
      return imageUrl; // Return original URL if resolution fails
    }
  }

  /**
   * Gets domain-specific configuration for content extraction
   * @param domain - The domain name
   * @returns Configuration object for the domain
   */
  private getDomainConfig(domain: string) {
    // Remove 'www.' prefix if present
    const cleanDomain = domain.replace(/^www\./, "");

    return DOMAIN_CONFIG[cleanDomain as keyof typeof DOMAIN_CONFIG] || DOMAIN_CONFIG.default;
  }
}
