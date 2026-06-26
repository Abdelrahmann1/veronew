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
3. Paste both into [`config.js`](config.js), and set `ADMIN_EMAIL` to the address that
   should access the dashboard (default `admin@gtrvero.com`).

## 2. Create the database
1. Supabase → **SQL Editor → New query**.
2. Paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and **Run**.
   - This creates `submissions`, `payments`, `admins`, the `is_admin()` function,
     all row-level-security policies, and the private `cvs` storage bucket.
   - It seeds the admin allowlist with `admin@gtrvero.com` — **change that line** to
     your real admin email (must match `ADMIN_EMAIL` in `config.js`).
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
- Email sign-ups are **on by default** in Supabase. For instant access during testing,
  you can turn off **Authentication → Providers → Email → "Confirm email"** (otherwise
  new clients must click a confirmation link before signing in).
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
