import { safeGet } from "./api";
import type { Settings } from "./types";

/**
 * Rendered on every page, so it must never be the reason a page fails.
 * When the API is down the site still renders with these neutral defaults.
 */
export const FALLBACK_SETTINGS: Settings = {
  event_name: "VHD Summit 2026",
  event_tagline: "Vietnam Hospitality & Digital Forum",
  event_description:
    "Diễn đàn công nghệ, đổi mới và giao thương cho ngành khách sạn – du lịch Việt Nam.",
  hero_title: "Kiến tạo tương lai ngành dịch vụ Việt Nam",
  hero_subtitle: "",
  hero_image: "",
  logo: "",
  start_date: null,
  end_date: null,
  venue_name: "",
  venue_address: "",
  venue_map_url: "",
  contact_email: "",
  contact_phone: "",
  contact_address: "",
  about_title: "",
  about_content: "",
  about_image: "",
  socials: {},
  stats: [],
  highlights: [],
  hero_slides: [],
  seo_title: "",
  seo_description: "",
  registration_open: true,
  updated_at: "",
};

export function getSettings(): Promise<Settings> {
  return safeGet<Settings>("/settings", FALLBACK_SETTINGS, 60);
}
