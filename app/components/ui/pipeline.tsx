"use client";

import React, { forwardRef, useRef } from "react";
import { 
  FileText, 
  MessageSquare, 
  Highlighter, 
  Database, 
  MessageCircle, 
  BarChart3
} from "lucide-react";

import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/magicui/animated-beam";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode; label?: string }
>(({ className, children, label }, ref) => {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        ref={ref}
        className={cn(
          "z-10 flex size-12 sm:size-16 items-center justify-center rounded-full border-2 border-white/20 bg-white p-2 sm:p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
          className
        )}
      >
        {children}
      </div>
      {label && <span className="text-[10px] sm:text-xs text-white/80 font-medium">{label}</span>}
    </div>
  );
});

Circle.displayName = "Circle";

export function AnimatedBeamMultipleOutputDemo({
  className,
}: {
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className={cn(
        "relative flex h-[400px] sm:h-[500px] w-full items-center justify-center overflow-x-auto overflow-y-hidden p-4 sm:p-10 bg-transparent",
        className,
      )}
      ref={containerRef}
    >
      <div className="flex min-w-[300px] sm:min-w-[600px] size-full max-w-xl flex-row items-stretch justify-between gap-4 sm:gap-16">
        <div className="flex flex-col justify-center gap-4">
          <Circle ref={div1Ref} label="PDF Document">
            <FileText className="h-5 w-5 sm:h-8 sm:w-8 text-blue-600" />
          </Circle>
          <Circle ref={div2Ref} label="PDF Comments">
            <MessageSquare className="h-5 w-5 sm:h-8 sm:w-8 text-green-600" />
          </Circle>
          <Circle ref={div3Ref} label="PDF Annotations">
            <Highlighter className="h-5 w-5 sm:h-8 sm:w-8 text-yellow-600" />
          </Circle>
        </div>
        <div className="flex flex-col justify-center">
          <Circle ref={div4Ref} className="size-14 sm:size-20" label="Data Store">
            <Database className="h-6 w-6 sm:h-10 sm:w-10 text-indigo-600" />
          </Circle>
        </div>
        <div className="flex flex-col justify-center gap-4">
          <Circle ref={div5Ref} label="Chat Interface">
            <MessageCircle className="h-5 w-5 sm:h-8 sm:w-8 text-purple-600" />
          </Circle>
          <Circle ref={div6Ref} label="Insights Dashboard">
            <BarChart3 className="h-5 w-5 sm:h-8 sm:w-8 text-red-600" />
          </Circle>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div4Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div4Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div4Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div4Ref}
        toRef={div5Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div4Ref}
        toRef={div6Ref}
      />
    </div>
  );
}

export function AnimatedBeamDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative flex items-center justify-center overflow-hidden p-10"
      ref={containerRef}
    >
      <div className="flex size-full max-w-xl flex-col items-stretch justify-between gap-10">
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div1Ref} label="Source 1">
            <FileText className="h-8 w-8" />
          </Circle>
          <Circle ref={div5Ref} label="Source 2">
            <FileText className="h-8 w-8" />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div2Ref} label="Source 3">
            <FileText className="h-8 w-8" />
          </Circle>
          <Circle ref={div4Ref} className="size-20" label="Processing">
            <Database className="h-10 w-10" />
          </Circle>
          <Circle ref={div6Ref} label="Source 4">
            <FileText className="h-8 w-8" />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div3Ref} label="Source 5">
            <MessageSquare className="h-8 w-8" />
          </Circle>
          <Circle ref={div7Ref} label="Source 6">
            <MessageCircle className="h-8 w-8" />
          </Circle>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div4Ref}
        curvature={-75}
        endYOffset={-10}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div4Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div4Ref}
        curvature={75}
        endYOffset={10}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div5Ref}
        toRef={div4Ref}
        curvature={-75}
        endYOffset={-10}
        reverse
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div6Ref}
        toRef={div4Ref}
        reverse
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div7Ref}
        toRef={div4Ref}
        curvature={75}
        endYOffset={10}
        reverse
      />
    </div>
  );
}
