import type { APIRoute } from "astro";
import { createRequestContainer } from "../../lib/core/container";
import { TagController } from "../../lib/modules/tag/tag.controller";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const container = createRequestContainer(context);
  const tagController = container.resolve(TagController);

  return tagController.getTags(context);
};
