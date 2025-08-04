import { injectable, inject } from "tsyringe";
import type { APIContext } from "astro";
import { ApiError } from "../../errors";
import { success } from "../../api/responses";
import type { UserService } from "./user.service";
import { withErrorHandler } from "@/lib/api/middleware/errorHandler";

/**
 * Controller handling user-related HTTP operations
 */
@injectable()
export class UserController {
  constructor(@inject("UserService") private userService: UserService) {}

  /**
   * GET /api/users/profile
   * Retrieves user profile with additional data
   */
  getProfile = withErrorHandler(async (context: APIContext): Promise<Response> => {
    const userId = context.locals.user?.id;

    if (!userId) {
      throw new ApiError(401, "Authentication required.", "UNAUTHORIZED");
    }

    if (!context.locals.supabase) {
      throw new ApiError(500, "Server configuration error.", "INTERNAL_SERVER_ERROR");
    }

    const userProfile = await this.userService.getUserProfile(userId);
    return success(userProfile);
  });
}
