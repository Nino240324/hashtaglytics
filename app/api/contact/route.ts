// app/api/contact/route.ts
//
// Task 47c. The contact form had no sending path at all -- handleSubmit set a
// flag and nothing left the browser. This is the endpoint it posts to.
//
// Sends through Resend's REST API (no npm dependency -- plain fetch). The
// domain is already verified there and Supabase Auth already sends through the
// same account, so nothing new has to be proved to a mail provider.
//
// Requires two environment variables in Vercel (Production AND Preview):
//   RESEND_API_KEY    -- Resend -> API Keys -> Create, scope "Sending access"
//   CONTACT_TO_EMAIL  -- where the form lands. Your Gmail today; change it to
//                        contact@hashtaglytics.com once task 47d gives the
//                        domain an MX record. Env change, no redeploy of code.
// Neither goes in the repo.

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const MAX = { name: 120, email: 200, message: 5000 };

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ] as string,
  );
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  // Honeypot. The "company" field is hidden from sighted users and from screen
  // readers; a human never fills it. Bots fill every input they can find.
  // Answer 200 so the bot records a success and does not come back.
  if (clean(body.company, 200) !== '') {
    return NextResponse.json({ ok: true });
  }

  const name = clean(body.name, MAX.name);
  const email = clean(body.email, MAX.email);
  const message = clean(body.message, MAX.message);

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: 'Tous les champs sont requis.' },
      { status: 400 },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json(
      { error: 'Adresse e-mail invalide.' },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    // A configuration fault, not the visitor's. Loud in the log, vague to them.
    console.error('[contact] RESEND_API_KEY or CONTACT_TO_EMAIL is not set');
    return NextResponse.json(
      { error: "L'envoi est momentanément indisponible." },
      { status: 500 },
    );
  }

  let res: Response;
  try {
    res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Must be on the verified domain. Supabase Auth already sends from
        // this exact address through the same Resend account.
        from: 'Formulaire Hashtaglytics <noreply@hashtaglytics.com>',
        to: [to],
        // So "Reply" in your mail client answers the visitor, not noreply@.
        reply_to: email,
        subject: `Contact site — ${name}`,
        text: `Nom : ${name}\nE-mail : ${email}\n\n${message}`,
        html:
          `<p><strong>Nom :</strong> ${escapeHtml(name)}<br>` +
          `<strong>E-mail :</strong> ${escapeHtml(email)}</p>` +
          `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
      }),
    });
  } catch (err) {
    console.error('[contact] resend unreachable', err);
    return NextResponse.json(
      { error: "L'envoi a échoué. Réessayez dans un instant." },
      { status: 502 },
    );
  }

  if (!res.ok) {
    console.error('[contact] resend %s %s', res.status, await res.text());
    return NextResponse.json(
      { error: "L'envoi a échoué. Réessayez dans un instant." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
