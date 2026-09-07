'use client';

import { useEffect, useRef, useState } from 'react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);

  // TODO: wire this to a real handler (email service, edge function, or form backend)
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  // Submitting replaces the whole form with the success message -- the
  // button that had focus is removed from the DOM entirely, and without
  // this, focus would simply fall back to <body> with nothing telling a
  // screen reader user that anything happened at all.
  useEffect(() => {
    if (submitted) successRef.current?.focus();
  }, [submitted]);

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
            <button type="submit" className="btn btn-primary">
              Envoyer
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
