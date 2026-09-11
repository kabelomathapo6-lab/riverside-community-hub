// shared/types.ts
//
// The single source of truth for the shapes that travel between the
// frontend and backend. Both halves import these, so an API response and
// the component that renders it can never silently disagree about a field.
// This directly satisfies the brief's "typed contracts between frontend
// and backend" requirement.
//
// These mirror the Core Database Schema in the project brief.

export type Role = "member" | "staff" | "admin";
export type MembershipTier = "Free" | "Standard" | "Family";
export type ResourceType = "room" | "equipment";
export type BookingStatus = "pending" | "approved" | "rejected" | "cancelled";

// profiles — one row per user, linked to Supabase auth.users by id
export interface Profile {
  id: string; // fk -> auth.users.id
  full_name: string;
  contact_info: string | null;
  role: Role;
  membership_tier: MembershipTier;
  joined_at: string; // ISO date
  membership_expires_at: string | null; // ISO date, used for "expiring soon"
}

// resources — bookable rooms and equipment
export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  capacity: number;
  description: string | null;
}

// bookings — a member's request to use a resource for a time window
export interface Booking {
  id: string;
  resource_id: string;
  member_id: string;
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
  status: BookingStatus;
  created_at: string;
}

// campaigns — a donation drive with a goal
export interface Campaign {
  id: string;
  title: string;
  goal_amount: number;
  current_amount: number;
  active: boolean;
}

// donations — a contribution, possibly anonymous (donor_id nullable)
export type PledgeType = "one_off" | "recurring";

// donations â€” a contribution, possibly anonymous (donor_id nullable)
export interface Donation {
  id: string;
  donor_id: string | null;
  campaign_id: string | null; // fk -> campaigns.id
  amount: number;
  pledge_type: PledgeType; // "recurring" = adopt-a-parcel pledge intent, no real billing
  donor_name: string | null; // used for anonymous gifts
  created_at: string;
}
// notifications — in-app messages to a user
export interface Notification {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

// ---- API request/response helper shapes ----

// A consistent error shape sent by the API (matches our error handler).
export interface ApiError {
  error: string;
}

// Standard paginated list response (brief requires paginated lists).
export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}
