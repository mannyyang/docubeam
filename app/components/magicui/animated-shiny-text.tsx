"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface AnimatedShinyTextProps {
  children: React.ReactNode;
  className?: string;
  shimmerWidth?: number;
}

export function AnimatedShinyText({
  children,
  className,
  shimmerWidth = 100,
}: AnimatedShinyTextProps) {
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    // Set window width on client side
    setWindowWidth(window.innerWidth);

    // Update window width when resized
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="relative z-10">{children}</div>
      <motion.div
        className="absolute inset-0 z-0 w-full"
        style={{
          background: `linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0) 100%)`,
          width: shimmerWidth,
        }}
        animate={{
          x: [windowWidth * -1, windowWidth],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 2,
        }}
      />
    </div>
  );
}
