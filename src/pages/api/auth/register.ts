import type { APIRoute } from "astro";
import { createRequestContainer } from "../../../lib/core/container";
import { AuthController } from "../../../lib/modules/auth/auth.controller";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const requestContainer = createRequestContainer(context);
  const authController = requestContainer.resolve(AuthController);
  return authController.register(context);
};
