import * as React from "react";
import { cn } from "@/lib/utils";

export type SkeletonVariant = "default" | "text" | "circle" | "card" | "image";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
}

const variantClasses: Record<SkeletonVariant, string> = {
  default: "rounded-md",
  text: "h-4 w-full rounded-sm",
  circle: "rounded-full aspect-square shrink-0",
  image: "w-full aspect-video rounded-lg",
  card: "w-full rounded-lg border border-border p-4",
};

export function Skeleton({
  className,
  variant = "default",
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  const customStyles: React.CSSProperties = {
    ...style,
    ...(width !== undefined ? { width: typeof width === "number" ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === "number" ? `${height}px` : height } : {}),
  };

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden bg-muted",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.8s_infinite] after:bg-gradient-to-r after:from-transparent after:via-surface/60 after:to-transparent",
        variantClasses[variant],
        className
      )}
      style={customStyles}
      {...props}
    />
  );
}

export default Skeleton;
