"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface AuroraTextProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  speed?: number;
}

export function AuroraText({
  children,
  className,
  colors = ["#FF0080", "#7928CA", "#0070F3", "#38bdf8"],
  speed = 1,
}: AuroraTextProps) {
  return (
    <motion.div
      className={cn("inline-block", className)}
      animate={{
        backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
      }}
      transition={{
        duration: 10 / speed,
        repeat: Infinity,
        ease: "linear",
      }}
      style={{
        backgroundImage: `linear-gradient(45deg, ${colors.join(", ")})`,
        backgroundSize: "300% 300%",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        color: "transparent",
      }}
    >
      {children}
    </motion.div>
  );
}
