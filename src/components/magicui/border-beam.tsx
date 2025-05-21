"use client";

import { motion } from "motion/react";
import { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  transition?: Record<string, unknown>;
  style?: CSSProperties;
  reverse?: boolean;
  initialOffset?: number;
  children?: ReactNode;
}

export const BorderBeam: React.FC<BorderBeamProps> = ({
  className,
  size = 50,
  duration = 6,
  delay = 0,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  transition,
  style,
  reverse = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // initialOffset = 0,
  children,
}) => {
  return (
    <div
      className={cn(
        "relative rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent] ![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
        className
      )}
      style={
        {
          "--size": size,
          "--duration": duration,
          "--anchor": reverse ? 10 : 90,
          "--border-width": 1.5,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": `${delay}s`,
          ...style,
        } as CSSProperties
      }
    >
      <motion.div
        className="absolute inset-[0] rounded-[inherit] after:absolute after:aspect-square after:w-[calc(var(--size)*1px)] after:animate-border-beam after:[animation-delay:var(--delay)] after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)] after:[offset-anchor:calc(var(--anchor)*1%)_50%] after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={transition}
      />
      {children}
    </div>
  );
};
