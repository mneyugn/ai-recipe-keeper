# Plan Implementacji Usługi OpenRouter

## 1. Opis Usługi

Usługa OpenRouter to kompleksowy moduł odpowiedzialny za komunikację z API OpenRouter w celu realizacji funkcjonalności czatów opartych na LLM.
Usługa zapewnia:

- Bezpieczną komunikację z API OpenRouter
- Zarządzanie strukturą wiadomości (system/user messages)
- Obsługę ustrukturyzowanych odpowiedzi poprzez JSON schema
- Konfigurację modeli AI i ich parametrów
- Kompleksową obsługę błędów i retry logic
- Walidację i sanityzację danych wejściowych

## 2. Opis Konstruktora

### `OpenRouterService`

```typescript
constructor(config: OpenRouterConfig) {
  this.apiKey = config.apiKey;
  this.baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
  this.defaultModel = config.defaultModel || 'anthropic/claude-3.5-sonnet';
  this.timeout = config.timeout || 30000;
  this.maxRetries = config.maxRetries || 3;
  this.retryDelay = config.retryDelay || 1000;
}
```

**Parametry konstruktora:**

- `apiKey`: Klucz API OpenRouter (wymagany)
- `baseUrl`: URL bazowy API (opcjonalny, domyślnie OpenRouter API)
- `defaultModel`: Domyślny model AI (opcjonalny)
- `timeout`: Timeout requestów w ms (opcjonalny, domyślnie 30s)
- `maxRetries`: Maksymalna liczba ponownych prób (opcjonalny, domyślnie 3)
- `retryDelay`: Opóźnienie między próbami w ms (opcjonalny, domyślnie 1s)

## 3. Publiczne Metody i Pola

### Metody

#### `createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>`

Główna metoda do tworzenia odpowiedzi czatu z modelem AI.

**Parametry:**

- `systemMessage`: Wiadomość systemowa z instrukcjami dla AI
- `userMessage`: Wiadomość użytkownika
- `modelName`: Nazwa modelu (opcjonalnie, używa defaultModel)
- `responseFormat`: Schema JSON dla ustrukturyzowanej odpowiedzi (opcjonalnie)
- `modelParameters`: Parametry modelu (temperature, max_tokens, itp.)

**Przykład użycia:**

```typescript
const response = await openRouterService.createChatCompletion({
  systemMessage: "Jesteś ekspertem kulinarnym. Odpowiadaj tylko w języku polskim.",
  userMessage: "Podaj przepis na kotlety schabowe",
  modelName: "anthropic/claude-3.5-sonnet",
  responseFormat: {
    type: "json_schema",
    json_schema: {
      name: "recipe_response",
      strict: true,
      schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          ingredients: {
            type: "array",
            items: { type: "string" },
          },
          instructions: {
            type: "array",
            items: { type: "string" },
          },
          prep_time: { type: "number" },
          difficulty: {
            type: "string",
            enum: ["łatwy", "średni", "trudny"],
          },
        },
        required: ["title", "ingredients", "instructions"],
      },
    },
  },
  modelParameters: {
    temperature: 0.7,
    max_tokens: 2000,
  },
});
```

#### `validateModel(modelName: string): Promise<boolean>`

Sprawdza dostępność wybranego modelu.

#### `estimateTokens(text: string): number`

Szacuje liczbę tokenów dla podanego tekstu.

### Pola Publiczne

- `isConnected: boolean` - Status połączenia z API
- `defaultModel: string` - Aktualnie ustawiony domyślny model
- `supportedFormats: string[]` - Lista obsługiwanych formatów odpowiedzi

## 4. Prywatne Metody i Pola

### Metody Prywatne

#### `makeRequest(endpoint: string, data: any): Promise<any>`

Wykonuje zapytanie HTTP z obsługą retry logic.

#### `validateResponseFormat(format: ResponseFormat): boolean`

Waliduje poprawność schematu JSON dla response_format.

#### `formatMessages(systemMessage: string, userMessage: string): Message[]`

Formatuje wiadomości zgodnie z wymaganiami OpenRouter API:

```typescript
private formatMessages(systemMessage: string, userMessage: string): Message[] {
  const messages: Message[] = [];

  if (systemMessage.trim()) {
    messages.push({
      role: 'system',
      content: systemMessage
    });
  }

  messages.push({
    role: 'user',
    content: userMessage
  });

  return messages;
}
```

#### `handleRetry(error: Error, attempt: number): Promise<void>`

Implementuje exponential backoff dla ponownych prób.

#### `sanitizeInput(input: string): string`

Sanityzuje dane wejściowe przed wysłaniem do API.

### Pola Prywatne

- `apiKey: string` - Klucz API
- `baseUrl: string` - URL bazowy
- `httpClient: AxiosInstance` - Klient HTTP
- `retryConfig: RetryConfig` - Konfiguracja retry logic

## 5. Obsługa Błędów

### Scenariusze Błędów

1. **Błędy sieciowe** - Brak połączenia, timeout
2. **Błędy autoryzacji** - Nieprawidłowy klucz API
3. **Błędy rate limiting** - Przekroczenie limitów
4. **Błędy dostępności modelu** - Model niedostępny lub usunięty
5. **Błędy walidacji** - Nieprawidłowy format danych
6. **Błędy response format** - Model nie obsługuje JSON schema

### Implementacja Error Handler

```typescript
class OpenRouterError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorType?: 'network' | 'auth' | 'rate_limit' | 'model' | 'validation' | 'response_format'
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

private handleError(error: any): never {
  if (error.response) {
    const status = error.response.status;
    switch (status) {
      case 401:
        throw new OpenRouterError('Nieprawidłowy klucz API', 401, 'auth');
      case 429:
        throw new OpenRouterError('Przekroczono limit requestów', 429, 'rate_limit');
      case 400:
        throw new OpenRouterError('Nieprawidłowe dane wejściowe', 400, 'validation');
      case 404:
        throw new OpenRouterError('Model niedostępny', 404, 'model');
      default:
        throw new OpenRouterError(`Błąd API: ${error.response.statusText}`, status);
    }
  }

  if (error.code === 'ECONNABORTED') {
    throw new OpenRouterError('Timeout połączenia', undefined, 'network');
  }

  throw new OpenRouterError('Nieoczekiwany błąd', undefined, 'network');
}
```

## 6. Kwestie Bezpieczeństwa

### Zabezpieczenie Kluczy API

1. **Zmienne środowiskowe**: Klucz API przechowywany w `.env`
2. **Walidacja**: Sprawdzenie formatu klucza przed użyciem
3. **Rotacja**: Możliwość aktualizacji klucza w runtime

### Sanityzacja Danych

1. **Input sanitization**: Oczyszczanie danych wejściowych
2. **Output validation**: Walidacja odpowiedzi z API
3. **XSS protection**: Zabezpieczenie przed atakami cross-site scripting

### Rate Limiting

1. **Client-side limiting**: Ograniczenie requestów po stronie klienta
2. **Queue management**: Kolejkowanie requestów
3. **Priority handling**: Priorytetyzacja ważnych requestów

## 7. Plan Wdrożenia Krok po Kroku

### Krok 1: Konfiguracja Środowiska

```bash
# Dodanie zmiennych środowiskowych w .env
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

### Krok 2: Definicja Typów

Stworzenie pliku `src/types.ts` z interfejsami:

```typescript
// Dodanie do istniejącego src/types.ts
export interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface ChatCompletionRequest {
  systemMessage: string;
  userMessage: string;
  modelName?: string;
  responseFormat?: ResponseFormat;
  modelParameters?: ModelParameters;
}

export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: object;
  };
}

export interface ModelParameters {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

### Krok 3: Implementacja Głównej Klasy

Stworzenie pliku `src/lib/openrouter-service.ts`:

```typescript
import axios, { AxiosInstance, AxiosError } from "axios";
import type {
  OpenRouterConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  Message,
  ResponseFormat,
} from "../types";

export class OpenRouterService {
  private apiKey: string;
  private baseUrl: string;
  private httpClient: AxiosInstance;
  private maxRetries: number;
  private retryDelay: number;

  public defaultModel: string;
  public isConnected: boolean = false;
  public supportedFormats: string[] = ["json_schema"];

  constructor(config: OpenRouterConfig) {
    // Implementacja konstruktora zgodnie z opisem powyżej
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    // Implementacja głównej metody
  }

  // Pozostałe metody publiczne i prywatne
}
```

### Krok 4: Konfiguracja HTTP Client

```typescript
private setupHttpClient(): void {
  this.httpClient = axios.create({
    baseURL: this.baseUrl,
    timeout: this.timeout,
    headers: {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.SITE_URL || 'http://localhost:4321',
      'X-Title': 'AI Recipe Keeper'
    }
  });

  // Interceptor dla obsługi błędów
  this.httpClient.interceptors.response.use(
    response => response,
    error => this.handleError(error)
  );
}
```

### Krok 5: Implementacja API Endpoint

Stworzenie pliku `src/pages/api/chat.ts`:

```typescript
import type { APIRoute } from "astro";
import { OpenRouterService } from "../../lib/openrouter-service";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { systemMessage, userMessage, modelName, responseFormat } = await request.json();

    const openRouterService = new OpenRouterService({
      apiKey: import.meta.env.OPENROUTER_API_KEY,
    });

    const response = await openRouterService.createChatCompletion({
      systemMessage,
      userMessage,
      modelName,
      responseFormat,
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
```

### Krok 6: Implementacja React Hook

Stworzenie pliku `src/lib/hooks/useOpenRouter.ts`:

```typescript
import { useState, useCallback } from "react";
import type { ChatCompletionRequest, ChatCompletionResponse } from "../../types";

export function useOpenRouter() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (request: ChatCompletionRequest): Promise<ChatCompletionResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { sendMessage, loading, error };
}
```

### Krok 7: Konfiguracja Middleware (Opcjonalnie)

Aktualizacja `src/middleware/index.ts` dla rate limiting:

```typescript
// Dodanie do istniejącego middleware
export const onRequest = sequence(
  // istniejące middleware
  rateLimitMiddleware
);

async function rateLimitMiddleware(context: any, next: any) {
  if (context.url.pathname.startsWith("/api/chat")) {
    // Implementacja rate limiting
    const clientIP = context.clientAddress;
    // Logika sprawdzenia limitów dla IP
  }
  return next();
}
```

## Podsumowanie

Ten plan implementacji zapewnia:

- ✅ Bezpieczną komunikację z OpenRouter API
- ✅ Kompleksową obsługę błędów
- ✅ Wsparcie dla wszystkich wymaganych funkcji (system/user messages, response format, parametry modelu)
- ✅ Zgodność z architekturą Astro i tech stackiem projektu
- ✅ Skalowalność i łatwość utrzymania
- ✅ Bezpieczeństwo i best practices

Implementacja powinna być wykonywana krok po kroku, z testowaniem każdego etapu przed przejściem do następnego.
