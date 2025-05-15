import { Context, MiddlewareHandler, Next } from "hono";
import { jwtVerify } from "jose";
import { ERROR_MESSAGES } from "../config";
import { AuthenticatedUser } from "../types";

/**
 * Authentication middleware for protecting routes
 * Verifies the JWT token from the Authorization header
 * and adds the user to the context
 */
export const authMiddleware = (): MiddlewareHandler => {
  return async (c: Context, next: Next) => {
    try {
      // Get the authorization header
      const authHeader = c.req.header("Authorization");
      
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json(
          { 
            status: "error", 
            error: ERROR_MESSAGES.AUTHENTICATION.UNAUTHORIZED 
          }, 
          401
        );
      }
      
      // Extract the token
      const token = authHeader.split(" ")[1];
      
      if (!token) {
        return c.json(
          { 
            status: "error", 
            error: ERROR_MESSAGES.AUTHENTICATION.UNAUTHORIZED 
          }, 
          401
        );
      }
      
      // Verify the token
      const secret = new TextEncoder().encode(c.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      
      if (!payload.sub || !payload.email || !payload.tenantId) {
        return c.json(
          { 
            status: "error", 
            error: ERROR_MESSAGES.AUTHENTICATION.UNAUTHORIZED 
          }, 
          401
        );
      }
      
      // Add the user to the context
      const user: AuthenticatedUser = {
        id: payload.sub as string,
        email: payload.email as string,
        name: payload.name as string || "",
        tenantId: payload.tenantId as string,
      };
      
      c.set("user", user);
      
      // Continue to the next middleware or route handler
      await next();
    } catch (error: unknown) {
      console.error("Authentication error:", error);
      
      // Check if token is expired
      if (error instanceof Error && error.name === "JWTExpired") {
        return c.json(
          { 
            status: "error", 
            error: ERROR_MESSAGES.AUTHENTICATION.TOKEN_EXPIRED 
          }, 
          401
        );
      }
      
      return c.json(
        { 
          status: "error", 
          error: ERROR_MESSAGES.AUTHENTICATION.UNAUTHORIZED 
        }, 
        401
      );
    }
  };
};