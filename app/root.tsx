import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { MetaFunction } from "react-router";
import "./index.css";
import { Toaster } from "./components/ui/toaster";

export const meta: MetaFunction = () => {
  return [
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { title: "Docubeam - Extract PDF Comments & Get Actionable Insights" },
    { name: "title", content: "Docubeam - Extract PDF Comments & Get Actionable Insights" },
    { name: "description", content: "Docubeam extracts and organizes comments from PDF documents, providing actionable insights and centralized data organization." },
    { name: "keywords", content: "PDF comments, document management, PDF extraction, comment organization, document insights, PDF annotations" },
    { name: "author", content: "Docubeam" },
    { name: "robots", content: "index, follow" },
    
    // Open Graph / Facebook
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://docubeam.websyte.ai/" },
    { property: "og:title", content: "Docubeam - Extract PDF Comments & Get Actionable Insights" },
    { property: "og:description", content: "Stop chasing comments and get actionable insights from your PDF documents. Docubeam extracts, organizes, and analyzes comments for better decision-making." },
    { property: "og:image", content: "/docubeam-og.png" },
    { property: "og:site_name", content: "Docubeam" },
    
    // Twitter
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:url", content: "https://docubeam.websyte.ai/" },
    { name: "twitter:title", content: "Docubeam - Extract PDF Comments & Get Actionable Insights" },
    { name: "twitter:description", content: "Stop chasing comments and get actionable insights from your PDF documents. Docubeam extracts, organizes, and analyzes comments for better decision-making." },
    { name: "twitter:image", content: "/docubeam-og.png" },
    { name: "twitter:creator", content: "@docubeam" },
    
    // Canonical URL
    { tagName: "link", rel: "canonical", href: "https://docubeam.websyte.ai/" },
    
    // Favicon
    { tagName: "link", rel: "icon", type: "image/png", href: "/docubeam-logo-sm.png" },
  ];
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
        
        {/* Structured Data - Website */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "url": "https://docubeam.websyte.ai/",
              "name": "Docubeam",
              "description": "Docubeam extracts and organizes comments from PDF documents, providing actionable insights and centralized data organization."
            })
          }}
        />
        
        {/* Structured Data - Software Application */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Docubeam",
              "description": "Docubeam extracts and organizes comments from PDF documents, providing actionable insights and centralized data organization.",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web"
            })
          }}
        />
        
        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "url": "https://docubeam.websyte.ai/",
              "name": "Docubeam",
              "logo": "https://docubeam.websyte.ai/docubeam-logo-sm.png",
              "description": "Docubeam extracts and organizes comments from PDF documents, providing actionable insights and centralized data organization."
            })
          }}
        />
      </head>
      <body>
        {children}
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: { error: unknown }) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main style={{ paddingTop: '4rem', padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre style={{ width: '100%', padding: '1rem', overflowX: 'auto' }}>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
