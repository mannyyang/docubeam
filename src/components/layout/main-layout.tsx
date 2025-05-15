import React from "react";
import { FileText, MessageSquare, Upload, Info } from "lucide-react";
import { Toaster } from "../ui/toaster";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Navigation */}
      <aside className="hidden w-64 border-r bg-muted/40 p-6 md:block">
        <div className="flex flex-col h-full">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">PDF Chat</h1>
            <p className="text-sm text-muted-foreground">
              Chat with your PDF documents
            </p>
          </div>
          
          <nav className="space-y-2 flex-1">
            <a
              href="/"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              <Upload className="h-4 w-4" />
              Upload PDF
            </a>
            <a
              href="/documents"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              <FileText className="h-4 w-4" />
              My Documents
            </a>
            <a
              href="/chat"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              <MessageSquare className="h-4 w-4" />
              Chat
            </a>
            <a
              href="/metadata-test"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              <Info className="h-4 w-4" />
              Metadata Test
            </a>
            <a
              href="/metadata-extract"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              <FileText className="h-4 w-4" />
              Extract Metadata
            </a>
          </nav>
          
          <div className="mt-auto pt-4">
            <div className="rounded-md bg-secondary px-3 py-2">
              <h3 className="text-sm font-medium">Need help?</h3>
              <p className="text-xs text-muted-foreground">
                Check out our documentation or contact support.
              </p>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Mobile Header */}
      <div className="flex flex-col flex-1">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6 md:hidden">
          <h1 className="text-xl font-bold">PDF Chat</h1>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
      
      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}
