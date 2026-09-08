export type Meta = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type StatItem = { value: number; suffix?: string; label: string; icon?: string };
export type Highlight = { icon?: string; title: string; description: string };
export type HeroSlide = { image: string; caption?: string };

export type Settings = {
  event_name: string;
  event_tagline: string;
  event_description: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image: string;
  logo: string;
  start_date: string | null;
  end_date: string | null;
  venue_name: string;
  venue_address: string;
  venue_map_url: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  about_title: string;
  about_content: string;
  about_image: string;
  socials: Record<string, string>;
  stats: StatItem[];
  highlights: Highlight[];
  hero_slides: HeroSlide[];
  seo_title: string;
  seo_description: string;
  registration_open: boolean;
  updated_at: string;
};

export type Speaker = {
  id: string;
  slug: string;
  name: string;
  title: string;
  company: string;
  country: string;
  photo: string;
  bio: string;
  short_bio: string;
  topics: string[];
  socials: Record<string, string>;
  featured: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  sessions?: AgendaSession[];
  posts?: Post[];
};

export type SessionType =
  | "session" | "keynote" | "panel" | "break" | "networking" | "workshop" | "ceremony";

export type AgendaSession = {
  id: string;
  day_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  room: string;
  track: string;
  type: SessionType;
  is_published: boolean;
  sort_order: number;
  day_label?: string;
  day_date?: string;
  speakers: Speaker[];
  speaker_ids?: string[];
};

export type AgendaDay = {
  id: string;
  label: string;
  title: string;
  date: string;
  sort_order: number;
  sessions: AgendaSession[];
};

export type PostCategory = "news" | "speech" | "press" | "announcement";

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover: string;
  category: PostCategory;
  tags: string[];
  author_name: string;
  speaker_id: string | null;
  is_published: boolean;
  featured: boolean;
  views: number;
  published_at: string;
  created_at: string;
  updated_at: string;
  speaker?: Speaker;
};

export type GalleryType = "image" | "video" | "document";

export type GalleryItem = {
  id: string;
  title: string;
  description: string;
  type: GalleryType;
  url: string;
  thumbnail: string;
  album: string;
  file_size: number;
  is_published: boolean;
  sort_order: number;
  created_at: string;
};

export type PartnerTier =
  | "diamond" | "platinum" | "gold" | "silver" | "bronze" | "partner" | "media";

export type Partner = {
  id: string;
  name: string;
  logo: string;
  website: string;
  description: string;
  tier: PartnerTier;
  is_published: boolean;
  sort_order: number;
  created_at: string;
};

export type TicketType = "visitor" | "delegate" | "exhibitor" | "press" | "vip";
export type RegistrationStatus = "pending" | "confirmed" | "cancelled" | "checked_in";

export type Registration = {
  id: string;
  code: string;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  job_title: string;
  country: string;
  ticket_type: TicketType;
  interests: string[];
  note: string;
  status: RegistrationStatus;
  created_at: string;
};

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type Media = {
  id: string;
  filename: string;
  original_name: string;
  url: string;
  mime_type: string;
  size: number;
  created_at: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
};

export type HomePayload = {
  settings: Settings;
  speakers: Speaker[];
  posts: Post[];
  partners: Partner[];
  gallery: GalleryItem[];
  agenda: AgendaDay[];
};

export type DashboardStats = {
  counts: {
    registrations: number;
    registrations_pending: number;
    registrations_confirmed: number;
    speakers: number;
    posts: number;
    gallery: number;
    partners: number;
    sessions: number;
    contacts_unread: number;
  };
  trend: { date: string; count: number }[];
  by_ticket: { ticket_type: TicketType; count: number }[];
  recent: Registration[];
};
