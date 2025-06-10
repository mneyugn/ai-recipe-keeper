import type { ExtractedRecipeDataDTO, ExtractionValidationResult } from "../../types";
import { OpenRouterService } from "../openrouter.service";
import type { OpenRouterConfig, ChatCompletionRequest, ResponseFormat } from "../../types";

/**
 * JSON Schema dla odpowiedzi AI - wyekstraktowane dane przepisu z URL
 */
const RECIPE_URL_EXTRACTION_SCHEMA = {
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
        enum: [
          "obiad",
          "śniadanie",
          "kolacja",
          "deser",
          "ciasto",
          "zupa",
          "makaron",
          "mięso",
          "ryby",
          "wegetariańskie",
          "wegańskie",
          "latwe",
          "szybkie",
          "trudne",
        ],
      },
      description: "Suggested tags from allowed list only (EXACTLY this field name: 'suggested_tags')",
    },
  },
  required: ["name", "ingredients", "steps", "suggested_tags"],
  additionalProperties: false,
};

/**
 * System prompt dla ekstrakcji przepisów z HTML/treści URL
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
 * Interfejs dla rezultatu scrapingu
 */
interface ScrapingResult {
  content: string;
  imageUrl?: string;
  title?: string;
}

/**
 * Serwis do scrapingu przepisów z obsługiwanych URL
 */
export class UrlScraperService {
  private openRouterService: OpenRouterService;
  private supportedDomains = ["aniagotuje.pl", "kwestiasmaku.com"];

  constructor() {
    // Inicjalizacja OpenRouter Service
    const config: OpenRouterConfig = {
      apiKey: import.meta.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || "",
      baseUrl: "https://openrouter.ai/api/v1",
      defaultModel: "anthropic/claude-3.5-sonnet",
      timeout: 60000,
      maxRetries: 2,
      retryDelay: 2000,
    };

    if (!config.apiKey) {
      throw new Error("OPENROUTER_API_KEY nie jest ustawiony w zmiennych środowiskowych");
    }

    this.openRouterService = new OpenRouterService(config);
  }

  /**
   * Sprawdza czy URL jest z obsługiwanej domeny
   */
  isSupportedUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return this.supportedDomains.some(
        (domain) => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }

  /**
   * Pobiera i parsuje treść z URL
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
          throw new Error("Przekroczono czas oczekiwania na odpowiedź ze strony");
        }
        throw new Error(`Błąd pobierania strony: ${error.message}`);
      }
      throw new Error("Nieznany błąd podczas pobierania strony");
    }
  }

  /**
   * Wyodrębnia treść przepisu z HTML
   */
  private extractContentFromHtml(html: string, url: string): ScrapingResult {
    // Podstawowe czyszczenie HTML - usuwanie skryptów, stylów itp.
    const cleanHtml = html
      .replace(/<script[^>]*>.*?<\/script>/gis, "")
      .replace(/<style[^>]*>.*?<\/style>/gis, "")
      .replace(/<nav[^>]*>.*?<\/nav>/gis, "")
      .replace(/<footer[^>]*>.*?<\/footer>/gis, "")
      .replace(/<header[^>]*>.*?<\/header>/gis, "")
      .replace(/<!--.*?-->/gs, "");

    // Próba wyodrębnienia tytułu
    const titleMatch = cleanHtml.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    // Próba wyodrębnienia głównego obrazka (meta property="og:image" lub podobne)
    const imageMatch = cleanHtml.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i);
    let imageUrl = imageMatch ? imageMatch[1] : undefined;

    // Jeśli nie ma og:image, spróbuj znaleźć inne obrazki związane z przepisem
    if (!imageUrl) {
      const imgMatch =
        cleanHtml.match(/<img[^>]*src="([^"]*)"[^>]*alt="[^"]*przepis[^"]*"/i) ||
        cleanHtml.match(/<img[^>]*alt="[^"]*przepis[^"]*"[^>]*src="([^"]*)"/i);
      imageUrl = imgMatch ? imgMatch[1] : undefined;
    }

    // Konwersja względnych URL na bezwzględne
    if (imageUrl && !imageUrl.startsWith("http")) {
      try {
        const baseUrl = new URL(url);
        imageUrl = new URL(imageUrl, baseUrl.origin).href;
      } catch {
        imageUrl = undefined;
      }
    }

    // Usuwanie tagów HTML i konwersja do tekstu
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
   * Ekstraktuje przepis z URL używając scrapingu i AI
   */
  async extractFromUrl(url: string): Promise<ExtractionValidationResult> {
    if (!this.isSupportedUrl(url)) {
      throw new Error("Podana strona nie jest obsługiwana. Wspierane domeny: aniagotuje.pl, kwestiasmaku.com");
    }

    try {
      // 1. Scraping treści
      const scrapingResult = await this.scrapeUrl(url);

      if (!scrapingResult.content || scrapingResult.content.length < 100) {
        throw new Error("Nie udało się pobrać wystarczającej ilości treści ze strony");
      }

      // 2. Przygotowanie response format z JSON schema
      const responseFormat: ResponseFormat = {
        type: "json_schema",
        json_schema: {
          name: "recipe_url_extraction",
          strict: true,
          schema: RECIPE_URL_EXTRACTION_SCHEMA,
        },
      };

      // 3. Przygotowanie requestu do OpenRouter
      const chatRequest: ChatCompletionRequest = {
        systemMessage: RECIPE_URL_EXTRACTION_SYSTEM_PROMPT,
        userMessage: `Wyekstraktuj dane przepisu z następującej treści strony internetowej:

URL: ${url}
${scrapingResult.title ? `Tytuł strony: ${scrapingResult.title}` : ""}

Treść:
${scrapingResult.content.slice(0, 8000)}`, // Ograniczenie długości dla tokeny
        responseFormat,
        modelParameters: {
          temperature: 0.1,
          max_tokens: 2000,
        },
      };

      // 4. Wywołanie OpenRouter API
      const response = await this.openRouterService.createChatCompletion(chatRequest);

      // 5. Parsowanie odpowiedzi JSON
      const assistantMessage = response.choices[0]?.message?.content;
      if (!assistantMessage) {
        throw new Error("Brak odpowiedzi od modelu AI");
      }

      let extractedData: ExtractedRecipeDataDTO;
      try {
        extractedData = JSON.parse(assistantMessage);
      } catch (parseError) {
        throw new Error(
          `Nieprawidłowy format odpowiedzi JSON: ${parseError instanceof Error ? parseError.message : "Unknown error"}`
        );
      }

      // 6. Walidacja wyekstraktowanych danych
      const validationResult = this.validateExtractedData(extractedData);

      // 7. Dodanie URL źródła i obrazka jeśli dostępny
      validationResult.data.source_url = url;
      if (scrapingResult.imageUrl) {
        validationResult.data.image_url = scrapingResult.imageUrl;
      }

      return validationResult;
    } catch (error) {
      console.error("Error in extractFromUrl:", error);
      throw error;
    }
  }

  /**
   * Waliduje wyekstraktowane dane przepisu i zwraca dane z ostrzeżeniami
   * @private
   */
  private validateExtractedData(data: unknown): ExtractionValidationResult {
    const warnings: string[] = [];
    let hasErrors = false;

    if (!data || typeof data !== "object") {
      hasErrors = true;
      warnings.push("Otrzymano nieprawidłowe dane z AI - spróbuj ponownie z innym URL");
      return {
        data: this.getDefaultRecipeData(),
        warnings,
        hasErrors,
      };
    }

    const obj = data as Record<string, unknown>;

    // Inicjalizacja wyniku z domyślnymi wartościami
    const result: ExtractedRecipeDataDTO = {
      name: "",
      ingredients: [],
      steps: [],
      preparation_time: undefined,
      suggested_tags: [],
    };

    // Walidacja nazwy
    if (!obj.name || typeof obj.name !== "string" || obj.name.trim().length === 0) {
      warnings.push("W przepisie nie wykryto nazwy - uzupełnij ją samodzielnie");
      result.name = "Nowy przepis"; // Domyślna nazwa
    } else {
      result.name = obj.name.trim();
    }

    // Walidacja składników
    if (!Array.isArray(obj.ingredients) || obj.ingredients.length === 0) {
      warnings.push("Nie wykryto składników - dodaj je samodzielnie");
      hasErrors = true;
    } else {
      const validIngredients: string[] = [];
      for (const ingredient of obj.ingredients) {
        if (typeof ingredient === "string" && ingredient.trim().length > 0) {
          validIngredients.push(ingredient.trim());
        }
      }

      if (validIngredients.length === 0) {
        warnings.push("Wykryte składniki były puste - dodaj je samodzielnie");
        hasErrors = true;
      } else if (validIngredients.length < obj.ingredients.length) {
        warnings.push("Część składników była nieprawidłowa i została pominięta");
      }

      result.ingredients = validIngredients;
    }

    // Walidacja kroków
    if (!Array.isArray(obj.steps) || obj.steps.length === 0) {
      warnings.push("Nie wykryto kroków przygotowania - dodaj je samodzielnie");
      hasErrors = true;
    } else {
      const validSteps: string[] = [];
      for (const step of obj.steps) {
        if (typeof step === "string" && step.trim().length > 0) {
          validSteps.push(step.trim());
        }
      }

      if (validSteps.length === 0) {
        warnings.push("Wykryte kroki były puste - dodaj je samodzielnie");
        hasErrors = true;
      } else if (validSteps.length < obj.steps.length) {
        warnings.push("Część kroków była nieprawidłowa i została pominięta");
      }

      result.steps = validSteps;
    }

    // Walidacja czasu przygotowania
    if (obj.preparation_time && typeof obj.preparation_time === "string" && obj.preparation_time.trim().length > 0) {
      result.preparation_time = obj.preparation_time.trim();
    }

    // Walidacja tagów
    const allowedTags = [
      "obiad",
      "śniadanie",
      "kolacja",
      "deser",
      "ciasto",
      "zupa",
      "makaron",
      "mięso",
      "ryby",
      "wegetariańskie",
      "wegańskie",
      "latwe",
      "szybkie",
      "trudne",
    ];

    if (Array.isArray(obj.suggested_tags)) {
      const validTags: string[] = [];
      const invalidTags: string[] = [];

      for (const tag of obj.suggested_tags) {
        if (typeof tag === "string" && allowedTags.includes(tag)) {
          validTags.push(tag);
        } else if (typeof tag === "string") {
          invalidTags.push(tag);
        }
      }

      result.suggested_tags = validTags;

      if (invalidTags.length > 0) {
        warnings.push(`Nieprawidłowe tagi zostały pominięte: ${invalidTags.join(", ")}`);
      }
    }

    return {
      data: result,
      warnings,
      hasErrors,
    };
  }

  /**
   * Zwraca domyślne dane przepisu w przypadku krytycznego błędu
   * @private
   */
  private getDefaultRecipeData(): ExtractedRecipeDataDTO {
    return {
      name: "Nowy przepis",
      ingredients: [],
      steps: [],
      suggested_tags: [],
    };
  }
}
