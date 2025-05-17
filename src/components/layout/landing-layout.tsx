import React from "react";
import { Toaster } from "../ui/toaster";

interface LandingLayoutProps {
  children: React.ReactNode;
}

export function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">PDF Chat</h1>
        </div>
        <div className="flex items-center gap-4">
          <a 
            href="/documents" 
            className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            Dashboard
          </a>
          <a 
            href="/login" 
            className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            Log in
          </a>
          <a 
            href="/signup" 
            className="px-4 py-2 text-sm font-medium bg-white text-black rounded-md hover:bg-white/90 transition-colors"
          >
            Sign up
          </a>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}
