import type { RouteConfig } from "@react-router/dev/routes";
import { index } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  { path: "/files", file: "routes/files.tsx" },
] satisfies RouteConfig;
