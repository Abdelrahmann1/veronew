// ============================================================
// GTR by Vero UK — add-to-calendar (Supabase Edge Function)
// Called by the site after a signed-in client books a slot.
// Verifies the caller's token, then creates the event on the
// admin's Google Calendar via the shared helper.
// Secrets: GOOGLE_* (see _shared/google-calendar.ts) + SUPABASE_*.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createCalendarEvent } from "../_shared/google-calendar.ts";
import { sendEmail, meetingClientHtml, meetingStaffHtml, STAFF_NOTIFY_EMAIL } from "../_shared/send-email.ts";

const admin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { userToken, summary, description, startISO, name, note } = await req.json();

    // Only a signed-in user may schedule (form bookings are gated behind auth).
    if (!userToken) return json({ error: "Unauthorized" }, 401);
    const { data } = await admin.auth.getUser(userToken);
    if (!data.user) return json({ error: "Unauthorized" }, 401);

    if (!startISO) return json({ ok: true, skipped: "no booking time" });

    const { meetLink } = await createCalendarEvent({
      summary: summary || "GTR booking",
      description: description || "",
      startISO,
    });

    // Email the client + a staff copy with the Meet link (best-effort — a
    // failed email never blocks the booking, which already succeeded above).
    if (meetLink) {
      const whenText = new Date(startISO).toLocaleString("en-GB", {
        timeZone: Deno.env.get("GOOGLE_TIMEZONE") ?? "Europe/London",
        weekday: "short", day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
      // Always the caller's own verified account email (from the JWT), never
      // the client-supplied `email` field — otherwise a signed-in user could
      // redirect someone else's meeting-link email to any address they type.
      const clientEmail = data.user.email;
      try {
        if (clientEmail) {
          await sendEmail({
            to: clientEmail,
            subject: "Your session with GTR by Vero UK is booked",
            html: meetingClientHtml({ name, whenText, meetLink }),
          });
        }
        await sendEmail({
          to: STAFF_NOTIFY_EMAIL,
          subject: "New booking — " + (name || clientEmail || "Client"),
          html: meetingStaffHtml({ name, email: clientEmail, whenText, meetLink, note }),
        });
      } catch (e) {
        console.error("meeting-link email failed:", e);
      }
    }
    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
