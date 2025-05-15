import { generateTokens } from "../utils";
import { AuthTokens, UserCredentials, UserRegistration } from "../types";
import { ERROR_MESSAGES } from "../config";
import { UnauthorizedError, ValidationError } from "../middleware/error";

/**
 * Authentication service for handling user authentication
 */
export class AuthService {
  /**
   * Login a user with email and password
   * @param credentials User credentials
   * @param env Environment variables
   * @returns Authentication tokens
   */
  static async login(credentials: UserCredentials, env: Env): Promise<AuthTokens> {
    // In a real implementation, this would validate against a database
    // For this demo, we'll simulate a successful login with a mock user
    
    // Mock validation - in a real app, this would check against a database
    if (credentials.email !== "demo@example.com" || credentials.password !== "password123") {
      throw new UnauthorizedError(ERROR_MESSAGES.AUTHENTICATION.INVALID_CREDENTIALS);
    }
    
    // Generate tokens for the authenticated user
    const tokens = await generateTokens(
      {
        sub: "user-123", // User ID
        email: credentials.email,
        name: "Demo User",
        tenantId: "tenant-123",
      },
      env.JWT_SECRET
    );
    
    return tokens;
  }
  
  /**
   * Register a new user
   * @param registration User registration data
   * @param env Environment variables
   * @returns Authentication tokens
   */
  static async register(registration: UserRegistration, env: Env): Promise<AuthTokens> {
    // In a real implementation, this would create a user in a database
    // For this demo, we'll simulate a successful registration
    
    // Mock validation - in a real app, this would check if the email is already taken
    if (registration.email === "demo@example.com") {
      throw new ValidationError("Email is already taken");
    }
    
    // Generate a user ID and tenant ID
    const userId = crypto.randomUUID();
    const tenantId = crypto.randomUUID();
    
    // Generate tokens for the new user
    const tokens = await generateTokens(
      {
        sub: userId,
        email: registration.email,
        name: registration.name,
        tenantId,
      },
      env.JWT_SECRET
    );
    
    return tokens;
  }
  
  /**
   * Refresh authentication tokens
   * @param refreshToken Refresh token
   * @param env Environment variables
   * @returns New authentication tokens
   */
  static async refreshTokens(refreshToken: string, env: Env): Promise<AuthTokens> {
    try {
      // In a real implementation, this would validate the refresh token
      // and retrieve the user from a database
      
      // For this demo, we'll simulate a successful token refresh
      // by decoding the token and generating new tokens
      
      // Verify the refresh token
      const secret = new TextEncoder().encode(env.JWT_SECRET);
      const { jwtVerify } = await import("jose");
      const { payload } = await jwtVerify(refreshToken, secret);
      
      if (!payload.sub || !payload.email || !payload.tenantId) {
        throw new UnauthorizedError(ERROR_MESSAGES.AUTHENTICATION.UNAUTHORIZED);
      }
      
      // Generate new tokens
      const tokens = await generateTokens(
        {
          sub: payload.sub as string,
          email: payload.email as string,
          name: payload.name as string || "",
          tenantId: payload.tenantId as string,
        },
        env.JWT_SECRET
      );
      
      return tokens;
    } catch (error) {
      console.error("Token refresh error:", error);
      throw new UnauthorizedError(ERROR_MESSAGES.AUTHENTICATION.TOKEN_EXPIRED);
    }
  }
}