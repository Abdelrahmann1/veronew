// ============================================================
// GTR by Vero UK — stripe-webhook (Supabase Edge Function)
// Verifies the Stripe signature and records completed payments.
// Uses the service-role key to write to `payments` (bypasses RLS).
// Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
//          SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// NOTE: deploy with --no-verify-jwt (Stripe calls it unauthenticated).
// ============================================================
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

const admin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig!, webhookSecret);
  } catch (e) {
    return new Response(`Webhook signature error: ${String(e)}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    const { error } = await admin.from("payments").insert([{
      stripe_session_id: s.id,
      payment_intent: typeof s.payment_intent === "string" ? s.payment_intent : null,
      email: s.customer_details?.email ?? null,
      name: s.customer_details?.name ?? null,
      plan: s.metadata?.plan ?? null,
      package_name: (s.metadata?.plan ?? null),
      amount: s.amount_total ?? null,
      currency: s.currency ?? "gbp",
      status: "paid",
      user_id: s.metadata?.user_id || null,
    }]);
    if (error) return new Response(`DB error: ${error.message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
