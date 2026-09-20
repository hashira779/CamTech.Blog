import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTransportOperator } from "@/lib/api";
import { TransportRouteCard } from "@/components/travel/TransportRouteCard";
import { Star, ShieldCheck, Phone, Mail, Globe, ArrowLeft, Bus, CheckCircle2 } from "lucide-react";

interface OperatorPageProps {
  params: Promise<{ slug: string }>;
}

export default async function OperatorDetailPage({ params }: OperatorPageProps) {
  const { slug } = await params;
  const operator = await getTransportOperator(slug);

  if (!operator) {
    notFound();
  }

  let amenities: string[] = [];
  try {
    amenities = JSON.parse(operator.amenities_json || "[]");
  } catch {
    amenities = [];
  }

  const routes = operator.routes || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/travel" className="hover:text-primary transition-colors">Travel</Link>
        <span>/</span>
        <Link href="/travel/transport" className="hover:text-primary transition-colors">Transport</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{operator.name}</span>
      </nav>

      {/* Back Link */}
      <Link
        href="/travel/transport"
        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Transport Directory
      </Link>

      {/* Operator Header Banner */}
      <div className="bg-card border rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-3xl">
              {operator.operator_type === "MINIVAN" ? "🚐" : operator.operator_type === "TRAIN" ? "🚆" : operator.operator_type === "FERRY" ? "⛴️" : "🚌"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold">{operator.name}</h1>
                {operator.verification_status === "VERIFIED" && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Operator
                  </span>
                )}
              </div>
              {operator.local_name && (
                <p className="text-sm text-muted-foreground font-khmer mt-0.5">{operator.local_name}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                <span className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-amber-500" /> {operator.rating.toFixed(1)}
                </span>
                <span>•</span>
                <span>{operator.review_count} verified traveler ratings</span>
                <span>•</span>
                <span className="uppercase tracking-wider font-semibold text-[11px] bg-muted px-2 py-0.5 rounded">
                  {operator.operator_type}
                </span>
              </div>
            </div>
          </div>

          {operator.website && (
            <a
              href={operator.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm shrink-0"
            >
              <Globe className="w-4 h-4" /> Official Website
            </a>
          )}
        </div>

        {/* Description */}
        <div className="py-6 border-b">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Company Overview & Fleet Standards
          </h2>
          <p className="text-sm leading-relaxed text-foreground mb-3">{operator.description}</p>
          {operator.description_km && (
            <p className="text-sm leading-relaxed text-muted-foreground font-khmer">{operator.description_km}</p>
          )}
        </div>

        {/* Fleet Amenities */}
        {amenities.length > 0 && (
          <div className="py-6 border-b">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Onboard Amenities & Standards
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {amenities.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-xs bg-muted/40 p-2.5 rounded-lg border">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="font-medium">{a}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact info */}
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {operator.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4 text-primary" />
              <span>Customer Booking Line: <strong>{operator.phone}</strong></span>
            </div>
          )}
          {operator.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4 text-primary" />
              <span>Support Email: <strong>{operator.email}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Active Routes Section */}
      <div className="mb-8">
        <h2 className="text-xl font-extrabold mb-2">
          Scheduled Routes & Daily Timetables ({routes.length})
        </h2>
        <p className="text-xs text-muted-foreground mb-6">
          Official departure times, estimated highway durations, and verified ticket pricing.
        </p>

        {routes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {routes.map((route) => (
              <TransportRouteCard key={route.id} route={{ ...route, operator }} />
            ))}
          </div>
        ) : (
          <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground">
            No active scheduled routes published for this operator.
          </div>
        )}
      </div>
    </div>
  );
}
