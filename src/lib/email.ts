import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { logoUrl } from "@/lib/config";

let transporter: Transporter | null = null;

function getTransporter() {
  if (!process.env.SMTP_URL) return null;
  transporter ??= nodemailer.createTransport(process.env.SMTP_URL);
  return transporter;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

type EmailContent = {
  to: string;
  subject: string;
  /** Paragraphs of plain text. */
  paragraphs: string[];
  /** Optional quoted block, e.g. a note or message. */
  quote?: { label: string; text: string } | null;
  action?: { label: string; url: string };
  footer?: string;
  accentColor?: string;
  /** Municipality shown in the header instead of the app name. */
  brand?: { name: string; logoUrl?: string | null };
};

export function renderEmail({ subject, paragraphs, quote, action, footer, accentColor = "#0f766e", brand }: EmailContent) {
  const text = [
    ...paragraphs,
    quote ? `${quote.label}\n${quote.text}` : null,
    action ? `${action.label}: ${action.url}` : null,
    footer ? `--\n${footer}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:24px;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1917">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e7e5e4;border-radius:12px" cellspacing="0" cellpadding="0">
      <tr><td style="padding:28px 28px 8px;font-size:15px;font-weight:600;letter-spacing:-0.01em">${brand?.logoUrl ? `<img src="${escapeHtml(brand.logoUrl)}" alt="" height="32" style="height:32px;vertical-align:middle;margin-right:10px;border-radius:6px">` : ""}${escapeHtml(brand?.name ?? "OpenCityVoice")}</td></tr>
      <tr><td style="padding:8px 28px 28px;font-size:15px;line-height:1.6">
        ${paragraphs.map((p) => `<p style="margin:0 0 14px">${escapeHtml(p)}</p>`).join("")}
        ${quote ? `<p style="margin:0 0 4px;font-size:13px;color:#57534e">${escapeHtml(quote.label)}</p><blockquote style="margin:0 0 18px;padding:10px 14px;border-left:3px solid ${accentColor};background:#fafaf9;white-space:pre-wrap">${escapeHtml(quote.text)}</blockquote>` : ""}
        ${action ? `<p style="margin:22px 0 0"><a href="${escapeHtml(action.url)}" style="display:inline-block;padding:10px 18px;border-radius:8px;background:${accentColor};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px">${escapeHtml(action.label)}</a></p>` : ""}
      </td></tr>
    </table>
    ${footer ? `<p style="max-width:560px;margin:16px auto 0;font-size:12px;line-height:1.5;color:#78716c">${escapeHtml(footer)}</p>` : ""}
  </td></tr></table>
</body></html>`;

  return { text, html };
}

export function emailBrand(m: { name: string; logo_path: string | null }) {
  return { name: m.name, logoUrl: m.logo_path ? logoUrl(m.logo_path) : null };
}

/** Sends an e-mail. Failures are logged and never break the calling action. */
export async function sendEmail(content: EmailContent) {
  const transport = getTransporter();
  const { text, html } = renderEmail(content);
  if (!transport) {
    console.info(`[email] SMTP_URL not set, skipping e-mail to ${content.to}: ${content.subject}`);
    return false;
  }
  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM ?? "OpenCityVoice <no-reply@opencityvoice.local>",
      to: content.to,
      subject: content.subject,
      text,
      html,
    });
    return true;
  } catch (error) {
    console.error("[email] failed to send", error);
    return false;
  }
}
