export interface WeddingAgendaItem {
  time: string;
  title: string;
  description: string;
}

export interface WeddingReception {
  venue: string;
  hall?: string;
  time: string;
  address: string;
  map_url: string;
}

export interface WeddingWish {
  id: string;
  guest_name: string;
  attendance: "attending" | "not_attending" | "unsure";
  guest_count: number;
  blessing_message: string;
  created_at?: string;
}

export interface WeddingCard {
  id: string;
  slug: string;
  theme: string;
  title: string;
  groom_name: string;
  groom_title: string;
  groom_parents: string;
  groom_image_url?: string;
  bride_name: string;
  bride_title: string;
  bride_parents: string;
  bride_image_url?: string;
  khmer_date: string;
  solar_date: string;
  solar_time: string;
  morning_agenda?: string; // JSON string of WeddingAgendaItem[]
  evening_reception?: string; // JSON string of WeddingReception
  cover_image_url?: string;
  gallery_images?: string; // JSON string of string[]
  music_url?: string;
  khqr_image_url?: string;
  khqr_account_name?: string;
  khqr_account_number?: string;
  enable_rsvp: boolean;
  enable_wishes: boolean;
  is_published: boolean;
  wishes?: WeddingWish[];
  created_at?: string;
}

export interface WeddingUser {
  id: string;
  phone: string;
  username: string;
  created_at?: string;
}

export interface WeddingAuthResponse {
  access_token: string;
  token_type: string;
  is_new: boolean;
  user: WeddingUser;
  card: WeddingCard;
}

export interface YouTubeResolveResponse {
  valid: boolean;
  video_id?: string;
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  music_url?: string;
  embed_url?: string;
  error?: string;
}

export interface CuratedSong {
  id: string;
  title_km: string;
  title_en: string;
  category: string;
  video_id: string;
  youtube_url: string;
  thumbnail_url: string;
}

