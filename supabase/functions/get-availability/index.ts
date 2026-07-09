// ============================================================
// GTR by Vero UK — get-availability (Supabase Edge Function)
// Returns which of the site's fixed morning/evening slots are
// actually free on the owner's real Google Calendar for a given day.
// Public (no user auth needed) — only exposes true/false per slot,
// never any event details.
// Secrets: GOOGLE_* (see _shared/google-calendar.ts).
// ============================================================
import { getFreeBusy } from "../_shared/google-calendar.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// Same fixed windows as the site's booking picker (script.js SLOT_GROUPS).
const SLOT_TIMES = [
  "06:00", "06:30", "07:00", "07:30", "08:00",
  "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30",
];
const SLOT_DURATION_MIN = 30;
const TZ = Deno.env.get("GOOGLE_TIMEZONE") ?? "Europe/London";

// Converts a UK wall-clock time on `date` (YYYY-MM-DD) to a UTC ISO string,
// handling BST/GMT automatically — mirrors script.js's ukSlotToISO.
function ukTimeToISO(dateStr: string, hh: number, mm: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const guessUTC = Date.UTC(y, m - 1, d, hh, mm);
  const asUK = new Date(new Date(guessUTC).toLocaleString("en-US", { timeZone: TZ })).getTime();
  const asUTC = new Date(new Date(guessUTC).toLocaleString("en-US", { timeZone: "UTC" })).getTime();
  return new Date(guessUTC - (asUK - asUTC)).toISOString();
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { date } = await req.json();   // "YYYY-MM-DD", interpreted as a UK calendar day
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: "date (YYYY-MM-DD) is required" }, 400);

    try {
      const dayStartISO = ukTimeToISO(date, 0, 0);
      const dayEndISO = ukTimeToISO(date, 23, 59);
      const busy = await getFreeBusy(dayStartISO, dayEndISO);
      const busyRanges = busy.map((b) => ({ start: new Date(b.start).getTime(), end: new Date(b.end).getTime() }));

      const slots: Record<string, boolean> = {};
      for (const t of SLOT_TIMES) {
        const [hh, mm] = t.split(":").map(Number);
        const start = new Date(ukTimeToISO(date, hh, mm)).getTime();
        const end = start + SLOT_DURATION_MIN * 60000;
        slots[t] = !busyRanges.some((b) => overlaps(start, end, b.start, b.end));
      }
      return json({ ok: true, slots });
    } catch (e) {
      // If the calendar connection is down/misconfigured, fail OPEN (show
      // every slot as available) so a config issue never blocks bookings
      // entirely — matches this project's calendar-sync error handling
      // elsewhere (best-effort, never blocks the booking).
      console.error("get-availability degraded:", e);
      const slots: Record<string, boolean> = {};
      for (const t of SLOT_TIMES) slots[t] = true;
      return json({ ok: true, slots, degraded: true });
    }
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
