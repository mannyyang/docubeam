import React from "react";
import { cn } from "@/lib/utils";

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

export function BentoGrid({
  className,
  children,
  ...props
}: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface BentoGridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  colSpan?: string;
  rowSpan?: string;
  children: React.ReactNode;
}

export function BentoGridItem({
  className,
  colSpan,
  rowSpan,
  children,
  ...props
}: BentoGridItemProps) {
  return (
    <div
      className={cn(
        colSpan,
        rowSpan,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  title?: string;
  name?: string;
  description?: string;
  Icon?: React.ElementType;
  icon?: React.ReactNode;
  iconClassName?: string;
  iconContainerClassName?: string;
  header?: React.ReactNode;
  children?: React.ReactNode;
  bgClassName?: string;
  href?: string;
  cta?: string;
}

export function BentoCard({
  className,
  title,
  name,
  description,
  Icon,
  icon,
  iconClassName,
  iconContainerClassName,
  header,
  children,
  bgClassName,
  href,
  cta,
  ...props
}: BentoCardProps) {
  const displayTitle = title || name;
  
  return (
    <div
      className={cn(
        "rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-lg",
        bgClassName || "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800",
        className
      )}
      {...props}
    >
      {header ? header : null}
      
      {Icon && (
        <div className="mb-4">
          <div className={cn("p-3 rounded-xl inline-flex", iconContainerClassName)}>
            <Icon className={cn("h-6 w-6", iconClassName)} />
          </div>
        </div>
      )}
      
      {icon && (
        <div className="mb-4">
          <div className={cn("p-3 rounded-xl inline-flex", iconContainerClassName)}>
            <div className={cn("h-6 w-6", iconClassName)}>{icon}</div>
          </div>
        </div>
      )}
      
      {displayTitle && <h3 className="text-2xl font-bold text-white mb-3">{displayTitle}</h3>}
      
      {description && <p className="text-lg text-white/90 leading-relaxed">{description}</p>}
      
      {cta && href && (
        <div className="mt-4">
          <a 
            href={href} 
            className="text-sm font-medium text-primary hover:underline"
          >
            {cta}
          </a>
        </div>
      )}
      
      {children}
    </div>
  );
}
