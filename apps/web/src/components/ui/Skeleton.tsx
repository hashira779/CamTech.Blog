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
  text: "h-4 w-full rounded",
  circle: "rounded-full aspect-square shrink-0",
  image: "w-full aspect-video rounded-xl",
  card: "w-full rounded-2xl p-4 border border-slate-200 dark:border-slate-800",
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
      className={cn(
        "relative overflow-hidden bg-slate-200/80 dark:bg-slate-800/80",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.8s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/40 dark:after:via-white/10 after:to-transparent",
        variantClasses[variant],
        className
      )}
      style={customStyles}
      {...props}
    />
  );
}

export default Skeleton;
