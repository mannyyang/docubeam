import { Context, MiddlewareHandler, Next } from "hono";
import { StatusCode } from "hono/utils/http-status";

/**
 * Error handling middleware
 * Catches any errors thrown in the route handlers
 * and returns a standardized error response
 */
export const errorMiddleware = (): MiddlewareHandler => {
  return async (c: Context, next: Next) => {
    try {
      // Continue to the next middleware or route handler
      await next();
    } catch (error: unknown) {
      console.error("Unhandled error:", error);
      
      // Default error message
      let message = "An unexpected error occurred";
      let status: StatusCode = 500;
      
      // If the error is an instance of Error, use its message
      if (error instanceof Error) {
        message = error.message;
        
        // Check for specific error types
        if (error.name === "ValidationError") {
          status = 400; // Bad request
        } else if (error.name === "NotFoundError") {
          status = 404; // Not found
        } else if (error.name === "UnauthorizedError") {
          status = 401; // Unauthorized
        } else if (error.name === "ForbiddenError") {
          status = 403; // Forbidden
        }
      }
      
      // Return a standardized error response
      return c.json(
        {
          status: "error",
          error: message,
        },
        status
      );
    }
  };
};

/**
 * Custom error classes for different types of errors
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}