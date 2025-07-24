import type { APIRoute } from "astro";
import { createRequestContainer } from "../../../lib/core/container";
import { withErrorHandler } from "../../../lib/api/middleware/errorHandler";
import { UserController } from "../../../lib/modules/user/user.controller";

export const prerender = false;

export const GET: APIRoute = withErrorHandler(async (context) => {
  const container = createRequestContainer(context);
  const userController = container.resolve(UserController);

  return await userController.getProfile(context);
});
