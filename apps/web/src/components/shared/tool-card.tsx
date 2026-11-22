import Link from "next/link";
import { ArrowUpRight, Calculator, Code2, FileText, Image as ImageIcon, QrCode, Video, Wrench } from "lucide-react";

export interface ToolCardProps {
  slug: string;
  name: string;
  category: string;
  description: string;
  iconName?: string;
  usageCount?: number;
  popular?: boolean;
}

export function ToolCard({ slug, name, category, description }: ToolCardProps) {
  const Icon = slug.includes("qr") ? QrCode
    : slug.includes("video") || slug.includes("downloader") ? Video
    : category.toLowerCase().includes("calculat") ? Calculator
    : category.toLowerCase().includes("develop") ? Code2
    : category.toLowerCase().includes("image") ? ImageIcon
    : category.toLowerCase().includes("text") ? FileText : Wrench;
  const label = category.toLowerCase() === "image" ? "Image & media" : category.toLowerCase();
  return (
    <Link href={`/tools/${slug}`} className="field-tool-card group">
      <div className="field-tool-card-top"><span><Icon size={21} strokeWidth={1.5} aria-hidden="true" /></span><small>{label}</small></div>
      <h3>{name}</h3>
      <p>{description}</p>
      <span className="field-tool-card-bottom">Open tool <ArrowUpRight size={16} aria-hidden="true" /></span>
    </Link>
  );
}
