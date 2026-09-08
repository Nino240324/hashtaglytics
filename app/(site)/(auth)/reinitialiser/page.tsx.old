// app/(auth)/reinitialiser/page.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/lib/auth-mock';

export default function ReinitialiserPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setSubmitting(true);
    await resetPassword(password);
    setSubmitting(false);
    setDone(true);
  }

  return (
    <>
      <h1>Nouveau mot de passe</h1>
      <p className="auth-lede">Choisissez un nouveau mot de passe pour votre compte.</p>

      {error && <p className="auth-error">{error}</p>}

      {done ? (
        <>
          <p className="auth-success">Mot de passe mis à jour.</p>
          <div className="auth-links">
            <Link href="/connexion">Se connecter</Link>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="reset-password">Nouveau mot de passe</label>
            <input
              id="reset-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="reset-confirm">Confirmer le mot de passe</label>
            <input
              id="reset-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Enregistrement…' : 'Réinitialiser le mot de passe'}
          </button>
        </form>
      )}
    </>
  );
}
