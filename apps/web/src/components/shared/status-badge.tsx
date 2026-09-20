import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertTriangle, Archive, XCircle, ShieldCheck } from "lucide-react";
import { DESIGN_TOKENS } from "@/lib/tokens";

export type EntityStatus =
  | "verified"
  | "unverified"
  | "needs_review"
  | "pending"
  | "active"
  | "closed"
  | "temporarily_closed"
  | "archived"
  | "merged"
  | "published"
  | "draft";

export interface StatusBadgeProps {
  status: EntityStatus | string;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export function StatusBadge({ status, size = "sm", showIcon = true }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  switch (normalized) {
    case "verified":
      return (
        <Badge variant="success" size={size}>
          {showIcon && <ShieldCheck size={DESIGN_TOKENS.iconSize.xs} className="text-emerald-600 dark:text-emerald-400" />}
          Verified
        </Badge>
      );
    case "active":
    case "published":
      return (
        <Badge variant="success" size={size}>
          {showIcon && <CheckCircle2 size={DESIGN_TOKENS.iconSize.xs} />}
          {normalized === "active" ? "Active" : "Published"}
        </Badge>
      );
    case "pending":
    case "draft":
      return (
        <Badge variant="secondary" size={size}>
          {showIcon && <Clock size={DESIGN_TOKENS.iconSize.xs} />}
          {normalized === "draft" ? "Draft" : "Pending"}
        </Badge>
      );
    case "needs_review":
    case "unverified":
      return (
        <Badge variant="warning" size={size}>
          {showIcon && <AlertTriangle size={DESIGN_TOKENS.iconSize.xs} />}
          {normalized === "unverified" ? "Unverified" : "Needs Review"}
        </Badge>
      );
    case "closed":
    case "temporarily_closed":
      return (
        <Badge variant="destructive" size={size}>
          {showIcon && <XCircle size={DESIGN_TOKENS.iconSize.xs} />}
          {normalized === "temporarily_closed" ? "Temp Closed" : "Closed"}
        </Badge>
      );
    case "archived":
    case "merged":
      return (
        <Badge variant="outline" size={size}>
          {showIcon && <Archive size={DESIGN_TOKENS.iconSize.xs} />}
          {normalized === "merged" ? "Merged" : "Archived"}
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" size={size}>
          {status}
        </Badge>
      );
  }
}
