import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import { createRequestHandler } from "react-router";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { errorMiddleware } from "./middleware/error";
import * as schema from "./db/schema";

// Import route handlers
import healthRoutes from "./routes/health-routes";
import documentRoutes from "./routes/document-routes";
import chatRoutes from "./routes/chat-routes";
import metadataRoutes from "./routes/metadata-routes";
import { waitlistRouter } from "./routes/waitlist-routes";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
    db: DrizzleD1Database<typeof schema>;
  }
}

// Create React Router request handler
const reactRouterHandler = createRequestHandler(
  // @ts-ignore
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

// Create a new Hono app for API routes
const apiApp = new Hono<{ Bindings: Env }>();

// Apply global middleware to API routes
apiApp.use("*", cors());
apiApp.use("*", errorMiddleware());

// Mount API route handlers
apiApp.route("/", healthRoutes);
apiApp.route("/", documentRoutes);
apiApp.route("/", chatRoutes);
apiApp.route("/", metadataRoutes);
apiApp.route("/api/waitlist", waitlistRouter);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    const db = drizzle(env.WAITLIST_DB, { schema });

    // Handle API routes with Hono
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/health")) {
      return apiApp.fetch(request, env, ctx);
    }

    // Handle everything else with React Router
    return reactRouterHandler(request, {
      cloudflare: { env, ctx },
      db,
    });
  },
} satisfies ExportedHandler<Env>;
