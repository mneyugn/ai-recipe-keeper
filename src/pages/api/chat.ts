import type { APIRoute } from "astro";
import { OpenRouterService } from "../../lib/openrouter.service";
import type { ChatCompletionRequest, OpenRouterError } from "../../types";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { systemMessage, userMessage, modelName, responseFormat, modelParameters } =
      (await request.json()) as ChatCompletionRequest;

    if (!userMessage) {
      return new Response(JSON.stringify({ error: "Wiadomość użytkownika jest wymagana." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = import.meta.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error("Brak klucza OPENROUTER_API_KEY w zmiennych środowiskowych.");
      return new Response(JSON.stringify({ error: "Błąd konfiguracji serwera." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const openRouterService = new OpenRouterService({
      apiKey,
    });

    const response = await openRouterService.createChatCompletion({
      systemMessage,
      userMessage,
      modelName,
      responseFormat,
      modelParameters,
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    const openRouterError = error as OpenRouterError;
    console.error("Błąd w /api/chat:", openRouterError);

    return new Response(JSON.stringify({ error: openRouterError.message || "Wystąpił nieoczekiwany błąd." }), {
      status: openRouterError.statusCode || 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
