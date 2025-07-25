import type { APIRoute } from "astro";
import { openRouterService } from "../../lib/core";
import type { ChatCompletionRequest } from "../../types";
import { ApiError } from "../../lib/errors";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const { systemMessage, userMessage, modelName, responseFormat, modelParameters } =
    (await request.json()) as ChatCompletionRequest;

  if (!userMessage) {
    throw new ApiError(400, "User message is required.", "VALIDATION_ERROR");
  }

  // use the singleton instance of the service
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
};
