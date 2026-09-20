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
  ShieldCheck,
  Star,
  Compass,
  ArrowRight,
  ExternalLink,
  Wifi,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Share2
} from "lucide-react";
import { getPlaceBySlug, getPlaces } from "@/lib/api";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);
  if (!place) return { title: "Place Not Found" };

  return {
    title: `${place.name} | Verified Travel Guide | Daily Discovery`,
    description: place.description.slice(0, 160),
  };
}

export default async function PlaceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);

  if (!place) {
    notFound();
  }

  const isHotel = place.place_type === "ACCOMMODATION";
  const hotel = place.accommodation;

  let amenities: string[] = [];
  try {
    amenities = JSON.parse(place.amenities_json || "[]");
  } catch (e) {}

  let tags: string[] = [];
  try {
    tags = JSON.parse(place.tags_json || "[]");
  } catch (e) {}

  let gallery: string[] = [];
  try {
    gallery = JSON.parse(place.gallery_json || "[]");
  } catch (e) {}

  // Related places in same destination
  const relatedData = await getPlaces({
    destination: place.destination?.slug,
    limit: 4,
  });
  const relatedPlaces = relatedData.items.filter((p) => p.id !== place.id).slice(0, 3);

  return (
    <div className="min-h-screen pb-24">
      {/* 1. Header Banner */}
      <section className="relative overflow-hidden bg-neutral-950 text-white py-14 lg:py-20">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 filter blur-[2px] scale-105"
          style={{
            backgroundImage: `url('${place.hero_image_url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80"}')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 mb-4 uppercase tracking-wider">
            <Link href="/travel" className="hover:underline">
              Travel
            </Link>
            <span>/</span>
            {place.destination && (
              <>
                <Link href={`/travel/${place.destination.slug}`} className="hover:underline">
                  {place.destination.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span>{place.place_type}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-600/90 text-white text-[11px] font-extrabold uppercase tracking-wider">
                  {place.place_type}
                </span>
                <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="h-3.5 w-3.5" /> {place.verification_status}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                {place.name}
              </h1>
              {place.local_name && (
                <p className="text-xl sm:text-2xl font-bold text-neutral-400 mt-1">
                  {place.local_name}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-neutral-300">
                <div className="flex items-center gap-1 font-bold text-white">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span>{place.rating.toFixed(1)}</span>
                  <span className="text-neutral-400 font-normal">
                    ({place.review_count} verified reviews)
                  </span>
                </div>
                <span>•</span>
                <span>Price: <strong className="text-white">{place.price_level}</strong></span>
                {place.address && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-neutral-300">
                      <MapPin className="h-3.5 w-3.5 text-rose-400" /> {place.address}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/travel/suggest?place_name=${encodeURIComponent(place.name)}&destination_slug=${place.destination?.slug || "siem-reap"}`}
                className="px-4 py-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-semibold transition-colors"
              >
                Suggest Update / Report Closed
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left / Main Details */}
          <div className="lg:col-span-2 space-y-10">
            {/* Hero Image */}
            <div className="rounded-3xl overflow-hidden shadow-sm border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 aspect-[16/10]">
              <img
                src={place.hero_image_url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"}
                alt={place.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Description */}
            <section className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
                About {place.name}
              </h2>
              <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 space-y-4">
                <p>{place.description}</p>
                {place.description_km && (
                  <div className="mt-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700/50">
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block mb-1">
                      ការពិពណ៌នាជាភាសាខ្មែរ
                    </span>
                    <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
                      {place.description_km}
                    </p>
                  </div>
                )}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap gap-2">
                  {tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Specialized Accommodation Details (Hotels) */}
            {isHotel && hotel && (
              <section className="bg-gradient-to-br from-indigo-950 to-neutral-900 text-white rounded-3xl p-6 sm:p-8 border border-indigo-900/50 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
                      Accommodations & Amenities
                    </span>
                    <h3 className="text-2xl font-bold mt-1">
                      {hotel.star_rating}★ {hotel.property_type.replace("_", " ")}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-neutral-400">Typical Rates</span>
                    <p className="text-lg font-bold text-amber-300">{hotel.price_range}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-indigo-900/60 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${hotel.has_swimming_pool ? "text-emerald-400" : "text-neutral-500"}`} />
                    <span>Swimming Pool: {hotel.has_swimming_pool ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className={`h-4 w-4 ${hotel.has_free_wifi ? "text-emerald-400" : "text-neutral-500"}`} />
                    <span>High-Speed WiFi: {hotel.has_free_wifi ? "Free" : "Paid"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coffee className={`h-4 w-4 ${hotel.has_breakfast ? "text-emerald-400" : "text-neutral-500"}`} />
                    <span>Breakfast: {hotel.has_breakfast ? "Included" : "Available"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-300" />
                    <span>Check-in: {hotel.check_in_time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-300" />
                    <span>Check-out: {hotel.check_out_time}</span>
                  </div>
                </div>

                {hotel.booking_url && (
                  <div className="mt-8">
                    <a
                      href={hotel.booking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md transition-all"
                    >
                      Visit Official Booking Portal <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </section>
            )}

            {/* Gallery */}
            {gallery.length > 0 && (
              <section className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                  Visual Gallery
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {gallery.map((img, idx) => (
                    <div key={idx} className="rounded-2xl overflow-hidden aspect-[4/3] bg-neutral-100 dark:bg-neutral-800">
                      <img src={img} alt={`${place.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Sidebar: Coordinates, Hours, Contact, Verification */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-3">
                Key Information
              </h3>

              {place.opening_hours && (
                <div className="flex items-start gap-3 text-xs text-neutral-700 dark:text-neutral-300">
                  <Clock className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-neutral-900 dark:text-white">Opening Hours</strong>
                    <span>{place.opening_hours}</span>
                  </div>
                </div>
              )}

              {place.address && (
                <div className="flex items-start gap-3 text-xs text-neutral-700 dark:text-neutral-300">
                  <MapPin className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-neutral-900 dark:text-white">Location & Address</strong>
                    <span>{place.address}</span>
                  </div>
                </div>
              )}

              {place.latitude && place.longitude && (
                <div className="flex items-start gap-3 text-xs text-neutral-700 dark:text-neutral-300">
                  <Compass className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-neutral-900 dark:text-white">GPS Coordinates</strong>
                    <span className="font-mono text-[11px]">{place.latitude}°N, {place.longitude}°E</span>
                  </div>
                </div>
              )}

              {place.phone && (
                <div className="flex items-start gap-3 text-xs text-neutral-700 dark:text-neutral-300">
                  <Phone className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-neutral-900 dark:text-white">Direct Phone</strong>
                    <a href={`tel:${place.phone}`} className="text-rose-600 hover:underline">
                      {place.phone}
                    </a>
                  </div>
                </div>
              )}

              {place.website && (
                <div className="flex items-start gap-3 text-xs text-neutral-700 dark:text-neutral-300">
                  <Globe className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-neutral-900 dark:text-white">Official Website</strong>
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-600 hover:underline truncate block max-w-[200px]"
                    >
                      {place.website}
                    </a>
                  </div>
                </div>
              )}

              {/* Amenities */}
              {amenities.length > 0 && (
                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <strong className="block text-xs font-bold text-neutral-900 dark:text-white mb-2">
                    Features & Highlights
                  </strong>
                  <ul className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-300">
                    {amenities.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Non-Destructive Status Badge */}
              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 flex items-center justify-between">
                <span>Record Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  {place.status}
                </span>
              </div>
            </div>

            {/* Related Places in this Destination */}
            {relatedPlaces.length > 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4">
                  More in {place.destination?.name || "Siem Reap"}
                </h3>
                <div className="space-y-4">
                  {relatedPlaces.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/travel/place/${rel.slug}`}
                      className="group flex items-center gap-3"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0">
                        <img
                          src={rel.hero_image_url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=200&q=80"}
                          alt={rel.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate group-hover:text-rose-600 transition-colors">
                          {rel.name}
                        </h4>
                        <span className="text-[11px] text-neutral-500 block mt-0.5">
                          {rel.place_type} • {rel.price_level}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
