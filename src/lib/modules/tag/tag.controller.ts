import type { APIContext } from "astro";
import { inject, injectable } from "tsyringe";
import type { TagService } from "./tag.service";
import type { TagListResponseDTO } from "../../../types";
import { withErrorHandler } from "../../api/middleware/errorHandler";
import { success } from "../../api/responses";

@injectable()
export class TagController {
  constructor(@inject("TagService") private tagService: TagService) {}

  /**
   * GET /api/tags - Fetch all active tags
   */
  getTags = withErrorHandler(async (_context: APIContext) => {
    const tags = await this.tagService.getActiveTags();

    const response: TagListResponseDTO = {
      tags,
    };

    return success(response);
  });
}
