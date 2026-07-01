// ============================================================
// GTR by Vero UK — email helper (shared)
// Sends transactional email via Resend (https://resend.com).
// Secrets:
//   RESEND_API_KEY  — from resend.com → API Keys
//   FROM_EMAIL      — verified sender, e.g. "GTR by Vero UK <hello@yourdomain.com>"
//                     (falls back to Resend's onboarding sender for testing)
// ============================================================
export interface EmailOpts {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(opts: EmailOpts): Promise<void> {
  const key = Deno.env.get("RESEND_API_KEY") ?? "";
  const from = Deno.env.get("FROM_EMAIL") ?? "GTR by Vero UK <onboarding@resend.dev>";
  if (!key) throw new Error("RESEND_API_KEY is not set");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html }),
  });
  if (!res.ok) throw new Error("Email send failed (" + res.status + "): " + (await res.text()));
}

// The work email that gets a copy of every booking's meeting-link notification.
export const STAFF_NOTIFY_EMAIL = "info@vero-official.com";

// Branded "your session is booked" email for the client, with the Google Meet link.
export function meetingClientHtml(opts: {
  name?: string | null;
  whenText?: string | null;   // formatted local time
  meetLink: string;
}): string {
  const name = opts.name ? opts.name.split(" ")[0] : "there";
  const whenRow = opts.whenText
    ? `<tr><td style="padding:6px 0;color:#6b6258;font-size:14px;">Your session</td><td style="padding:6px 0;text-align:right;color:#1c1813;font-size:14px;font-weight:600;">${opts.whenText}</td></tr>`
    : "";

  return `<!DOCTYPE html><html><body style="margin:0;background:#f4f1eb;font-family:Arial,Helvetica,sans-serif;color:#1c1813;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#fff;border:1px solid #e6dfd2;border-radius:18px;padding:36px;">
      <div style="font-family:'Space Mono',monospace;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#ff7759;margin-bottom:16px;">Booking confirmed</div>
      <h1 style="font-size:26px;line-height:1.2;margin:0 0 12px;color:#17150f;">Your session with GTR by Vero UK is booked.</h1>
      <p style="font-size:15px;line-height:1.6;color:#5f574c;margin:0 0 24px;">Hi ${name}, here are your session details. Join using the link below at the scheduled time.</p>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid #e6dfd2;border-bottom:1px solid #e6dfd2;margin:0 0 24px;">
        ${whenRow}
      </table>
      <p style="margin:0 0 24px;"><a href="${opts.meetLink}" style="display:inline-block;background:#17150f;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:999px;">Join Google Meet</a></p>
      <p style="font-size:12px;line-height:1.6;color:#9b8c77;margin:0;">If you need to reschedule or cancel, use the link in your account page.</p>
    </div>
    <p style="text-align:center;font-size:12px;color:#9b8c77;margin:18px 0 0;">© GTR by Vero UK</p>
  </div></body></html>`;
}

// Internal notification for staff — sent alongside the client's copy.
export function meetingStaffHtml(opts: {
  name?: string | null;
  email?: string | null;
  whenText?: string | null;
  meetLink: string;
  note?: string | null;   // e.g. plan name or interest
}): string {
  return `<!DOCTYPE html><html><body style="margin:0;background:#f4f1eb;font-family:Arial,Helvetica,sans-serif;color:#1c1813;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#fff;border:1px solid #e6dfd2;border-radius:18px;padding:36px;">
      <div style="font-family:'Space Mono',monospace;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#ff7759;margin-bottom:16px;">New booking</div>
      <h1 style="font-size:22px;line-height:1.2;margin:0 0 16px;color:#17150f;">A client has booked a session.</h1>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid #e6dfd2;border-bottom:1px solid #e6dfd2;margin:0 0 24px;">
        <tr><td style="padding:6px 0;color:#6b6258;font-size:14px;">Client</td><td style="padding:6px 0;text-align:right;color:#1c1813;font-size:14px;font-weight:600;">${opts.name || "—"}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6258;font-size:14px;">Email</td><td style="padding:6px 0;text-align:right;color:#1c1813;font-size:14px;font-weight:600;">${opts.email || "—"}</td></tr>
        ${opts.note ? `<tr><td style="padding:6px 0;color:#6b6258;font-size:14px;">Interested in</td><td style="padding:6px 0;text-align:right;color:#1c1813;font-size:14px;font-weight:600;">${opts.note}</td></tr>` : ""}
        ${opts.whenText ? `<tr><td style="padding:6px 0;color:#6b6258;font-size:14px;">When</td><td style="padding:6px 0;text-align:right;color:#1c1813;font-size:14px;font-weight:600;">${opts.whenText}</td></tr>` : ""}
      </table>
      <p style="margin:0;"><a href="${opts.meetLink}" style="display:inline-block;background:#17150f;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:999px;">Join Google Meet</a></p>
    </div>
  </div></body></html>`;
}

// Branded payment-confirmation email body.
export function paymentConfirmationHtml(opts: {
  name?: string | null;
  plan?: string | null;
  amount?: string;        // e.g. "£49.00"
  bookingWhen?: string;   // formatted local time, optional
  meetLink?: string | null;   // Google Meet join link, if a session was booked
}): string {
  const name = opts.name ? opts.name.split(" ")[0] : "there";
  const planRow = opts.plan
    ? `<tr><td style="padding:6px 0;color:#6b6258;font-size:14px;">Programme</td><td style="padding:6px 0;text-align:right;color:#1c1813;font-size:14px;font-weight:600;">${opts.plan}</td></tr>`
    : "";
  const amountRow = opts.amount
    ? `<tr><td style="padding:6px 0;color:#6b6258;font-size:14px;">Amount paid</td><td style="padding:6px 0;text-align:right;color:#1c1813;font-size:14px;font-weight:600;">${opts.amount}</td></tr>`
    : "";
  const whenRow = opts.bookingWhen
    ? `<tr><td style="padding:6px 0;color:#6b6258;font-size:14px;">Your session</td><td style="padding:6px 0;text-align:right;color:#1c1813;font-size:14px;font-weight:600;">${opts.bookingWhen}</td></tr>`
    : "";
  const meetRow = opts.meetLink
    ? `<p style="margin:0 0 24px;"><a href="${opts.meetLink}" style="display:inline-block;background:#17150f;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:999px;">Join Google Meet</a></p>`
    : "";

  return `<!DOCTYPE html><html><body style="margin:0;background:#f4f1eb;font-family:Arial,Helvetica,sans-serif;color:#1c1813;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#fff;border:1px solid #e6dfd2;border-radius:18px;padding:36px;">
      <div style="font-family:'Space Mono',monospace;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#ff7759;margin-bottom:16px;">Payment confirmed</div>
      <h1 style="font-size:26px;line-height:1.2;margin:0 0 12px;color:#17150f;">Thank you for joining the GTR Programme by Vero UK.</h1>
      <p style="font-size:15px;line-height:1.6;color:#5f574c;margin:0 0 24px;">Hi ${name}, your payment has been received and approved. We're delighted to have you. A member of our team will review your details and be in touch shortly with the next steps.</p>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid #e6dfd2;border-bottom:1px solid #e6dfd2;margin:0 0 24px;">
        ${planRow}${amountRow}${whenRow}
      </table>
      ${meetRow}
      <p style="font-size:14px;line-height:1.6;color:#6b6258;margin:0 0 8px;"><strong>What happens next</strong></p>
      <p style="font-size:14px;line-height:1.6;color:#6b6258;margin:0 0 6px;">1. We review your background and circumstances (a few working days).</p>
      <p style="font-size:14px;line-height:1.6;color:#6b6258;margin:0 0 6px;">2. We contact you directly to discuss the most suitable next step.</p>
      <p style="font-size:12px;line-height:1.6;color:#9b8c77;margin:24px 0 0;">GTR by Vero UK is an independent educational and guidance programme. It does not constitute legal or immigration advice.</p>
    </div>
    <p style="text-align:center;font-size:12px;color:#9b8c77;margin:18px 0 0;">© GTR by Vero UK</p>
  </div></body></html>`;
}
