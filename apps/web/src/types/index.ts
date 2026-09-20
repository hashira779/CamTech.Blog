export interface Author {
  id: string;
  name: string;
  slug: string;
  role: string;
  expertise?: string;
  bio?: string;
  avatar_url?: string;
}

export interface Source {
  id: string;
  name: string;
  slug: string;
  country: string;
  language: string;
  website_url: string;
  feed_url?: string;
  category: string;
  trust_level: string;
  license_notes?: string;
}

export interface Category {
  id: string;
  name: string;
  name_km?: string;
  slug: string;
  scope: string;
  icon?: string;
}

export interface ArticleSource {
  id: string;
  source_name: string;
  source_url: string;
  attribution_quote?: string;
  coverage_type?: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  title_km?: string;
  subheadline?: string;
  summary: string;
  summary_km?: string;
  content: string;
  key_points?: string; // JSON string
  why_it_matters?: string;
  timeline?: string; // JSON string
  who_said_what?: string;
  what_is_documented?: string;
  what_remains_disputed?: string;
  category_id: string;
  author_id: string;
  country: string;
  province_or_city?: string;
  language: string;
  primary_source_id?: string;
  primary_source_url: string;
  source_attribution_text?: string;
  hero_image_url?: string;
  hero_image_credit?: string;
  hero_image_license?: string;
  hero_image_alt?: string;
  status: string;
  quality_checklist_passed: boolean;
  views_count: number;
  shares_count: number;
  saves_count: number;
  trend_score: number;
  is_featured: boolean;
  is_breaking: boolean;
  canonical_url?: string;
  seo_title?: string;
  seo_description?: string;
  published_at?: string;
  updated_at?: string;
  created_at: string;
  category?: Category;
  author?: Author;
  primary_source?: Source;
  sources?: ArticleSource[];
}

export interface Discovery {
  id: string;
  slug: string;
  title: string;
  title_km?: string;
  hero_image_url: string;
  hero_image_credit?: string;
  category: string;
  intro: string;
  intro_km?: string;
  main_explanation: string;
  main_explanation_km?: string;
  visual_sections?: string; // JSON string
  important_facts?: string; // JSON string
  timeline?: string; // JSON string
  diagram_data?: string; // JSON string
  interactive_type?: string;
  sources?: string; // JSON string
  views_count: number;
  shares_count: number;
  saves_count: number;
  published_at?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  question_km?: string;
  choices: string[];
  order_num: number;
  difficulty: string;
  category?: string;
  correct_answer_idx?: number;
  explanation?: string;
  source_reference?: string;
}

export interface Quiz {
  id: string;
  slug: string;
  title: string;
  title_km?: string;
  description: string;
  category: string;
  difficulty: string;
  is_daily: boolean;
  featured_date?: string;
  estimated_minutes: number;
  questions: QuizQuestion[];
}

export interface Tool {
  id: string;
  slug: string;
  name: string;
  name_km?: string;
  category: "CALCULATOR" | "DEVELOPER" | "IMAGE" | "TEXT";
  description: string;
  description_km?: string;
  icon: string;
  is_popular: boolean;
  usage_count: number;
  version?: string;
}

export interface TrendingResponse {
  cambodia: Array<{
    id: string;
    title: string;
    title_km?: string;
    slug: string;
    url: string;
    category: string;
    hero_image_url?: string;
    trend_score: number;
    views_count: number;
    published_at?: string;
  }>;
  world: Array<{
    id: string;
    title: string;
    title_km?: string;
    slug: string;
    url: string;
    category: string;
    hero_image_url?: string;
    trend_score: number;
    views_count: number;
    published_at?: string;
  }>;
  editor_picks: Array<{
    id: string;
    title: string;
    title_km?: string;
    slug: string;
    url: string;
    category: string;
    hero_image_url?: string;
    trend_score: number;
    views_count: number;
    published_at?: string;
  }>;
}

export interface SearchResultItem {
  id: string;
  type: "ARTICLE" | "DISCOVERY" | "QUIZ" | "TOOL" | "PLACE" | "DESTINATION";
  title: string;
  title_km?: string;
  summary: string;
  slug: string;
  url: string;
  category?: string;
  country?: string;
  image_url?: string;
  published_at?: string;
}

// --- Travel Domain Types ---

export interface Country {
  id: string;
  code: string;
  name: string;
  name_km?: string;
  currency_code: string;
  is_active: boolean;
}

export interface Accommodation {
  id: string;
  property_type: string;
  star_rating: number;
  price_range: string;
  check_in_time: string;
  check_out_time: string;
  room_types_json: string;
  has_swimming_pool: boolean;
  has_free_wifi: boolean;
  has_breakfast: boolean;
  booking_url?: string;
}

export interface Place {
  id: string;
  destination_id: string;
  name: string;
  local_name?: string;
  slug: string;
  place_type: "ATTRACTION" | "ACCOMMODATION" | "RESTAURANT" | "CAFE" | "MARKET" | "TEMPLE" | "MUSEUM" | "WATERFALL" | "ACTIVITY" | "HIDDEN_GEM";
  description: string;
  description_km?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  email?: string;
  opening_hours?: string;
  price_level: "$" | "$$" | "$$$" | "$$$$" | "FREE";
  hero_image_url?: string;
  gallery_json?: string;
  amenities_json?: string;
  tags_json?: string;
  verification_status: "VERIFIED" | "UNVERIFIED" | "NEEDS_REVIEW" | "OUTDATED";
  status: "ACTIVE" | "CLOSED" | "TEMPORARILY_CLOSED" | "ARCHIVED" | "MERGED";
  rating: number;
  review_count: number;
  views_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  accommodation?: Accommodation;
  destination?: Destination;
}

export interface Destination {
  id: string;
  country_id: string;
  name: string;
  name_km?: string;
  slug: string;
  overview: string;
  overview_km?: string;
  hero_image_url?: string;
  latitude?: number;
  longitude?: number;
  best_time_to_visit?: string;
  practical_info?: string;
  is_featured: boolean;
  views_count: number;
  status: string;
  created_at: string;
  country?: Country;
  places?: Place[];
  trips?: Trip[];
}

export interface TripDayItem {
  id: string;
  place_id?: string;
  time_of_day: "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT";
  start_time?: string;
  title: string;
  description?: string;
  duration_minutes: number;
  order_index: number;
  place?: Place;
}

export interface TripDay {
  id: string;
  day_number: number;
  title: string;
  summary?: string;
  items: TripDayItem[];
}

export interface Trip {
  id: string;
  destination_id: string;
  title: string;
  title_km?: string;
  slug: string;
  description: string;
  description_km?: string;
  duration_days: number;
  travel_style: string;
  budget_level: string;
  hero_image_url?: string;
  is_featured: boolean;
  is_curated: boolean;
  status: string;
  created_at: string;
  destination?: Destination;
  days: TripDay[];
}

export interface GeneratedTripDayItem {
  time_of_day: string;
  start_time: string;
  title: string;
  description: string;
  place_id?: string;
  place_name?: string;
  duration_minutes: number;
  estimated_cost: string;
}

export interface GeneratedTripDay {
  day_number: number;
  title: string;
  theme: string;
  items: GeneratedTripDayItem[];
}

export interface TripPlanResponse {
  destination_name: string;
  destination_slug: string;
  duration_days: number;
  travel_style: string;
  budget_level: string;
  summary: string;
  days: GeneratedTripDay[];
}

export interface PlaceSuggestionCreate {
  suggestion_type: "NEW_PLACE" | "UPDATE_INFO" | "REPORT_CLOSED" | "INACCURACY";
  place_id?: string;
  place_name: string;
  destination_slug: string;
  place_type?: string;
  details: string;
  submitter_name?: string;
  submitter_contact?: string;
  source_notes?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  label_key: string;
  route: string;
  icon?: string;
  parent_id?: string;
  position: number;
  enabled: boolean;
  visibility: string;
  language: string;
}

export interface HomepageSection {
  id: string;
  section_type: string;
  title: string;
  title_key?: string;
  position: number;
  layout: string;
  query_config: string;
  max_items: number;
  enabled: boolean;
  device_visibility: string;
}

export interface TransportHub {
  id: string;
  destination_id?: string;
  name: string;
  local_name?: string;
  slug: string;
  hub_type: string;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  website?: string;
  facilities_json: string;
  status: string;
  verification_status: string;
}

export interface TransportSchedule {
  id: string;
  departure_time: string;
  arrival_time: string;
  days_of_week: string;
  price_usd: number;
  currency: string;
  vehicle_class: string;
  service_calendar_type: string;
  status: string;
  source: string;
  booking_url?: string;
  last_verified_at: string;
}

export interface TransportStop {
  id: string;
  stop_name: string;
  stop_order: number;
  arrival_offset_minutes: number;
  departure_offset_minutes: number;
  hub?: TransportHub;
}

export interface TransportOperator {
  id: string;
  name: string;
  local_name?: string;
  slug: string;
  operator_type: string;
  description: string;
  description_km?: string;
  logo_url?: string;
  website?: string;
  phone?: string;
  email?: string;
  rating: number;
  review_count: number;
  amenities_json: string;
  status: string;
  verification_status: string;
  last_verified_at: string;
  routes?: TransportRoute[];
}

export interface TransportRoute {
  id: string;
  operator_id: string;
  origin_destination_id: string;
  destination_id: string;
  name: string;
  slug: string;
  transport_type: string;
  description?: string;
  duration_minutes: number;
  distance_km: number;
  base_price_usd: number;
  status: string;
  verification_status: string;
  last_verified_at: string;
  operator?: TransportOperator;
  origin_hub?: TransportHub;
  destination_hub?: TransportHub;
  schedules: TransportSchedule[];
  stops?: TransportStop[];
}

export interface RouteSearchResponse {
  origin: string;
  destination: string;
  total_options: number;
  routes: TransportRoute[];
}

export interface NearbyPlace {
  place: Place;
  distance_km: number;
  estimated_walk_minutes: number;
  estimated_drive_minutes: number;
}

export interface NearbySearchResponse {
  reference_name: string;
  reference_lat: number;
  reference_lng: number;
  radius_km: number;
  total: number;
  results: NearbyPlace[];
}

export interface TravelGuide {
  id: string;
  destination_id: string;
  title: string;
  title_km?: string;
  slug: string;
  summary: string;
  content: string;
  hero_image_url?: string;
  read_time_minutes: string;
  status: string;
  published_at: string;
}

export interface TravelEvent {
  id: string;
  destination_id: string;
  name: string;
  name_km?: string;
  slug: string;
  description: string;
  event_type: string;
  venue?: string;
  start_date: string;
  end_date?: string;
  hero_image_url?: string;
  status: string;
}

