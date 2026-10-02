// app/api/campaign-kickoff/route.ts
//
// [#69 PHASE C] RÉVEILLE #17a IMMÉDIATEMENT APRÈS LA CRÉATION D'UNE CAMPAGNE.
//
// Mesuré 2026-10-02 sur électricien/Reims : la campagne est créée à 05:00:04,
// le premier point de grille n'est réclamé qu'à 05:01:00 — 56 secondes à ne
// rien faire, uniquement parce que #17a se déclenche à la seconde :00 de
// chaque minute. Ces 56 secondes sont du pur hasard : créer à :58 en coûte 2,
// créer à :01 en coûte 59.
//
// >>> LE NAVIGATEUR N'APPELLE JAMAIS n8n DIRECTEMENT. <<< L'URL du webhook
// serait alors dans le bundle JavaScript, lisible par n'importe qui. Cette
// route tourne côté serveur : l'URL et le secret restent dans les variables
// d'environnement Vercel, sans préfixe NEXT_PUBLIC_, ce qui est tout l'objet
// de la manœuvre.
//
// >>> LE POST NE TRANSPORTE AUCUNE DONNÉE, ET C'EST VOULU. <<< Le webhook de
// #17a alimente son nœud Config, qui appelle claim_work_items — lequel réclame
// les points de grille en attente, toutes campagnes confondues. Il n'a pas
// besoin qu'on lui dise laquelle. Donc : pas d'identifiant de campagne, pas de
// charge utile, rien que le client puisse falsifier. C'est un signal
// « réveille-toi », pas un canal de données.
//
// >>> CETTE ROUTE EST OUVERTE, ET C'EST UN CHOIX ASSUMÉ. <<< N'importe qui
// peut la POSTer. Le rayon d'action est borné : cela ne fait que demander à
// n8n de réclamer du travail DÉJÀ en file, ce que le cron fait de toute façon
// chaque minute. Aucune campagne ne peut être créée, aucune dépense déclenchée
// sur du vide. Le seul coût d'un abus serait des exécutions n8n inutiles sur
// Render. Si cela devient un problème : lire le cookie de session Supabase ici
// et refuser les appels non authentifiés — à faire le jour où c'est nécessaire,
// pas avant.
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
// Jamais de cache : chaque appel doit réellement partir.
export const dynamic = 'force-dynamic';

export async function POST() {
  const url = process.env.N8N_SCAN_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  // Variables manquantes : on le journalise et on rend 204 quand même. La
  // campagne EST créée ; le cron de #17a la prendra dans la minute. Un échec
  // de réveil ne doit jamais ressembler à un échec de création.
  if (!url || !secret) {
    console.error('campaign-kickoff: N8N_SCAN_WEBHOOK_URL ou N8N_WEBHOOK_SECRET absent');
    return new NextResponse(null, { status: 204 });
  }

  try {
    // 3 secondes, pas plus. Un n8n qui ne répond pas ne doit pas retenir la
    // requête de l'utilisateur : il est déjà en train de naviguer vers l'écran
    // de la campagne.
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 3000);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-hashtaglytics-secret': secret,
        },
        body: '{}',
        signal: ctl.signal,
        cache: 'no-store',
      });
      if (!res.ok) {
        console.error('campaign-kickoff: n8n a répondu', res.status);
      }
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    // Inclut l'abandon au bout de 3 s. On journalise et on continue : le
    // filet, c'est la planification de #17a toutes les minutes.
    console.error('campaign-kickoff: n8n injoignable', err);
  }

  // TOUJOURS 204. Voir plus haut : l'appelant ne doit jamais traiter un réveil
  // raté comme une erreur de création de campagne.
  return new NextResponse(null, { status: 204 });
}
