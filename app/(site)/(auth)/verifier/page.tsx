// app/(auth)/verifier/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resendVerificationEmail, demoMarkVerified } from '@/lib/auth-mock';

export default function VerifierPage() {
  const router = useRouter();
  const [resent, setResent] = useState(false);

  async function handleResend() {
    await resendVerificationEmail();
    setResent(true);
  }

  function handleDemoVerify() {
    demoMarkVerified();
    router.push('/app/prospects');
  }

  return (
    <>
      <h1>Vérifiez votre boîte mail</h1>
      <p className="auth-lede">
        Nous avons envoyé un lien de confirmation. Cliquez dessus pour activer votre compte et accéder au
        tableau de bord.
      </p>

      {resent && <p className="auth-success">E-mail renvoyé.</p>}

      <button type="button" className="btn btn-ghost" onClick={handleResend}>
        Renvoyer l&rsquo;e-mail
      </button>

      <div className="auth-demo-note">
        <p>
          Aucun e-mail réel n&rsquo;est envoyé dans cette maquette. Ce bouton simule le clic sur le lien de
          vérification.
        </p>
        <button type="button" className="btn" onClick={handleDemoVerify}>
          Simuler la vérification (démo)
        </button>
      </div>
    </>
  );
}
