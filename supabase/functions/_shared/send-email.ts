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

// Branded payment-confirmation email body.
export function paymentConfirmationHtml(opts: {
  name?: string | null;
  plan?: string | null;
  amount?: string;        // e.g. "£49.00"
  bookingWhen?: string;   // formatted local time, optional
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

  return `<!DOCTYPE html><html><body style="margin:0;background:#f4f1eb;font-family:Arial,Helvetica,sans-serif;color:#1c1813;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#fff;border:1px solid #e6dfd2;border-radius:18px;padding:36px;">
      <div style="font-family:'Space Mono',monospace;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#ff7759;margin-bottom:16px;">Payment confirmed</div>
      <h1 style="font-size:26px;line-height:1.2;margin:0 0 12px;color:#17150f;">Thank you for joining the GTR Programme by Vero UK.</h1>
      <p style="font-size:15px;line-height:1.6;color:#5f574c;margin:0 0 24px;">Hi ${name}, your payment has been received and approved. We're delighted to have you. A member of our team will review your details and be in touch shortly with the next steps.</p>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid #e6dfd2;border-bottom:1px solid #e6dfd2;margin:0 0 24px;">
        ${planRow}${amountRow}${whenRow}
      </table>
      <p style="font-size:14px;line-height:1.6;color:#6b6258;margin:0 0 8px;"><strong>What happens next</strong></p>
      <p style="font-size:14px;line-height:1.6;color:#6b6258;margin:0 0 6px;">1. We review your background and circumstances (a few working days).</p>
      <p style="font-size:14px;line-height:1.6;color:#6b6258;margin:0 0 6px;">2. We contact you directly to discuss the most suitable next step.</p>
      <p style="font-size:12px;line-height:1.6;color:#9b8c77;margin:24px 0 0;">GTR by Vero UK is an independent educational and guidance programme. It does not constitute legal or immigration advice.</p>
    </div>
    <p style="text-align:center;font-size:12px;color:#9b8c77;margin:18px 0 0;">© GTR by Vero UK</p>
  </div></body></html>`;
}
