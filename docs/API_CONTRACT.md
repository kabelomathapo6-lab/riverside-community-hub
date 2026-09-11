# Riverside Community Hub - API Contract

This document lists every endpoint the backend provides: the method, the path,
who is allowed to call it, what it expects in the request, and what it sends
back. I wrote this before building the routes so that the frontend and backend
agree on every shape from the start. The types named here (Profile, Resource,
Booking, Donation, Campaign, Notification) live in `shared/types.ts` and are
imported by both halves, which is how the brief's "typed contracts between
frontend and backend" requirement is met.

## Conventions

- Base URL in development: `http://localhost:4000`.
- All request and response bodies are JSON.
- Auth is done with a Supabase access token sent as
  `Authorization: Bearer <token>`. Endpoints marked "public" need no token.
- Errors use one shape, `ApiError`, which is `{ "error": "message" }`, and the
  correct HTTP status code (400, 401, 403, 404, 409, 500).
- List endpoints are paginated and return `Paginated<T>`:
  `{ data, page, pageSize, total }`. The brief requires no unbounded queries.
- "Own" means the row belongs to the caller. The database enforces this with Row
  Level Security using `auth.uid()`, so the API is not the only guard.

## Roles quick reference

- **public**: no token needed.
- **member**: any logged-in user.
- **staff**: role is staff or admin.
- **admin**: role is admin only.

---

## Health

### GET /health
Who: public.
Purpose: check the API is running.
Response 200:
```json
{ "status": "ok", "service": "riverside-hub-api" }
```

---

## Auth and profile

Supabase Auth handles sign up, email verification, and login on the client using
the anon key. The backend does not create passwords. These endpoints deal with
the `profiles` row that pairs with the Supabase user.

### GET /profiles/me
Who: member.
Purpose: get the logged-in user's own profile.
Response 200: `Profile`.
Errors: 401 if not logged in, 404 if the profile row does not exist yet.

### PATCH /profiles/me
Who: member.
Purpose: update the caller's own profile (name, contact info).
Request body:
```json
{ "full_name": "Thabo M", "contact_info": "072 000 0000" }
```
Response 200: the updated `Profile`.
Notes: a member cannot change their own `role` or `membership_tier` here. Those
are admin actions.

### GET /profiles
Who: staff, admin.
Purpose: the member directory, with search and filter.
Query params: `page`, `pageSize`, `search` (name), `tier` (membership tier).
Response 200: `Paginated<Profile>`.
Errors: 403 if the caller is a plain member.

### PATCH /profiles/:id
Who: admin.
Purpose: admin changes a user's role or membership tier, or renews membership by
moving `membership_expires_at`.
Request body (any subset):
```json
{ "role": "staff", "membership_tier": "Standard", "membership_expires_at": "2027-10-05" }
```
Response 200: the updated `Profile`.
Errors: 403 if not admin, 404 if the id is unknown.

---

## Resources

### GET /resources
Who: public.
Purpose: the facility and equipment catalogue.
Query params: `type` (room or equipment), `page`, `pageSize`.
Response 200: `Paginated<Resource>`.

### GET /resources/:id
Who: public.
Purpose: one resource's detail.
Response 200: `Resource`. Errors: 404 if not found.

### GET /resources/:id/availability
Who: public.
Purpose: the booked time windows for a resource on a given day, so the UI can
show which slots are free.
Query params: `date` (YYYY-MM-DD).
Response 200:
```json
{ "resource_id": "…", "date": "2026-09-20",
  "booked": [ { "start_time": "…", "end_time": "…" } ] }
```

### POST /resources
Who: staff, admin.
Purpose: add a resource.
Request body:
```json
{ "name": "Main Hall", "type": "room", "capacity": 100, "description": "…" }
```
Response 201: the created `Resource`. Errors: 400 invalid body, 403 not staff.

### PATCH /resources/:id
Who: staff, admin.
Purpose: edit a resource.
Response 200: the updated `Resource`.

### DELETE /resources/:id
Who: staff, admin.
Purpose: remove a resource.
Response 204: no body. Errors: 403 not staff, 404 unknown id.

---

## Bookings

### POST /bookings
Who: member.
Purpose: request a booking. Always created with status `pending` and with the
caller as `member_id`.
Request body:
```json
{ "resource_id": "…", "start_time": "…", "end_time": "…" }
```
Response 201: the created `Booking`.
Errors: 400 invalid times (end before start), 409 if the slot overlaps an
existing approved booking for that resource (conflict prevention), 401 if not
logged in.

### GET /bookings/me
Who: member.
Purpose: the caller's own bookings.
Query params: `page`, `pageSize`, `status`.
Response 200: `Paginated<Booking>`.

### PATCH /bookings/:id/cancel
Who: member (own booking only).
Purpose: cancel the caller's own booking. Sets status to `cancelled`.
Response 200: the updated `Booking`.
Errors: 403 if the booking is not the caller's, 404 unknown id.

### GET /bookings
Who: staff, admin.
Purpose: all bookings, for the queue and schedule.
Query params: `page`, `pageSize`, `status`, `resource_id`.
Response 200: `Paginated<Booking>`.

### PATCH /bookings/:id/status
Who: staff, admin.
Purpose: approve or reject a booking.
Request body:
```json
{ "status": "approved" }
```
(allowed: `approved` or `rejected`)
Response 200: the updated `Booking`. A notification row is created for the member.
Errors: 400 invalid status, 403 not staff, 409 if approving would overlap an
existing approved booking.

---

## Donations

### POST /donations
Who: public (anonymous allowed) or member.
Purpose: record a donation. If the caller is logged in, `donor_id` is set to
their id; otherwise it is null and `donor_name` may be supplied.
Request body:
```json
{ "amount": 500, "campaign_id": "…", "pledge_type": "one_off", "donor_name": "…" }
```
`campaign_id`, `donor_name` optional. `pledge_type` is `one_off` or `recurring`
(recurring is recorded as intent only, no real billing).
Response 201: the created `Donation`.
Errors: 400 if amount is missing or not a positive number.

### GET /donations/me
Who: member.
Purpose: the caller's own giving history.
Response 200: `Paginated<Donation>`.

### GET /donations
Who: admin.
Purpose: the full donation report.
Query params: `page`, `pageSize`, `campaign_id`, `from`, `to`.
Response 200: `Paginated<Donation>` plus a summary block:
```json
{ "data": [ … ], "page": 1, "pageSize": 20, "total": 87,
  "summary": { "total_raised": 31500, "this_month": 8200 } }
```
Errors: 403 if not admin.

### GET /donations/export
Who: admin.
Purpose: CSV export of all donations.
Response 200: `text/csv` file download.

---

## Campaigns

### GET /campaigns
Who: public.
Purpose: campaigns for the progress bars.
Query params: `active` (true/false).
Response 200: `Campaign[]` (small list, not paginated).

### POST /campaigns
Who: admin.
Request body:
```json
{ "title": "Winter Food Parcels", "goal_amount": 50000, "active": true }
```
Response 201: the created `Campaign`. `current_amount` starts at 0.

### PATCH /campaigns/:id
Who: admin.
Purpose: edit a campaign or toggle active.
Response 200: the updated `Campaign`.

---

## Notifications

### GET /notifications/me
Who: member.
Purpose: the caller's own notifications, newest first.
Response 200: `Paginated<Notification>`.

### PATCH /notifications/:id/read
Who: member (own only).
Purpose: mark a notification as read.
Response 200: the updated `Notification`.
Errors: 403 if not the caller's notification.

---

## Type reconciliation note (to apply in Phase 2)

While writing this contract I compared it against the current `shared/types.ts`.
Three small changes are needed so the types match this contract and the ERD.
They are recorded here so the edit is deliberate and tracked, not silent drift:

1. `Donation.campaign: string | null` should become `campaign_id: string | null`,
   to match the ERD foreign key and the request bodies above.
2. `Donation.recurring: boolean` should become
   `pledge_type: "one_off" | "recurring"`, which is more explicit than a boolean
   and matches the donation endpoints.
3. `Donation` needs a new field `donor_name: string | null`, used for anonymous
   gifts in the donation report.

I will make these edits at the start of Phase 2, in the same commit that begins
the backend routes, so the contract and the code stay in step.

## What is intentionally not an endpoint yet

- File uploads to Supabase Storage (IDs, proof of payment, event images) are in
  the brief's tech stack but not wired as API routes in this contract. I will
  add upload endpoints when that feature is built, so I am not documenting a
  route I have not designed.
- Real payment processing. Donations are recorded only. A payment gateway is a
  stretch goal.
