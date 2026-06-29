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
import { createCalendarEvent } from "../_shared/google-calendar.ts";
import { sendEmail, paymentConfirmationHtml } from "../_shared/send-email.ts";

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
    // Upsert on the unique stripe_session_id → idempotent: a Stripe retry or
    // duplicate event updates the same row instead of failing on the constraint.
    const { error } = await admin.from("payments").upsert([{
      stripe_session_id: s.id,
      payment_intent: typeof s.payment_intent === "string" ? s.payment_intent : null,
      email: s.customer_details?.email ?? null,
      name: s.customer_details?.name ?? null,
      plan: s.metadata?.plan ?? null,
      package_name: (s.metadata?.plan ?? null),
      amount: s.amount_total ?? null,
      currency: s.currency ?? "gbp",
      booking_at: s.metadata?.booking_at || null,
      status: "paid",
      user_id: s.metadata?.user_id || null,
    }], { onConflict: "stripe_session_id" });
    if (error) return new Response(`DB error: ${error.message}`, { status: 500 });

    // Send the buyer a branded confirmation email (best-effort).
    const buyerEmail = s.customer_details?.email;
    if (buyerEmail) {
      try {
        const when = s.metadata?.booking_at
          ? new Date(s.metadata.booking_at).toLocaleString("en-GB", {
              timeZone: Deno.env.get("GOOGLE_TIMEZONE") ?? "Europe/London",
              weekday: "short", day: "2-digit", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })
          : undefined;
        await sendEmail({
          to: buyerEmail,
          subject: "Payment confirmed — Thank you for joining GTR by Vero UK",
          html: paymentConfirmationHtml({
            name: s.customer_details?.name,
            plan: s.metadata?.plan,
            amount: "£" + (((s.amount_total ?? 0) / 100).toFixed(2)),
            bookingWhen: when,
          }),
        });
      } catch (e) {
        console.error("email send failed:", e);
      }
    }

    // Mirror the paid booking into the admin's Google Calendar (best-effort:
    // never fail the webhook if calendar sync errors or isn't configured).
    const bookingAt = s.metadata?.booking_at || "";
    if (bookingAt) {
      try {
        await createCalendarEvent({
          summary: "GTR booking — " +
            (s.customer_details?.name || s.customer_details?.email || "Client") +
            " (" + (s.metadata?.plan || "") + ")",
          description:
            "Paid booking\n" +
            "Client: " + (s.customer_details?.name || "") + "\n" +
            "Email: " + (s.customer_details?.email || "") + "\n" +
            "Plan: " + (s.metadata?.plan || "") + "\n" +
            "Amount: £" + (((s.amount_total ?? 0) / 100).toFixed(2)),
          startISO: bookingAt,
        });
      } catch (e) {
        console.error("calendar sync failed:", e);
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
