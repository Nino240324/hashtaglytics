// app/(auth)/connexion/page.tsx

'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function ConnexionForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('E-mail et mot de passe sont requis.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Adresse e-mail invalide.');
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setSubmitting(false);
      setError('E-mail ou mot de passe incorrect.');
      return;
    }
    // window.location.href, not router.push -- a client-side transition
    // could be served from the router cache without proxy.ts re-checking
    // the freshly-set session cookie server-side. Same bug class already
    // found and fixed once for sign-out; applied here too for the other
    // auth transition rather than leaving it inconsistent.
    //
    // Preserves the originally-requested /app destination, set by
    // proxy.ts when it redirected here -- falls back to
    // /app/prospects when there was none (e.g. arriving directly at
    // /connexion, not bounced from a protected route).
    const next = searchParams.get('next');
    window.location.href = next && next.startsWith('/app') ? next : '/app/prospects';
  }

  return (
    <>
      <h1>Connexion</h1>
      <p className="auth-lede">Accédez à votre tableau de bord.</p>

      {error && <p className="auth-error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="login-email">E-mail</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="auth-field">
          <label htmlFor="login-password">Mot de passe</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <div className="auth-links">
        <Link href="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
      </div>
      <div className="auth-links">
        Pas encore de compte ? <Link href="/inscription">Créer un compte</Link>
      </div>
    </>
  );
}

// useSearchParams() requires a Suspense boundary during static
// generation -- ConnexionForm is the piece that actually needs it,
// wrapped here rather than in the form itself.
export default function ConnexionPage() {
  return (
    <Suspense fallback={null}>
      <ConnexionForm />
    </Suspense>
  );
}
