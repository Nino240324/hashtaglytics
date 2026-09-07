// app/(auth)/mot-de-passe-oublie/page.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/lib/auth-mock';

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Adresse e-mail invalide.');
      return;
    }
    setSubmitting(true);
    await requestPasswordReset(email);
    setSubmitting(false);
    setSent(true);
  }

  return (
    <>
      <h1>Mot de passe oublié</h1>
      <p className="auth-lede">
        Indiquez votre adresse e-mail. Si un compte existe, vous recevrez un lien pour réinitialiser votre
        mot de passe.
      </p>

      {error && <p className="auth-error">{error}</p>}
      {sent ? (
        <p className="auth-success">
          Si cette adresse correspond à un compte, un e-mail vient de vous être envoyé.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="forgot-email">E-mail</label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Envoi…' : 'Envoyer le lien'}
          </button>
        </form>
      )}

      <div className="auth-links">
        <Link href="/connexion">Retour à la connexion</Link>
      </div>
    </>
  );
}
