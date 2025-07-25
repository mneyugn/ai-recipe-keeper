import "reflect-metadata";
import { inject, injectable } from "tsyringe";
import type { APIContext } from "astro";
import type { IAuthService } from "./auth.service";
import { withErrorHandler } from "../../api/middleware/errorHandler";
import type { LoginFormData, RegisterFormData } from "./auth.validation";

@injectable()
export class AuthController {
  constructor(@inject("IAuthService") private authService: IAuthService) {}

  public login = withErrorHandler(async (context: APIContext) => {
    const data = (await context.request.json()) as LoginFormData;
    const response = await this.authService.login(context, data);
    return response;
  });

  public register = withErrorHandler(async (context: APIContext) => {
    const data = (await context.request.json()) as RegisterFormData;
    const response = await this.authService.register(context, data);
    return response;
  });

  public logout = withErrorHandler(async (context: APIContext) => {
    const response = await this.authService.logout(context);
    return response;
  });
}
