import Link from "next/link";
import {
  ArrowUpRight,
  Calculator,
  Code2,
  FileText,
  Image as ImageIcon,
  QrCode,
  Video,
  Wrench,
  Sparkles,
  Zap,
} from "lucide-react";

export interface ToolCardProps {
  slug: string;
  name: string;
  category: string;
  description: string;
  iconName?: string;
  usageCount?: number;
  popular?: boolean;
}

export function ToolCard({
  slug,
  name,
  category,
  description,
  popular,
}: ToolCardProps) {
  const isVideo = slug.includes("video") || slug.includes("downloader");
  const isQr = slug.includes("qr") || slug.includes("khqr");
  const isCalc = category.toLowerCase().includes("calculat") || slug.includes("tax") || slug.includes("salary");
  const isDev = category.toLowerCase().includes("develop") || slug.includes("isp");
  const isText = category.toLowerCase().includes("text");

  const Icon = isQr
    ? QrCode
    : isVideo
    ? Video
    : isCalc
    ? Calculator
    : isDev
    ? Code2
    : isText
    ? FileText
    : category.toLowerCase().includes("image")
    ? ImageIcon
    : Wrench;

  // Nuxt-grade distinctive category color pods
  const podColor = isVideo
    ? "from-amber-500/20 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
    : isQr
    ? "from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
    : isCalc
    ? "from-blue-500/20 to-cyan-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
    : isDev
    ? "from-purple-500/20 to-violet-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
    : "from-accent/20 to-accent/10 text-accent border-accent/30";

  const label = isVideo
    ? "Media & Video"
    : isQr
    ? "Payment & QR"
    : category.toLowerCase() === "image"
    ? "Image & Media"
    : category.toLowerCase();

  return (
    <Link
      href={`/tools/${slug}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:bg-surface-elevated hover:shadow-lg dark:hover:border-emerald-500/40"
    >
      {/* Subtle top-edge light reflection */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div>
        {/* Top Header: Icon Pod + Monospace Category Badge */}
        <div className="flex items-center justify-between gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br shadow-2xs transition-transform duration-300 group-hover:scale-110 ${podColor}`}
          >
            <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
          </span>

          <div className="flex items-center gap-1.5">
            {(popular || isVideo || isQr) && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <Sparkles size={10} />
                <span>Popular</span>
              </span>
            )}
            <span className="rounded-full border border-border/60 bg-surface-muted/90 px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-4 text-base font-bold leading-snug tracking-tight text-foreground transition-colors duration-200 group-hover:text-accent sm:text-lg">
          {name}
        </h3>

        {/* Description */}
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      {/* Card Footer: Launch Action Button */}
      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3.5 text-xs font-semibold text-accent transition-colors group-hover:text-accent">
        <span className="inline-flex items-center gap-1">
          <Zap size={13} className="opacity-70 group-hover:opacity-100" />
          <span>Launch tool</span>
        </span>
        <ArrowUpRight
          size={16}
          aria-hidden="true"
          className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      </div>
    </Link>
  );
}
