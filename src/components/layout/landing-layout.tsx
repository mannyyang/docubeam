import React from "react";
import { Toaster } from "../ui/toaster";

interface LandingLayoutProps {
  children: React.ReactNode;
}

export function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between px-6 py-4 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <img src="/docubeam-logo-sm.png" alt="Docubeam Logo" className="h-8 w-8" />
          <h1 className="text-xl font-bold tracking-tight">Docubeam</h1>
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
