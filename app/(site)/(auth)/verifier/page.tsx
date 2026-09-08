// app/(auth)/verifier/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function VerifierPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });
  }, []);

  async function handleResend() {
    setError(null);
    if (!email) {
      setError("Impossible de déterminer votre adresse e-mail. Reconnectez-vous et réessayez.");
      return;
    }
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({ type: 'signup', email });
    if (resendError) {
      setError('Une erreur est survenue. Réessayez dans un instant.');
      return;
    }
    setResent(true);
  }

  return (
    <>
      <h1>Vérifiez votre boîte mail</h1>
      <p className="auth-lede">
        Nous avons envoyé un lien de confirmation. Cliquez dessus pour activer votre compte et accéder au
        tableau de bord.
      </p>

      {error && <p className="auth-error">{error}</p>}
      {resent && <p className="auth-success">E-mail renvoyé.</p>}

      <button type="button" className="btn btn-ghost" onClick={handleResend}>
        Renvoyer l&rsquo;e-mail
      </button>
    </>
  );
}
