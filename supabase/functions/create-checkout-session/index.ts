// ============================================================
// GTR by Vero UK — create-checkout-session (Supabase Edge Function)
// Creates a Stripe Checkout Session for a fixed, server-defined plan.
// Prices live HERE (server-side) so the browser cannot tamper with them.
// If the caller is signed in, their user id is verified from the token
// and attached to the session metadata so the payment links to them.
// Secrets: STRIPE_SECRET_KEY  (SUPABASE_URL + SERVICE_ROLE injected)
// ============================================================
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const admin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// plan id -> { label, amount in pence }
const PLANS: Record<string, { name: string; amount: number }> = {
  assessment:  { name: "Global Talent Assessment", amount: 4900 },
  guidance:    { name: "1:1 Guidance",              amount: 11900 },
  review:      { name: "Document Review",           amount: 14900 },
  mentorship:  { name: "Full Mentorship",           amount: 34900 },
  accelerated: { name: "Accelerated Mentorship",    amount: 94900 },
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Pretty-print the chosen booking slot for the Stripe receipt (UK time).
function formatSlot(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      timeZone: "Europe/London", weekday: "short", day: "2-digit",
      month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { plan, origin, userToken, bookingAt } = await req.json();
    const def = PLANS[plan];
    if (!def) {
      return new Response(JSON.stringify({ error: "Unknown plan" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Optional: resolve the signed-in user from their token (guests allowed).
    let userId = "";
    let email: string | undefined;
    if (userToken) {
      const { data } = await admin.auth.getUser(userToken);
      if (data.user) { userId = data.user.id; email = data.user.email ?? undefined; }
    }

    const base = origin || req.headers.get("origin") || "";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: def.amount,
          product_data: {
            name: "GTR by Vero UK — " + def.name,
            ...(bookingAt ? { description: "Booked for " + formatSlot(bookingAt) } : {}),
          },
        },
      }],
      metadata: { plan, user_id: userId, booking_at: bookingAt || "" },
      success_url: `${base}/thankyou.html`,
      cancel_url: `${base}/index.html?canceled=1`,
    });
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
