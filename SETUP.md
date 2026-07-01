# GTR by Vero UK — Backend Setup (Supabase + Stripe)

The website works **without any setup** in *demo mode*: the contact form shows the
thank-you state, pricing buttons fall back to the enquiry form, and the dashboard
shows a setup notice. Follow the steps below to enable real auth, data capture, and
payments.

Everything public lives in `config.js`. The Stripe **secret** key never goes in the
repo — it is stored only as a Supabase function secret that *you* set.

---

## 1. Create a Supabase project
1. Go to https://supabase.com → **New project** (free tier is fine).
2. In **Project Settings → API**, copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
3. Paste both into [`config.js`](config.js). There is no admin email in `config.js` —
   who is an admin is controlled entirely by the `admins` table (step 2/3).

## 2. Create the database
1. Supabase → **SQL Editor → New query**.
2. Paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and **Run**.
   - This creates `submissions`, `payments`, `admins`, the `is_admin()` function,
     all row-level-security policies, and the private `cvs` storage bucket.
   - It seeds the admin allowlist with `admin@gtrvero.com` — **change that line** to
     your real admin email. The `admins` table is the single source of truth: the
     `is_admin()` function checks each signed-in user's email against it, and the site
     calls `is_admin()` (server-side) to decide who reaches the dashboard.
3. **If you ran an earlier version of `schema.sql`** (before client accounts existed),
   also run [`supabase/migrations/002_client_accounts.sql`](supabase/migrations/002_client_accounts.sql).
   It adds the `user_id` columns + per-user policies so logged-in clients can see their
   own data. (A fresh `schema.sql` already includes this — running the migration again is harmless.)

## 3. Create the admin user
1. Supabase → **Authentication → Users → Add user** → create the account using your
   admin email + a password. (Or enable email sign-ups and register once.)
2. That email must exist in the `admins` table (step 2).

### Client (visitor) accounts
Visitors can optionally **sign up / sign in** from the site (nav "Sign in" or the
account page) to track their own enquiries and payments — guests can still enquire
and pay without an account.
- Email sign-ups are **on by default** in Supabase, with **"Confirm email"** required —
  new clients confirm with a **6-digit code emailed to them** (entered right on the
  site, no separate page). For instant access during testing, you can turn this off at
  **Authentication → Providers → Email → "Confirm email"**.
- **Required for the code to actually appear in the email:** Supabase's default
  "Confirm signup" template only shows a clickable link. Go to **Authentication →
  Email Templates → Confirm signup** and edit the body so it includes `{{ .Token }}`,
  e.g.:
  ```
  <h2>Confirm your signup</h2>
  <p>Your confirmation code is: <strong>{{ .Token }}</strong></p>
  <p>Enter it on the site to finish creating your account.</p>
  ```
  (Keep or remove `{{ .ConfirmationURL }}` as you like — the site only asks for the code.)
- Codes expire after **1 hour** by default (**Authentication → Providers → Email →
  "Email OTP Expiration"** to change it) and can be resent from the same screen.
- A signed-in client sees only their own rows (enforced by RLS); the admin sees all.

## 4. Stripe (test mode)
1. In the Stripe Dashboard, toggle **Test mode** (top right).
2. **Developers → API keys**: note your **Secret key** (`sk_test_...`).
   You do **not** need to put any Stripe key in `config.js`.

## 5. Deploy the Edge Functions
Install the Supabase CLI (https://supabase.com/docs/guides/cli), then:

```bash
supabase login
supabase link --project-ref YOUR-PROJECT-REF

# Set secrets (server-side only — never committed):
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx   # from step 6

# Deploy:
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook --no-verify-jwt
```
(`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected into functions automatically.)

## 6. Connect the Stripe webhook
1. Stripe → **Developers → Webhooks → Add endpoint**.
2. Endpoint URL:
   `https://YOUR-PROJECT.supabase.co/functions/v1/stripe-webhook`
3. Event to send: **`checkout.session.completed`**.
4. Copy the endpoint's **Signing secret** (`whsec_...`) and set it as
   `STRIPE_WEBHOOK_SECRET` (step 5), then re-deploy `stripe-webhook`.

## 6b. Google Calendar sync (optional — auto-add bookings to your calendar)
Bookings (form bookings with a date/time, and paid bookings) are auto-added to
your Google Calendar via a **service account**, and each event includes an
auto-generated **Google Meet** link.

Once the event is created, the meeting link is emailed to **both** the client
who booked **and** a fixed staff address (`info@vero-official.com`, set in
[`supabase/functions/_shared/send-email.ts`](supabase/functions/_shared/send-email.ts)
as `STAFF_NOTIFY_EMAIL` — change it there if this address ever changes). This
reuses the `RESEND_API_KEY` / `FROM_EMAIL` secrets already set up for payment
emails (step 4/5) — no extra secrets needed for the meeting-link emails.

1. **Google Cloud Console** → create/select a project → **APIs & Services → Library**
   → enable **Google Calendar API**.
2. **APIs & Services → Credentials → Create credentials → Service account**.
   Create it, then open it → **Keys → Add key → Create new key → JSON** (downloads a file).
3. Open the JSON; you need two fields: `client_email` and `private_key`.
4. **Google Calendar** (calendar.google.com) → your calendar → **Settings and sharing**
   → **Share with specific people** → add the service account's `client_email`
   → permission **"Make changes to events"**.
5. Set the secrets (Supabase → **Edge Functions → Secrets**; paste the multi-line
   private key into the value box):
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` = the `client_email`
   - `GOOGLE_PRIVATE_KEY` = the `private_key` value
   - `GOOGLE_CALENDAR_ID` = the calendar to write to (usually **your email address**)
   - `GOOGLE_TIMEZONE` = optional, default `Europe/London`
6. Deploy the functions:
   ```bash
   supabase functions deploy add-to-calendar
   supabase functions deploy stripe-webhook --no-verify-jwt   # picks up calendar sync for paid bookings
   ```
Form bookings call `add-to-calendar` from the site; paid bookings are added by the
Stripe webhook. Calendar errors are non-fatal — a booking always saves even if sync fails.

## 7. Test
- **Forms:** submit the contact form → a row appears in `submissions`
  (webinar buttons tag it `type = webinar`). CV uploads land in the `cvs` bucket.
- **Payments:** click a paid pricing CTA → Stripe Checkout → pay with test card
  `4242 4242 4242 4242`, any future expiry/CVC → redirected back with a confirmation,
  and a row appears in `payments`.
- **Dashboard:** open `dashboard.html` (or click **Staff login** in the site footer),
  sign in with the admin account → see enquiries, webinar signups, and payments,
  change enquiry statuses, and open uploaded CVs.

---

## What feeds the dashboard
| Source on the site | Stored as | Dashboard tab |
|---|---|---|
| Contact form (all fields + CV) | `submissions` (`type=enquiry`) | Enquiries |
| "Book / register webinar" buttons → form | `submissions` (`type=webinar`) | Webinar |
| Paid pricing CTAs → Stripe Checkout | `payments` | Payments |

## Going live
Swap the Stripe test keys for live keys (`sk_live_…`, new webhook secret), re-deploy
the functions, and keep `config.js` pointing at the same Supabase project.
