import React from "react";
import { HomePage } from "../pages/home-page";
import { DocumentsPage } from "../pages/documents-page";
import { ChatPage } from "../pages/chat-page";
import { MetadataTestPage } from "../pages/metadata-test-page";
import { MetadataExtractPage } from "../pages/metadata-extract-page";

type Route = {
  path: string;
  component: React.ComponentType;
};

const routes: Route[] = [
  { path: "/", component: HomePage },
  { path: "/documents", component: DocumentsPage },
  { path: "/chat", component: ChatPage },
  { path: "/metadata-test", component: MetadataTestPage },
  { path: "/metadata-extract", component: MetadataExtractPage },
];

export function Router() {
  const [currentPath, setCurrentPath] = React.useState(window.location.pathname);

  React.useEffect(() => {
    const onLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", onLocationChange);

    // Handle link clicks
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      
      if (
        anchor &&
        anchor.href.startsWith(window.location.origin) &&
        !anchor.hasAttribute("target") &&
        anchor.hasAttribute("href")
      ) {
        const url = new URL(anchor.href);
        const newPath = url.pathname;
        
        // Don't intercept API routes - let them go to the backend
        if (newPath.startsWith("/api/")) {
          return;
        }
        
        e.preventDefault();
        window.history.pushState({}, "", newPath);
        setCurrentPath(newPath);
      }
    });

    return () => {
      window.removeEventListener("popstate", onLocationChange);
    };
  }, []);

  // Find the matching route or default to home
  const route = routes.find((route) => route.path === currentPath) || routes[0];
  const Component = route.component;

  return <Component />;
}
