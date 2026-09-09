// app/(auth)/inscription/page.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function InscriptionPage() {
  const router = useRouter();
  const [agencyName, setAgencyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(null);
    if (!agencyName.trim()) {
      setError('Le nom de l\u2019agence est requis.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Adresse e-mail invalide.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    // agency_name lands in the new user's raw_user_meta_data -- this is
    // how the (separately built) database-side handler reads it when
    // creating the agencies row. No agencies/agency_members row is
    // created by this step -- that's explicitly database-side work, not
    // application code.
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { agency_name: agencyName.trim() } },
    });
    setSubmitting(false);
    if (signUpError) {
      setError(
        signUpError.message.toLowerCase().includes('already registered')
          ? 'Un compte existe déjà avec cette adresse e-mail.'
          : 'Une erreur est survenue. Réessayez.'
      );
      return;
    }
    router.push('/verifier');
  }

  return (
    <>
      <h1>Créer un compte</h1>
      <p className="auth-lede">
        Aucune carte requise. Vérifiez votre e-mail, puis choisissez un forfait depuis le tableau de bord
        quand vous êtes prêt.
      </p>

      {error && <p className="auth-error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="signup-agency">Nom de l&rsquo;agence</label>
          <input
            id="signup-agency"
            type="text"
            value={agencyName}
            onChange={(e) => setAgencyName(e.target.value)}
            autoComplete="organization"
          />
        </div>
        <div className="auth-field">
          <label htmlFor="signup-email">Adresse e-mail</label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="auth-field">
          <label htmlFor="signup-password">Mot de passe</label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>

      <div className="auth-links">
        Déjà un compte ? <Link href="/connexion">Se connecter</Link>
      </div>
    </>
  );
}
