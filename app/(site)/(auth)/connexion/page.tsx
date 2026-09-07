// app/(auth)/connexion/page.tsx

'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from '@/lib/auth-mock';

function ConnexionForm() {
  const router = useRouter();
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
    await signIn({ email, password });
    setSubmitting(false);
    // Preserves the originally-requested /app destination, set by
    // proxy.ts when it redirected here -- falls back to
    // /app/prospects when there was none (e.g. arriving directly at
    // /connexion, not bounced from a protected route).
    const next = searchParams.get('next');
    router.push(next && next.startsWith('/app') ? next : '/app/prospects');
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

// useSearchParams() bails out of static prerendering unless wrapped in
// Suspense -- this is what pnpm build's prerender pass caught and
// pnpm dev never surfaced. fallback={null} rather than a spinner: the
// searchParams read only affects where the post-login redirect goes,
// nothing visible depends on it while it resolves.
export default function ConnexionPage() {
  return (
    <Suspense fallback={null}>
      <ConnexionForm />
    </Suspense>
  );
}
