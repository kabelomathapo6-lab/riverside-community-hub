# Riverside Community Hub - Entity Relationship Diagram (ERD)

This document describes the database. It comes straight out of the client brief
and the user stories. The nouns in the brief (profile, resource, booking,
donation, campaign, notification) are the six tables here. I designed the whole
database before writing any SQL so that in Phase 2 I can build the schema and
the Row Level Security policies in one clean pass.

I am using Supabase, which runs on PostgreSQL. That matters for two design
choices I explain below: how I handle user accounts, and how I prevent
double-booking at the database level.

## How authentication fits in (important)

Supabase has its own built-in table called `auth.users`. That table stores the
real login identity: the email, the hashed password, and a unique id. I do not
create that table and I do not edit it directly. Supabase owns it.

Instead I create my own table called `profiles` in the public schema. Each row
in `profiles` has the same id as a row in `auth.users`. This is the standard
Supabase pattern. The reason is separation: `auth.users` is for logging in, and
`profiles` is for the application data I actually need (name, role, membership
tier). When someone registers and verifies their email, a new `profiles` row is
created that points back to their `auth.users` id.

So the link is: `auth.users.id` (managed by Supabase) === `profiles.id` (managed
by me).

## The four roles

The brief defines four roles, and I model them with a single `role` text column
on `profiles`. I chose one column over a separate permissions table because
there are only four fixed roles and it is the easiest design to explain and to
write RLS policies against.

- **public visitor** - not logged in. This is not a stored role, it is simply
  the absence of a login. Public visitors can browse and donate.
- **member** - a signed-up user. Books resources, manages their own bookings,
  views their membership status, donates.
- **staff** - approves or rejects bookings, manages resources, views the member
  list.
- **admin** - everything staff can do, plus manages staff accounts, views
  donation and financial reports, and configures campaigns.

A new sign-up is always `member`. Staff and admin are set on purpose by an
existing admin, so nobody can promote themselves.

## The tables at a glance

```
             auth.users  (managed by Supabase, not by me)
                  |
                  | 1 to 1  (same id)
                  v
      +-----------------------+
      |       profiles        |
      +-----------------------+
      | id (PK, FK)           |
      | full_name             |
      | contact_info          |
      | role                  |
      | membership_tier       |
      | joined_at             |
      | membership_expires_at |
      +-----------------------+
          |        |        |
   1..many|        |        |1..many
          v        |        v
   +-----------+   |   +----------------+
   | bookings  |   |   | notifications  |
   +-----------+   |   +----------------+
   | id (PK)   |   |   | id (PK)        |
   | resource_id FK|   | user_id (FK)   |
   | member_id (FK)|   | message        |
   | start_time    |   | read           |
   | end_time      |   | created_at     |
   | status        |   +----------------+
   | created_at    |
   +-----------+
        |
        |many to 1
        v
   +------------+        +----------------+
   | resources  |        |   donations    |
   +------------+        +----------------+
   | id (PK)    |        | id (PK)        |
   | name       |        | donor_id (FK)? |  null = anonymous
   | type       |        | campaign_id FK |
   | capacity   |        | amount         |
   | description|        | pledge_type    |
   | created_at |        | donor_name ?   |
   +------------+        | created_at     |
                         +----------------+
                                |
                                |many to 1
                                v
                         +----------------+
                         |   campaigns    |
                         +----------------+
                         | id (PK)        |
                         | title          |
                         | goal_amount    |
                         | current_amount |
                         | active         |
                         | created_at     |
                         +----------------+
```

## Table details

### profiles
Application data for each registered user. One row per user, sharing the id of
the matching `auth.users` row.

| Column                | Type        | Notes                                              |
|-----------------------|-------------|----------------------------------------------------|
| id                    | uuid        | Primary key. Foreign key to auth.users.id.         |
| full_name             | text        | The member's name.                                 |
| contact_info          | text        | Phone or other contact detail.                     |
| role                  | text        | 'member', 'staff', or 'admin'. Defaults 'member'.  |
| membership_tier       | text        | 'Free', 'Standard', or 'Family'. Defaults 'Free'.  |
| joined_at             | timestamptz | When they joined. Defaults now().                  |
| membership_expires_at | timestamptz | When the membership lapses. Drives the flag below. |

Notes:
- `role` is the most important column for security. Staff and admin RLS policies
  check it.
- "Expiring soon" is not a stored column. It is computed: a membership is
  expiring soon when `membership_expires_at` is within the next 30 days. Storing
  the real expiry date and computing the flag keeps one source of truth, and it
  lets an admin do the manual renewal the brief allows by just pushing the date
  out.

### resources
The bookable rooms and equipment. Managed by staff and admin. Seed data is 3
room types and 2 equipment categories.

| Column      | Type        | Notes                                          |
|-------------|-------------|------------------------------------------------|
| id          | uuid        | Primary key.                                   |
| name        | text        | For example "Main Hall" or "Projector".        |
| type        | text        | 'room' or 'equipment'.                          |
| capacity    | integer     | How many people or units. Null if not relevant.|
| description | text        | A short description.                            |
| created_at  | timestamptz | Defaults now().                                 |

Notes:
- Readable by everyone, including public visitors (they view availability).
- Only staff and admin can insert, update, or delete.

### bookings
A request by one member to use one resource for a period of time. Goes through a
staff approval workflow.

| Column      | Type        | Notes                                                         |
|-------------|-------------|---------------------------------------------------------------|
| id          | uuid        | Primary key.                                                  |
| resource_id | uuid        | Foreign key to resources.id.                                  |
| member_id   | uuid        | Foreign key to profiles.id. Who is booking.                   |
| start_time  | timestamptz | Start of the slot.                                            |
| end_time    | timestamptz | End of the slot.                                              |
| status      | text        | 'pending', 'approved', 'rejected', or 'cancelled'. Default 'pending'. |
| created_at  | timestamptz | Defaults now().                                               |

Notes:
- A new booking starts as 'pending'. Staff or admin move it to 'approved' or
  'rejected'. A member can 'cancel' their own booking.
- No booking is ever hard-deleted. The status column keeps the history.
- **Double-booking is prevented at the database level, not just the UI.** The
  brief requires this. My plan is a Postgres exclusion constraint on `bookings`
  using the `btree_gist` extension, so that two approved bookings for the same
  resource cannot have overlapping time ranges. The database itself rejects the
  clash. I write the exact constraint in Phase 2, but I am recording the
  decision here so the design is intentional. The API also checks first and
  returns a friendly error, but the database is the real guard.

### donations
A gift of money. Can come from a logged-in member or an anonymous public
visitor, and is optionally tied to a campaign.

| Column      | Type        | Notes                                                        |
|-------------|-------------|--------------------------------------------------------------|
| id          | uuid        | Primary key.                                                 |
| donor_id    | uuid, null  | Foreign key to profiles.id. NULL when anonymous.             |
| campaign_id | uuid, null  | Foreign key to campaigns.id. Which drive this supports.      |
| amount      | numeric     | The amount. A number, not text, so totals add up correctly.  |
| pledge_type | text        | 'one_off' or 'recurring'. Recurring is logged as intent only.|
| donor_name  | text, null  | Optional name for an anonymous gift.                         |
| created_at  | timestamptz | Defaults now().                                              |

Notes:
- `donor_id` is nullable on purpose. The brief allows public, anonymous
  donations, so a donation can exist with no linked profile.
- `pledge_type` records the "adopt a food parcel" recurring pledge as an
  intention. There is no real recurring billing in this version, which the brief
  explicitly permits.
- Anyone can insert a donation. Only admins can read the full list and export it.

### campaigns
A fundraising drive with a goal, for example "R50,000 for winter parcels". Drives
the public progress bar.

| Column         | Type        | Notes                                             |
|----------------|-------------|---------------------------------------------------|
| id             | uuid        | Primary key.                                      |
| title          | text        | The campaign name.                                |
| goal_amount    | numeric     | The fundraising target.                           |
| current_amount | numeric     | How much has been raised. Defaults 0.             |
| active         | boolean     | Whether the campaign is currently running.        |
| created_at     | timestamptz | Defaults now().                                   |

Notes:
- Readable by everyone (the progress bar is public).
- Only admins create or configure campaigns.
- `current_amount` is kept in step with the sum of that campaign's donations.

### notifications
A simple in-app message to one user, used for booking status changes.

| Column     | Type        | Notes                                          |
|------------|-------------|------------------------------------------------|
| id         | uuid        | Primary key.                                   |
| user_id    | uuid        | Foreign key to profiles.id. Who it is for.     |
| message    | text        | The notification text.                          |
| read       | boolean     | Whether the user has read it. Defaults false.   |
| created_at | timestamptz | Defaults now().                                 |

Notes:
- The brief allows email or in-app notification on booking status change. I chose
  in-app because it needs no email provider and is fully testable.
- A user can read and update (mark as read) only their own notifications.

## Relationships summary

- **profiles to auth.users**: one to one, same id. Supabase owns auth.users.
- **profiles to bookings**: one to many. A member has many bookings.
- **resources to bookings**: one to many. A resource has many bookings.
- **profiles to donations**: one to many but optional. A donation may have no
  profile (anonymous).
- **campaigns to donations**: one to many. A campaign receives many donations.
- **profiles to notifications**: one to many. A user has many notifications.

## Row Level Security plan (graded on every table)

Row Level Security (RLS) filters rows at the database level based on who is
asking. Even if the frontend has a bug, the database refuses to hand back rows a
user is not allowed to see. RLS is turned on for every table. The brief states
this must be enforced by RLS, not just hidden UI, and it is a checkpoint
criterion. Here is the plan in plain English before I write the policies in
Phase 2:

- **profiles**: a user reads and updates only their own row (`auth.uid() = id`).
  Staff and admin can read all profiles (the member directory).
- **resources**: everyone can read. Only staff and admin can write.
- **bookings**: a member reads and cancels only their own rows
  (`auth.uid() = member_id`) and can only create bookings with their own id.
  Staff and admin can read all bookings and change status (approve/reject).
- **donations**: a logged-in donor reads only their own rows. Anyone can insert
  (including anonymous). Only admin can read the full list and export.
- **campaigns**: everyone can read. Only admin can write.
- **notifications**: a user reads and updates only their own rows.

The phrase "their own" is done in Supabase with `auth.uid()`, which returns the
id of the user making the request. That function is the heart of almost every
policy in this project.

The role checks (staff, admin) are done by looking up the caller's `role` in
`profiles`. In Phase 2 I will wrap that lookup in a small helper function so the
policies stay readable.

## Design decisions I want to be able to explain

- **Single role column** instead of a separate roles table. Four fixed roles do
  not need the extra complexity, and it keeps the RLS policies short.
- **Explicit `membership_expires_at`** instead of computing expiry from
  `joined_at`. One source of truth, and admins can renew by moving the date.
- **Status columns instead of deleting** bookings, so history is preserved and
  the approval workflow has real states.
- **Double-booking blocked in the database** with an exclusion constraint, not
  only in the UI, because the brief makes this a hard requirement.
- **In-app notifications** rather than email, so the feature is fully testable
  without an email provider.
- **No card details stored anywhere.** Donations record an amount and a pledge
  type only. Real payment gateway integration is a stretch goal, not part of
  this version.
