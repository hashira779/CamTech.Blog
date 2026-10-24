import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import {
  MapPin,
  Clock,
  Phone,
  Globe,
  Mail,
  Compass,
  ExternalLink,
  Check,
  X,
  Landmark,
  ArrowRight,
  CalendarClock,
  Navigation,
} from "lucide-react";
import { getPlaceBySlug, getPlaces } from "@/lib/api";
import PlaceImage from "@/components/travel/place-image";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { CategoryMark } from "@/components/ui/category-mark";
import { StatusBadge } from "@/components/shared/status-badge";
import { Photo } from "@/components/ui/photo";
import { PhotoFill } from "@/components/ui/photo-image";
import { Reveal } from "@/components/ui/reveal";
import { cleanText, humanize } from "@/lib/format";
import { nearestTo, toCoord } from "@/lib/travel/itinerary";
import { isProvinceStandIn } from "@/lib/travel/photo";
import { AddToTripButton } from "@/components/travel/trip/AddToTripButton";
import { JsonLd } from "@/components/JsonLd";
import { generateBreadcrumbJsonLd, SITE_URL } from "@/lib/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);
  if (!place) return { title: "Place Not Found" };

  const description = cleanText(place.description || "").slice(0, 160);
  return {
    title: `${place.name} | Travel Guide`,
    description,
    alternates: { canonical: `/travel/place/${place.slug}` },
    openGraph: {
      type: "website",
      url: `/travel/place/${place.slug}`,
      title: place.name,
      description,
      ...(place.hero_image_url && !isProvinceStandIn(place.hero_image_url) ? { images: [{ url: place.hero_image_url, alt: place.name }] } : {}),
    },
  };
}

function parseJsonArray(value?: string | null): string[] {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string" && v.trim()) : [];
  } catch {
    return [];
  }
}

/** One labelled fact: the real value when the record carries it, an honest blank when it does not. */
function FactRow({
  icon: Icon,
  label,
  children,
  absent,
}: {
  icon: typeof MapPin;
  label: string;
  children?: React.ReactNode;
  absent?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3.5">
      <Icon size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-border-strong" />
      <div className="min-w-0 flex-1">
        <p className="section-label">{label}</p>
        {children ? (
          <div className="mt-1 text-sm leading-relaxed text-foreground">{children}</div>
        ) : (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {absent || "Not recorded yet"}
          </p>
        )}
      </div>
    </div>
  );
}

function AmenityRow({ label, present }: { label: string; present: boolean }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="text-foreground/90">{label}</span>
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
          present ? "text-success" : "text-muted-foreground"
        }`}
      >
        {present ? <Check size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
        {present ? "Recorded" : "Not recorded"}
      </span>
    </li>
  );
}

/**
 * A single place.
 *
 * The photograph gallery is the first thing on the page, and the seeded `rating` / `review_count`
 * columns are gone: they read as reader feedback ("4.9 — 2,840 verified reviews") when nothing in the
 * record supports it. Galleries here only hold images verified to depict this place, so an empty one
 * is a normal state and gets a deliberate, quiet treatment rather than a stock substitute. Every
 * field in the fact list — address, hours, phone, website, price, coordinates — shows its real value
 * or says plainly that the record has none.
 */
export default async function PlaceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);

  if (!place) {
    notFound();
  }

  const isHotel = place.place_type === "ACCOMMODATION";
  const hotel = place.accommodation;

  const amenities = parseJsonArray(place.amenities_json);
  const tags = parseJsonArray(place.tags_json);

  const gallery = parseJsonArray(place.gallery_json);
  // The hero is usually the first gallery frame; count each URL once.
  // A province cover used as this row's hero is not a photograph of the place (see lib/travel/photo).
  const images = Array.from(new Set([place.hero_image_url, ...gallery].filter(Boolean) as string[])).filter(
    (src) => !isProvinceStandIn(src)
  );
  const [lead, ...rest] = images;

  // Other places in the same province. With coordinates on both sides they are ordered by
  // straight-line distance (and labelled so); otherwise in the order the directory returns them.
  const relatedData = await getPlaces({
    destination: place.destination?.slug,
    limit: 100,
  });
  const others = relatedData.items.filter((p) => p.id !== place.id && p.place_type !== "ACCOMMODATION");
  const origin = toCoord(place);
  const nearby = origin ? nearestTo(place, others, 4) : [];
  const relatedPlaces = nearby.length > 0 ? nearby.map((n) => n.place as (typeof others)[number]) : others.slice(0, 3);
  const distanceBySlug = new Map(nearby.map((n) => [n.place.slug, n.km]));
  const isVisit = !["ACCOMMODATION", "RESTAURANT", "CAFE"].includes(place.place_type);
  const updated = place.updated_at ? new Date(place.updated_at) : null;

  const destinationName = place.destination?.name || null;
  const destinationSlug = place.destination?.slug || null;

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(
    [
      { name: "Home", url: "/" },
      { name: "Travel", url: "/travel" },
      ...(destinationSlug && destinationName ? [{ name: destinationName, url: `/travel/${destinationSlug}` }] : []),
      { name: place.name, url: `/travel/place/${place.slug}` },
    ],
    SITE_URL
  );
  // Only for places to visit, and only with fields the record carries — no ratings or reviews.
  const placeJsonLd = isVisit
    ? {
        "@context": "https://schema.org",
        "@type": "TouristAttraction",
        name: place.name,
        ...(place.local_name ? { alternateName: place.local_name } : {}),
        description: cleanText(place.description || "").slice(0, 300),
        url: `${SITE_URL}/travel/place/${place.slug}`,
        ...(lead ? { image: lead.startsWith("/") ? `${SITE_URL}${lead}` : lead } : {}),
        ...(origin ? { geo: { "@type": "GeoCoordinates", latitude: origin[0], longitude: origin[1] } } : {}),
        ...(place.address ? { address: cleanText(place.address) } : {}),
        ...(destinationName ? { containedInPlace: { "@type": "AdministrativeArea", name: `${destinationName}, Cambodia` } } : {}),
      }
    : null;

  return (
    <div className="flex w-full flex-1 flex-col">
      <JsonLd data={breadcrumbJsonLd} />
      {placeJsonLd && <JsonLd data={placeJsonLd} />}
      {/* ── 1. Masthead: what this place is, no photograph required ─────────── */}
      <Section className="border-b border-border pb-8 pt-8 sm:pb-10 sm:pt-10">
        <Container>
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <li>
                <Link href="/travel" className="transition-colors hover:text-accent">
                  Travel
                </Link>
              </li>
              {destinationSlug && destinationName && (
                <>
                  <li aria-hidden="true">/</li>
                  <li>
                    <Link
                      href={`/travel/${destinationSlug}`}
                      className="transition-colors hover:text-accent"
                    >
                      {destinationName}
                    </Link>
                  </li>
                </>
              )}
              <li aria-hidden="true">/</li>
              <li className="font-medium text-foreground">{humanize(place.place_type)}</li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <CategoryMark category="travel" tone="dot">
              {humanize(place.place_type)}
            </CategoryMark>
            <StatusBadge status={place.verification_status} size="sm" />
          </div>

          <h1 className="mt-4 max-w-4xl font-display text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            {place.name}
          </h1>
          {place.local_name && (
            <p className="mt-2 text-lg text-muted-foreground">{place.local_name}</p>
          )}

          {place.description && (
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-foreground/90">
              {cleanText(place.description)}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="tabular-nums">
              {images.length > 0
                ? `${images.length} verified photograph${images.length === 1 ? "" : "s"}`
                : "No verified photograph yet"}
            </span>
            <span aria-hidden="true">·</span>
            <span>Status: {humanize(place.status.toLowerCase())}</span>
            {destinationName && (
              <>
                <span aria-hidden="true">·</span>
                <span>{destinationName}</span>
              </>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {isVisit && (
              <AddToTripButton
                variant="solid"
                place={{ slug: place.slug, name: place.name, destination_slug: destinationSlug, hero_image_url: place.hero_image_url ?? null }}
              />
            )}
            {origin && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${origin[0]},${origin[1]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-xs font-semibold text-foreground hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Navigation size={14} aria-hidden="true" />
                Directions (Google Maps)
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            )}
            {destinationSlug && (
              <Link
                href={`/travel/planner?destination=${destinationSlug}`}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-xs font-semibold text-accent hover:text-foreground"
              >
                Plan a trip in {destinationName ?? "this province"}
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            )}
          </div>
        </Container>
      </Section>

      {/* ── 2. The gallery comes first ─────────────────────────────────────── */}
      <Section className="pb-0 pt-8 sm:pt-10">
        <Container>
          <SectionHeader
            label="Photographs"
            title={images.length > 0 ? `${place.name}, as photographed` : "Nothing to show yet"}
            description="Galleries on this site hold only images verified to depict the place itself. An empty gallery is a real state, not a loading problem — and it is never padded with a stock picture."
          />

          {images.length === 0 ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs sm:rounded-3xl">
              <div className="aspect-[16/9] w-full">
                <PlaceImage
                  src={null}
                  alt={place.name}
                  className="h-full w-full bg-surface-muted"
                />
              </div>
              <div className="flex flex-col gap-3 border-t border-border p-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                  No image of {place.name} has been matched to this record yet. Descriptions, address
                  and coordinates below are still what the directory holds.
                </p>
                <Link
                  href={`/travel/suggest?place_name=${encodeURIComponent(place.name)}`}
                  className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-foreground"
                >
                  Contribute a photo
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>
          ) : (
            <figure>
              <Photo
                src={lead}
                alt={place.name}
                ratio="16/9"
                radius="hero"
                priority
                showCredit={false}
                placeholderLabel="Photo not verified yet"
              />

              {rest.length > 0 && (
                <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-1">
                  {rest.map((img, idx) => (
                    <a
                      key={`${img}-${idx}`}
                      href={img}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open verified photograph ${idx + 2} of ${images.length}`}
                      className="group block w-32 shrink-0 overflow-hidden rounded-md border border-border bg-card transition-colors hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-40"
                    >
                      <span className="block aspect-[4/3] bg-surface-muted">
                        <PhotoFill
                          src={img}
                          alt={`${place.name} — verified photograph ${idx + 2}`}
                          compact
                          className="photo-zoom h-full w-full object-cover"
                        />
                      </span>
                    </a>
                  ))}
                </div>
              )}

              <figcaption className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {images.length} verified photograph{images.length === 1 ? "" : "s"} in this record
                </span>
                {rest.length > 0 && <span aria-hidden="true">·</span>}
                {rest.length > 0 && <span>Select a frame to open the original</span>}
              </figcaption>
            </figure>
          )}
        </Container>
      </Section>

      {/* ── 3. Body: narrative and facts ───────────────────────────────────── */}
      <Container className="py-10 sm:py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-10 lg:col-span-7">
            {place.description && (
              <section>
                <SectionHeader as="h2" label="About" title={`About ${place.name}`} />
                <p className="text-base leading-relaxed text-foreground/90">
                  {cleanText(place.description)}
                </p>

                {place.description_km && (
                  <div className="mt-5 rounded-lg border border-border bg-surface-muted/60 p-5">
                    <p className="section-label">ការពិពណ៌នាជាភាសាខ្មែរ</p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                      {place.description_km}
                    </p>
                  </div>
                )}

                {tags.length > 0 && (
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-md border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {isHotel && hotel && (
              <section className="rounded-lg border border-border bg-card p-6 shadow-xs sm:p-7">
                <p className="section-label text-accent">Accommodation</p>
                <h2 className="mt-2 font-display text-2xl leading-tight tracking-tight text-foreground">
                  {humanize(hotel.property_type)}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Classified as {hotel.star_rating}-star in the record
                </p>

                <dl className="mt-5 divide-y divide-border border-y border-border text-sm">
                  <div className="flex items-center justify-between gap-3 py-3">
                    <dt className="text-muted-foreground">Rate range as recorded</dt>
                    <dd className="text-right font-medium text-foreground">
                      {hotel.price_range ? cleanText(hotel.price_range) : "Not recorded yet"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-3">
                    <dt className="text-muted-foreground">Check-in</dt>
                    <dd className="text-right tabular-nums text-foreground">
                      {hotel.check_in_time || "Not recorded yet"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-3">
                    <dt className="text-muted-foreground">Check-out</dt>
                    <dd className="text-right tabular-nums text-foreground">
                      {hotel.check_out_time || "Not recorded yet"}
                    </dd>
                  </div>
                </dl>

                <ul className="mt-5 divide-y divide-border">
                  <AmenityRow label="Swimming pool" present={hotel.has_swimming_pool} />
                  <AmenityRow label="Free WiFi" present={hotel.has_free_wifi} />
                  <AmenityRow label="Breakfast included" present={hotel.has_breakfast} />
                </ul>

                {hotel.booking_url ? (
                  <a
                    href={hotel.booking_url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    Booking page recorded for this property
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                ) : (
                  <p className="mt-6 text-sm text-muted-foreground">
                    No booking address is recorded for this property.
                  </p>
                )}
              </section>
            )}

            {amenities.length > 0 && (
              <section>
                <SectionHeader as="h3" label="Features" title="What this listing records" />
                <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                  {amenities.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 border-b border-border py-3 text-sm text-foreground/90"
                    >
                      <Check size={14} aria-hidden="true" className="mt-1 shrink-0 text-success" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="rounded-lg border border-border bg-surface-muted/60 p-6">
              <h2 className="font-display text-lg leading-snug text-foreground">
                Know something this record does not?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Hours, prices and photos are added by editors and readers. A suggestion is reviewed
                before it changes the listing.
              </p>
              <Link
                href={`/travel/suggest?place_name=${encodeURIComponent(place.name)}${destinationSlug ? `&destination_slug=${destinationSlug}` : ""}`}
                className="group mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-foreground"
              >
                Suggest an update or report it closed
                <ArrowRight
                  size={14}
                  aria-hidden="true"
                  className="link-nudge"
                />
              </Link>
            </div>
          </div>

          {/* ── Facts: the value, or plainly nothing ─────────────────────────── */}
          <Reveal as="aside" variant="right" className="lg:col-span-5">
            <div className="rounded-lg border border-border bg-card shadow-xs">
              <h2 className="border-b border-border px-6 py-4 font-display text-lg leading-snug tracking-tight text-foreground">
                Key information
              </h2>

              <div className="divide-y divide-border px-6">
                <FactRow icon={MapPin} label="Address" absent="No address recorded yet">
                  {place.address ? cleanText(place.address) : undefined}
                </FactRow>

                <FactRow icon={Clock} label="Opening hours" absent="Hours not recorded yet">
                  {place.opening_hours ? cleanText(place.opening_hours) : undefined}
                </FactRow>

                <FactRow icon={Landmark} label="Price level" absent="Price level not recorded yet">
                  {place.price_level ? (
                    <span className="tabular-nums">{place.price_level}</span>
                  ) : undefined}
                </FactRow>

                <FactRow
                  icon={Compass}
                  label="Coordinates"
                  absent="No coordinates recorded, so this place is not on the province map"
                >
                  {typeof place.latitude === "number" && typeof place.longitude === "number" ? (
                    <span className="tabular-nums">
                      {place.latitude.toFixed(5)}°N, {place.longitude.toFixed(5)}°E
                    </span>
                  ) : undefined}
                </FactRow>

                <FactRow icon={Globe} label="Official website" absent="No website recorded yet">
                  {place.website ? (
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center gap-1 break-all text-accent underline-offset-2 hover:underline"
                    >
                      {place.website}
                      <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  ) : undefined}
                </FactRow>

                <FactRow icon={Phone} label="Phone" absent="No phone number recorded yet">
                  {place.phone ? (
                    <a
                      href={`tel:${place.phone}`}
                      className="text-accent underline-offset-2 hover:underline"
                    >
                      {place.phone}
                    </a>
                  ) : undefined}
                </FactRow>

                <FactRow icon={CalendarClock} label="Record last updated" absent="Update date not recorded">
                  {updated && !Number.isNaN(updated.getTime()) ? (
                    <span>
                      {updated.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                      <span className="block text-xs text-muted-foreground">
                        When this directory entry last changed — not a date the hours or prices were checked on site.
                      </span>
                    </span>
                  ) : undefined}
                </FactRow>

                <FactRow icon={Mail} label="Email" absent="No email address recorded yet">
                  {place.email ? (
                    <a
                      href={`mailto:${place.email}`}
                      className="break-all text-accent underline-offset-2 hover:underline"
                    >
                      {place.email}
                    </a>
                  ) : undefined}
                </FactRow>
              </div>

              {destinationSlug && destinationName && (
                <div className="border-t border-border px-6 py-4">
                  <Link
                    href={`/travel/${destinationSlug}`}
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-foreground"
                  >
                    All places in {destinationName}
                    <ArrowRight
                      size={14}
                      aria-hidden="true"
                      className="link-nudge"
                    />
                  </Link>
                </div>
              )}
            </div>
          </Reveal>
        </div>

        {/* ── 4. More places in the directory ──────────────────────────────── */}
        {relatedPlaces.length > 0 && (
          <section className="mt-14 border-t border-border pt-10">
            <SectionHeader
              label={distanceBySlug.size > 0 ? "Nearby" : "Keep reading"}
              title={destinationName ? `More in ${destinationName}` : "More places in the directory"}
              description={
                distanceBySlug.size > 0
                  ? "The closest listed places by straight-line distance — not road distance or travel time."
                  : "Listings sharing this province record, shown in the order the directory returns them."
              }
            />

            <ul className="divide-y divide-border border-y border-border">
              {relatedPlaces.map((rel, i) => (
                <Reveal as="li" key={rel.id} variant="left" index={i}>
                  <Link
                    href={`/travel/place/${rel.slug}`}
                    className="group flex items-center gap-4 py-4"
                  >
                    <span className="h-16 w-20 shrink-0 overflow-hidden rounded-md border border-border">
                      <PlaceImage
                        src={rel.hero_image_url}
                        alt={rel.name}
                        className="h-full w-full object-cover photo-zoom"
                        compact
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs uppercase tracking-[0.1em] text-category-travel">
                        {humanize(rel.place_type)}
                      </span>
                      <span className="mt-1 block text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
                        {rel.name}
                      </span>
                      {rel.local_name && (
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {rel.local_name}
                        </span>
                      )}
                    </span>
                    {distanceBySlug.has(rel.slug) && (
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {(distanceBySlug.get(rel.slug) as number).toFixed(1)} km
                      </span>
                    )}
                    <ArrowRight
                      size={15}
                      aria-hidden="true"
                      className="shrink-0 text-border-strong link-nudge group-hover:text-accent"
                    />
                  </Link>
                </Reveal>
              ))}
            </ul>
          </section>
        )}
      </Container>
    </div>
  );
}
