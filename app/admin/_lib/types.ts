export type Tab =
  | "dashboard"
  | "submissions"
  | "events"
  | "providers"
  | "messages"
  | "banners"
  | "gallery"
  | "organizations"

export type SubmissionStatus = "pending" | "approved" | "rejected"

export interface EventSubmission {
  id: string
  event_name: string
  description: string
  event_date: string
  end_date?: string | null
  event_time: string
  location: string
  department?: string | null
  city?: string | null
  maps_url?: string | null
  category: string
  contact_email: string
  contact_phone: string
  contact_name: string
  status: SubmissionStatus
  created_at: string
  image_url: string | null
  wants_premium?: boolean | null
}

export interface ProviderSubmission {
  id: string
  business_name: string
  category: string
  contact_email: string
  contact_phone: string
  contact_name: string
  website: string | null
  description: string
  status: SubmissionStatus
  created_at: string
}

export interface ImportantLink {
  label: string
  url: string
}

export interface PublishedEvent {
  id: string
  title: string
  slug: string | null
  date: string
  end_date?: string | null
  time: string
  location: string
  department: string | null
  city: string | null
  maps_url: string | null
  category: string
  description: string
  long_description: string | null
  is_premium: boolean
  is_approved: boolean
  image_url: string | null
  contact_email: string | null
  contact_phone: string | null
  allow_contact_form: boolean | null
  important_links: ImportantLink[] | null
  internal_banner_url: string | null
  gacetilla_titulo?: string | null
  gacetilla_imagen?: string | null
  gacetilla_texto?: string | null
  organization_id?: string | null
  created_at: string
}

export interface Provider {
  id: string
  name: string
  slug: string | null
  category: string
  contact_email: string
  contact_phone: string
  website: string | null
  description: string | null
  avatar_url: string | null
  is_approved: boolean
  created_at?: string
}

export interface GeneralContact {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  status: string | null
  created_at: string
}

export interface EventContactRequest {
  id: string
  event_id: string
  contact_type: string
  name: string
  email: string
  phone: string | null
  message: string | null
  status: string
  created_at: string
}

export interface Banner {
  id: string
  title: string
  image_url: string
  link_url: string
  is_active: boolean
  display_order: number
  event_id?: string | null
}

export interface Organization {
  id: string
  name: string
  slug: string
  avatar_url: string | null
  email: string
  password_hash: string
  is_active: boolean
  created_at: string
}

export interface GalleryImage {
  id: string
  image_url: string
  caption?: string | null
}
