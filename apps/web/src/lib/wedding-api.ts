import { WeddingAuthResponse, WeddingCard, WeddingWish, YouTubeResolveResponse, CuratedSong } from "@/types/wedding";

const API_BASE = typeof window === "undefined"
  ? (process.env.INTERNAL_WEDDING_API_URL || "http://127.0.0.1:8002/api/v1")
  : (process.env.NEXT_PUBLIC_WEDDING_API_URL || "/api/v1");

export const DEFAULT_PREMIER_CARD: WeddingCard = {
  id: "card-sample-01",
  slug: "heng-bopha-wedding",
  theme: "royal_khmer_gold",
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

// Local storage keys
const AUTH_KEY = "camtech_wedding_auth";
const CARD_KEY = "camtech_wedding_card";

export async function unifiedWeddingAuth(payload: {
  phone: string;
  username?: string;
  password: string;
}): Promise<WeddingAuthResponse> {
  try {
    const res = await fetch(`${API_BASE}/wedding/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_KEY, JSON.stringify(data));
        localStorage.setItem(CARD_KEY, JSON.stringify(data.card));
      }
      return data;
    }

    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "បរាជ័យក្នុងការចូលប្រើ");
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    // If backend is unreachable, gracefully fall back to local mode
    if (errorMsg.includes("Incorrect") || errorMsg.includes("លេខសម្ងាត់មិនត្រឹមត្រូវ")) {
      throw err;
    }
    console.warn("FastAPI unreachable, fallback to browser state:", err);
    
    // Simulate smart local response
    const stored = typeof window !== "undefined" ? localStorage.getItem(AUTH_KEY) : null;
    let is_new = true;
    let card = { ...DEFAULT_PREMIER_CARD };
    
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.user?.phone === payload.phone.replace(/[^\d+]/g, "")) {
        is_new = false;
        card = parsed.card || card;
      }
    }

    const mockResponse: WeddingAuthResponse = {
      access_token: "mock-jwt-token-" + Date.now(),
      token_type: "bearer",
      is_new,
      user: {
        id: "local-user-" + Date.now(),
        phone: payload.phone,
        username: payload.username || (is_new ? `User ${payload.phone.slice(-4)}` : "ភ្ញៀវកិត្តិយស"),
        created_at: new Date().toISOString()
      },
      card
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_KEY, JSON.stringify(mockResponse));
      localStorage.setItem(CARD_KEY, JSON.stringify(mockResponse.card));
    }

    return mockResponse;
  }
}

export function getStoredAuth(): WeddingAuthResponse | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearStoredAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(CARD_KEY);
}

export async function fetchMyWeddingCard(token: string): Promise<WeddingCard> {
  try {
    const res = await fetch(`${API_BASE}/wedding/my-card`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const card = await res.json();
      if (typeof window !== "undefined") localStorage.setItem(CARD_KEY, JSON.stringify(card));
      return card;
    }
  } catch (err) {
    console.warn("fetchMyWeddingCard network fallback:", err);
  }

  if (typeof window !== "undefined") {
    const local = localStorage.getItem(CARD_KEY);
    if (local) return JSON.parse(local);
  }
  return DEFAULT_PREMIER_CARD;
}

export async function updateMyWeddingCard(token: string, updates: Partial<WeddingCard>): Promise<WeddingCard> {
  try {
    const res = await fetch(`${API_BASE}/wedding/my-card`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      const card = await res.json();
      if (typeof window !== "undefined") localStorage.setItem(CARD_KEY, JSON.stringify(card));
      return card;
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "បរាជ័យក្នុងការរក្សាទុក");
  } catch (err: unknown) {
    console.warn("updateMyWeddingCard network fallback:", err);
    // Local fallback update
    if (typeof window !== "undefined") {
      const local = localStorage.getItem(CARD_KEY);
      const existing = local ? JSON.parse(local) : DEFAULT_PREMIER_CARD;
      const updated = { ...existing, ...updates };
      localStorage.setItem(CARD_KEY, JSON.stringify(updated));
      return updated;
    }
    return { ...DEFAULT_PREMIER_CARD, ...updates };
  }
}

export async function fetchPublicWeddingCard(slug: string): Promise<WeddingCard> {
  try {
    const res = await fetch(`${API_BASE}/wedding/card/${encodeURIComponent(slug)}`, {
      next: { revalidate: 10 }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("fetchPublicWeddingCard network fallback:", err);
  }

  // Fallback to local or default
  if (typeof window !== "undefined") {
    const local = localStorage.getItem(CARD_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed.slug === slug || slug === "demo" || slug === "sample") {
        return parsed;
      }
    }
  }
  return DEFAULT_PREMIER_CARD;
}

export async function postWeddingWish(slug: string, wish: {
  guest_name: string;
  phone?: string;
  attendance: string;
  guest_count: number;
  blessing_message: string;
}): Promise<WeddingWish> {
  try {
    const res = await fetch(`${API_BASE}/wedding/card/${encodeURIComponent(slug)}/wish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(wish)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("postWeddingWish network fallback:", err);
  }

  return {
    id: "wish-" + Date.now(),
    guest_name: wish.guest_name,
    attendance: (wish.attendance as "attending" | "not_attending" | "unsure") || "attending",
    guest_count: wish.guest_count,
    blessing_message: wish.blessing_message,
    created_at: new Date().toISOString()
  };
}

export const DEFAULT_CURATED_SONGS: CuratedSong[] = [
  {
    id: "song-blessing-01",
    title_km: "របាំជូនពរ (ភ្លេងការបុរាណខ្មែរ)",
    title_en: "Robam Choun Por (Traditional Blessing Dance)",
    category: "ជូនពរសិរីសួស្តី",
    video_id: "Wj_P9cKzW2U",
    youtube_url: "https://www.youtube.com/watch?v=Wj_P9cKzW2U",
    thumbnail_url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "song-procession-02",
    title_km: "ពិធីហែកំណត់ / ហែជំនូនចូលរោងជ័យ",
    title_en: "Hae Khnom (Traditional Groom Procession)",
    category: "ពិធីហែជំនូន",
    video_id: "8G-G4nC0GqY",
    youtube_url: "https://www.youtube.com/watch?v=8G-G4nC0GqY",
    thumbnail_url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "song-katsok-03",
    title_km: "ពិធីកាត់សក់បង្កក់សិរីមង្គល",
    title_en: "Kat Sok Bangkork Serey (Hair Cutting Ceremony)",
    category: "ពិធីកាត់សក់",
    video_id: "7o3Fv64Bq0E",
    youtube_url: "https://www.youtube.com/watch?v=7o3Fv64Bq0E",
    thumbnail_url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "song-phtum-04",
    title_km: "ពិធីសំពះផ្ទឹម ចងដៃសិរីសួស្តី",
    title_en: "Sompeah Phtum (Sacred Knot Tying Ceremony)",
    category: "ពិធីសំពះផ្ទឹម",
    video_id: "4jS9XwLz7g0",
    youtube_url: "https://www.youtube.com/watch?v=4jS9XwLz7g0",
    thumbnail_url: "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "song-pka-sla-05",
    title_km: "ផ្កាស្លាបីទង (មរតកភ្លេងការបុរាណ)",
    title_en: "Pka Sla Bei Torng (Heritage Wedding Melody)",
    category: "បទបុរាណប្រពៃណី",
    video_id: "m9Y1Z9w8Q2c",
    youtube_url: "https://www.youtube.com/watch?v=m9Y1Z9w8Q2c",
    thumbnail_url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "song-destiny-06",
    title_km: "គូព្រេងនិស្ស័យ (ស្នេហ៍ស្មោះស័ក្តិសិទ្ធិ)",
    title_en: "Destined Soulmates (Khmer Love Symphony)",
    category: "មនោសញ្ចេតនា",
    video_id: "2g811Eo7K8U",
    youtube_url: "https://www.youtube.com/watch?v=2g811Eo7K8U",
    thumbnail_url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=400&q=80"
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
 * Upload one or multiple wedding images directly to the database/filesystem.
 * Tries Next.js API route first, then FastAPI microservice, and falls back to optimized Base64 data URL.
 */
export async function uploadWeddingImages(
  files: File[],
  token?: string,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const uploadedUrls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (onProgress) onProgress(i + 1, files.length);

    // Optimize image first
    const optimized = await optimizeImageFile(file);

    let uploadedUrl: string | null = null;

    // 1. Try Next.js upload API route
    try {
      const fd = new FormData();
      fd.append("file", optimized);
      const res = await fetch("/api/wedding/upload", {
        method: "POST",
        body: fd
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) uploadedUrl = data.url;
      }
    } catch {}

    // 2. Try FastAPI microservice upload route
    if (!uploadedUrl) {
      try {
        const fd = new FormData();
        fd.append("file", optimized);
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE}/wedding/upload`, {
          method: "POST",
          headers,
          body: fd
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) uploadedUrl = data.url;
        }
      } catch {}
    }

    // 3. Resilient Base64 Fallback
    if (!uploadedUrl) {
      uploadedUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve("");
        reader.readAsDataURL(optimized);
      });
    }

    if (uploadedUrl) {
      uploadedUrls.push(uploadedUrl);
    }
  }

  return uploadedUrls;
}


