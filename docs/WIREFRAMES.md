# Riverside Community Hub - Wireframes

These are low-fidelity wireframes. They are drawn with simple text boxes on
purpose. At this stage I care about what is on each screen and who can see it,
not about colours or exact spacing. The visual design comes later in the build.
I list the role that sees each screen and the brief requirement it satisfies, so
every screen traces back to something the client asked for.

Legend:
- `[ Button ]` is a button.
- `[____]` is a text input.
- `( )` is a radio option, `[v]` is a dropdown.
- Anything in CAPS at the top of a box is the screen or section name.

## Screen map (which role sees what)

- Public visitor: Landing, Resource Catalogue, Donation Drive, Sign Up, Log In.
- Member: everything public, plus Member Dashboard, Book a Resource, My
  Bookings, My Profile.
- Staff: Admin Dashboard (bookings queue, resources, member list).
- Admin: everything staff sees, plus Reports, Campaigns, Staff management.

---

## 1. Landing page  (public - brief 5.5)

```
+----------------------------------------------------------+
|  RIVERSIDE COMMUNITY HUB          [ Log In ] [ Sign Up ] |
+----------------------------------------------------------+
|                                                          |
|   Welcome to Riverside Community Hub                     |
|   Youth programmes, a community gym, event rooms,        |
|   and a food-parcel donation drive.                      |
|                                                          |
|   [ Become a Member ]      [ Donate Now ]                |
|                                                          |
+----------------------------------------------------------+
|  OUR PROGRAMMES                                          |
|  +----------+  +----------+  +----------+                |
|  | Youth    |  | Gym      |  | Event    |                |
|  | programs |  | access   |  | rooms    |                |
|  +----------+  +----------+  +----------+                |
+----------------------------------------------------------+
|  DONATION DRIVE PROGRESS                                 |
|  Winter Food Parcels                                     |
|  [##########............] R28,000 of R50,000            |
|  [ Support this drive ]                                  |
+----------------------------------------------------------+
|  Footer: contact, hours, "student project" note          |
+----------------------------------------------------------+
```

## 2. Resource catalogue with availability  (public - brief 5.5, 5.2)

```
+----------------------------------------------------------+
|  FACILITIES & EQUIPMENT                                  |
|  Filter: [ All (v) ]  [ Rooms ]  [ Equipment ]           |
+----------------------------------------------------------+
|  +--------------------+   +--------------------+          |
|  | Main Hall (room)   |   | Meeting Room (room)|          |
|  | Capacity: 100      |   | Capacity: 12       |          |
|  | Availability: green|   | Availability: busy |          |
|  | [ View / Book ]    |   | [ View / Book ]    |          |
|  +--------------------+   +--------------------+          |
|  +--------------------+   +--------------------+          |
|  | Projector (equip)  |   | PA System (equip)  |          |
|  | Units: 2           |   | Units: 1           |          |
|  | [ View / Book ]    |   | [ View / Book ]    |          |
|  +--------------------+   +--------------------+          |
+----------------------------------------------------------+
```
Note: a public visitor can browse and see availability. Clicking Book when not
logged in sends them to Log In first.

## 3. Donation drive page  (public - brief 5.3, 5.5)

```
+----------------------------------------------------------+
|  DONATE TO RIVERSIDE                                     |
+----------------------------------------------------------+
|  Campaign: Winter Food Parcels                           |
|  [##########............] R28,000 of R50,000            |
|                                                          |
|  Amount:  [ R____ ]                                      |
|  Type:    ( ) One-off   ( ) Adopt a food parcel (pledge)|
|  Name (optional if anonymous): [____________]           |
|                                                          |
|  [ Give Now ]                                            |
|                                                          |
|  Note: donations can be made without an account.         |
+----------------------------------------------------------+
```

## 4. Sign up  (public - brief 5.1)

```
+---------------------------------------+
|  CREATE YOUR MEMBERSHIP               |
+---------------------------------------+
|  Full name:     [__________________]  |
|  Contact info:  [__________________]  |
|  Email:         [__________________]  |
|  Password:      [__________________]  |
|  Membership:    [ Free (v) ]          |
|                                       |
|  [ Sign Up ]                          |
|  We will email you to verify.         |
+---------------------------------------+
```
Note: email verification is required (brief 5.1). New users default to the
member role.

## 5. Log in  (public - brief 5.1)

```
+---------------------------------------+
|  LOG IN                               |
+---------------------------------------+
|  Email:     [__________________]      |
|  Password:  [__________________]      |
|  [ Log In ]                           |
|  Forgot password?                     |
+---------------------------------------+
```

## 6. Member dashboard  (member - brief 5.1)

```
+----------------------------------------------------------+
|  RIVERSIDE            My Bookings  Donate  Profile  Logout|
+----------------------------------------------------------+
|  Hi, Thabo                                               |
|                                                          |
|  MEMBERSHIP STATUS                                       |
|  Tier: Standard    Expires: 2026-10-05                   |
|  [ ! Expiring soon ]  (shows only inside 30 days)        |
|                                                          |
|  QUICK ACTIONS                                           |
|  [ Book a resource ]  [ View my bookings ]  [ Donate ]  |
+----------------------------------------------------------+
```

## 7. Book a resource  (member - brief 5.2)

```
+----------------------------------------------------------+
|  BOOK: Main Hall                                         |
+----------------------------------------------------------+
|  Date:   [ 2026-09-20 ]                                  |
|  From:   [ 14:00 ]     To:  [ 16:00 ]                    |
|                                                          |
|  Availability for this day:                              |
|  09:00 [free]  11:00 [free]  14:00 [you]  16:00 [taken]  |
|                                                          |
|  [ Request Booking ]                                     |
|                                                          |
|  Your request goes to staff for approval.                |
|  Overlapping times are blocked by the system.            |
+----------------------------------------------------------+
```
Note: conflict prevention is enforced at the database and API level, not just
here (brief 5.2).

## 8. My bookings  (member - brief 5.2)

```
+----------------------------------------------------------+
|  MY BOOKINGS                                             |
+----------------------------------------------------------+
|  Resource     Date         Time        Status    Action  |
|  Main Hall    2026-09-20   14:00-16:00 pending    [x]    |
|  Meeting Rm   2026-09-12   10:00-11:00 approved   [x]    |
|  Projector    2026-09-01   09:00-10:00 cancelled   -     |
+----------------------------------------------------------+
|  [x] = cancel this booking (only my own, if not past)    |
+----------------------------------------------------------+
```

## 9. My profile  (member - brief 5.1)

```
+---------------------------------------+
|  MY PROFILE                           |
+---------------------------------------+
|  Full name:     [ Thabo M________ ]   |
|  Contact info:  [ 072 000 0000___ ]   |
|  Membership:    Standard (read only)  |
|  Joined:        2025-10-05            |
|  Expires:       2026-10-05            |
|  [ Save Changes ]                     |
+---------------------------------------+
```
Note: a member can edit only their own profile. Tier is changed by an admin, so
it is read-only here.

## 10. Admin dashboard - overview  (staff + admin - brief 5.4)

```
+----------------------------------------------------------+
|  ADMIN            Bookings  Resources  Members  Reports  |
|                   Campaigns  Staff                       |
+----------------------------------------------------------+
|  THIS MONTH                                              |
|  Bookings: 42     Donations: R31,500     Members: 118   |
+----------------------------------------------------------+
|  PENDING BOOKINGS QUEUE                                  |
|  Member     Resource    Date/Time         Action         |
|  Thabo M    Main Hall   09-20 14:00-16:00 [Approve][Reject]|
|  Naledi K   Projector   09-21 09:00-10:00 [Approve][Reject]|
+----------------------------------------------------------+
```
Note: Reports, Campaigns, and Staff tabs are admin only. Staff see Bookings,
Resources, and Members.

## 11. Member directory  (staff + admin - brief 5.4)

```
+----------------------------------------------------------+
|  MEMBERS            Search: [__________]  Tier: [All (v)]|
+----------------------------------------------------------+
|  Name        Tier      Joined       Status               |
|  Thabo M     Standard  2025-10-05   Active               |
|  Naledi K    Family    2026-01-11   Expiring soon        |
|  Sipho D     Free      2024-06-30   Expired              |
+----------------------------------------------------------+
|  (paginated - no unbounded lists, brief section 7)       |
+----------------------------------------------------------+
```

## 12. Manage resources  (staff + admin - brief 5.2, 5.4)

```
+----------------------------------------------------------+
|  RESOURCES                              [ + Add resource ]|
+----------------------------------------------------------+
|  Name         Type       Capacity   Action               |
|  Main Hall    room       100        [ Edit ] [ Remove ]  |
|  Meeting Rm   room       12         [ Edit ] [ Remove ]  |
|  Projector    equipment  2          [ Edit ] [ Remove ]  |
+----------------------------------------------------------+
```

## 13. Donation report  (admin only - brief 5.3, 5.4)

```
+----------------------------------------------------------+
|  DONATION REPORT                        [ Export CSV ]   |
+----------------------------------------------------------+
|  Total raised: R31,500      This month: R8,200          |
|                                                          |
|  Donor        Campaign        Amount    Type     Date    |
|  Thabo M      Winter Parcels  R500      one-off  09-02   |
|  (anonymous)  Winter Parcels  R1,000    one-off  09-03   |
|  Naledi K     General         R250      pledge   09-05   |
+----------------------------------------------------------+
```

## 14. Manage campaigns  (admin only - brief 5.3)

```
+----------------------------------------------------------+
|  CAMPAIGNS                              [ + New campaign ]|
+----------------------------------------------------------+
|  Title            Goal      Raised    Active   Action    |
|  Winter Parcels   R50,000   R28,000   yes      [ Edit ]  |
|  Gym Equipment    R20,000   R4,500    no       [ Edit ]  |
+----------------------------------------------------------+
```

---

## Shared UI states (brief section 7)

Every screen that loads data must handle three states. I am noting this once
here so I do not repeat it on every wireframe:

- **Loading**: a spinner or skeleton while data is fetched.
- **Empty**: a friendly message when there is nothing yet (for example "You
  have no bookings").
- **Error**: a clear message and a retry option when a request fails.

Accessibility (brief section 7): all forms are keyboard navigable, use semantic
HTML labels, and keep sufficient colour contrast.
