// ============================================================
// GTR by Vero UK — Google Calendar helper (shared)
// Creates an event on the admin's calendar using a Google
// service account (no per-user OAuth). The admin shares their
// calendar with the service account's email; events land there.
//
// Secrets used:
//   GOOGLE_SERVICE_ACCOUNT_EMAIL  — e.g. vero-cal@project.iam.gserviceaccount.com
//   GOOGLE_PRIVATE_KEY            — the service account private key (PEM)
//   GOOGLE_CALENDAR_ID            — the calendar to write to (usually your email)
//   GOOGLE_TIMEZONE              — optional, default "Europe/London"
// ============================================================
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

// PEM (PKCS8) → ArrayBuffer. Tolerates both real newlines and "\n" literals.
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\\n/g, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function getAccessToken(): Promise<string> {
  const email = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL") ?? "";
  const pk = Deno.env.get("GOOGLE_PRIVATE_KEY") ?? "";
  if (!email || !pk) throw new Error("Google service account secrets are not set");

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(pk),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const jwt = await create(
    { alg: "RS256", typ: "JWT" },
    {
      iss: email,
      scope: "https://www.googleapis.com/auth/calendar",
      aud: "https://oauth2.googleapis.com/token",
      iat: getNumericDate(0),
      exp: getNumericDate(60 * 60),
    },
    key,
  );

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const j = await res.json();
  if (!j.access_token) throw new Error("Google token error: " + JSON.stringify(j));
  return j.access_token as string;
}

export interface CalendarEvent {
  summary: string;
  description?: string;
  startISO: string;       // ISO datetime
  durationMin?: number;   // default 30
}

export interface CalendarEventResult {
  meetLink: string | null;   // Google Meet join link, if one was created
}

export async function createCalendarEvent(ev: CalendarEvent): Promise<CalendarEventResult> {
  const calendarId = Deno.env.get("GOOGLE_CALENDAR_ID") ?? "";
  if (!calendarId) throw new Error("GOOGLE_CALENDAR_ID is not set");
  const tz = Deno.env.get("GOOGLE_TIMEZONE") ?? "Europe/London";

  const token = await getAccessToken();
  const start = new Date(ev.startISO);
  const end = new Date(start.getTime() + (ev.durationMin ?? 30) * 60000);

  const body = {
    summary: ev.summary,
    description: ev.description ?? "",
    start: { dateTime: start.toISOString(), timeZone: tz },
    end: { dateTime: end.toISOString(), timeZone: tz },
    // NB: no attendees — service accounts can't send invites without
    // domain-wide delegation; client details go in the description instead.
    conferenceData: {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`,
    {
      method: "POST",
      headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error("Calendar insert failed (" + res.status + "): " + (await res.text()));
  const data = await res.json();
  return { meetLink: data.hangoutLink ?? null };
}
