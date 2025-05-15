import { Hono } from "hono";
import { cors } from "hono/cors";
import { errorMiddleware } from "./middleware/error";

// Import route handlers
import healthRoutes from "./routes/health-routes";
import documentRoutes from "./routes/document-routes";
import chatRoutes from "./routes/chat-routes";
import metadataRoutes from "./routes/metadata-routes";
import authRoutes from "./routes/auth-routes";

// Create a new Hono app
const app = new Hono<{ Bindings: Env }>();

// Apply global middleware
app.use("*", cors());
app.use("*", errorMiddleware());

// Mount route handlers
app.route("/", healthRoutes);
app.route("/", documentRoutes);
app.route("/", chatRoutes);
app.route("/", metadataRoutes);
app.route("/", authRoutes);

// Export the Hono app as the default export
export default app;
