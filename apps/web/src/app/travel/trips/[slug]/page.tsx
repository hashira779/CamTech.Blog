import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { getTripBySlug } from "@/lib/api";
import { Container } from "@/components/ui/container";
import { Photo } from "@/components/ui/photo";
import { CategoryMark } from "@/components/ui/category-mark";
import { MetaDot } from "@/components/ui/byline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cleanText } from "@/lib/format";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getTripBySlug(slug);
  if (!trip) return { title: "Itinerary Not Found" };

  return {
    title: trip.title,
    description: trip.description.slice(0, 160),
  };
}

/** "90 min" → "1h 30m"; nothing when the item carries no duration. */
function duration(minutes?: number): string {
  if (!minutes || minutes <= 0) return "";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default async function TripDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const trip = await getTripBySlug(slug);

  if (!trip) {
    notFound();
  }

  const days = trip.days || [];
  const destinationSlug = trip.destination?.slug;
  const plannerHref = destinationSlug ? `/travel/planner?destination=${destinationSlug}&duration=${trip.duration_days}` : "/travel/planner";

  return (
    <div className="flex w-full flex-1 flex-col">
      {/* ── Headline ─────────────────────────────────────────────────────── */}
      <Container className="pt-6 sm:pt-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <Link href="/travel" className="transition-colors hover:text-foreground">
            Travel
          </Link>
          <MetaDot />
          {trip.destination?.name && (
            <>
              <Link href={`/travel/${trip.destination.slug}`} className="transition-colors hover:text-foreground">
                {cleanText(trip.destination.name)}
              </Link>
              <MetaDot />
            </>
          )}
          <span className="text-foreground">Itinerary</span>
        </nav>
      </Container>

      <Container className="pt-8 pb-8 sm:pt-12">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <CategoryMark category="travel" tone="dot">
              {trip.duration_days}-day itinerary
            </CategoryMark>

            <h1 className="mt-4 font-display text-4xl leading-[1.08] tracking-tight text-foreground sm:text-5xl">
              {cleanText(trip.title)}
            </h1>

            {trip.title_km && <p className="mt-3 text-lg text-muted-foreground">{trip.title_km}</p>}

            {trip.description && (
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {cleanText(trip.description)}
              </p>
            )}

            {trip.description_km && (
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">{trip.description_km}</p>
            )}
          </div>

          {/* What the record carries, nothing more */}
          <dl className="divide-y divide-border self-start border-y border-border text-sm lg:col-span-5">
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="section-label">Style</dt>
              <dd className="text-foreground">{cleanText(trip.travel_style) || "—"}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="section-label">Budget level</dt>
              <dd className="text-foreground">{cleanText(trip.budget_level) || "—"}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="section-label">Days</dt>
              <dd className="tabular-nums text-foreground">{trip.duration_days}</dd>
            </div>
            {trip.destination?.name && (
              <div className="flex items-baseline justify-between gap-4 py-3">
                <dt className="section-label">Destination</dt>
                <dd className="text-foreground">
                  <Link href={`/travel/${trip.destination.slug}`} className="transition-colors hover:text-accent">
                    {cleanText(trip.destination.name)}
                  </Link>
                </dd>
              </div>
            )}
            {trip.is_curated && (
              <div className="flex items-baseline justify-between gap-4 py-3">
                <dt className="section-label">Editorial</dt>
                <dd>
                  <Badge variant="secondary" size="sm">
                    Curated route
                  </Badge>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </Container>

      {/* ── Photograph ───────────────────────────────────────────────────── */}
      <Container className="pb-10">
        <Photo
          src={trip.hero_image_url}
          alt={cleanText(trip.title)}
          ratio="16/9"
          radius="hero"
          priority
          placeholderLabel="No verified photograph for this itinerary yet"
        />
      </Container>

      {/* ── Day by day ───────────────────────────────────────────────────── */}
      <Container width="reading" as="section" className="pb-14">
        <div className="flex items-baseline gap-4">
          <span className="section-label shrink-0 text-accent">Day by day</span>
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
        </div>

        {days.length === 0 ? (
          <p className="py-10 text-sm leading-relaxed text-muted-foreground">
            The hour-by-hour plan for this itinerary has not been published yet.
          </p>
        ) : (
          <div className="mt-8 space-y-12">
            {days.map((day) => (
              <section key={day.id}>
                <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-3">
                  <h2 className="font-display text-2xl leading-tight tracking-tight text-foreground">
                    Day {day.day_number}
                  </h2>
                  {day.title && <p className="text-base text-muted-foreground">{cleanText(day.title)}</p>}
                </header>

                {day.summary && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{cleanText(day.summary)}</p>
                )}

                {(day.items || []).length === 0 ? (
                  <p className="py-5 text-sm text-muted-foreground">
                    No steps published for this day yet.
                  </p>
                ) : (
                  <ol className="divide-y divide-border">
                    {(day.items || []).map((item) => {
                      const time = duration(item.duration_minutes);
                      return (
                        <li key={item.id} className="grid gap-2 py-5 sm:grid-cols-12 sm:gap-4">
                          <div className="sm:col-span-3">
                            {item.start_time ? (
                              <p className="text-sm font-medium tabular-nums text-foreground">{item.start_time}</p>
                            ) : (
                              <p className="text-sm text-muted-foreground">Time not set</p>
                            )}
                            <p className="section-label mt-1">
                              {item.time_of_day?.toLowerCase().replace(/_/g, " ") || "part of day"}
                            </p>
                            {time && <p className="mt-1 text-xs tabular-nums text-muted-foreground">about {time}</p>}
                          </div>

                          <div className="sm:col-span-9">
                            <h3 className="text-base font-semibold leading-snug text-foreground">
                              {cleanText(item.title)}
                            </h3>
                            {item.description && (
                              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                {cleanText(item.description)}
                              </p>
                            )}
                            {item.place && (
                              <Link
                                href={`/travel/place/${item.place.slug}`}
                                className="group mt-2.5 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-foreground"
                              >
                                <MapPin size={14} aria-hidden="true" />
                                {cleanText(item.place.name)}
                                <ArrowRight
                                  size={14}
                                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                                  aria-hidden="true"
                                />
                              </Link>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>
            ))}
          </div>
        )}

        <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-border pt-6">
          <Button variant="accent" asChild>
            <Link href={plannerHref}>Plan your own version</Link>
          </Button>
          <Link
            href="/travel"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            More itineraries
          </Link>
        </div>
      </Container>
    </div>
  );
}
