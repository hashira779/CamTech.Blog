import * as React from "react";
import Link from "next/link";
import { ArrowRight, Wrench, Calculator, Code2, QrCode, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DESIGN_TOKENS } from "@/lib/tokens";

export interface ToolCardProps {
  slug: string;
  name: string;
  category: string;
  description: string;
  iconName?: string;
}

export function ToolCard({ slug, name, category, description }: ToolCardProps) {
  const getToolIcon = () => {
    switch (category.toLowerCase()) {
      case "calculator":
      case "calculators":
        return <Calculator size={DESIGN_TOKENS.iconSize.lg} />;
      case "developer":
        return <Code2 size={DESIGN_TOKENS.iconSize.lg} />;
      case "image":
      case "file":
        return <QrCode size={DESIGN_TOKENS.iconSize.lg} />;
      default:
        return <Wrench size={DESIGN_TOKENS.iconSize.lg} />;
    }
  };

  return (
    <Card hoverEffect className="p-5 flex flex-col h-full group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
          {getToolIcon()}
        </div>
        <Badge variant="secondary" size="sm">
          {category}
        </Badge>
      </div>

      <Link href={`/tools/${slug}`} className="mb-2">
        <h3 className="text-base font-semibold leading-snug tracking-tight text-slate-900 group-hover:text-teal-700 dark:text-slate-100 dark:group-hover:text-teal-400 transition-colors">
          {name}
        </h3>
      </Link>

      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
        {description}
      </p>

      <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">Free Client Utility</span>
        <Link
          href={`/tools/${slug}`}
          className="text-xs font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
        >
          Launch Tool
          <ArrowRight size={DESIGN_TOKENS.iconSize.xs} />
        </Link>
      </div>
    </Card>
  );
}
