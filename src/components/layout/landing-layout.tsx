import React from "react";
import { Toaster } from "../ui/toaster";

interface LandingLayoutProps {
  children: React.ReactNode;
}

export function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center">
          <h1 className="text-xl font-bold tracking-tight">Magic UI</h1>
        </div>
        <div className="flex items-center gap-4">
          <a 
            href="/login" 
            className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            Log in
          </a>
          <a 
            href="/signup" 
            className="px-4 py-2 text-sm font-medium bg-zinc-800 text-white rounded-md hover:bg-zinc-700 transition-colors border border-zinc-700"
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
