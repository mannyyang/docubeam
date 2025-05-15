import { Context, Hono } from "hono";

// Create a new Hono app for health check routes
const healthRoutes = new Hono();

/**
 * Health check endpoint
 * GET /api/health
 */
healthRoutes.get("/api/health", (c: Context) => {
  return c.json({ status: "ok" });
});

export default healthRoutes;
