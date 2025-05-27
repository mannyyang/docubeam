import type { RouteConfig } from "@react-router/dev/routes";
import { index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("documents", "routes/documents.tsx"),
  route("chat", "routes/chat.tsx"),
  route("metadata-test", "routes/metadata-test.tsx"),
  route("metadata-extract", "routes/metadata-extract.tsx"),
] satisfies RouteConfig;
