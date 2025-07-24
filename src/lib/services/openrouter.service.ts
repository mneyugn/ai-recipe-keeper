import { injectable } from "tsyringe";
import axios, { type AxiosInstance, type AxiosError, type AxiosResponse } from "axios";
import type {
  OpenRouterConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  Message,
  ResponseFormat,
  RetryConfig,
} from "../../types";
import { ApiError } from "../errors";

/**
 * Service for communication with OpenRouter API
 * Provides secure communication, error handling and retry logic
 */
@injectable()
export class OpenRouterService {
  private apiKey: string;
  private baseUrl: string;
  private httpClient!: AxiosInstance;
  private timeout: number;
  private retryConfig: RetryConfig;

  public defaultModel: string;
  public isConnected = false;
  public supportedFormats: string[] = ["json_schema"];

  constructor(config: OpenRouterConfig) {
    if (!config.apiKey) {
      throw new ApiError(500, "API key is required for OpenRouterService", "CONFIG_ERROR");
    }

    if (!config.apiKey.startsWith("sk-or-")) {
      throw new ApiError(500, "Invalid OpenRouter API key format", "CONFIG_ERROR");
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://openrouter.ai/api/v1";
    this.defaultModel = config.defaultModel || "google/gemini-2.0-flash-exp:free";
    this.timeout = config.timeout || 30000;

    this.retryConfig = {
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      backoffMultiplier: 2,
    };

    this.setupHttpClient();
  }

  /**
   * Main method to create a chat completion with AI model
   */
  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    // validate input
    if (!request.systemMessage && !request.userMessage) {
      throw new ApiError(400, "At least one message is required", "VALIDATION_ERROR");
    }

    if (!request.userMessage.trim()) {
      throw new ApiError(400, "User message cannot be empty", "VALIDATION_ERROR");
    }

    // sanitize input
    const sanitizedRequest = {
      ...request,
      systemMessage: this.sanitizeInput(request.systemMessage || ""),
      userMessage: this.sanitizeInput(request.userMessage),
    };

    if (sanitizedRequest.responseFormat && !this.validateResponseFormat(sanitizedRequest.responseFormat)) {
      throw new ApiError(400, "Invalid response format", "VALIDATION_ERROR");
    }

    const messages = this.formatMessages(sanitizedRequest.systemMessage, sanitizedRequest.userMessage);

    // prepare request for API
    const apiRequest: Record<string, unknown> = {
      model: sanitizedRequest.modelName || this.defaultModel,
      messages,
      ...sanitizedRequest.modelParameters,
    };

    // add response_format if provided
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
   * Checks if the selected model is available
   */
  async validateModel(modelName: string): Promise<boolean> {
    if (!modelName.trim()) {
      return false;
    }

    try {
      await this.makeRequest("/models", {});
      // TODO: check if the model is on the list, for now we assume that all models are available
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Estimates number of tokens for given text
   * Simple estimation TODO: use tiktoken library
   */
  estimateTokens(text: string): number {
    if (!text) return 0;

    // simple estimation: ~4 characters = 1 token for most models
    return Math.ceil(text.length / 4);
  }

  /**
   * Configures HTTP Client with interceptors
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

    // Response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        this.handleError(error);
      }
    );
  }

  /**
   * Makes HTTP request with retry logic
   */
  private async makeRequest(endpoint: string, data: unknown): Promise<AxiosResponse> {
    let lastError: Error = new Error("Unexpected connection error");

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const response = await this.httpClient.post(endpoint, data);
        return response;
      } catch (error) {
        lastError = error as Error;

        // don't retry for some errors
        if (this.shouldNotRetry(error as AxiosError)) {
          throw error;
        }

        // last attempt - throw error
        if (attempt === this.retryConfig.maxRetries) {
          throw error;
        }

        // wait before next attempt with exponential backoff
        await this.handleRetry(error as Error, attempt);
      }
    }

    throw lastError;
  }

  /**
   * checks if error should not be retried
   */
  private shouldNotRetry(error: AxiosError): boolean {
    if (!error.response) return false;

    const status = error.response.status;
    // don't retry for auth, validation and unavailable model errors
    return status === 401 || status === 400 || status === 404;
  }

  /**
   * exponential backoff for retries
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
   * Validates JSON schema for response_format
   */
  private validateResponseFormat(format: ResponseFormat): boolean {
    if (!format || format.type !== "json_schema") {
      return false;
    }

    if (!format.json_schema?.name || !format.json_schema?.schema) {
      return false;
    }

    // basic JSON schema validation
    try {
      JSON.stringify(format.json_schema.schema);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Formats messages according to OpenRouter API requirements
   */
  private formatMessages(systemMessage: string, userMessage: string): Message[] {
    const messages: Message[] = [];

    // add system message if not empty
    if (systemMessage.trim()) {
      messages.push({
        role: "system",
        content: systemMessage.trim(),
      });
    }

    // always add user message
    messages.push({
      role: "user",
      content: userMessage.trim(),
    });

    return messages;
  }

  /**
   * Sanitizes input before sending to API
   */
  private sanitizeInput(input: string): string {
    if (!input) return "";

    return (
      input
        .trim()
        // remove potentially dangerous characters
        // eslint-disable-next-line no-control-regex
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
        // limit length to a reasonable value
        .slice(0, 50000)
    );
  }

  /**
   * Handles API errors with appropriate messages
   */
  private handleError(error: AxiosError): never {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as { error?: { message?: string } };
      const errorMessage = data?.error?.message || error.response.statusText;

      switch (status) {
        case 401:
          throw new ApiError(401, `OpenRouter authentication error: ${errorMessage}`, "AUTH_ERROR");
        case 429:
          throw new ApiError(429, `OpenRouter rate limit exceeded: ${errorMessage}`, "RATE_LIMIT_EXCEEDED");
        case 400:
          throw new ApiError(400, `OpenRouter invalid request: ${errorMessage}`, "INVALID_REQUEST");
        case 404:
          throw new ApiError(404, `OpenRouter model not found: ${errorMessage}`, "NOT_FOUND");
        case 502:
        case 503:
        case 504:
          throw new ApiError(status, `OpenRouter service unavailable: ${errorMessage}`, "SERVICE_UNAVAILABLE");
        default:
          throw new ApiError(status, `OpenRouter API error (${status}): ${errorMessage}`, "API_ERROR");
      }
    }

    if (error.code === "ECONNABORTED") {
      throw new ApiError(504, "Request to OpenRouter timed out", "TIMEOUT_ERROR");
    }

    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      throw new ApiError(503, "Could not connect to OpenRouter service", "CONNECTION_ERROR");
    }

    throw new ApiError(500, `Unexpected network error: ${error.message}`, "UNEXPECTED_ERROR");
  }
}
