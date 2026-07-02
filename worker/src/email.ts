import { HTTPException } from 'hono/http-exception';
import type { Env } from './types';

type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendEmail(env: Env, payload: EmailPayload) {
  if (!env.RESEND_API_KEY) {
    throw new HTTPException(500, { message: 'Email service is not configured' });
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    }),
  });

  if (!response.ok) {
    throw new HTTPException(502, { message: 'Unable to send email right now' });
  }
}

export async function sendVerificationEmail(env: Env, email: string, token: string) {
  const link = `${trimTrailingSlash(env.APP_BASE_URL)}/verify-email?token=${encodeURIComponent(token)}`;
  await sendEmail(env, {
    to: email,
    subject: 'Verify your PawnNexus email',
    text: `Verify your PawnNexus email: ${link}\n\nThis link expires in 24 hours.`,
    html: emailTemplate(
      'Verify your PawnNexus email',
      'Confirm this email address so you can add, edit, and refresh Pawns.',
      link,
      'Verify email',
      'This link expires in 24 hours.',
    ),
  });
}

export async function sendPasswordResetEmail(env: Env, email: string, token: string) {
  const link = `${trimTrailingSlash(env.APP_BASE_URL)}/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail(env, {
    to: email,
    subject: 'Reset your PawnNexus password',
    text: `Reset your PawnNexus password: ${link}\n\nThis link expires in 1 hour. If you did not request this, you can ignore it.`,
    html: emailTemplate(
      'Reset your PawnNexus password',
      'Use this link to set a new password for your account.',
      link,
      'Reset password',
      'This link expires in 1 hour. If you did not request this, you can ignore it.',
    ),
  });
}

function emailTemplate(title: string, intro: string, link: string, button: string, footer: string) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;background:#101113;color:#f4f4f5;padding:32px">
      <div style="max-width:560px;margin:0 auto;background:#181a1d;border:1px solid #33363b;padding:28px">
        <h1 style="margin:0 0 12px;font-size:24px">${escapeHtml(title)}</h1>
        <p style="color:#d4d4d8;line-height:1.5">${escapeHtml(intro)}</p>
        <p style="margin:28px 0">
          <a href="${link}" style="background:#d6a645;color:#101113;padding:12px 18px;text-decoration:none;font-weight:700">${escapeHtml(button)}</a>
        </p>
        <p style="color:#a1a1aa;font-size:13px;line-height:1.5">${escapeHtml(footer)}</p>
      </div>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}
