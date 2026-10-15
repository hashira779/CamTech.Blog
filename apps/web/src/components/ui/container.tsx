import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The one page container.
 *
 * `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` was copy-pasted into the header, the
 * footer and most pages, with small variations that made columns drift out of
 * alignment between routes. Everything now measures from the same rule in
 * globals.css.
 */
export type ContainerWidth = "page" | "reading" | "wide" | "none";

const WIDTH_CLASS: Record<ContainerWidth, string> = {
  page: "container-page",
  reading: "container-reading",
  wide: "container-wide",
  none: "w-full",
};

export interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  width?: ContainerWidth;
  as?: React.ElementType;
}

export function Container({
  width = "page",
  as: Tag = "div",
  className,
  ...props
}: ContainerProps) {
  return <Tag className={cn(WIDTH_CLASS[width], className)} {...props} />;
}

/** Vertical rhythm between page sections. */
export function Section({
  className,
  as: Tag = "section",
  ...props
}: React.HTMLAttributes<HTMLElement> & { as?: React.ElementType }) {
  return <Tag className={cn("py-10 sm:py-14", className)} {...props} />;
}
