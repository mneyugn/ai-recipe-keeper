import axios, { type AxiosInstance, type AxiosError, type AxiosResponse } from "axios";
import type {
  OpenRouterConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  Message,
  ResponseFormat,
  RetryConfig,
} from "../types";

/**
 * Serwis do komunikacji z OpenRouter API
 * Zapewnia bezpieczną komunikację, obsługę błędów i retry logic
 */
export class OpenRouterService {
  // Pola prywatne
  private apiKey: string;
  private baseUrl: string;
  private httpClient!: AxiosInstance;
  private timeout: number;
  private retryConfig: RetryConfig;

  // Pola publiczne
  public defaultModel: string;
  public isConnected = false;
  public supportedFormats: string[] = ["json_schema"];

  constructor(config: OpenRouterConfig) {
    // Walidacja wymaganych parametrów
    if (!config.apiKey) {
      throw new Error("Klucz API jest wymagany");
    }

    if (!config.apiKey.startsWith("sk-or-")) {
      throw new Error("Nieprawidłowy format klucza API OpenRouter");
    }

    // Inicjalizacja pól
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://openrouter.ai/api/v1";
    this.defaultModel = config.defaultModel || "google/gemini-2.0-flash-exp:free";
    this.timeout = config.timeout || 30000;

    // Konfiguracja retry logic
    this.retryConfig = {
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      backoffMultiplier: 2,
    };

    // Konfiguracja HTTP Client
    this.setupHttpClient();
  }

  /**
   * Główna metoda do tworzenia odpowiedzi czatu z modelem AI
   */
  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    // Walidacja danych wejściowych
    if (!request.systemMessage && !request.userMessage) {
      throw new Error("Wymagana jest co najmniej jedna wiadomość");
    }

    if (!request.userMessage.trim()) {
      throw new Error("Wiadomość użytkownika nie może być pusta");
    }

    // Sanityzacja danych wejściowych
    const sanitizedRequest = {
      ...request,
      systemMessage: this.sanitizeInput(request.systemMessage || ""),
      userMessage: this.sanitizeInput(request.userMessage),
    };

    // Walidacja response format jeśli podany
    if (sanitizedRequest.responseFormat && !this.validateResponseFormat(sanitizedRequest.responseFormat)) {
      throw new Error("Nieprawidłowy format odpowiedzi");
    }

    // Formatowanie wiadomości
    const messages = this.formatMessages(sanitizedRequest.systemMessage, sanitizedRequest.userMessage);

    // Przygotowanie requestu do API
    const apiRequest: Record<string, unknown> = {
      model: sanitizedRequest.modelName || this.defaultModel,
      messages,
      ...sanitizedRequest.modelParameters,
    };

    // Dodanie response_format jeśli podany
    if (sanitizedRequest.responseFormat) {
      apiRequest.response_format = sanitizedRequest.responseFormat;
    }

    try {
      const response = await this.makeRequest("/chat/completions", apiRequest);
      this.isConnected = true;
      return response.data;
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Sprawdza dostępność wybranego modelu
   */
  async validateModel(modelName: string): Promise<boolean> {
    if (!modelName.trim()) {
      return false;
    }

    try {
      await this.makeRequest("/models", {});
      // W rzeczywistej implementacji sprawdzilibyśmy, czy model jest na liście
      // Na potrzeby implementacji zakładamy, że wszystkie modele są dostępne
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Szacuje liczbę tokenów dla podanego tekstu
   * Prosta estymacja - w rzeczywistości można użyć biblioteki tiktoken
   */
  estimateTokens(text: string): number {
    if (!text) return 0;

    // Prosta estymacja: ~4 znaki = 1 token dla większości modeli
    return Math.ceil(text.length / 4);
  }

  /**
   * Konfiguruje HTTP Client z interceptorami
   */
  private setupHttpClient(): void {
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.SITE_URL || "http://localhost:4321",
        "X-Title": "AI Recipe Keeper",
      },
    });

    // Response interceptor dla obsługi błędów
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        this.handleError(error);
      }
    );
  }

  /**
   * Wykonuje zapytanie HTTP z obsługą retry logic
   */
  private async makeRequest(endpoint: string, data: unknown): Promise<AxiosResponse> {
    let lastError: Error = new Error("Nieoczekiwany błąd połączenia");

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const response = await this.httpClient.post(endpoint, data);
        return response;
      } catch (error) {
        lastError = error as Error;

        // Nie ponawiamy prób dla niektórych błędów
        if (this.shouldNotRetry(error as AxiosError)) {
          throw error;
        }

        // Ostatnia próba - rzucamy błąd
        if (attempt === this.retryConfig.maxRetries) {
          throw error;
        }

        // Czekamy przed następną próbą z exponential backoff
        await this.handleRetry(error as Error, attempt);
      }
    }

    throw lastError;
  }

  /**
   * Sprawdza czy błąd nie powinien być ponowiony
   */
  private shouldNotRetry(error: AxiosError): boolean {
    if (!error.response) return false;

    const status = error.response.status;
    // Nie ponawiamy dla błędów autoryzacji, walidacji i niedostępnych modeli
    return status === 401 || status === 400 || status === 404;
  }

  /**
   * Implementuje exponential backoff dla ponownych prób
   */
  private async handleRetry(error: Error, attempt: number): Promise<void> {
    const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt);

    console.warn(
      `OpenRouter request failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}). Retrying in ${delay}ms...`,
      error.message
    );

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Waliduje poprawność schematu JSON dla response_format
   */
  private validateResponseFormat(format: ResponseFormat): boolean {
    if (!format || format.type !== "json_schema") {
      return false;
    }

    if (!format.json_schema?.name || !format.json_schema?.schema) {
      return false;
    }

    // Podstawowa walidacja schematu JSON
    try {
      JSON.stringify(format.json_schema.schema);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Formatuje wiadomości zgodnie z wymaganiami OpenRouter API
   */
  private formatMessages(systemMessage: string, userMessage: string): Message[] {
    const messages: Message[] = [];

    // Dodajemy system message jeśli nie jest pusty
    if (systemMessage.trim()) {
      messages.push({
        role: "system",
        content: systemMessage.trim(),
      });
    }

    // Zawsze dodajemy user message
    messages.push({
      role: "user",
      content: userMessage.trim(),
    });

    return messages;
  }

  /**
   * Sanityzuje dane wejściowe przed wysłaniem do API
   */
  private sanitizeInput(input: string): string {
    if (!input) return "";

    return (
      input
        .trim()
        // Usuwamy potencjalnie niebezpieczne znaki
        // eslint-disable-next-line no-control-regex
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
        // Ograniczamy długość do rozumnej wartości
        .slice(0, 50000)
    );
  }

  /**
   * Obsługuje błędy API z odpowiednimi komunikatami
   */
  private handleError(error: AxiosError): never {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as { error?: { message?: string } };

      switch (status) {
        case 401:
          throw new Error("Nieprawidłowy klucz API OpenRouter");
        case 429:
          throw new Error("Przekroczono limit requestów. Spróbuj ponownie za chwilę");
        case 400:
          throw new Error(`Nieprawidłowe dane wejściowe: ${data?.error?.message || "Sprawdź format danych"}`);
        case 404:
          throw new Error("Model niedostępny lub nie istnieje");
        case 502:
        case 503:
        case 504:
          throw new Error("Usługa OpenRouter jest czasowo niedostępna");
        default:
          throw new Error(`Błąd API OpenRouter (${status}): ${data?.error?.message || error.response.statusText}`);
      }
    }

    if (error.code === "ECONNABORTED") {
      throw new Error("Przekroczono czas oczekiwania na odpowiedź. Spróbuj ponownie");
    }

    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      throw new Error("Brak połączenia z internetem lub usługa OpenRouter jest niedostępna");
    }

    throw new Error(`Nieoczekiwany błąd: ${error.message}`);
  }
}
