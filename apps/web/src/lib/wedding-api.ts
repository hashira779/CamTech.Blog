import { WeddingAuthResponse, WeddingCard, WeddingWish, WeddingResponsesList, YouTubeResolveResponse, CuratedSong } from "@/types/wedding";

const API_BASE = typeof window === "undefined"
  ? (process.env.INTERNAL_WEDDING_API_URL || "http://127.0.0.1:8002/api/v1")
  : (process.env.NEXT_PUBLIC_WEDDING_API_URL || "/api/v1");

/* Showroom sample for the /wedding landing page only. It is never served for a
   real invitation link: a slug that doesn't resolve is a 404, not this couple. */
export const DEFAULT_PREMIER_CARD: WeddingCard = {
  id: "card-sample-01",
  slug: "demo",
  theme: "romduol_golden",
  title: "សិរីសួស្តី អាពាហ៍ពិពាហ៍",
  groom_name: "ជា វិសាល",
  groom_title: "កូនប្រុសច្បង",
  groom_parents: "លោក ជា សុខុម & លោកស្រី គង់ ផល្លា",
  groom_image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
  bride_name: "សុខ សុវណ្ណារី",
  bride_title: "កូនស្រីពៅ",
  bride_parents: "លោក សុខ ចន្ថា & លោកស្រី ម៉ៅ សុភ័ក្ត្រ",
  bride_image_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
  khmer_date: "ថ្ងៃអាទិត្យ ៥កើត ខែមិគសិរ ឆ្នាំរោង ឆស័ក ព.ស. ២៥៦៩",
  solar_date: "2026-11-28",
  solar_time: "17:00",
  morning_agenda: JSON.stringify([
    { time: "07:00 ព្រឹក", title: "ពិធីហែកំណត់ / ហែជំនូន", description: "ក្បួនហែជំនូនចូលគេហដ្ឋានមាតាបិតាខាងស្រី រៀបរាប់ផ្លែឈើ និងគ្រឿងបណ្ណាការ" },
    { time: "08:30 ព្រឹក", title: "ពិធីកាត់សក់បង្កក់សិរី", description: "កាត់សក់សិរីសួស្តី ជូនពរជ័យដោយមេបា ចាស់ទុំ និងភ្ញៀវកិត្តិយស" },
    { time: "09:30 ព្រឹក", title: "ពិធីសំពះផ្ទឹម ចងដៃ និងបង្កក់សិរី", description: "ពិធីសំពះផ្ទឹមប្រពៃណីបុរាណខ្មែរ ចងអំបោះក្រហម និងបាចផ្កាស្លាជ័យ" }
  ]),
  evening_reception: JSON.stringify({
    venue: "មជ្ឈមណ្ឌលសន្និបាត និងពិព័រណ៍ ឌឹ ព្រេមៀ សេនធ័រ សែនសុខ",
    hall: "អាគារ A (Building A)",
    time: "05:00 ល្ងាច",
    address: "ផ្លូវ 1003 សង្កាត់ភ្នំពេញថ្មី ខណ្ឌសែនសុខ រាជធានីភ្នំពេញ",
    map_url: "https://maps.google.com/?q=The+Premier+Center+Sen+Sok+Phnom+Penh"
  }),
  cover_image_url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
  gallery_images: JSON.stringify([
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80"
  ]),
  music_url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
  khqr_image_url: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://bakong.nbc.org.kh",
  khqr_account_name: "CHEA VISAL & SOK SOVANNARY",
  khqr_account_number: "000 123 456 (ABA Bank)",
  enable_rsvp: true,
  enable_wishes: true,
  is_published: true,
  wishes: [
    {
      id: "w-1",
      guest_name: "លោក សុខុម និង ភរិយា",
      attendance: "attending",
      guest_count: 2,
      blessing_message: "សូមជូនពរក្មួយទាំងពីរជួបតែសេចក្តីសុខ សុភមង្គល រកទទួលទានមានបាន និងស្រឡាញ់គ្នារហូតដល់ចាស់កោងខ្នង!",
      created_at: "2026-10-17T10:00:00Z"
    },
    {
      id: "w-2",
      guest_name: "ម៉ៅ វណ្ណា",
      attendance: "attending",
      guest_count: 1,
      blessing_message: "Congratulations to the lovely couple! Wishing you a lifetime of endless joy and prosperity together.",
      created_at: "2026-10-17T11:30:00Z"
    }
  ]
};

// Local storage key for the signed-in couple's session (token + user)
const AUTH_KEY = "camtech_wedding_auth";
// Legacy key: earlier builds cached a copy of the card here and served it when the API failed
const LEGACY_CARD_KEY = "camtech_wedding_card";

/** Error carrying the HTTP status, so callers can tell "signed out" from "offline". */
export class WeddingApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "WeddingApiError";
    this.status = status;
  }
}

const NETWORK_ERROR = "មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ សូមព្យាយាមម្តងទៀត (Can't reach the server, please try again)";

function detailMessage(detail: unknown, fallback: string): string {
  if (typeof detail === "string" && detail) return detail;
  // FastAPI validation errors: [{ loc, msg }]
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { loc?: unknown[]; msg?: string };
    const field = Array.isArray(first.loc) ? String(first.loc[first.loc.length - 1]) : "";
    return `${fallback}${field ? ` (${field}: ${first.msg})` : first.msg ? ` (${first.msg})` : ""}`;
  }
  return fallback;
}

/** fetch + JSON with real errors: success is only ever what the server confirmed. */
async function request<T>(path: string, init: RequestInit & { token?: string } = {}, fallbackError = "សំណើបរាជ័យ (Request failed)"): Promise<T> {
  const { token, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: {
        ...(rest.body && !(rest.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new WeddingApiError(NETWORK_ERROR, 0);
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = (body as { detail?: unknown } | null)?.detail;
    const msg = res.status === 429
      ? detailMessage(detail, "សំណើច្រើនពេក (Too many requests)")
      : res.status >= 500
        ? NETWORK_ERROR
        : detailMessage(detail, fallbackError);
    throw new WeddingApiError(msg, res.status);
  }
  return body as T;
}

export async function unifiedWeddingAuth(payload: {
  phone: string;
  username?: string;
  password: string;
}): Promise<WeddingAuthResponse> {
  const data = await request<WeddingAuthResponse>("/wedding/auth", {
    method: "POST",
    body: JSON.stringify(payload),
  }, "បរាជ័យក្នុងការចូលប្រើ (Sign-in failed)");
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ ...data, card: null }));
    localStorage.removeItem(LEGACY_CARD_KEY);
  }
  return data;
}

export function getStoredAuth(): WeddingAuthResponse | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as WeddingAuthResponse;
    // Sessions minted by the old offline fallback were never real accounts
    if (!parsed?.access_token || parsed.access_token.startsWith("mock-jwt-token-")) {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearStoredAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(LEGACY_CARD_KEY);
}

export async function fetchMyWeddingCard(token: string): Promise<WeddingCard> {
  return request<WeddingCard>("/wedding/my-card", { token, cache: "no-store" }, "មិនអាចទាញយកធៀបការបានទេ (Couldn't load your invitation)");
}

export async function updateMyWeddingCard(token: string, updates: Partial<WeddingCard>): Promise<WeddingCard> {
  // Only send editable columns; server-owned fields and the guestbook stay out
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, wishes, created_at, updated_at, ...editable } = updates as WeddingCard;
  return request<WeddingCard>("/wedding/my-card", {
    method: "PUT",
    token,
    body: JSON.stringify(editable),
  }, "បរាជ័យក្នុងការរក្សាទុក (Save failed)");
}

/** The published card for a slug, or null when there is none (unknown or draft).
 *  Throws when the service itself can't be reached, so the page can say so
 *  instead of showing someone else's invitation. */
export async function fetchPublicWeddingCard(slug: string): Promise<WeddingCard | null> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/wedding/card/${encodeURIComponent(slug)}`, {
      next: { revalidate: 10 }
    });
  } catch {
    throw new WeddingApiError(NETWORK_ERROR, 0);
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new WeddingApiError(NETWORK_ERROR, res.status);
  return await res.json();
}

export async function postWeddingWish(slug: string, wish: {
  guest_name: string;
  phone?: string;
  attendance: string;
  guest_count: number;
  blessing_message: string;
  website?: string;
}): Promise<WeddingWish> {
  return request<WeddingWish>(`/wedding/card/${encodeURIComponent(slug)}/wish`, {
    method: "POST",
    body: JSON.stringify(wish),
  }, "មិនអាចផ្ញើបានទេ (Couldn't send your response)");
}

export type SlugCheck = { slug: string; available: boolean; reason: "free" | "yours" | "taken" | "invalid" | "reserved" };

/** Whether each link could be this couple's (up to 6 per call) */
export async function checkWeddingSlugs(token: string, slugs: string[]): Promise<SlugCheck[]> {
  const q = new URLSearchParams(slugs.map((s) => ["slug", s]));
  return request<SlugCheck[]>(`/wedding/my-card/slug-check?${q}`, { token, cache: "no-store" });
}

export async function fetchMyResponses(token: string): Promise<WeddingResponsesList> {
  return request<WeddingResponsesList>("/wedding/my-card/responses", { token, cache: "no-store" });
}

export async function deleteMyResponse(token: string, id: string): Promise<void> {
  await request<void>(`/wedding/my-card/responses/${encodeURIComponent(id)}`, { method: "DELETE", token });
}

// Same list as the service's: each one checked to play in an embedded player
export const DEFAULT_CURATED_SONGS: CuratedSong[] = [
  {
    id: "song-homrong-01",
    title_km: "ហោមរោង (បើកពិធីមង្គលការ)",
    title_en: "Hom Rong (Opening of the Ceremony)",
    category: "ចាប់ផ្តើមពិធី",
    video_id: "iLHnS6Zjdh8",
    youtube_url: "https://www.youtube.com/watch?v=iLHnS6Zjdh8",
    thumbnail_url: "https://i.ytimg.com/vi/iLHnS6Zjdh8/hqdefault.jpg"
  },
  {
    id: "song-plengka-02",
    title_km: "ភ្លេងការបុរាណខ្មែរ",
    title_en: "Pleng Ka — Khmer Traditional Wedding Music",
    category: "បទបុរាណប្រពៃណី",
    video_id: "wfJoz4The1w",
    youtube_url: "https://www.youtube.com/watch?v=wfJoz4The1w",
    thumbnail_url: "https://i.ytimg.com/vi/wfJoz4The1w/hqdefault.jpg"
  },
  {
    id: "song-smoung-03",
    title_km: "ភ្លេងការ ស្មោង (ឈុតទី ១)",
    title_en: "Phleng Ka Collection Vol. 1",
    category: "បទបុរាណប្រពៃណី",
    video_id: "aJqkEm6XHxQ",
    youtube_url: "https://www.youtube.com/watch?v=aJqkEm6XHxQ",
    thumbnail_url: "https://i.ytimg.com/vi/aJqkEm6XHxQ/hqdefault.jpg"
  },
  {
    id: "song-kamdarong-04",
    title_km: "ភ្លេងការកំដររោង",
    title_en: "Pleng Ka for the Wedding Hall",
    category: "កំដររោងការ",
    video_id: "JB7p_x0uAI8",
    youtube_url: "https://www.youtube.com/watch?v=JB7p_x0uAI8",
    thumbnail_url: "https://i.ytimg.com/vi/JB7p_x0uAI8/hqdefault.jpg"
  },
  {
    id: "song-norkorreach-05",
    title_km: "ភ្លេងការ នគររាជ",
    title_en: "Khmer Wedding Song — Nokor Reach",
    category: "ជូនពរសិរីសួស្តី",
    video_id: "v8lnHkZL1jk",
    youtube_url: "https://www.youtube.com/watch?v=v8lnHkZL1jk",
    thumbnail_url: "https://i.ytimg.com/vi/v8lnHkZL1jk/hqdefault.jpg"
  },
  {
    id: "song-classic-06",
    title_km: "ចម្រៀងការជំនាន់មុន (សាវុធ & សេរីយ៉ុង)",
    title_en: "Classic Wedding Songs (Savuth & Sereyong)",
    category: "មនោសញ្ចេតនា",
    video_id: "wosq2c0ZB9E",
    youtube_url: "https://www.youtube.com/watch?v=wosq2c0ZB9E",
    thumbnail_url: "https://i.ytimg.com/vi/wosq2c0ZB9E/hqdefault.jpg"
  }
];

export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const patterns = [
    /(?:v=|\/v\/|youtu\.be\/|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/
  ];
  for (const p of patterns) {
    const m = trimmed.match(p);
    if (m && m[1]) return m[1];
  }
  return null;
}

export async function resolveYouTubeAudio(url: string): Promise<YouTubeResolveResponse> {
  if (!url || !url.trim()) {
    return { valid: false, error: "សូមបញ្ចូល Link YouTube" };
  }

  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    return { valid: false, error: "Link YouTube មិនត្រឹមត្រូវ (Invalid YouTube link)" };
  }

  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&loop=1`;
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  try {
    const res = await fetch(`${API_BASE}/wedding/youtube-resolve?url=${encodeURIComponent(canonicalUrl)}`);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn("YouTube resolve network fallback:", err);
  }

  // Graceful in-browser fallback
  return {
    valid: true,
    video_id: videoId,
    title: `ភ្លេងការខ្មែរ (YouTube ID: ${videoId})`,
    author_name: "YouTube Music",
    thumbnail_url: thumbnailUrl,
    music_url: canonicalUrl,
    embed_url: embedUrl
  };
}

export async function fetchCuratedSongs(): Promise<CuratedSong[]> {
  try {
    const res = await fetch(`${API_BASE}/wedding/curated-songs`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("fetchCuratedSongs network fallback:", err);
  }
  return DEFAULT_CURATED_SONGS;
}

/**
 * Automatically compress and optimize high-resolution phone/camera photos
 * to max 1600px width at 85% quality to ensure fast upload of 10-20+ images.
 */
export async function optimizeImageFile(file: File, maxWidth = 1600, quality = 0.85): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const optimizedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
                type: "image/webp",
                lastModified: Date.now()
              });
              resolve(optimizedFile);
            } else {
              resolve(file);
            }
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload wedding images to the wedding service (signed-in owners only).
 * Each photo is compressed in the browser first. A failed upload throws:
 * nothing is silently swapped for an inline copy the server never stored.
 */
export async function uploadWeddingImages(
  files: File[],
  token: string,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const uploadedUrls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    if (onProgress) onProgress(i + 1, files.length);
    const optimized = await optimizeImageFile(files[i]);
    const fd = new FormData();
    fd.append("file", optimized);
    const data = await request<{ url?: string }>("/wedding/upload", {
      method: "POST",
      token,
      body: fd,
    }, "បរាជ័យក្នុងការផ្ទុករូបភាព (Upload failed)");
    if (!data?.url) throw new WeddingApiError("បរាជ័យក្នុងការផ្ទុករូបភាព (Upload failed)", 500);
    uploadedUrls.push(data.url);
  }
  return uploadedUrls;
}
