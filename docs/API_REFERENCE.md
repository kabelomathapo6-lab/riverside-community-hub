# Riverside Community Hub - API Reference

This is the reference for the backend REST API as it is actually built. It lists
every endpoint, who may call it, the request body it expects, and what it
returns. It reflects the running code, so where the implementation refined the
original Phase 1 contract (for example the donation summary block and the CSV
export), this document is the accurate version.

## Basics

- **Base URL (local):** `http://localhost:4000`
- All bodies are JSON unless noted (the CSV export returns a file).
- **Auth:** send the Supabase access token as `Authorization: Bearer <token>`.
  Endpoints marked public need no token.
- **Errors:** always `{ "error": "message" }` with an appropriate status code.
- **Lists:** paginated as `{ data, page, pageSize, total }`. Query params `page`
  and `pageSize` (pageSize is capped at 50).
- **Roles:** public (no token), member (any logged-in user), staff (role staff
  or admin), admin (role admin only). Roles are enforced by Row Level Security
  in the database and by middleware in the API.

## Health

### GET /health
Public. Confirms the API is running.
`200` → `{ "status": "ok", "service": "riverside-hub-api" }`

## Profiles

### GET /profiles/me
Member. Returns the caller's own profile.
`200` → `Profile`. `401` if not logged in, `404` if no profile row.

### PATCH /profiles/me
Member. Updates the caller's own name or contact info.
Body: `{ "full_name"?: string, "contact_info"?: string }`
`200` → updated `Profile`. A member cannot change their own role or tier here.

### GET /profiles
Staff or admin. The member directory.
Query: `page`, `pageSize`, `search` (name), `tier`.
`200` → `Paginated<Profile>`. `403` if a plain member calls it.

### PATCH /profiles/:id
Admin. Change a user's role or tier, or renew membership by moving
`membership_expires_at`.
Body (any subset): `{ "role", "membership_tier", "membership_expires_at", "full_name", "contact_info" }`
`200` → updated `Profile`. `403` if not admin, `404` if id unknown.

## Resources

### GET /resources
Public. The facility and equipment catalogue.
Query: `type` (room or equipment), `page`, `pageSize`.
`200` → `Paginated<Resource>`.

### GET /resources/:id
Public. One resource.
`200` → `Resource`. `404` if not found.

### GET /resources/:id/availability
Public. The booked time windows for a resource on a given day.
Query: `date` (YYYY-MM-DD, required).
`200` → `{ resource_id, date, booked: [{ start_time, end_time, status }] }`.
Only pending and approved bookings count as busy.
`400` if the date param is missing or malformed.

### POST /resources
Staff or admin. Add a resource.
Body: `{ "name", "type", "capacity"?, "description"? }`
`201` → created `Resource`. `400` invalid body, `403` not staff.

### PATCH /resources/:id
Staff or admin. Edit a resource. `200` → updated `Resource`.

### DELETE /resources/:id
Staff or admin. Remove a resource. `204` no body.

## Bookings

### POST /bookings
Member. Request a booking. Always created as `pending` with the caller as
`member_id`.
Body: `{ "resource_id", "start_time", "end_time" }` (ISO datetimes)
`201` → created `Booking`.
`400` invalid times (end not after start).
`409` if the slot overlaps an existing pending or approved booking for that
resource. This is enforced by a database exclusion constraint.

### GET /bookings/me
Member. The caller's own bookings.
Query: `page`, `pageSize`, `status`.
`200` → `Paginated<Booking>`.

### PATCH /bookings/:id/cancel
Member (own booking only). Sets status to `cancelled`.
`200` → updated `Booking`. `404` if not found or not the caller's.

### GET /bookings
Staff or admin. All bookings, for the queue and schedule.
Query: `page`, `pageSize`, `status`, `resource_id`.
`200` → `Paginated<Booking>`.

### PATCH /bookings/:id/status
Staff or admin. Approve or reject a booking. Creates a notification for the
member.
Body: `{ "status": "approved" | "rejected" }`
`200` → updated `Booking`.
`400` invalid status, `409` if approving would clash with another approved
booking.

## Donations

### POST /donations
Public or member. Records a donation. If a valid token is present the donation
is linked to that user; otherwise it is anonymous and may carry a donor name.
If it names a campaign, that campaign's total is increased.
Body: `{ "amount", "campaign_id"?, "pledge_type"?, "donor_name"? }`
`pledge_type` is `one_off` (default) or `recurring` (recorded as intent only).
`201` → created `Donation`. `400` if amount is missing or not positive.

### GET /donations/me
Member. The caller's own giving history.
`200` → `Paginated<Donation>`.

### GET /donations
Admin. The full donation report with a summary.
Query: `page`, `pageSize`.
`200` → `Paginated<Donation>` plus
`"summary": { "total_raised": number, "this_month": number }`.
`403` if not admin.

### GET /donations/export
Admin. CSV download of all donations.
`200` → `text/csv` file (`donations.csv`). `403` if not admin.

## Campaigns

### GET /campaigns
Public. Campaigns for the progress bars.
Query: `active` (true or false).
`200` → `Campaign[]` (a small list, not paginated).

### POST /campaigns
Admin. Create a campaign. `current_amount` starts at 0.
Body: `{ "title", "goal_amount", "active"? }`
`201` → created `Campaign`. `400` if title or goal missing.

### PATCH /campaigns/:id
Admin. Edit a campaign or toggle active.
Body (any subset): `{ "title", "goal_amount", "active" }`
`200` → updated `Campaign`. `404` if not found.

## Notifications

### GET /notifications/me
Member. The caller's own notifications, newest first.
`200` → `Paginated<Notification>`.

### PATCH /notifications/:id/read
Member (own only). Marks a notification as read.
`200` → updated `Notification`. `404` if not found or not the caller's.

## Data shapes

These are defined in `shared/types.ts` and imported by both the frontend and
backend, so the API and the UI can never disagree about a field.

- **Profile**: id, full_name, contact_info, role, membership_tier, joined_at,
  membership_expires_at
- **Resource**: id, name, type (room or equipment), capacity, description
- **Booking**: id, resource_id, member_id, start_time, end_time, status
  (pending, approved, rejected, cancelled), created_at
- **Donation**: id, donor_id (nullable), campaign_id (nullable), amount,
  pledge_type (one_off or recurring), donor_name (nullable), created_at
- **Campaign**: id, title, goal_amount, current_amount, active
- **Notification**: id, user_id, message, read, created_at
