# Riverside Community Hub - User Stories

This document describes who uses the Riverside Community Hub and what each
person needs to do. I wrote these stories first because everything else in the
project is built on top of them. The database tables come from the nouns in
these stories, and the API endpoints come from the actions. I also added
acceptance criteria under each story so that later I have a clear checklist of
what "done" actually means when I test each feature.

Riverside Community Hub is a made-up non-profit organisation. The app brings
three things together into one platform:

1. A membership portal, where people sign up and manage their profile.
2. A booking system, where members reserve the organisation's facilities.
3. A donation platform, where supporters give money to the organisation.

## The people who use the app (roles)

There are four kinds of people I need to think about:

- **Public visitor** - anyone who lands on the site and is not logged in yet.
- **Member** - a registered, logged-in user who belongs to the community.
- **Admin** - a staff member who runs the organisation and manages everything
  behind the scenes.
- **Donor** - a supporter who gives money. A donor can be a logged-in member or
  a member of the public who just wants to give.

One real person can wear more than one hat. For example a member can also be a
donor. I kept the roles separate in this document because each role needs
different permissions, and permissions are what Row Level Security protects
later in the project.

## Public visitor stories

### V1 - See what the organisation is about
As a public visitor, I want to see a homepage that explains what Riverside
Community Hub does, so that I understand the organisation before I decide to
join or donate.

Acceptance criteria:
- The homepage loads without needing to log in.
- It clearly describes the organisation and shows links to sign up and donate.

### V2 - Browse the facilities
As a public visitor, I want to see the list of facilities the organisation
offers, so that I know what I could book if I became a member.

Acceptance criteria:
- The facilities list is visible without logging in.
- Each facility shows a name and a short description.
- I cannot actually book a facility until I log in.

### V3 - Create an account
As a public visitor, I want to register with my email and a password, so that I
can become a member and access member features.

Acceptance criteria:
- I can sign up with an email and a password.
- After signing up I become a logged-in member.
- The same email cannot be used to register twice.

### V4 - Donate without an account
As a public visitor, I want to make a donation even if I am not logged in, so
that giving is easy and I am not forced to create an account first.

Acceptance criteria:
- I can start a donation from a public page.
- I can complete a donation without logging in.
- My donation is recorded so the organisation can see it.

## Member stories

### M1 - Log in and log out
As a member, I want to log in and log out securely, so that only I can reach my
own account.

Acceptance criteria:
- I can log in with the email and password I registered with.
- If my details are wrong, I am told the login failed.
- I can log out, and after that I can no longer reach member-only pages.

### M2 - View and edit my profile
As a member, I want to see and update my own profile information, so that my
details stay correct.

Acceptance criteria:
- I can see my own profile details.
- I can update my details and the change is saved.
- I can only see and edit my own profile, never anyone else's.

### M3 - Book a facility
As a member, I want to book a facility for a date and time, so that I can use
the organisation's spaces.

Acceptance criteria:
- I can pick a facility, a date, and a time slot.
- The booking is saved and linked to my account.
- I cannot book a slot that is already taken.

### M4 - See my bookings
As a member, I want to see a list of my own bookings, so that I can keep track
of what I have reserved.

Acceptance criteria:
- I see only the bookings that belong to me.
- Each booking shows the facility, the date, and the time.

### M5 - Cancel my booking
As a member, I want to cancel a booking I made, so that I can free up the slot
if my plans change.

Acceptance criteria:
- I can cancel a booking that belongs to me.
- After cancelling, that slot becomes available again.
- I cannot cancel a booking that belongs to someone else.

## Donor stories

### D1 - Make a donation
As a donor, I want to give a chosen amount of money to the organisation, so
that I can support its work.

Acceptance criteria:
- I can enter an amount and complete a donation.
- I get a confirmation that the donation went through.
- The donation is recorded with the amount and the date.

### D2 - See my giving history (logged-in donor)
As a donor who is also a logged-in member, I want to see the donations I have
made, so that I have a record of my support.

Acceptance criteria:
- I see only my own donations, not anyone else's.
- Each entry shows the amount and the date.

## Admin stories

### A1 - Manage facilities
As an admin, I want to add, edit, and remove facilities, so that the booking
list always reflects what the organisation actually offers.

Acceptance criteria:
- I can create a new facility with a name and description.
- I can edit or remove an existing facility.
- Only admins can do this, never ordinary members.

### A2 - See all bookings
As an admin, I want to see every booking across all members, so that I can
manage the organisation's schedule.

Acceptance criteria:
- I can see all bookings, not just my own.
- I can see which member made each booking.

### A3 - See donation reporting
As an admin, I want to see a report of all donations, so that I can understand
how much support the organisation is receiving.

Acceptance criteria:
- I can see the total amount donated.
- I can see the list of individual donations with amounts and dates.
- Only admins can see this report.

### A4 - Manage members
As an admin, I want to see the list of members, so that I know who belongs to
the community.

Acceptance criteria:
- I can see the list of registered members.
- Only admins can reach this list.

## Why these stories matter for the rest of the build

I am listing this on purpose so that the link between the stories and the code
is easy to follow when I explain the project:

- The **nouns** in these stories (member, profile, facility, booking, donation)
  become the **database tables** in my ERD in the next document.
- The **actions** (register, log in, book, cancel, donate, report) become the
  **API endpoints** in my API contract.
- The **"I can only see my own..." rules** (my profile, my bookings, my
  donations) are exactly what **Row Level Security** enforces in the database.
  This is the part of the project that is graded on every table, so I wanted it
  written down as a requirement from the very start, not added at the end.

## Out of scope for now

To keep the project realistic for the timeline, these are things I am
deliberately not building in the first version:

- Real card payments through a live payment provider. I will record donations
  in the database and can note where a real payment gateway would connect.
- Email notifications and reminders.
- A public directory of members (this would also be a privacy concern).
