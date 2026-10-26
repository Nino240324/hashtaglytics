'use client';

import { useEffect, useRef, useState } from 'react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;

    // Read the form BEFORE the first await. React pools the synthetic event,
    // so e.currentTarget is null by the time the fetch resolves.
    const data = new FormData(e.currentTarget);

    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          message: data.get('message'),
          company: data.get('company'), // honeypot -- see the route handler
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error ?? "L'envoi a échoué.");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'envoi a échoué.");
      setSending(false);
    }
  }

  // Submitting replaces the whole form with the success message -- the
  // button that had focus is removed from the DOM entirely, and without
  // this, focus would simply fall back to <body> with nothing telling a
  // screen reader user that anything happened at all.
  useEffect(() => {
    if (submitted) successRef.current?.focus();
  }, [submitted]);

  // A failure leaves the form in place, so focus is still on the button. The
  // error appears above it, where focus will never travel on its own.
  // role="alert" announces it; moving focus is what lets them reach it.
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  return (
    <section className="contact">
      <div className="wrap">
        <span className="eyebrow">Contact</span>
        <h1>Parlez-nous de votre zone.</h1>
        <p className="lede">
          Dites-nous votre métier et votre ville. Vous recevez dix prospects réels par mois,
          avec leur diagnostic, sous votre marque — sans carte bancaire.
        </p>

        {submitted ? (
          <div className="contact-form" ref={successRef} tabIndex={-1} role="status">
            <p style={{ fontSize: 'var(--t-h3)', fontWeight: 600, color: 'var(--ok)' }}>
              Message envoyé.
            </p>
            <p style={{ marginTop: 12, color: 'var(--ink-soft)' }}>
              Nous revenons vers vous sous 24 heures ouvrées.
            </p>
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit}>
            {error && (
              <p
                ref={errorRef}
                tabIndex={-1}
                role="alert"
                style={{ marginBottom: 16, color: 'var(--danger, #c0392b)', fontWeight: 600 }}
              >
                {error}
              </p>
            )}

            <div className="field">
              <label htmlFor="name">Nom</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
              />
            </div>
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
              />
            </div>
            <div className="field">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                required
                placeholder="Votre métier, votre zone, votre question…"
              />
            </div>

            {/*
              Honeypot. Hidden from sight AND from assistive technology, and
              out of the tab order, so no human reaches it -- which is the
              whole point: anything in it came from a bot. Do not swap this
              for display:none; some bots skip those fields.
            */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                width: 1,
                height: 1,
                overflow: 'hidden',
                clip: 'rect(0 0 0 0)',
                whiteSpace: 'nowrap',
              }}
            >
              <label htmlFor="company">Société</label>
              <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={sending}
              aria-busy={sending}
            >
              {sending ? 'Envoi…' : 'Envoyer'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
