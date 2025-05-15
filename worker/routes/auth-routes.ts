import { Context, Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { loginSchema, registerSchema, refreshTokenSchema } from "../schemas";
import { AuthService } from "../services/auth-service";
import { formatSuccessResponse, formatErrorResponse } from "../utils";
import { API_ROUTES } from "../config";

// Create a new Hono app for auth routes
const authRoutes = new Hono();

/**
 * Login route
 * POST /api/auth/login
 */
authRoutes.post(
  API_ROUTES.AUTH.LOGIN,
  zValidator("json", loginSchema),
  async (c: Context<{ Bindings: Env }>) => {
    try {
      const { email, password } = await c.req.json() as z.infer<typeof loginSchema>;
      const tokens = await AuthService.login({ email, password }, c.env);
      
      return c.json(formatSuccessResponse(tokens));
    } catch (error: unknown) {
      console.error("Login error:", error);
      
      if (error instanceof Error && error.name === "UnauthorizedError") {
        return c.json(formatErrorResponse(error.message), 401);
      }
      
      return c.json(formatErrorResponse("Login failed"), 500);
    }
  }
);

/**
 * Register route
 * POST /api/auth/register
 */
authRoutes.post(
  API_ROUTES.AUTH.REGISTER,
  zValidator("json", registerSchema),
  async (c: Context<{ Bindings: Env }>) => {
    try {
      const { email, password, name } = await c.req.json() as z.infer<typeof registerSchema>;
      const tokens = await AuthService.register({ email, password, name }, c.env);
      
      return c.json(formatSuccessResponse(tokens));
    } catch (error: unknown) {
      console.error("Registration error:", error);
      
      if (error instanceof Error && error.name === "ValidationError") {
        return c.json(formatErrorResponse(error.message), 400);
      }
      
      return c.json(formatErrorResponse("Registration failed"), 500);
    }
  }
);

/**
 * Refresh token route
 * POST /api/auth/refresh
 */
authRoutes.post(
  API_ROUTES.AUTH.REFRESH,
  zValidator("json", refreshTokenSchema),
  async (c: Context<{ Bindings: Env }>) => {
    try {
      const { refreshToken } = await c.req.json() as z.infer<typeof refreshTokenSchema>;
      const tokens = await AuthService.refreshTokens(refreshToken, c.env);
      
      return c.json(formatSuccessResponse(tokens));
    } catch (error: unknown) {
      console.error("Token refresh error:", error);
      
      if (error instanceof Error && error.name === "UnauthorizedError") {
        return c.json(formatErrorResponse(error.message), 401);
      }
      
      return c.json(formatErrorResponse("Token refresh failed"), 500);
    }
  }
);

export default authRoutes;