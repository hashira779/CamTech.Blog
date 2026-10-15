import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getTransportOperator } from "@/lib/api";
import { TransportRouteCard } from "@/components/travel/TransportRouteCard";
import { Container } from "@/components/ui/container";
import { CategoryMark } from "@/components/ui/category-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetaDot } from "@/components/ui/byline";
import { Photo } from "@/components/ui/photo";
import { cleanText, formatDate } from "@/lib/format";

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
  const checked = formatDate(operator.last_verified_at, "medium");
  const isVerified = operator.verification_status === "VERIFIED";

  return (
    <div className="flex w-full flex-1 flex-col">
      <Container className="pt-6 sm:pt-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <MetaDot />
          <Link href="/travel" className="transition-colors hover:text-foreground">
            Travel
          </Link>
          <MetaDot />
          <Link href="/travel/transport" className="transition-colors hover:text-foreground">
            Transport
          </Link>
          <MetaDot />
          <span className="text-foreground">{cleanText(operator.name)}</span>
        </nav>
      </Container>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <Container className="pt-8 pb-10 sm:pt-12">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <CategoryMark category="transport" tone="dot">
              {operator.operator_type?.toLowerCase().replace(/_/g, " ") || "Transport operator"}
            </CategoryMark>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-4xl leading-[1.08] tracking-tight text-foreground sm:text-5xl">
                {cleanText(operator.name)}
              </h1>
              {isVerified && <Badge variant="success">Verified record</Badge>}
            </div>

            {operator.local_name && <p className="mt-2 text-lg text-muted-foreground">{operator.local_name}</p>}

            {operator.description && (
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {cleanText(operator.description)}
              </p>
            )}

            {operator.description_km && (
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
                {operator.description_km}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {operator.website && (
                <Button variant="outline" asChild>
                  <a href={operator.website} target="_blank" rel="noopener noreferrer nofollow">
                    Operator website
                    <ExternalLink size={15} aria-hidden="true" />
                  </a>
                </Button>
              )}
              <Link
                href="/travel/transport"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft size={15} aria-hidden="true" />
                All transport routes
              </Link>
            </div>
          </div>

          <aside className="lg:col-span-5">
            {operator.logo_url ? (
              <Photo
                src={operator.logo_url}
                alt={cleanText(operator.name)}
                ratio="4/3"
                radius="lg"
                placeholderLabel="No operator image on record"
              />
            ) : null}

            <dl className="divide-y divide-border border-y border-border text-sm">
              {operator.phone && (
                <div className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="section-label">Booking line</dt>
                  <dd className="text-right font-medium tabular-nums text-foreground">
                    <a href={`tel:${operator.phone}`} className="transition-colors hover:text-accent">
                      {operator.phone}
                    </a>
                  </dd>
                </div>
              )}
              {operator.email && (
                <div className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="section-label">Email</dt>
                  <dd className="text-right">
                    <a
                      href={`mailto:${operator.email}`}
                      className="break-all font-medium text-foreground transition-colors hover:text-accent"
                    >
                      {operator.email}
                    </a>
                  </dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-4 py-3">
                <dt className="section-label">Routes on record</dt>
                <dd className="tabular-nums text-foreground">{routes.length}</dd>
              </div>
              {checked && (
                <div className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="section-label">Record checked</dt>
                  <dd className="tabular-nums text-foreground">{checked}</dd>
                </div>
              )}
            </dl>

            {amenities.length > 0 && (
              <div className="mt-6">
                <p className="section-label text-accent">Onboard</p>
                <ul className="mt-2 divide-y divide-border text-sm text-muted-foreground">
                  {amenities.map((a) => (
                    <li key={a} className="py-2">
                      {cleanText(a)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </Container>

      {/* ── Routes ───────────────────────────────────────────────────────── */}
      <Container as="section" className="border-t border-border py-10 sm:py-14">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl leading-tight tracking-tight text-foreground">Scheduled routes</h2>
          <p className="text-xs text-muted-foreground">
            {routes.length > 0
              ? `${routes.length} route${routes.length === 1 ? "" : "s"} held by CamTech.Blog`
              : "No routes published"}
          </p>
        </div>

        {routes.length > 0 ? (
          <div className="divide-y divide-border">
            {routes.map((route) => (
              <TransportRouteCard key={route.id} route={{ ...route, operator }} />
            ))}
          </div>
        ) : (
          <p className="py-10 text-sm leading-relaxed text-muted-foreground">
            This operator has no scheduled routes in the registry yet. Contact details above are the ones
            we hold on record.
          </p>
        )}
      </Container>
    </div>
  );
}
