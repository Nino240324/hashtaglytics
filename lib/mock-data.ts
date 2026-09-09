// /lib/mock-data.ts
//
// v2 rewrite. Supersedes the v1 file (region-scoped campaigns, no
// enrichment markers) per frontend_brief_v2.md. Field names match real
// columns -- verified against schema.sql / functions_live.sql where noted,
// not inferred.
//
// [ESTABLISHED against the live schema]
//   business_name, city, category, website_kind        -> businesses
//   keyword, maps_position, review_count, rating,
//   photo_count, gbp_completeness, is_claimed, seo_score,
//   website_phone_raw, nap_phone_match,
//   mbi_fetched_at, email_checked_at, html_checked_at    -> business_snapshots
//   email, email_status, outcome, delivered_at           -> leads
//   phone                                                -> businesses.phone (E.164)
//   measured_at                                          -> business_snapshots.created_at
//   nap_phone_match CHECK IN ('match','mismatch','no_website','no_gbp')
//     -- confirmed in schema.sql, not the 3 values I might have guessed.
//   website_phone_raw's column comment says "for the PDF" -- Nino confirmed
//     this is descriptive (written when the PDF was the only consumer),
//     not restrictive: the phone-mismatch marker below is a second,
//     legitimate consumer.
//   communes (code_insee, nom, slug, dept_code, region_name, population)
//     -- real table, 34,746 rows live. slug is NOT unique (3,774 shared
//     names). The 200 rows here are illustrative mock data for UI
//     development, NOT independently verified against the live table --
//     same standing as every other mock array in this file.
//   campaign_communes (campaign_id, code_insee) -- real, coexists with the
//     older campaign_regions rather than replacing it (region stays valid
//     for rural departements). The one-town-per-campaign UI restriction
//     here is a product decision on top of a technically more flexible
//     schema, confirmed by the brief's own modal spec (5.2).
//   max_active_campaigns (subscription_tiers) -- replaced max_keywords /
//     max_regions as the real enforcement mechanism (enforce_max_campaigns
//     trigger; enforce_max_keywords' trigger was DROPPED). Confirmed
//     directly in functions_live.sql, not inferred from the brief alone.
//     Seed values: Trial 2, Starter 3, Growth 6, Business 12, Premium 25,
//     NULL = unlimited (enterprise).
//
// Three-state cells (brief 7 -- "the most important detail in this
// brief") apply to the five POST-DELIVERY columns only (email chain,
// HTML chain) -- driven by their MARKER column, never by the value being
// null, because null means the same thing before and after. Potentiel,
// Fiche Google and Complétude are NOT three-state: mbi_fetched_at is
// never null on a delivered lead (Change 3/4), so those three are always
// populated. getFicheGoogleState and getEmailCellState centralise the
// logic that remains once rather than letting each component re-derive
// it.

// Only import this file needs -- everything else here is pure mock
// data with no external dependencies. Used solely by
// fetchAgencyPlanUsage, the one function converted to a real query.
import { createClient } from '@/lib/supabase/client';

export type Prospect = {
  id: string;
  business_name: string;
  city: string | null; // null = service-area business, no address
  category: string | null;
  keyword: string;
  maps_position: number;
  review_count: number | null;
  rating: number | null; // NULL on older scans -- no stars then
  photo_count: number | null;
  gbp_completeness: number | null; // 0..100. Always populated on a delivered lead (see mbi_fetched_at below).
  is_claimed: boolean | null; // see getFicheGoogleState -- null means "not returned by the provider", not "pending"
  website_kind: 'own' | 'booking_platform' | 'social' | 'directory' | 'none';
  seo_score: number | null; // 0..100, LOWER = more opportunity. Always populated on a delivered lead, final -- never revised.
  phone: string | null; // from the Google listing, E.164. Available immediately, no marker gate.
  website_phone_raw: string | null; // from the site. Comparison value only -- never its own column.
  // Misleading names, neither means what it reads as — never surface
  // either verbatim to an agency:
  //   'no_website'  -- no PHONE found ON THE SITE, not "no website"
  //   'no_gbp'      -- businesses.phone IS NULL (no phone on the Google
  //                    listing itself), not "no Google Business Profile".
  //                    Every lead here has a GBP by construction (found
  //                    via Maps scan); phone is just a nullable field on
  //                    it, no NOT NULL constraint. A real, occurring
  //                    state, not a data error.
  nap_phone_match: 'match' | 'mismatch' | 'no_website' | 'no_gbp' | null;
  email: string | null;
  // PIPELINE DEPENDENCY, not enforced by these types -- verification
  // claims leads WHERE seo_score IS NOT NULL, and scoring only runs after
  // MBI. Chain: MBI -> seo_score -> verification. So 'deliverable' and
  // 'invalid' (real verification outcomes) CANNOT occur while
  // mbi_fetched_at is still null -- if you see that combination in a row,
  // it's an invalid mock, not a real state.
  // Finding an address does NOT depend on MBI (the website-fetch pass
  // runs independently), only VERIFYING it does. So while
  // mbi_fetched_at is null, only these are valid: null (not fetched yet),
  // 'pending_verification' (found, not yet verified), or 'unknown' /
  // 'risky' (both render "Non garanti" — same badge either way).
  email_status:
    | 'deliverable'
    | 'risky'
    | 'unknown'
    | 'invalid'
    | 'pending_verification'
    | null;
  outcome: 'won' | 'lost' | 'no_response' | 'in_progress' | null;
  delivered_at: string | null; // ISO
  measured_at: string; // ISO -- always shown
  // MARKERS -- these drive the three-state cells, never the values above.
  //
  // mbi_fetched_at is NEVER null on a row in this array. The pipeline is
  // scan -> qualify -> MBI -> score -> DELIVER, and only delivered leads
  // ever reach /app/prospects (quota is consumed at delivery, not at
  // scan -- a single Paris campaign finds ~1,650 businesses and a Growth
  // agency bought 400 leads; showing everything found would make the
  // quota meaningless). deliver_leads orders by score and can't run
  // before a score exists, so a delivered lead ALWAYS has mbi_fetched_at
  // set, and therefore always has seo_score, is_claimed (or the
  // documented is_claimed-null-after-check case) and gbp_completeness
  // populated too. A row with mbi_fetched_at: null represents a lead
  // that was never delivered -- it would never appear here, and adding
  // one recreates a state that's impossible in the real product. Only
  // email_checked_at and html_checked_at can legitimately be null on a
  // row here -- those arrive AFTER delivery, not before it.
  mbi_fetched_at: string | null;
  email_checked_at: string | null;
  html_checked_at: string | null;
  // Gated by html_checked_at -- added for the lead detail row (task 40f).
  // Real column names (schema.sql: business_snapshots).
  website_title_tag: string | null;
  h1_text: string | null; // verbatim -- never classify it, that's the agency's call
  meta_description: string | null; // verbatim; length is shown, not judged
  // FK -> campaigns.id, via campaign_grids. This is the real campaign
  // membership -- NOT keyword+city (see fetchProspectsForCampaign below
  // for why matching on city is wrong).
  campaign_id: string;
};

export type Commune = {
  code_insee: string; // what the form submits -- never the name
  nom: string;
  slug: string; // NOT UNIQUE -- 3,774 share a name
  dept_code: string;
  region_name: string;
  population: number | null;
};

export type Campaign = {
  id: string;
  keyword: string;
  commune: Commune;
  status: 'in_progress' | 'completed' | 'failed' | 'paused' | 'quota_reached';
  total_grids: number;
  completed_grids: number;
  businesses_found: number;
  created_at: string;
  completed_at: string | null;
};

export const mockProspects: Prospect[] = [
  {
    "id": "a1b2c3d4-0001-4aaa-8bbb-000000000001",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Plomberie Girard & Fils",
    "city": "Lyon",
    "category": "Plombier chauffagiste",
    "keyword": "plombier",
    "maps_position": 14,
    "review_count": 3,
    "rating": 3.8,
    "photo_count": 0,
    "gbp_completeness": 20,
    "is_claimed": true,
    "website_kind": "none",
    "seo_score": 15,
    "phone": "+33478100000",
    "website_phone_raw": null,
    "nap_phone_match": "no_website",
    "email": null,
    "email_status": null,
    "outcome": null,
    "delivered_at": "2026-07-01T09:00:00Z",
    "measured_at": "2026-07-01T08:00:00Z",
    "mbi_fetched_at": "2026-08-01T10:00:00Z",
    "email_checked_at": "2026-08-01T09:30:00Z",
    "html_checked_at": "2026-08-01T09:15:00Z",
    "website_title_tag": null,
    "h1_text": null,
    "meta_description": null
  },
  {
    "id": "a1b2c3d4-0001-4aaa-8bbb-000000000002",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Dépannage Plomberie Croix-Rousse",
    "city": "Lyon",
    "category": "Plombier",
    "keyword": "plombier",
    "maps_position": 9,
    "review_count": 11,
    "rating": 4.1,
    "photo_count": 2,
    "gbp_completeness": 31,
    "is_claimed": false,
    "website_kind": "booking_platform",
    "seo_score": 22,
    "phone": "+33478100137",
    "website_phone_raw": "+33478100137",
    "nap_phone_match": "match",
    "email": null,
    "email_status": null,
    "outcome": null,
    "delivered_at": "2026-08-02T09:00:00Z",
    "measured_at": "2026-08-01T08:00:00Z",
    "mbi_fetched_at": "2026-08-02T10:00:00Z",
    "email_checked_at": null,
    "html_checked_at": "2026-08-02T09:15:00Z",
    "website_title_tag": "Dépannage Plomberie Croix-Rousse - Plombier à Lyon",
    "h1_text": "Dépannage Plomberie Croix-Rousse - plombier professionnel",
    "meta_description": "Dépannage Plomberie Croix-Rousse, plombier a Lyon. Devis gratuit, intervention rapide, professionnel qualifie a votre ecoute."
  },
  {
    "id": "a1b2c3d4-0001-4aaa-8bbb-000000000003",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "SOS Plombier Presqu'île",
    "city": "Lyon",
    "category": "Entreprise de plomberie",
    "keyword": "plombier",
    "maps_position": 21,
    "review_count": 6,
    "rating": 3.5,
    "photo_count": 1,
    "gbp_completeness": 29,
    "is_claimed": false,
    "website_kind": "directory",
    "seo_score": 24,
    "phone": "+33478100274",
    "website_phone_raw": "+33478100274",
    "nap_phone_match": "match",
    "email": null,
    "email_status": null,
    "outcome": null,
    "delivered_at": "2026-07-03T09:00:00Z",
    "measured_at": "2026-07-01T08:00:00Z",
    "mbi_fetched_at": "2026-07-03T07:00:00Z",
    "email_checked_at": null,
    "html_checked_at": null,
    "website_title_tag": null,
    "h1_text": null,
    "meta_description": null
  },
  {
    "id": "a1b2c3d4-0001-4aaa-8bbb-000000000004",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "AquaFix Plomberie Villeurbanne",
    "city": "Lyon",
    "category": "Plombier",
    "keyword": "plombier",
    "maps_position": 6,
    "review_count": 34,
    "rating": 4.6,
    "photo_count": 9,
    "gbp_completeness": 53,
    "is_claimed": false,
    "website_kind": "own",
    "seo_score": 36,
    "phone": "+33478100411",
    "website_phone_raw": "+33478100411",
    "nap_phone_match": "match",
    "email": "contact@aquafixplomberievi.fr",
    "email_status": "pending_verification",
    "outcome": "in_progress",
    "delivered_at": "2026-08-04T09:00:00Z",
    "measured_at": "2026-08-01T08:00:00Z",
    "mbi_fetched_at": "2026-08-04T10:00:00Z",
    "email_checked_at": "2026-08-04T09:30:00Z",
    "html_checked_at": null,
    "website_title_tag": null,
    "h1_text": null,
    "meta_description": null
  },
  {
    "id": "a1b2c3d4-0001-4aaa-8bbb-000000000005",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Plomberie Générale Belleville",
    "city": "Paris",
    "category": "Plombier",
    "keyword": "plombier",
    "maps_position": 17,
    "review_count": 4,
    "rating": 3.6,
    "photo_count": 0,
    "gbp_completeness": 64,
    "is_claimed": null,
    "website_kind": "none",
    "seo_score": 43,
    "phone": "+33141005480",
    "website_phone_raw": null,
    "nap_phone_match": "no_website",
    "email": "plomberiegénéraleb@gmail.com",
    "email_status": "deliverable",
    "outcome": null,
    "delivered_at": "2026-07-05T09:00:00Z",
    "measured_at": "2026-07-01T08:00:00Z",
    "mbi_fetched_at": "2026-08-05T10:00:00Z",
    "email_checked_at": "2026-08-05T09:30:00Z",
    "html_checked_at": "2026-08-05T09:15:00Z",
    "website_title_tag": null,
    "h1_text": null,
    "meta_description": null
  },
  {
    "id": "a1b2c3d4-0001-4aaa-8bbb-000000000006",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Ets Meunier Plomberie 11e",
    "city": "Paris",
    "category": "Plombier chauffagiste",
    "keyword": "plombier",
    "maps_position": 12,
    "review_count": 19,
    "rating": 4.0,
    "photo_count": 4,
    "gbp_completeness": 75,
    "is_claimed": false,
    "website_kind": "directory",
    "seo_score": 50,
    "phone": null,
    "website_phone_raw": "+33142376850",
    "nap_phone_match": "no_gbp",
    "email": "etsmeunierplomberi@gmail.com",
    "email_status": "unknown",
    "outcome": "no_response",
    "delivered_at": "2026-08-06T09:00:00Z",
    "measured_at": "2026-08-02T08:00:00Z",
    "mbi_fetched_at": "2026-08-06T10:00:00Z",
    "email_checked_at": "2026-08-06T09:30:00Z",
    "html_checked_at": "2026-08-06T09:15:00Z",
    "website_title_tag": "Ets Meunier Plomberie 11e - Plombier à Paris",
    "h1_text": "Ets Meunier Plomberie 11e - plombier professionnel",
    "meta_description": "Ets Meunier Plomberie 11e, plombier a Paris. Devis gratuit, intervention rapide, professionnel qualifie a votre ecoute."
  },
  {
    "id": "a1b2c3d4-0001-4aaa-8bbb-000000000007",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Plomberie du Vieux-Lille",
    "city": "Lille",
    "category": "Plombier",
    "keyword": "plombier",
    "maps_position": 24,
    "review_count": 2,
    "rating": null,
    "photo_count": null,
    "gbp_completeness": 44,
    "is_claimed": true,
    "website_kind": "social",
    "seo_score": 31,
    "phone": "+33320100822",
    "website_phone_raw": "+33320100822",
    "nap_phone_match": "match",
    "email": null,
    "email_status": null,
    "outcome": null,
    "delivered_at": "2026-07-07T09:00:00Z",
    "measured_at": "2026-07-03T08:00:00Z",
    "mbi_fetched_at": "2026-07-07T07:00:00Z",
    "email_checked_at": null,
    "html_checked_at": null,
    "website_title_tag": null,
    "h1_text": null,
    "meta_description": null
  },
  {
    "id": "a1b2c3d4-0001-4aaa-8bbb-000000000008",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "SOS Fuite Lille Centre",
    "city": "Lille",
    "category": "Plombier",
    "keyword": "plombier",
    "maps_position": 19,
    "review_count": 7,
    "rating": 3.9,
    "photo_count": 1,
    "gbp_completeness": 32,
    "is_claimed": false,
    "website_kind": "none",
    "seo_score": 64,
    "phone": "+33320100959",
    "website_phone_raw": null,
    "nap_phone_match": "no_website",
    "email": "sosfuitelillecentr@gmail.com",
    "email_status": "risky",
    "outcome": "won",
    "delivered_at": "2026-08-08T09:00:00Z",
    "measured_at": "2026-08-04T08:00:00Z",
    "mbi_fetched_at": "2026-08-08T10:00:00Z",
    "email_checked_at": "2026-08-08T09:30:00Z",
    "html_checked_at": "2026-08-08T09:15:00Z",
    "website_title_tag": null,
    "h1_text": null,
    "meta_description": null
  },
  {
    "id": "a1b2c3d4-0001-4aaa-8bbb-000000000009",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Plombier Dépannage 24/7 Rhône",
    "city": null,
    "category": "Plombier",
    "keyword": "plombier",
    "maps_position": 27,
    "review_count": 15,
    "rating": 4.2,
    "photo_count": 3,
    "gbp_completeness": 43,
    "is_claimed": true,
    "website_kind": "none",
    "seo_score": 16,
    "phone": "+33600101096",
    "website_phone_raw": null,
    "nap_phone_match": "no_website",
    "email": null,
    "email_status": null,
    "outcome": null,
    "delivered_at": "2026-07-09T09:00:00Z",
    "measured_at": "2026-07-05T08:00:00Z",
    "mbi_fetched_at": "2026-08-09T10:00:00Z",
    "email_checked_at": null,
    "html_checked_at": "2026-08-09T09:15:00Z",
    "website_title_tag": null,
    "h1_text": null,
    "meta_description": null
  },
  {
    "id": "a1b2c3d4-0001-4aaa-8bbb-000000000010",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Plomberie Mobile Gironde",
    "city": null,
    "category": "Plombier chauffagiste",
    "keyword": "plombier",
    "maps_position": 31,
    "review_count": 9,
    "rating": 4.0,
    "photo_count": 2,
    "gbp_completeness": 54,
    "is_claimed": false,
    "website_kind": "social",
    "seo_score": 23,
    "phone": "+33600101233",
    "website_phone_raw": "+33600101233",
    "nap_phone_match": "match",
    "email": null,
    "email_status": null,
    "outcome": "lost",
    "delivered_at": "2026-08-10T09:00:00Z",
    "measured_at": "2026-08-06T08:00:00Z",
    "mbi_fetched_at": "2026-08-10T10:00:00Z",
    "email_checked_at": "2026-08-10T09:30:00Z",
    "html_checked_at": "2026-08-10T09:15:00Z",
    "website_title_tag": "Plomberie Mobile Gironde - Plombier",
    "h1_text": "Plomberie Mobile Gironde - plombier professionnel",
    "meta_description": "Plomberie Mobile Gironde, plombier a votre secteur. Devis gratuit, intervention rapide, professionnel qualifie a votre ecoute."
  },
  {
    "id": "a1b2c3d4-0002-4aaa-8bbb-000000000011",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Menuiserie Bernard",
    "city": "Lyon",
    "category": "Menuisier",
    "keyword": "menuisier",
    "maps_position": 8,
    "review_count": 22,
    "rating": 4.5,
    "photo_count": 11,
    "gbp_completeness": 65,
    "is_claimed": true,
    "website_kind": "own",
    "seo_score": 30,
    "phone": "+33478101370",
    "website_phone_raw": "+33478375370",
    "nap_phone_match": "mismatch",
    "email": "contact@menuiseriebernard.fr",
    "email_status": "deliverable",
    "outcome": null,
    "delivered_at": "2026-07-11T09:00:00Z",
    "measured_at": "2026-07-07T08:00:00Z",
    "mbi_fetched_at": "2026-08-11T10:00:00Z",
    "email_checked_at": "2026-08-11T09:30:00Z",
    "html_checked_at": "2026-08-11T09:15:00Z",
    "website_title_tag": "Menuiserie Bernard - Menuisier à Lyon",
    "h1_text": "Menuiserie Bernard - menuisier professionnel",
    "meta_description": "Menuiserie Bernard, menuisier a Lyon. Devis gratuit, intervention rapide, professionnel qualifie a votre ecoute."
  },
  {
    "id": "a1b2c3d4-0002-4aaa-8bbb-000000000012",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Atelier du Bois Lyonnais",
    "city": "Lyon",
    "category": "Menuisier ébéniste",
    "keyword": "menuisier",
    "maps_position": 16,
    "review_count": 5,
    "rating": 4.1,
    "photo_count": 0,
    "gbp_completeness": 22,
    "is_claimed": false,
    "website_kind": "none",
    "seo_score": 19,
    "phone": "+33478101507",
    "website_phone_raw": null,
    "nap_phone_match": "no_website",
    "email": null,
    "email_status": null,
    "outcome": null,
    "delivered_at": "2026-08-12T09:00:00Z",
    "measured_at": "2026-08-08T08:00:00Z",
    "mbi_fetched_at": "2026-08-12T07:00:00Z",
    "email_checked_at": null,
    "html_checked_at": null,
    "website_title_tag": null,
    "h1_text": null,
    "meta_description": null
  },
  {
    "id": "a1b2c3d4-0002-4aaa-8bbb-000000000013",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Menuiserie Fabre Confluence",
    "city": "Lyon",
    "category": "Menuiserie",
    "keyword": "menuisier",
    "maps_position": 13,
    "review_count": 8,
    "rating": 3.9,
    "photo_count": 2,
    "gbp_completeness": 22,
    "is_claimed": true,
    "website_kind": "directory",
    "seo_score": 44,
    "phone": "+33478101644",
    "website_phone_raw": "+33478101644",
    "nap_phone_match": "match",
    "email": "menuiseriefabrecon@gmail.com",
    "email_status": "deliverable",
    "outcome": null,
    "delivered_at": "2026-07-13T09:00:00Z",
    "measured_at": "2026-07-09T08:00:00Z",
    "mbi_fetched_at": "2026-08-13T10:00:00Z",
    "email_checked_at": "2026-08-13T09:30:00Z",
    "html_checked_at": "2026-08-13T09:15:00Z",
    "website_title_tag": "Menuiserie Fabre Confluence - Menuisier à Lyon",
    "h1_text": "Accueil",
    "meta_description": "Menuiserie Fabre Confluence, menuisier a Lyon. Devis gratuit, intervention rapide, professionnel qualifie a votre ecoute."
  },
  {
    "id": "a1b2c3d4-0002-4aaa-8bbb-000000000014",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "L'Établi Parisien",
    "city": "Paris",
    "category": "Menuisier",
    "keyword": "menuisier",
    "maps_position": 22,
    "review_count": 3,
    "rating": 3.7,
    "photo_count": 1,
    "gbp_completeness": 33,
    "is_claimed": false,
    "website_kind": "social",
    "seo_score": 51,
    "phone": "+33141017810",
    "website_phone_raw": "+33141017810",
    "nap_phone_match": "match",
    "email": "létabliparisien@gmail.com",
    "email_status": "risky",
    "outcome": "in_progress",
    "delivered_at": "2026-08-14T09:00:00Z",
    "measured_at": "2026-08-10T08:00:00Z",
    "mbi_fetched_at": "2026-08-14T10:00:00Z",
    "email_checked_at": "2026-08-14T09:30:00Z",
    "html_checked_at": null,
    "website_title_tag": null,
    "h1_text": null,
    "meta_description": null
  },
  {
    "id": "a1b2c3d4-0002-4aaa-8bbb-000000000015",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Menuiserie Duval Aménagement",
    "city": "Paris",
    "category": "Menuisier d'agencement",
    "keyword": "menuisier",
    "maps_position": 10,
    "review_count": 27,
    "rating": 4.4,
    "photo_count": 7,
    "gbp_completeness": 44,
    "is_claimed": true,
    "website_kind": "own",
    "seo_score": 58,
    "phone": "+33141019180",
    "website_phone_raw": "+33141019180",
    "nap_phone_match": "match",
    "email": null,
    "email_status": null,
    "outcome": null,
    "delivered_at": "2026-07-15T09:00:00Z",
    "measured_at": "2026-07-11T08:00:00Z",
    "mbi_fetched_at": "2026-08-15T10:00:00Z",
    "email_checked_at": null,
    "html_checked_at": "2026-08-15T09:15:00Z",
    "website_title_tag": "Menuiserie Duval Aménagement - Menuisier à Paris",
    "h1_text": "Menuiserie Duval Aménagement - menuisier professionnel",
    "meta_description": "Menuiserie Duval Aménagement, menuisier a Paris. Devis gratuit, intervention rapide, professionnel qualifie a votre ecoute."
  },
  {
    "id": "a1b2c3d4-0002-4aaa-8bbb-000000000016",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Bois & Formes Paris 15e",
    "city": "Paris",
    "category": "Menuisier",
    "keyword": "menuisier",
    "maps_position": 18,
    "review_count": 6,
    "rating": 3.8,
    "photo_count": 0,
    "gbp_completeness": 55,
    "is_claimed": null,
    "website_kind": "none",
    "seo_score": 65,
    "phone": "+33141020550",
    "website_phone_raw": null,
    "nap_phone_match": "no_website",
    "email": "boisetformesparis1@gmail.com",
    "email_status": "pending_verification",
    "outcome": "no_response",
    "delivered_at": "2026-08-16T09:00:00Z",
    "measured_at": "2026-08-12T08:00:00Z",
    "mbi_fetched_at": "2026-08-16T10:00:00Z",
    "email_checked_at": "2026-08-16T09:30:00Z",
    "html_checked_at": "2026-08-16T09:15:00Z",
    "website_title_tag": null,
    "h1_text": null,
    "meta_description": null
  },
  {
    "id": "a1b2c3d4-0002-4aaa-8bbb-000000000017",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Menuiserie du Vieux-Lille",
    "city": "Lille",
    "category": "Menuiserie",
    "keyword": "menuisier",
    "maps_position": 15,
    "review_count": 9,
    "rating": 4.0,
    "photo_count": 3,
    "gbp_completeness": 66,
    "is_claimed": true,
    "website_kind": "directory",
    "seo_score": 17,
    "phone": null,
    "website_phone_raw": "+33320239192",
    "nap_phone_match": "no_gbp",
    "email": "menuiserieduvieux-@gmail.com",
    "email_status": "deliverable",
    "outcome": null,
    "delivered_at": "2026-07-17T09:00:00Z",
    "measured_at": "2026-07-13T08:00:00Z",
    "mbi_fetched_at": "2026-08-17T10:00:00Z",
    "email_checked_at": "2026-08-17T09:30:00Z",
    "html_checked_at": "2026-08-17T09:15:00Z",
    "website_title_tag": "Menuiserie du Vieux-Lille - Menuisier à Lille",
    "h1_text": "Menuiserie du Vieux-Lille - menuisier professionnel",
    "meta_description": "Menuiserie du Vieux-Lille, menuisier a Lille. Devis gratuit, intervention rapide, professionnel qualifie a votre ecoute."
  },
  {
    "id": "a1b2c3d4-0002-4aaa-8bbb-000000000018",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Atelier Nord Ébénisterie",
    "city": "Lille",
    "category": "Menuisier ébéniste",
    "keyword": "menuisier",
    "maps_position": 20,
    "review_count": 4,
    "rating": null,
    "photo_count": null,
    "gbp_completeness": 57,
    "is_claimed": true,
    "website_kind": "own",
    "seo_score": 42,
    "phone": "+33320102329",
    "website_phone_raw": "+33320102329",
    "nap_phone_match": "match",
    "email": null,
    "email_status": null,
    "outcome": "won",
    "delivered_at": "2026-08-18T09:00:00Z",
    "measured_at": "2026-08-14T08:00:00Z",
    "mbi_fetched_at": "2026-08-18T07:00:00Z",
    "email_checked_at": null,
    "html_checked_at": null,
    "website_title_tag": null,
    "h1_text": null,
    "meta_description": null
  },
  {
    "id": "a1b2c3d4-0002-4aaa-8bbb-000000000019",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Menuiserie Itinérante Rhône-Alpes",
    "city": null,
    "category": "Menuisier",
    "keyword": "menuisier",
    "maps_position": 29,
    "review_count": 10,
    "rating": 4.0,
    "photo_count": 2,
    "gbp_completeness": 23,
    "is_claimed": true,
    "website_kind": "social",
    "seo_score": 31,
    "phone": "+33600102466",
    "website_phone_raw": "+33600102466",
    "nap_phone_match": "match",
    "email": null,
    "email_status": null,
    "outcome": null,
    "delivered_at": "2026-07-19T09:00:00Z",
    "measured_at": "2026-07-15T08:00:00Z",
    "mbi_fetched_at": "2026-08-19T10:00:00Z",
    "email_checked_at": "2026-08-19T09:30:00Z",
    "html_checked_at": "2026-08-19T09:15:00Z",
    "website_title_tag": "Menuiserie Itinérante Rhône-Alpes - Menuisier",
    "h1_text": "Menuiserie Itinérante Rhône-Alpes - menuisier professionnel",
    "meta_description": "Menuiserie Itinérante Rhône-Alpes, menuisier a votre secteur. Devis gratuit, intervention rapide, professionnel qualifie a votre ecoute."
  },
  {
    "id": "a1b2c3d4-0002-4aaa-8bbb-000000000020",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Ébénisterie Mobile Sud-Ouest",
    "city": null,
    "category": "Ébéniste",
    "keyword": "menuisier",
    "maps_position": 33,
    "review_count": 1,
    "rating": 3.5,
    "photo_count": 0,
    "gbp_completeness": 34,
    "is_claimed": false,
    "website_kind": "none",
    "seo_score": 38,
    "phone": "+33600102603",
    "website_phone_raw": null,
    "nap_phone_match": "no_website",
    "email": "ébénisteriemobiles@gmail.com",
    "email_status": "risky",
    "outcome": "lost",
    "delivered_at": "2026-08-20T09:00:00Z",
    "measured_at": "2026-08-16T08:00:00Z",
    "mbi_fetched_at": "2026-08-20T10:00:00Z",
    "email_checked_at": "2026-08-20T09:30:00Z",
    "html_checked_at": "2026-08-20T09:15:00Z",
    "website_title_tag": null,
    "h1_text": null,
    "meta_description": null
  },
  {
    "id": "a1b2c3d4-0003-4aaa-8bbb-000000000021",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Cabinet Moreau Avocat",
    "city": "Lyon",
    "category": "Cabinet d'avocats",
    "keyword": "avocat",
    "maps_position": 5,
    "review_count": 18,
    "rating": 4.7,
    "photo_count": 6,
    "gbp_completeness": 45,
    "is_claimed": true,
    "website_kind": "own",
    "seo_score": 45,
    "phone": "+33478102740",
    "website_phone_raw": "+33478102740",
    "nap_phone_match": "match",
    "email": null,
    "email_status": null,
    "outcome": null,
    "delivered_at": "2026-07-21T09:00:00Z",
    "measured_at": "2026-07-17T08:00:00Z",
    "mbi_fetched_at": "2026-08-21T10:00:00Z",
    "email_checked_at": null,
    "html_checked_at": "2026-08-21T09:15:00Z",
    "website_title_tag": "Cabinet Moreau Avocat - Avocat à Lyon",
    "h1_text": "Cabinet Moreau Avocat - avocat professionnel",
    "meta_description": "Cabinet Moreau Avocat, avocat a Lyon. Devis gratuit, intervention rapide, professionnel qualifie a votre ecoute."
  },
  {
    "id": "a1b2c3d4-0003-4aaa-8bbb-000000000022",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "SCP Lambert & Associés",
    "city": "Lyon",
    "category": "Cabinet d'avocats",
    "keyword": "avocat",
    "maps_position": 7,
    "review_count": 25,
    "rating": 4.5,
    "photo_count": 4,
    "gbp_completeness": 56,
    "is_claimed": false,
    "website_kind": "own",
    "seo_score": 52,
    "phone": "+33478102877",
    "website_phone_raw": "+33478376877",
    "nap_phone_match": "mismatch",
    "email": "contact@scplambertetassoci.fr",
    "email_status": "pending_verification",
    "outcome": null,
    "delivered_at": "2026-08-22T09:00:00Z",
    "measured_at": "2026-08-18T08:00:00Z",
    "mbi_fetched_at": "2026-08-22T10:00:00Z",
    "email_checked_at": "2026-08-22T09:30:00Z",
    "html_checked_at": "2026-08-22T09:15:00Z",
    "website_title_tag": "SCP Lambert & Associés - Avocat à Lyon",
    "h1_text": "SCP Lambert & Associés - avocat professionnel",
    "meta_description": "SCP Lambert & Associés, avocat a Lyon. Devis gratuit, intervention rapide, professionnel qualifie a votre ecoute."
  },
  {
    "id": "a1b2c3d4-0003-4aaa-8bbb-000000000023",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Maître Sophie Renard",
    "city": "Lyon",
    "category": "Avocat",
    "keyword": "avocat",
    "maps_position": 15,
    "review_count": 6,
    "rating": 4.0,
    "photo_count": 1,
    "gbp_completeness": 67,
    "is_claimed": true,
    "website_kind": "directory",
    "seo_score": 59,
    "phone": "+33478103014",
    "website_phone_raw": "+33478103014",
    "nap_phone_match": "match",
    "email": "maîtresophierenard@gmail.com",
    "email_status": "deliverable",
    "outcome": null,
    "delivered_at": "2026-07-23T09:00:00Z",
    "measured_at": "2026-07-19T08:00:00Z",
    "mbi_fetched_at": "2026-08-23T10:00:00Z",
    "email_checked_at": "2026-08-23T09:30:00Z",
    "html_checked_at": null,
    "website_title_tag": null,
    "h1_text": null,
    "meta_description": null
  },
  {
    "id": "a1b2c3d4-0003-4aaa-8bbb-000000000024",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Cabinet Girard Avocats",
    "city": "Lyon",
    "category": "Avocat",
    "keyword": "avocat",
    "maps_position": 23,
    "review_count": 2,
    "rating": 3.6,
    "photo_count": 0,
    "gbp_completeness": 33,
    "is_claimed": false,
    "website_kind": "none",
    "seo_score": 27,
    "phone": "+33478103151",
    "website_phone_raw": null,
    "nap_phone_match": "no_website",
    "email": null,
    "email_status": null,
    "outcome": "in_progress",
    "delivered_at": "2026-08-24T09:00:00Z",
    "measured_at": "2026-08-20T08:00:00Z",
    "mbi_fetched_at": "2026-08-24T07:00:00Z",
    "email_checked_at": null,
    "html_checked_at": null,
    "website_title_tag": null,
    "h1_text": null,
    "meta_description": null
  },
  {
    "id": "a1b2c3d4-0003-4aaa-8bbb-000000000025",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Étude Fontaine Avocats",
    "city": "Paris",
    "category": "Cabinet d'avocats",
    "keyword": "avocat",
    "maps_position": 4,
    "review_count": 41,
    "rating": 4.8,
    "photo_count": 9,
    "gbp_completeness": 24,
    "is_claimed": true,
    "website_kind": "own",
    "seo_score": 18,
    "phone": "+33141032880",
    "website_phone_raw": "+33141032880",
    "nap_phone_match": "match",
    "email": "contact@étudefontaineavoca.fr",
    "email_status": "deliverable",
    "outcome": null,
    "delivered_at": "2026-07-25T09:00:00Z",
    "measured_at": "2026-07-21T08:00:00Z",
    "mbi_fetched_at": "2026-08-25T10:00:00Z",
    "email_checked_at": "2026-08-25T09:30:00Z",
    "html_checked_at": "2026-08-25T09:15:00Z",
    "website_title_tag": "Étude Fontaine Avocats - Avocat à Paris",
    "h1_text": "Étude Fontaine Avocats - avocat professionnel",
    "meta_description": "Étude Fontaine Avocats, avocat a Paris. Devis gratuit, intervention rapide, professionnel qualifie a votre ecoute."
  },
  {
    "id": "a1b2c3d4-0003-4aaa-8bbb-000000000026",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Cabinet Avocat Dubreuil",
    "city": "Paris",
    "category": "Avocat",
    "keyword": "avocat",
    "maps_position": 19,
    "review_count": 5,
    "rating": 3.9,
    "photo_count": 1,
    "gbp_completeness": 35,
    "is_claimed": false,
    "website_kind": "directory",
    "seo_score": 25,
    "phone": "+33141034250",
    "website_phone_raw": "+33141034250",
    "nap_phone_match": "match",
    "email": null,
    "email_status": null,
    "outcome": "no_response",
    "delivered_at": "2026-08-26T09:00:00Z",
    "measured_at": "2026-08-22T08:00:00Z",
    "mbi_fetched_at": "2026-08-26T10:00:00Z",
    "email_checked_at": "2026-08-26T09:30:00Z",
    "html_checked_at": "2026-08-26T09:15:00Z",
    "website_title_tag": "Cabinet Avocat Dubreuil - Avocat à Paris",
    "h1_text": "Cabinet Avocat Dubreuil - avocat professionnel",
    "meta_description": "Cabinet Avocat Dubreuil, avocat a Paris. Devis gratuit, intervention rapide, professionnel qualifie a votre ecoute."
  },
  {
    "id": "a1b2c3d4-0003-4aaa-8bbb-000000000027",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Maître Thomas Vidal",
    "city": "Paris",
    "category": "Avocat",
    "keyword": "avocat",
    "maps_position": 26,
    "review_count": 3,
    "rating": 3.7,
    "photo_count": 0,
    "gbp_completeness": 46,
    "is_claimed": null,
    "website_kind": "social",
    "seo_score": 32,
    "phone": "+33141035620",
    "website_phone_raw": "+33141035620",
    "nap_phone_match": "match",
    "email": "maîtrethomasvidal@gmail.com",
    "email_status": "unknown",
    "outcome": null,
    "delivered_at": "2026-07-27T09:00:00Z",
    "measured_at": "2026-07-23T08:00:00Z",
    "mbi_fetched_at": "2026-08-27T10:00:00Z",
    "email_checked_at": "2026-08-27T09:30:00Z",
    "html_checked_at": "2026-08-27T09:15:00Z",
    "website_title_tag": "Maître Thomas Vidal - Avocat à Paris",
    "h1_text": "Maître Thomas Vidal - avocat professionnel",
    "meta_description": "Maître Thomas Vidal, avocat a Paris. Devis gratuit, intervention rapide, professionnel qualifie a votre ecoute."
  },
  {
    "id": "a1b2c3d4-0003-4aaa-8bbb-000000000028",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Cabinet Lecomte Lille",
    "city": "Lille",
    "category": "Cabinet d'avocats",
    "keyword": "avocat",
    "maps_position": 6,
    "review_count": 21,
    "rating": 4.6,
    "photo_count": 5,
    "gbp_completeness": 57,
    "is_claimed": false,
    "website_kind": "own",
    "seo_score": 39,
    "phone": "+33320103699",
    "website_phone_raw": "+33320103699",
    "nap_phone_match": "match",
    "email": null,
    "email_status": null,
    "outcome": "won",
    "delivered_at": "2026-08-01T09:00:00Z",
    "measured_at": "2026-08-01T08:00:00Z",
    "mbi_fetched_at": "2026-08-01T10:00:00Z",
    "email_checked_at": null,
    "html_checked_at": "2026-08-01T09:15:00Z",
    "website_title_tag": "Cabinet Lecomte Lille - Avocat à Lille",
    "h1_text": "Cabinet Lecomte Lille - avocat professionnel",
    "meta_description": null
  },
  {
    "id": "a1b2c3d4-0003-4aaa-8bbb-000000000029",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Maître Camille Perrin",
    "city": "Lille",
    "category": "Avocat",
    "keyword": "avocat",
    "maps_position": 17,
    "review_count": 4,
    "rating": 3.8,
    "photo_count": 1,
    "gbp_completeness": 48,
    "is_claimed": true,
    "website_kind": "directory",
    "seo_score": 35,
    "phone": "+33320103836",
    "website_phone_raw": "+33320103836",
    "nap_phone_match": "match",
    "email": null,
    "email_status": null,
    "outcome": null,
    "delivered_at": "2026-07-02T09:00:00Z",
    "measured_at": "2026-07-01T08:00:00Z",
    "mbi_fetched_at": "2026-07-02T07:00:00Z",
    "email_checked_at": null,
    "html_checked_at": null,
    "website_title_tag": null,
    "h1_text": null,
    "meta_description": null
  },
  {
    "id": "a1b2c3d4-0003-4aaa-8bbb-000000000030",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Cabinet Avocat Bastide",
    "city": "Bordeaux",
    "category": "Avocat",
    "keyword": "avocat",
    "maps_position": 25,
    "review_count": 1,
    "rating": 3.4,
    "photo_count": 0,
    "gbp_completeness": 79,
    "is_claimed": false,
    "website_kind": "none",
    "seo_score": 53,
    "phone": null,
    "website_phone_raw": null,
    "nap_phone_match": "no_website",
    "email": "cabinetavocatbasti@gmail.com",
    "email_status": "unknown",
    "outcome": "lost",
    "delivered_at": "2026-08-03T09:00:00Z",
    "measured_at": "2026-08-01T08:00:00Z",
    "mbi_fetched_at": "2026-08-03T10:00:00Z",
    "email_checked_at": "2026-08-03T09:30:00Z",
    "html_checked_at": "2026-08-03T09:15:00Z",
    "website_title_tag": null,
    "h1_text": null,
    "meta_description": null
  },
  {
    "id": "a1b2c3d4-0004-4aaa-8bbb-000000000031",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Atelier d'Architecture Lyon",
    "city": "Lyon",
    "category": "Cabinet d'architecture",
    "keyword": "architecte",
    "maps_position": 8,
    "review_count": 16,
    "rating": 4.4,
    "photo_count": 12,
    "gbp_completeness": 25,
    "is_claimed": true,
    "website_kind": "own",
    "seo_score": 60,
    "phone": "+33478104110",
    "website_phone_raw": "+33478104110",
    "nap_phone_match": "match",
    "email": "contact@atelierdarchitectu.fr",
    "email_status": "deliverable",
    "outcome": null,
    "delivered_at": "2026-07-04T09:00:00Z",
    "measured_at": "2026-07-01T08:00:00Z",
    "mbi_fetched_at": "2026-08-04T10:00:00Z",
    "email_checked_at": "2026-08-04T09:30:00Z",
    "html_checked_at": "2026-08-04T09:15:00Z",
    "website_title_tag": "Atelier d'Architecture Lyon - Architecte à Lyon",
    "h1_text": "Atelier d'Architecture Lyon - architecte professionnel",
    "meta_description": "Atelier d'Architecture Lyon, architecte a Lyon. Devis gratuit, intervention rapide, professionnel qualifie a votre ecoute."
  },
  {
    "id": "a1b2c3d4-0004-4aaa-8bbb-000000000032",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Architecture & Volumes",
    "city": "Lyon",
    "category": "Architecte",
    "keyword": "architecte",
    "maps_position": 18,
    "review_count": 5,
    "rating": 4.0,
    "photo_count": 3,
    "gbp_completeness": 36,
    "is_claimed": false,
    "website_kind": "directory",
    "seo_score": 67,
    "phone": "+33478104247",
    "website_phone_raw": "+33478104247",
    "nap_phone_match": "match",
    "email": "architectureetvolu@gmail.com",
    "email_status": "risky",
    "outcome": null,
    "delivered_at": "2026-08-05T09:00:00Z",
    "measured_at": "2026-08-01T08:00:00Z",
    "mbi_fetched_at": "2026-08-05T10:00:00Z",
    "email_checked_at": "2026-08-05T09:30:00Z",
    "html_checked_at": null,
    "website_title_tag": null,
    "h1_text": null,
    "meta_description": null
  },
  {
    "id": "a1b2c3d4-0004-4aaa-8bbb-000000000033",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Cabinet Architecte Chapuis",
    "city": "Lyon",
    "category": "Architecte",
    "keyword": "architecte",
    "maps_position": 27,
    "review_count": 2,
    "rating": 3.6,
    "photo_count": 0,
    "gbp_completeness": 47,
    "is_claimed": true,
    "website_kind": "none",
    "seo_score": 19,
    "phone": "+33478104384",
    "website_phone_raw": null,
    "nap_phone_match": "no_website",
    "email": null,
    "email_status": null,
    "outcome": null,
    "delivered_at": "2026-07-06T09:00:00Z",
    "measured_at": "2026-07-02T08:00:00Z",
    "mbi_fetched_at": "2026-08-06T10:00:00Z",
    "email_checked_at": "2026-08-06T09:30:00Z",
    "html_checked_at": "2026-08-06T09:15:00Z",
    "website_title_tag": null,
    "h1_text": null,
    "meta_description": null
  },
  {
    "id": "a1b2c3d4-0004-4aaa-8bbb-000000000034",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Studio Archi Paris",
    "city": "Paris",
    "category": "Cabinet d'architecture",
    "keyword": "architecte",
    "maps_position": 9,
    "review_count": 20,
    "rating": 4.5,
    "photo_count": 10,
    "gbp_completeness": 61,
    "is_claimed": true,
    "website_kind": "own",
    "seo_score": 46,
    "phone": "+33141045210",
    "website_phone_raw": "+33141045210",
    "nap_phone_match": "match",
    "email": null,
    "email_status": null,
    "outcome": "in_progress",
    "delivered_at": "2026-08-07T09:00:00Z",
    "measured_at": "2026-08-03T08:00:00Z",
    "mbi_fetched_at": "2026-08-07T07:00:00Z",
    "email_checked_at": null,
    "html_checked_at": null,
    "website_title_tag": null,
    "h1_text": null,
    "meta_description": null
  },
  {
    "id": "a1b2c3d4-0004-4aaa-8bbb-000000000035",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Agence d'Architecture Nord-Est",
    "city": "Paris",
    "category": "Architecte",
    "keyword": "architecte",
    "maps_position": 21,
    "review_count": 4,
    "rating": 3.8,
    "photo_count": 1,
    "gbp_completeness": 69,
    "is_claimed": true,
    "website_kind": "social",
    "seo_score": 33,
    "phone": null,
    "website_phone_raw": "+33142416580",
    "nap_phone_match": "no_gbp",
    "email": "agencedarchitectur@gmail.com",
    "email_status": "deliverable",
    "outcome": null,
    "delivered_at": "2026-07-08T09:00:00Z",
    "measured_at": "2026-07-04T08:00:00Z",
    "mbi_fetched_at": "2026-08-08T10:00:00Z",
    "email_checked_at": "2026-08-08T09:30:00Z",
    "html_checked_at": "2026-08-08T09:15:00Z",
    "website_title_tag": "Agence d'Architecture Nord-Est - Architecte à Paris",
    "h1_text": "Agence d'Architecture Nord-Est - architecte professionnel",
    "meta_description": "Agence d'Architecture Nord-Est, architecte a Paris. Devis gratuit, intervention rapide, professionnel qualifie a votre ecoute."
  },
  {
    "id": "a1b2c3d4-0004-4aaa-8bbb-000000000036",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Architecte DPLG Rivière",
    "city": "Paris",
    "category": "Architecte",
    "keyword": "architecte",
    "maps_position": 14,
    "review_count": 7,
    "rating": 4.1,
    "photo_count": 2,
    "gbp_completeness": 80,
    "is_claimed": false,
    "website_kind": "directory",
    "seo_score": 40,
    "phone": "+33141047950",
    "website_phone_raw": "+33141047950",
    "nap_phone_match": "match",
    "email": null,
    "email_status": null,
    "outcome": "no_response",
    "delivered_at": "2026-08-09T09:00:00Z",
    "measured_at": "2026-08-05T08:00:00Z",
    "mbi_fetched_at": "2026-08-09T10:00:00Z",
    "email_checked_at": null,
    "html_checked_at": "2026-08-09T09:15:00Z",
    "website_title_tag": "Architecte DPLG Rivière - Architecte à Paris",
    "h1_text": "Architecte DPLG Rivière - architecte professionnel",
    "meta_description": "Architecte DPLG Rivière, architecte a Paris. Devis gratuit, intervention rapide, professionnel qualifie a votre ecoute."
  },
  {
    "id": "a1b2c3d4-0004-4aaa-8bbb-000000000037",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Atelier Cube Lille",
    "city": "Lille",
    "category": "Cabinet d'architecture",
    "keyword": "architecte",
    "maps_position": 11,
    "review_count": 13,
    "rating": 4.3,
    "photo_count": 6,
    "gbp_completeness": 26,
    "is_claimed": true,
    "website_kind": "own",
    "seo_score": 47,
    "phone": "+33320104932",
    "website_phone_raw": "+33320104932",
    "nap_phone_match": "match",
    "email": "contact@ateliercubelille.fr",
    "email_status": "deliverable",
    "outcome": null,
    "delivered_at": "2026-07-10T09:00:00Z",
    "measured_at": "2026-07-06T08:00:00Z",
    "mbi_fetched_at": "2026-08-10T10:00:00Z",
    "email_checked_at": "2026-08-10T09:30:00Z",
    "html_checked_at": "2026-08-10T09:15:00Z",
    "website_title_tag": "Atelier Cube Lille - Architecte à Lille",
    "h1_text": "Atelier Cube Lille - architecte professionnel",
    "meta_description": "Atelier Cube Lille, architecte a Lille. Devis gratuit, intervention rapide, professionnel qualifie a votre ecoute."
  },
  {
    "id": "a1b2c3d4-0004-4aaa-8bbb-000000000038",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Cabinet Marchand Architecte",
    "city": "Bordeaux",
    "category": "Architecte",
    "keyword": "architecte",
    "maps_position": 16,
    "review_count": 9,
    "rating": 4.2,
    "photo_count": 3,
    "gbp_completeness": 37,
    "is_claimed": false,
    "website_kind": "directory",
    "seo_score": 54,
    "phone": "+33556105069",
    "website_phone_raw": "+33556105069",
    "nap_phone_match": "match",
    "email": "cabinetmarchandarc@gmail.com",
    "email_status": "risky",
    "outcome": "won",
    "delivered_at": "2026-08-11T09:00:00Z",
    "measured_at": "2026-08-07T08:00:00Z",
    "mbi_fetched_at": "2026-08-11T10:00:00Z",
    "email_checked_at": "2026-08-11T09:30:00Z",
    "html_checked_at": null,
    "website_title_tag": null,
    "h1_text": null,
    "meta_description": null
  },
  {
    "id": "a1b2c3d4-0004-4aaa-8bbb-000000000039",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Studio Archi Bordeaux",
    "city": "Bordeaux",
    "category": "Architecte",
    "keyword": "architecte",
    "maps_position": 24,
    "review_count": 3,
    "rating": 3.7,
    "photo_count": 0,
    "gbp_completeness": 26,
    "is_claimed": false,
    "website_kind": "none",
    "seo_score": 21,
    "phone": "+33556105206",
    "website_phone_raw": null,
    "nap_phone_match": "no_website",
    "email": null,
    "email_status": null,
    "outcome": null,
    "delivered_at": "2026-07-12T09:00:00Z",
    "measured_at": "2026-07-08T08:00:00Z",
    "mbi_fetched_at": "2026-07-12T07:00:00Z",
    "email_checked_at": null,
    "html_checked_at": null,
    "website_title_tag": null,
    "h1_text": null,
    "meta_description": null
  },
  {
    "id": "a1b2c3d4-0004-4aaa-8bbb-000000000040",
    "campaign_id": "cmp-0001-4aaa-8bbb-000000000001",
    "business_name": "Atelier Garonne Architecture",
    "city": "Bordeaux",
    "category": "Architecte",
    "keyword": "architecte",
    "maps_position": 20,
    "review_count": 6,
    "rating": 4.0,
    "photo_count": 2,
    "gbp_completeness": 59,
    "is_claimed": false,
    "website_kind": "social",
    "seo_score": 68,
    "phone": "+33556105343",
    "website_phone_raw": "+33556105343",
    "nap_phone_match": "match",
    "email": null,
    "email_status": null,
    "outcome": "lost",
    "delivered_at": "2026-08-13T09:00:00Z",
    "measured_at": "2026-08-09T08:00:00Z",
    "mbi_fetched_at": "2026-08-13T10:00:00Z",
    "email_checked_at": "2026-08-13T09:30:00Z",
    "html_checked_at": "2026-08-13T09:15:00Z",
    "website_title_tag": "Atelier Garonne Architecture - Architecte à Bordeaux",
    "h1_text": "Atelier Garonne Architecture - architecte professionnel",
    "meta_description": "Atelier Garonne Architecture, architecte a Bordeaux. Devis gratuit, intervention rapide, professionnel qualifie a votre ecoute."
  }
];

export const mockCommunes: Commune[] = [
  {
    "code_insee": "75056",
    "nom": "Paris",
    "slug": "paris",
    "dept_code": "75",
    "region_name": "Île-de-France",
    "population": 2145906
  },
  {
    "code_insee": "69123",
    "nom": "Lyon",
    "slug": "lyon",
    "dept_code": "69",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 522969
  },
  {
    "code_insee": "13055",
    "nom": "Marseille",
    "slug": "marseille",
    "dept_code": "13",
    "region_name": "Provence-Alpes-Côte d'Azur",
    "population": 873076
  },
  {
    "code_insee": "59350",
    "nom": "Lille",
    "slug": "lille",
    "dept_code": "59",
    "region_name": "Hauts-de-France",
    "population": 233098
  },
  {
    "code_insee": "33063",
    "nom": "Bordeaux",
    "slug": "bordeaux",
    "dept_code": "33",
    "region_name": "Nouvelle-Aquitaine",
    "population": 260958
  },
  {
    "code_insee": "31555",
    "nom": "Toulouse",
    "slug": "toulouse",
    "dept_code": "31",
    "region_name": "Occitanie",
    "population": 493465
  },
  {
    "code_insee": "44109",
    "nom": "Nantes",
    "slug": "nantes",
    "dept_code": "44",
    "region_name": "Pays de la Loire",
    "population": 320732
  },
  {
    "code_insee": "67482",
    "nom": "Strasbourg",
    "slug": "strasbourg",
    "dept_code": "67",
    "region_name": "Grand Est",
    "population": 287228
  },
  {
    "code_insee": "34172",
    "nom": "Montpellier",
    "slug": "montpellier",
    "dept_code": "34",
    "region_name": "Occitanie",
    "population": 302454
  },
  {
    "code_insee": "35238",
    "nom": "Rennes",
    "slug": "rennes",
    "dept_code": "35",
    "region_name": "Bretagne",
    "population": 220488
  },
  {
    "code_insee": "51454",
    "nom": "Reims",
    "slug": "reims",
    "dept_code": "51",
    "region_name": "Grand Est",
    "population": 182460
  },
  {
    "code_insee": "76351",
    "nom": "Le Havre",
    "slug": "le-havre",
    "dept_code": "76",
    "region_name": "Normandie",
    "population": 165855
  },
  {
    "code_insee": "76540",
    "nom": "Rouen",
    "slug": "rouen",
    "dept_code": "76",
    "region_name": "Normandie",
    "population": 114187
  },
  {
    "code_insee": "42218",
    "nom": "Saint-Étienne",
    "slug": "saint-etienne",
    "dept_code": "42",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 172565
  },
  {
    "code_insee": "83137",
    "nom": "Toulon",
    "slug": "toulon",
    "dept_code": "83",
    "region_name": "Provence-Alpes-Côte d'Azur",
    "population": 176198
  },
  {
    "code_insee": "38185",
    "nom": "Grenoble",
    "slug": "grenoble",
    "dept_code": "38",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 158454
  },
  {
    "code_insee": "21231",
    "nom": "Dijon",
    "slug": "dijon",
    "dept_code": "21",
    "region_name": "Bourgogne-Franche-Comté",
    "population": 158002
  },
  {
    "code_insee": "49007",
    "nom": "Angers",
    "slug": "angers",
    "dept_code": "49",
    "region_name": "Pays de la Loire",
    "population": 152960
  },
  {
    "code_insee": "30189",
    "nom": "Nîmes",
    "slug": "nimes",
    "dept_code": "30",
    "region_name": "Occitanie",
    "population": 150610
  },
  {
    "code_insee": "69266",
    "nom": "Villeurbanne",
    "slug": "villeurbanne",
    "dept_code": "69",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 152624
  },
  {
    "code_insee": "63113",
    "nom": "Clermont-Ferrand",
    "slug": "clermont-ferrand",
    "dept_code": "63",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 143886
  },
  {
    "code_insee": "06088",
    "nom": "Nice",
    "slug": "nice",
    "dept_code": "06",
    "region_name": "Provence-Alpes-Côte d'Azur",
    "population": 342669
  },
  {
    "code_insee": "54395",
    "nom": "Nancy",
    "slug": "nancy",
    "dept_code": "54",
    "region_name": "Grand Est",
    "population": 104885
  },
  {
    "code_insee": "80021",
    "nom": "Amiens",
    "slug": "amiens",
    "dept_code": "80",
    "region_name": "Hauts-de-France",
    "population": 133448
  },
  {
    "code_insee": "37261",
    "nom": "Tours",
    "slug": "tours",
    "dept_code": "37",
    "region_name": "Centre-Val de Loire",
    "population": 136463
  },
  {
    "code_insee": "87085",
    "nom": "Limoges",
    "slug": "limoges",
    "dept_code": "87",
    "region_name": "Nouvelle-Aquitaine",
    "population": 130050
  },
  {
    "code_insee": "72181",
    "nom": "Le Mans",
    "slug": "le-mans",
    "dept_code": "72",
    "region_name": "Pays de la Loire",
    "population": 143240
  },
  {
    "code_insee": "25056",
    "nom": "Besançon",
    "slug": "besancon",
    "dept_code": "25",
    "region_name": "Bourgogne-Franche-Comté",
    "population": 116775
  },
  {
    "code_insee": "45234",
    "nom": "Orléans",
    "slug": "orleans",
    "dept_code": "45",
    "region_name": "Centre-Val de Loire",
    "population": 116238
  },
  {
    "code_insee": "57463",
    "nom": "Metz",
    "slug": "metz",
    "dept_code": "57",
    "region_name": "Grand Est",
    "population": 116429
  },
  {
    "code_insee": "64445",
    "nom": "Pau",
    "slug": "pau",
    "dept_code": "64",
    "region_name": "Nouvelle-Aquitaine",
    "population": 76173
  },
  {
    "code_insee": "62041",
    "nom": "Arras",
    "slug": "arras",
    "dept_code": "62",
    "region_name": "Hauts-de-France",
    "population": 41199
  },
  {
    "code_insee": "59606",
    "nom": "Roubaix",
    "slug": "roubaix",
    "dept_code": "59",
    "region_name": "Hauts-de-France",
    "population": 98828
  },
  {
    "code_insee": "59512",
    "nom": "Tourcoing",
    "slug": "tourcoing",
    "dept_code": "59",
    "region_name": "Hauts-de-France",
    "population": 97900
  },
  {
    "code_insee": "62193",
    "nom": "Calais",
    "slug": "calais",
    "dept_code": "62",
    "region_name": "Hauts-de-France",
    "population": 71595
  },
  {
    "code_insee": "33318",
    "nom": "Mérignac",
    "slug": "merignac",
    "dept_code": "33",
    "region_name": "Nouvelle-Aquitaine",
    "population": 71075
  },
  {
    "code_insee": "33119",
    "nom": "Pessac",
    "slug": "pessac",
    "dept_code": "33",
    "region_name": "Nouvelle-Aquitaine",
    "population": 65486
  },
  {
    "code_insee": "69259",
    "nom": "Vénissieux",
    "slug": "venissieux",
    "dept_code": "69",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 66738
  },
  {
    "code_insee": "69003",
    "nom": "Lyon 3e",
    "slug": "lyon-3e",
    "dept_code": "69",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 100000
  },
  {
    "code_insee": "93066",
    "nom": "Saint-Denis",
    "slug": "saint-denis",
    "dept_code": "93",
    "region_name": "Île-de-France",
    "population": 113351
  },
  {
    "code_insee": "92050",
    "nom": "Nanterre",
    "slug": "nanterre",
    "dept_code": "92",
    "region_name": "Île-de-France",
    "population": 95753
  },
  {
    "code_insee": "69199",
    "nom": "Sainte-Colombe",
    "slug": "sainte-colombe",
    "dept_code": "69",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 1023
  },
  {
    "code_insee": "33477",
    "nom": "Sainte-Colombe",
    "slug": "sainte-colombe",
    "dept_code": "33",
    "region_name": "Nouvelle-Aquitaine",
    "population": 456
  },
  {
    "code_insee": "76580",
    "nom": "Sainte-Colombe",
    "slug": "sainte-colombe",
    "dept_code": "76",
    "region_name": "Normandie",
    "population": 712
  },
  {
    "code_insee": "21562",
    "nom": "Sainte-Colombe",
    "slug": "sainte-colombe",
    "dept_code": "21",
    "region_name": "Bourgogne-Franche-Comté",
    "population": 389
  },
  {
    "code_insee": "89369",
    "nom": "Sainte-Colombe",
    "slug": "sainte-colombe",
    "dept_code": "89",
    "region_name": "Bourgogne-Franche-Comté",
    "population": 201
  },
  {
    "code_insee": "16345",
    "nom": "Sainte-Colombe",
    "slug": "sainte-colombe",
    "dept_code": "16",
    "region_name": "Nouvelle-Aquitaine",
    "population": 178
  },
  {
    "code_insee": "01100",
    "nom": "Saint-Aubin-sur-Loire",
    "slug": "saint-aubin-sur-loire",
    "dept_code": "01",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 200
  },
  {
    "code_insee": "02107",
    "nom": "Saint-Martin",
    "slug": "saint-martin",
    "dept_code": "02",
    "region_name": "Hauts-de-France",
    "population": 253
  },
  {
    "code_insee": "03114",
    "nom": "Julien-le-Château",
    "slug": "julien-le-château",
    "dept_code": "03",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 306
  },
  {
    "code_insee": "04121",
    "nom": "Pierre-en-Vallée",
    "slug": "pierre-en-vallee",
    "dept_code": "04",
    "region_name": "Provence-Alpes-Côte d'Azur",
    "population": 359
  },
  {
    "code_insee": "05128",
    "nom": "Notre-Dame-de-Denis",
    "slug": "notre-dame-de-denis",
    "dept_code": "05",
    "region_name": "Provence-Alpes-Côte d'Azur",
    "population": 412
  },
  {
    "code_insee": "07135",
    "nom": "Vincent-sur-Vienne",
    "slug": "vincent-sur-vienne",
    "dept_code": "07",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 465
  },
  {
    "code_insee": "08142",
    "nom": "Le Petit-Loup",
    "slug": "le-petit-loup",
    "dept_code": "08",
    "region_name": "Grand Est",
    "population": 518
  },
  {
    "code_insee": "09149",
    "nom": "Villeneuve-Amand",
    "slug": "villeneuve-amand",
    "dept_code": "09",
    "region_name": "Occitanie",
    "population": 571
  },
  {
    "code_insee": "10156",
    "nom": "Saint-Georges-sur-Loire",
    "slug": "saint-georges-sur-loire",
    "dept_code": "10",
    "region_name": "Grand Est",
    "population": 624
  },
  {
    "code_insee": "11163",
    "nom": "Saint-Michel",
    "slug": "saint-michel",
    "dept_code": "11",
    "region_name": "Occitanie",
    "population": 677
  },
  {
    "code_insee": "12170",
    "nom": "Rémy-le-Château",
    "slug": "remy-le-château",
    "dept_code": "12",
    "region_name": "Occitanie",
    "population": 730
  },
  {
    "code_insee": "14177",
    "nom": "Hilaire-en-Vallée",
    "slug": "hilaire-en-vallee",
    "dept_code": "14",
    "region_name": "Normandie",
    "population": 783
  },
  {
    "code_insee": "15184",
    "nom": "Notre-Dame-de-Cyr",
    "slug": "notre-dame-de-cyr",
    "dept_code": "15",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 836
  },
  {
    "code_insee": "17191",
    "nom": "Genest-sur-Vienne",
    "slug": "genest-sur-vienne",
    "dept_code": "17",
    "region_name": "Nouvelle-Aquitaine",
    "population": 889
  },
  {
    "code_insee": "18198",
    "nom": "Le Petit-Aubin",
    "slug": "le-petit-aubin",
    "dept_code": "18",
    "region_name": "Centre-Val de Loire",
    "population": 942
  },
  {
    "code_insee": "19205",
    "nom": "Villeneuve-Martin",
    "slug": "villeneuve-martin",
    "dept_code": "19",
    "region_name": "Nouvelle-Aquitaine",
    "population": 995
  },
  {
    "code_insee": "22212",
    "nom": "Saint-Julien-sur-Loire",
    "slug": "saint-julien-sur-loire",
    "dept_code": "22",
    "region_name": "Bretagne",
    "population": 1048
  },
  {
    "code_insee": "23219",
    "nom": "Saint-Pierre",
    "slug": "saint-pierre",
    "dept_code": "23",
    "region_name": "Nouvelle-Aquitaine",
    "population": 1101
  },
  {
    "code_insee": "24226",
    "nom": "Denis-le-Château",
    "slug": "denis-le-château",
    "dept_code": "24",
    "region_name": "Nouvelle-Aquitaine",
    "population": 1154
  },
  {
    "code_insee": "26233",
    "nom": "Vincent-en-Vallée",
    "slug": "vincent-en-vallee",
    "dept_code": "26",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 1207
  },
  {
    "code_insee": "27240",
    "nom": "Notre-Dame-de-Loup",
    "slug": "notre-dame-de-loup",
    "dept_code": "27",
    "region_name": "Normandie",
    "population": 1260
  },
  {
    "code_insee": "28247",
    "nom": "Amand-sur-Vienne",
    "slug": "amand-sur-vienne",
    "dept_code": "28",
    "region_name": "Centre-Val de Loire",
    "population": 1313
  },
  {
    "code_insee": "29254",
    "nom": "Le Petit-Georges",
    "slug": "le-petit-georges",
    "dept_code": "29",
    "region_name": "Bretagne",
    "population": 1366
  },
  {
    "code_insee": "32261",
    "nom": "Villeneuve-Michel",
    "slug": "villeneuve-michel",
    "dept_code": "32",
    "region_name": "Occitanie",
    "population": 1419
  },
  {
    "code_insee": "36268",
    "nom": "Saint-Rémy-sur-Loire",
    "slug": "saint-remy-sur-loire",
    "dept_code": "36",
    "region_name": "Centre-Val de Loire",
    "population": 1472
  },
  {
    "code_insee": "39275",
    "nom": "Saint-Hilaire",
    "slug": "saint-hilaire",
    "dept_code": "39",
    "region_name": "Bourgogne-Franche-Comté",
    "population": 1525
  },
  {
    "code_insee": "40282",
    "nom": "Cyr-le-Château",
    "slug": "cyr-le-château",
    "dept_code": "40",
    "region_name": "Nouvelle-Aquitaine",
    "population": 1578
  },
  {
    "code_insee": "41289",
    "nom": "Genest-en-Vallée",
    "slug": "genest-en-vallee",
    "dept_code": "41",
    "region_name": "Centre-Val de Loire",
    "population": 1631
  },
  {
    "code_insee": "43296",
    "nom": "Notre-Dame-de-Aubin",
    "slug": "notre-dame-de-aubin",
    "dept_code": "43",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 1684
  },
  {
    "code_insee": "46303",
    "nom": "Martin-sur-Vienne",
    "slug": "martin-sur-vienne",
    "dept_code": "46",
    "region_name": "Occitanie",
    "population": 1737
  },
  {
    "code_insee": "47310",
    "nom": "Le Petit-Julien",
    "slug": "le-petit-julien",
    "dept_code": "47",
    "region_name": "Nouvelle-Aquitaine",
    "population": 1790
  },
  {
    "code_insee": "48317",
    "nom": "Villeneuve-Pierre",
    "slug": "villeneuve-pierre",
    "dept_code": "48",
    "region_name": "Occitanie",
    "population": 1843
  },
  {
    "code_insee": "50324",
    "nom": "Saint-Denis-sur-Loire",
    "slug": "saint-denis-sur-loire",
    "dept_code": "50",
    "region_name": "Normandie",
    "population": 1896
  },
  {
    "code_insee": "52331",
    "nom": "Saint-Vincent",
    "slug": "saint-vincent",
    "dept_code": "52",
    "region_name": "Grand Est",
    "population": 1949
  },
  {
    "code_insee": "53338",
    "nom": "Loup-le-Château",
    "slug": "loup-le-château",
    "dept_code": "53",
    "region_name": "Pays de la Loire",
    "population": 2002
  },
  {
    "code_insee": "55345",
    "nom": "Amand-en-Vallée",
    "slug": "amand-en-vallee",
    "dept_code": "55",
    "region_name": "Grand Est",
    "population": 2055
  },
  {
    "code_insee": "56352",
    "nom": "Notre-Dame-de-Georges",
    "slug": "notre-dame-de-georges",
    "dept_code": "56",
    "region_name": "Bretagne",
    "population": 2108
  },
  {
    "code_insee": "58359",
    "nom": "Michel-sur-Vienne",
    "slug": "michel-sur-vienne",
    "dept_code": "58",
    "region_name": "Bourgogne-Franche-Comté",
    "population": 2161
  },
  {
    "code_insee": "60366",
    "nom": "Le Petit-Rémy",
    "slug": "le-petit-remy",
    "dept_code": "60",
    "region_name": "Hauts-de-France",
    "population": 2214
  },
  {
    "code_insee": "61373",
    "nom": "Villeneuve-Hilaire",
    "slug": "villeneuve-hilaire",
    "dept_code": "61",
    "region_name": "Normandie",
    "population": 2267
  },
  {
    "code_insee": "65380",
    "nom": "Saint-Cyr-sur-Loire",
    "slug": "saint-cyr-sur-loire",
    "dept_code": "65",
    "region_name": "Occitanie",
    "population": 2320
  },
  {
    "code_insee": "66387",
    "nom": "Saint-Genest",
    "slug": "saint-genest",
    "dept_code": "66",
    "region_name": "Occitanie",
    "population": 2373
  },
  {
    "code_insee": "68394",
    "nom": "Aubin-le-Château",
    "slug": "aubin-le-château",
    "dept_code": "68",
    "region_name": "Grand Est",
    "population": 2426
  },
  {
    "code_insee": "70401",
    "nom": "Martin-en-Vallée",
    "slug": "martin-en-vallee",
    "dept_code": "70",
    "region_name": "Bourgogne-Franche-Comté",
    "population": 2479
  },
  {
    "code_insee": "71408",
    "nom": "Notre-Dame-de-Julien",
    "slug": "notre-dame-de-julien",
    "dept_code": "71",
    "region_name": "Bourgogne-Franche-Comté",
    "population": 2532
  },
  {
    "code_insee": "73415",
    "nom": "Pierre-sur-Vienne",
    "slug": "pierre-sur-vienne",
    "dept_code": "73",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 2585
  },
  {
    "code_insee": "74422",
    "nom": "Le Petit-Denis",
    "slug": "le-petit-denis",
    "dept_code": "74",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 2638
  },
  {
    "code_insee": "77429",
    "nom": "Villeneuve-Vincent",
    "slug": "villeneuve-vincent",
    "dept_code": "77",
    "region_name": "Île-de-France",
    "population": 2691
  },
  {
    "code_insee": "78436",
    "nom": "Saint-Loup-sur-Loire",
    "slug": "saint-loup-sur-loire",
    "dept_code": "78",
    "region_name": "Île-de-France",
    "population": 2744
  },
  {
    "code_insee": "79443",
    "nom": "Saint-Amand",
    "slug": "saint-amand",
    "dept_code": "79",
    "region_name": "Nouvelle-Aquitaine",
    "population": 2797
  },
  {
    "code_insee": "81450",
    "nom": "Georges-le-Château",
    "slug": "georges-le-château",
    "dept_code": "81",
    "region_name": "Occitanie",
    "population": 2850
  },
  {
    "code_insee": "82457",
    "nom": "Michel-en-Vallée",
    "slug": "michel-en-vallee",
    "dept_code": "82",
    "region_name": "Occitanie",
    "population": 2903
  },
  {
    "code_insee": "84464",
    "nom": "Notre-Dame-de-Rémy",
    "slug": "notre-dame-de-remy",
    "dept_code": "84",
    "region_name": "Provence-Alpes-Côte d'Azur",
    "population": 2956
  },
  {
    "code_insee": "85471",
    "nom": "Hilaire-sur-Vienne",
    "slug": "hilaire-sur-vienne",
    "dept_code": "85",
    "region_name": "Pays de la Loire",
    "population": 3009
  },
  {
    "code_insee": "86478",
    "nom": "Le Petit-Cyr",
    "slug": "le-petit-cyr",
    "dept_code": "86",
    "region_name": "Nouvelle-Aquitaine",
    "population": 3062
  },
  {
    "code_insee": "88485",
    "nom": "Villeneuve-Genest",
    "slug": "villeneuve-genest",
    "dept_code": "88",
    "region_name": "Grand Est",
    "population": 3115
  },
  {
    "code_insee": "90492",
    "nom": "Saint-Aubin-sur-Loire",
    "slug": "saint-aubin-sur-loire",
    "dept_code": "90",
    "region_name": "Bourgogne-Franche-Comté",
    "population": 3168
  },
  {
    "code_insee": "91499",
    "nom": "Saint-Martin",
    "slug": "saint-martin",
    "dept_code": "91",
    "region_name": "Île-de-France",
    "population": 3221
  },
  {
    "code_insee": "95506",
    "nom": "Julien-le-Château",
    "slug": "julien-le-château",
    "dept_code": "95",
    "region_name": "Île-de-France",
    "population": 3274
  },
  {
    "code_insee": "01513",
    "nom": "Pierre-en-Vallée",
    "slug": "pierre-en-vallee",
    "dept_code": "01",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 3327
  },
  {
    "code_insee": "02520",
    "nom": "Notre-Dame-de-Denis",
    "slug": "notre-dame-de-denis",
    "dept_code": "02",
    "region_name": "Hauts-de-France",
    "population": 3380
  },
  {
    "code_insee": "03527",
    "nom": "Vincent-sur-Vienne",
    "slug": "vincent-sur-vienne",
    "dept_code": "03",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 3433
  },
  {
    "code_insee": "04534",
    "nom": "Le Petit-Loup",
    "slug": "le-petit-loup",
    "dept_code": "04",
    "region_name": "Provence-Alpes-Côte d'Azur",
    "population": 3486
  },
  {
    "code_insee": "05541",
    "nom": "Villeneuve-Amand",
    "slug": "villeneuve-amand",
    "dept_code": "05",
    "region_name": "Provence-Alpes-Côte d'Azur",
    "population": 3539
  },
  {
    "code_insee": "07548",
    "nom": "Saint-Georges-sur-Loire",
    "slug": "saint-georges-sur-loire",
    "dept_code": "07",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 3592
  },
  {
    "code_insee": "08555",
    "nom": "Saint-Michel",
    "slug": "saint-michel",
    "dept_code": "08",
    "region_name": "Grand Est",
    "population": 3645
  },
  {
    "code_insee": "09562",
    "nom": "Rémy-le-Château",
    "slug": "remy-le-château",
    "dept_code": "09",
    "region_name": "Occitanie",
    "population": 3698
  },
  {
    "code_insee": "10569",
    "nom": "Hilaire-en-Vallée",
    "slug": "hilaire-en-vallee",
    "dept_code": "10",
    "region_name": "Grand Est",
    "population": 3751
  },
  {
    "code_insee": "11576",
    "nom": "Notre-Dame-de-Cyr",
    "slug": "notre-dame-de-cyr",
    "dept_code": "11",
    "region_name": "Occitanie",
    "population": 3804
  },
  {
    "code_insee": "12583",
    "nom": "Genest-sur-Vienne",
    "slug": "genest-sur-vienne",
    "dept_code": "12",
    "region_name": "Occitanie",
    "population": 3857
  },
  {
    "code_insee": "14590",
    "nom": "Le Petit-Aubin",
    "slug": "le-petit-aubin",
    "dept_code": "14",
    "region_name": "Normandie",
    "population": 3910
  },
  {
    "code_insee": "15597",
    "nom": "Villeneuve-Martin",
    "slug": "villeneuve-martin",
    "dept_code": "15",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 3963
  },
  {
    "code_insee": "17604",
    "nom": "Saint-Julien-sur-Loire",
    "slug": "saint-julien-sur-loire",
    "dept_code": "17",
    "region_name": "Nouvelle-Aquitaine",
    "population": 4016
  },
  {
    "code_insee": "18611",
    "nom": "Saint-Pierre",
    "slug": "saint-pierre",
    "dept_code": "18",
    "region_name": "Centre-Val de Loire",
    "population": 4069
  },
  {
    "code_insee": "19618",
    "nom": "Denis-le-Château",
    "slug": "denis-le-château",
    "dept_code": "19",
    "region_name": "Nouvelle-Aquitaine",
    "population": 4122
  },
  {
    "code_insee": "22625",
    "nom": "Vincent-en-Vallée",
    "slug": "vincent-en-vallee",
    "dept_code": "22",
    "region_name": "Bretagne",
    "population": 4175
  },
  {
    "code_insee": "23632",
    "nom": "Notre-Dame-de-Loup",
    "slug": "notre-dame-de-loup",
    "dept_code": "23",
    "region_name": "Nouvelle-Aquitaine",
    "population": 4228
  },
  {
    "code_insee": "24639",
    "nom": "Amand-sur-Vienne",
    "slug": "amand-sur-vienne",
    "dept_code": "24",
    "region_name": "Nouvelle-Aquitaine",
    "population": 4281
  },
  {
    "code_insee": "26646",
    "nom": "Le Petit-Georges",
    "slug": "le-petit-georges",
    "dept_code": "26",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 4334
  },
  {
    "code_insee": "27653",
    "nom": "Villeneuve-Michel",
    "slug": "villeneuve-michel",
    "dept_code": "27",
    "region_name": "Normandie",
    "population": 4387
  },
  {
    "code_insee": "28660",
    "nom": "Saint-Rémy-sur-Loire",
    "slug": "saint-remy-sur-loire",
    "dept_code": "28",
    "region_name": "Centre-Val de Loire",
    "population": 4440
  },
  {
    "code_insee": "29667",
    "nom": "Saint-Hilaire",
    "slug": "saint-hilaire",
    "dept_code": "29",
    "region_name": "Bretagne",
    "population": 4493
  },
  {
    "code_insee": "32674",
    "nom": "Cyr-le-Château",
    "slug": "cyr-le-château",
    "dept_code": "32",
    "region_name": "Occitanie",
    "population": 4546
  },
  {
    "code_insee": "36681",
    "nom": "Genest-en-Vallée",
    "slug": "genest-en-vallee",
    "dept_code": "36",
    "region_name": "Centre-Val de Loire",
    "population": 4599
  },
  {
    "code_insee": "39688",
    "nom": "Notre-Dame-de-Aubin",
    "slug": "notre-dame-de-aubin",
    "dept_code": "39",
    "region_name": "Bourgogne-Franche-Comté",
    "population": 4652
  },
  {
    "code_insee": "40695",
    "nom": "Martin-sur-Vienne",
    "slug": "martin-sur-vienne",
    "dept_code": "40",
    "region_name": "Nouvelle-Aquitaine",
    "population": 4705
  },
  {
    "code_insee": "41702",
    "nom": "Le Petit-Julien",
    "slug": "le-petit-julien",
    "dept_code": "41",
    "region_name": "Centre-Val de Loire",
    "population": 4758
  },
  {
    "code_insee": "43709",
    "nom": "Villeneuve-Pierre",
    "slug": "villeneuve-pierre",
    "dept_code": "43",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 4811
  },
  {
    "code_insee": "46716",
    "nom": "Saint-Denis-sur-Loire",
    "slug": "saint-denis-sur-loire",
    "dept_code": "46",
    "region_name": "Occitanie",
    "population": 4864
  },
  {
    "code_insee": "47723",
    "nom": "Saint-Vincent",
    "slug": "saint-vincent",
    "dept_code": "47",
    "region_name": "Nouvelle-Aquitaine",
    "population": 4917
  },
  {
    "code_insee": "48730",
    "nom": "Loup-le-Château",
    "slug": "loup-le-château",
    "dept_code": "48",
    "region_name": "Occitanie",
    "population": 4970
  },
  {
    "code_insee": "50737",
    "nom": "Amand-en-Vallée",
    "slug": "amand-en-vallee",
    "dept_code": "50",
    "region_name": "Normandie",
    "population": 5023
  },
  {
    "code_insee": "52744",
    "nom": "Notre-Dame-de-Georges",
    "slug": "notre-dame-de-georges",
    "dept_code": "52",
    "region_name": "Grand Est",
    "population": 5076
  },
  {
    "code_insee": "53751",
    "nom": "Michel-sur-Vienne",
    "slug": "michel-sur-vienne",
    "dept_code": "53",
    "region_name": "Pays de la Loire",
    "population": 5129
  },
  {
    "code_insee": "55758",
    "nom": "Le Petit-Rémy",
    "slug": "le-petit-remy",
    "dept_code": "55",
    "region_name": "Grand Est",
    "population": 5182
  },
  {
    "code_insee": "56765",
    "nom": "Villeneuve-Hilaire",
    "slug": "villeneuve-hilaire",
    "dept_code": "56",
    "region_name": "Bretagne",
    "population": 5235
  },
  {
    "code_insee": "58772",
    "nom": "Saint-Cyr-sur-Loire",
    "slug": "saint-cyr-sur-loire",
    "dept_code": "58",
    "region_name": "Bourgogne-Franche-Comté",
    "population": 5288
  },
  {
    "code_insee": "60779",
    "nom": "Saint-Genest",
    "slug": "saint-genest",
    "dept_code": "60",
    "region_name": "Hauts-de-France",
    "population": 5341
  },
  {
    "code_insee": "61786",
    "nom": "Aubin-le-Château",
    "slug": "aubin-le-château",
    "dept_code": "61",
    "region_name": "Normandie",
    "population": 5394
  },
  {
    "code_insee": "65793",
    "nom": "Martin-en-Vallée",
    "slug": "martin-en-vallee",
    "dept_code": "65",
    "region_name": "Occitanie",
    "population": 5447
  },
  {
    "code_insee": "66800",
    "nom": "Notre-Dame-de-Julien",
    "slug": "notre-dame-de-julien",
    "dept_code": "66",
    "region_name": "Occitanie",
    "population": 5500
  },
  {
    "code_insee": "68807",
    "nom": "Pierre-sur-Vienne",
    "slug": "pierre-sur-vienne",
    "dept_code": "68",
    "region_name": "Grand Est",
    "population": 5553
  },
  {
    "code_insee": "70814",
    "nom": "Le Petit-Denis",
    "slug": "le-petit-denis",
    "dept_code": "70",
    "region_name": "Bourgogne-Franche-Comté",
    "population": 5606
  },
  {
    "code_insee": "71821",
    "nom": "Villeneuve-Vincent",
    "slug": "villeneuve-vincent",
    "dept_code": "71",
    "region_name": "Bourgogne-Franche-Comté",
    "population": 5659
  },
  {
    "code_insee": "73828",
    "nom": "Saint-Loup-sur-Loire",
    "slug": "saint-loup-sur-loire",
    "dept_code": "73",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 5712
  },
  {
    "code_insee": "74835",
    "nom": "Saint-Amand",
    "slug": "saint-amand",
    "dept_code": "74",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 5765
  },
  {
    "code_insee": "77842",
    "nom": "Georges-le-Château",
    "slug": "georges-le-château",
    "dept_code": "77",
    "region_name": "Île-de-France",
    "population": 5818
  },
  {
    "code_insee": "78849",
    "nom": "Michel-en-Vallée",
    "slug": "michel-en-vallee",
    "dept_code": "78",
    "region_name": "Île-de-France",
    "population": 5871
  },
  {
    "code_insee": "79856",
    "nom": "Notre-Dame-de-Rémy",
    "slug": "notre-dame-de-remy",
    "dept_code": "79",
    "region_name": "Nouvelle-Aquitaine",
    "population": 5924
  },
  {
    "code_insee": "81863",
    "nom": "Hilaire-sur-Vienne",
    "slug": "hilaire-sur-vienne",
    "dept_code": "81",
    "region_name": "Occitanie",
    "population": 5977
  },
  {
    "code_insee": "82870",
    "nom": "Le Petit-Cyr",
    "slug": "le-petit-cyr",
    "dept_code": "82",
    "region_name": "Occitanie",
    "population": 6030
  },
  {
    "code_insee": "84877",
    "nom": "Villeneuve-Genest",
    "slug": "villeneuve-genest",
    "dept_code": "84",
    "region_name": "Provence-Alpes-Côte d'Azur",
    "population": 6083
  },
  {
    "code_insee": "85884",
    "nom": "Saint-Aubin-sur-Loire",
    "slug": "saint-aubin-sur-loire",
    "dept_code": "85",
    "region_name": "Pays de la Loire",
    "population": 6136
  },
  {
    "code_insee": "86891",
    "nom": "Saint-Martin",
    "slug": "saint-martin",
    "dept_code": "86",
    "region_name": "Nouvelle-Aquitaine",
    "population": 6189
  },
  {
    "code_insee": "88898",
    "nom": "Julien-le-Château",
    "slug": "julien-le-château",
    "dept_code": "88",
    "region_name": "Grand Est",
    "population": 6242
  },
  {
    "code_insee": "90905",
    "nom": "Pierre-en-Vallée",
    "slug": "pierre-en-vallee",
    "dept_code": "90",
    "region_name": "Bourgogne-Franche-Comté",
    "population": 6295
  },
  {
    "code_insee": "91912",
    "nom": "Notre-Dame-de-Denis",
    "slug": "notre-dame-de-denis",
    "dept_code": "91",
    "region_name": "Île-de-France",
    "population": 6348
  },
  {
    "code_insee": "95919",
    "nom": "Vincent-sur-Vienne",
    "slug": "vincent-sur-vienne",
    "dept_code": "95",
    "region_name": "Île-de-France",
    "population": 6401
  },
  {
    "code_insee": "01926",
    "nom": "Le Petit-Loup",
    "slug": "le-petit-loup",
    "dept_code": "01",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 6454
  },
  {
    "code_insee": "02933",
    "nom": "Villeneuve-Amand",
    "slug": "villeneuve-amand",
    "dept_code": "02",
    "region_name": "Hauts-de-France",
    "population": 6507
  },
  {
    "code_insee": "03940",
    "nom": "Saint-Georges-sur-Loire",
    "slug": "saint-georges-sur-loire",
    "dept_code": "03",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 6560
  },
  {
    "code_insee": "04947",
    "nom": "Saint-Michel",
    "slug": "saint-michel",
    "dept_code": "04",
    "region_name": "Provence-Alpes-Côte d'Azur",
    "population": 6613
  },
  {
    "code_insee": "05104",
    "nom": "Rémy-le-Château",
    "slug": "remy-le-château",
    "dept_code": "05",
    "region_name": "Provence-Alpes-Côte d'Azur",
    "population": 6666
  },
  {
    "code_insee": "07111",
    "nom": "Hilaire-en-Vallée",
    "slug": "hilaire-en-vallee",
    "dept_code": "07",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 6719
  },
  {
    "code_insee": "08118",
    "nom": "Notre-Dame-de-Cyr",
    "slug": "notre-dame-de-cyr",
    "dept_code": "08",
    "region_name": "Grand Est",
    "population": 6772
  },
  {
    "code_insee": "09125",
    "nom": "Genest-sur-Vienne",
    "slug": "genest-sur-vienne",
    "dept_code": "09",
    "region_name": "Occitanie",
    "population": 6825
  },
  {
    "code_insee": "10132",
    "nom": "Le Petit-Aubin",
    "slug": "le-petit-aubin",
    "dept_code": "10",
    "region_name": "Grand Est",
    "population": 6878
  },
  {
    "code_insee": "11139",
    "nom": "Villeneuve-Martin",
    "slug": "villeneuve-martin",
    "dept_code": "11",
    "region_name": "Occitanie",
    "population": 6931
  },
  {
    "code_insee": "12146",
    "nom": "Saint-Julien-sur-Loire",
    "slug": "saint-julien-sur-loire",
    "dept_code": "12",
    "region_name": "Occitanie",
    "population": 6984
  },
  {
    "code_insee": "14153",
    "nom": "Saint-Pierre",
    "slug": "saint-pierre",
    "dept_code": "14",
    "region_name": "Normandie",
    "population": 7037
  },
  {
    "code_insee": "15160",
    "nom": "Denis-le-Château",
    "slug": "denis-le-château",
    "dept_code": "15",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 7090
  },
  {
    "code_insee": "17167",
    "nom": "Vincent-en-Vallée",
    "slug": "vincent-en-vallee",
    "dept_code": "17",
    "region_name": "Nouvelle-Aquitaine",
    "population": 7143
  },
  {
    "code_insee": "18174",
    "nom": "Notre-Dame-de-Loup",
    "slug": "notre-dame-de-loup",
    "dept_code": "18",
    "region_name": "Centre-Val de Loire",
    "population": 7196
  },
  {
    "code_insee": "19181",
    "nom": "Amand-sur-Vienne",
    "slug": "amand-sur-vienne",
    "dept_code": "19",
    "region_name": "Nouvelle-Aquitaine",
    "population": 7249
  },
  {
    "code_insee": "22188",
    "nom": "Le Petit-Georges",
    "slug": "le-petit-georges",
    "dept_code": "22",
    "region_name": "Bretagne",
    "population": 7302
  },
  {
    "code_insee": "23195",
    "nom": "Villeneuve-Michel",
    "slug": "villeneuve-michel",
    "dept_code": "23",
    "region_name": "Nouvelle-Aquitaine",
    "population": 7355
  },
  {
    "code_insee": "24202",
    "nom": "Saint-Rémy-sur-Loire",
    "slug": "saint-remy-sur-loire",
    "dept_code": "24",
    "region_name": "Nouvelle-Aquitaine",
    "population": 7408
  },
  {
    "code_insee": "26209",
    "nom": "Saint-Hilaire",
    "slug": "saint-hilaire",
    "dept_code": "26",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 7461
  },
  {
    "code_insee": "27216",
    "nom": "Cyr-le-Château",
    "slug": "cyr-le-château",
    "dept_code": "27",
    "region_name": "Normandie",
    "population": 7514
  },
  {
    "code_insee": "28223",
    "nom": "Genest-en-Vallée",
    "slug": "genest-en-vallee",
    "dept_code": "28",
    "region_name": "Centre-Val de Loire",
    "population": 7567
  },
  {
    "code_insee": "29230",
    "nom": "Notre-Dame-de-Aubin",
    "slug": "notre-dame-de-aubin",
    "dept_code": "29",
    "region_name": "Bretagne",
    "population": 7620
  },
  {
    "code_insee": "32237",
    "nom": "Martin-sur-Vienne",
    "slug": "martin-sur-vienne",
    "dept_code": "32",
    "region_name": "Occitanie",
    "population": 7673
  },
  {
    "code_insee": "36244",
    "nom": "Le Petit-Julien",
    "slug": "le-petit-julien",
    "dept_code": "36",
    "region_name": "Centre-Val de Loire",
    "population": 7726
  },
  {
    "code_insee": "39251",
    "nom": "Villeneuve-Pierre",
    "slug": "villeneuve-pierre",
    "dept_code": "39",
    "region_name": "Bourgogne-Franche-Comté",
    "population": 7779
  },
  {
    "code_insee": "40258",
    "nom": "Saint-Denis-sur-Loire",
    "slug": "saint-denis-sur-loire",
    "dept_code": "40",
    "region_name": "Nouvelle-Aquitaine",
    "population": 7832
  },
  {
    "code_insee": "41265",
    "nom": "Saint-Vincent",
    "slug": "saint-vincent",
    "dept_code": "41",
    "region_name": "Centre-Val de Loire",
    "population": 7885
  },
  {
    "code_insee": "43272",
    "nom": "Loup-le-Château",
    "slug": "loup-le-château",
    "dept_code": "43",
    "region_name": "Auvergne-Rhône-Alpes",
    "population": 7938
  },
  {
    "code_insee": "46279",
    "nom": "Amand-en-Vallée",
    "slug": "amand-en-vallee",
    "dept_code": "46",
    "region_name": "Occitanie",
    "population": 7991
  },
  {
    "code_insee": "47286",
    "nom": "Notre-Dame-de-Georges",
    "slug": "notre-dame-de-georges",
    "dept_code": "47",
    "region_name": "Nouvelle-Aquitaine",
    "population": 8044
  },
  {
    "code_insee": "48293",
    "nom": "Michel-sur-Vienne",
    "slug": "michel-sur-vienne",
    "dept_code": "48",
    "region_name": "Occitanie",
    "population": 8097
  },
  {
    "code_insee": "50300",
    "nom": "Le Petit-Rémy",
    "slug": "le-petit-remy",
    "dept_code": "50",
    "region_name": "Normandie",
    "population": 8150
  },
  {
    "code_insee": "52307",
    "nom": "Villeneuve-Hilaire",
    "slug": "villeneuve-hilaire",
    "dept_code": "52",
    "region_name": "Grand Est",
    "population": 203
  },
  {
    "code_insee": "53314",
    "nom": "Saint-Cyr-sur-Loire",
    "slug": "saint-cyr-sur-loire",
    "dept_code": "53",
    "region_name": "Pays de la Loire",
    "population": 256
  }
];

export const mockCampaigns: Campaign[] = [
  {
    "id": "cmp-0001-4aaa-8bbb-000000000001",
    "keyword": "plombier",
    "commune": {
      "code_insee": "59350",
      "nom": "Lille",
      "slug": "lille",
      "dept_code": "59",
      "region_name": "Hauts-de-France",
      "population": 233098
    },
    "status": "in_progress",
    "total_grids": 63,
    "completed_grids": 38,
    "businesses_found": 54,
    "created_at": "2026-08-29T08:00:00Z",
    "completed_at": null
  },
  {
    "id": "cmp-0002-4aaa-8bbb-000000000002",
    "keyword": "avocat",
    "commune": {
      "code_insee": "75056",
      "nom": "Paris",
      "slug": "paris",
      "dept_code": "75",
      "region_name": "Île-de-France",
      "population": 2145906
    },
    "status": "completed",
    "total_grids": 142,
    "completed_grids": 142,
    "businesses_found": 612,
    "created_at": "2026-08-10T08:00:00Z",
    "completed_at": "2026-08-10T08:07:40Z"
  },
  {
    "id": "cmp-0003-4aaa-8bbb-000000000003",
    "keyword": "architecte",
    "commune": {
      "code_insee": "33063",
      "nom": "Bordeaux",
      "slug": "bordeaux",
      "dept_code": "33",
      "region_name": "Nouvelle-Aquitaine",
      "population": 260958
    },
    "status": "completed",
    "total_grids": 82,
    "completed_grids": 82,
    "businesses_found": 245,
    "created_at": "2026-08-15T09:00:00Z",
    "completed_at": "2026-08-15T09:04:12Z"
  },
  {
    "id": "cmp-0004-4aaa-8bbb-000000000004",
    "keyword": "menuisier",
    "commune": {
      "code_insee": "69123",
      "nom": "Lyon",
      "slug": "lyon",
      "dept_code": "69",
      "region_name": "Auvergne-Rhône-Alpes",
      "population": 522969
    },
    "status": "failed",
    "total_grids": 95,
    "completed_grids": 23,
    "businesses_found": 31,
    "created_at": "2026-08-20T10:00:00Z",
    "completed_at": "2026-08-20T10:03:55Z"
  },
  {
    "id": "cmp-0005-4aaa-8bbb-000000000005",
    "keyword": "avocat",
    "commune": {
      "code_insee": "59350",
      "nom": "Lille",
      "slug": "lille",
      "dept_code": "59",
      "region_name": "Hauts-de-France",
      "population": 233098
    },
    "status": "quota_reached",
    "total_grids": 63,
    "completed_grids": 52,
    "businesses_found": 89,
    "created_at": "2026-08-22T08:00:00Z",
    "completed_at": "2026-08-22T08:06:18Z"
  },
  {
    "id": "cmp-0006-4aaa-8bbb-000000000006",
    "keyword": "electricien",
    "commune": {
      "code_insee": "44109",
      "nom": "Nantes",
      "slug": "nantes",
      "dept_code": "44",
      "region_name": "Pays de la Loire",
      "population": 320732
    },
    "status": "in_progress",
    "total_grids": 110,
    "completed_grids": 99,
    "businesses_found": 381,
    "created_at": "2026-08-27T08:00:00Z",
    "completed_at": null
  },
  {
    "id": "cmp-0008-4aaa-8bbb-000000000008",
    "keyword": "plombier",
    "commune": {
      "code_insee": "31555",
      "nom": "Toulouse",
      "slug": "toulouse",
      "dept_code": "31",
      "region_name": "Occitanie",
      "population": 493465
    },
    "status": "in_progress",
    "total_grids": 130,
    "completed_grids": 59,
    "businesses_found": 211,
    "created_at": "2026-08-29T10:00:00Z",
    "completed_at": null
  },
  {
    "id": "cmp-0009-4aaa-8bbb-000000000009",
    "keyword": "menuisier",
    "commune": {
      "code_insee": "34172",
      "nom": "Montpellier",
      "slug": "montpellier",
      "dept_code": "34",
      "region_name": "Occitanie",
      "population": 302454
    },
    "status": "in_progress",
    "total_grids": 105,
    "completed_grids": 68,
    "businesses_found": 246,
    "created_at": "2026-08-28T09:00:00Z",
    "completed_at": null
  },
  {
    "id": "cmp-0010-4aaa-8bbb-000000000010",
    "keyword": "architecte",
    "commune": {
      "code_insee": "35238",
      "nom": "Rennes",
      "slug": "rennes",
      "dept_code": "35",
      "region_name": "Bretagne",
      "population": 220488
    },
    "status": "in_progress",
    "total_grids": 90,
    "completed_grids": 27,
    "businesses_found": 95,
    "created_at": "2026-08-30T08:00:00Z",
    "completed_at": null
  }
];

// -- Status tabs (unchanged from the v1 prospects build) ---------------

export type ProspectStatusTab =
  | 'tous'
  | 'a_traiter'
  | 'en_cours'
  | 'sans_reponse'
  | 'gagnes'
  | 'ignores';

export function getProspectStatusTab(p: Prospect): Exclude<ProspectStatusTab, 'tous'> {
  if (p.outcome === null) return 'a_traiter';
  if (p.outcome === 'in_progress') return 'en_cours';
  if (p.outcome === 'no_response') return 'sans_reponse';
  if (p.outcome === 'won') return 'gagnes';
  return 'ignores'; // 'lost'
}

export const PROSPECT_STATUS_TAB_LABELS: Record<ProspectStatusTab, string> = {
  tous: 'Tous',
  a_traiter: 'A traiter',
  en_cours: 'En cours',
  sans_reponse: 'Sans reponse',
  gagnes: 'Gagnes',
  ignores: 'Ignores',
};

// -- Three-state cell helpers (brief 7) ---------------------------------
//
// Change 4 (quota_changes_prompt.md): after Change 3, mbi_fetched_at is
// NEVER null on a row here -- delivery orders by score
// (deliver_leads), so a lead without one was never delivered and cannot
// appear in this array. There is deliberately no 'pending' branch below:
// permitting one in code is exactly how an impossible state comes back
// after the data is fixed to rule it out. isMbiPending, which used to
// gate this, has been removed rather than left unused.
//
// is_claimed still has THREE outcomes, not two -- the extra one is
// specific to this field and does not generalise to score/completeness:
//   is_claimed === true    -> claimed
//   is_claimed === false   -> unclaimed
//   is_claimed === null    -> 'unknown': not returned by the provider,
//     roughly a fifth of those turn out to be unclaimed. Renders NOTHING
//     -- not "unknown" as a label, not a neutral badge, not "pas encore
//     traité". Saying anything would be a guess.

export type FicheGoogleState = 'claimed' | 'unclaimed' | 'unknown';

export function getFicheGoogleState(p: Prospect): FicheGoogleState {
  if (p.is_claimed === true) return 'claimed';
  if (p.is_claimed === false) return 'unclaimed';
  return 'unknown';
}

export type EmailCellState = 'pending' | 'has_email' | 'no_email';

export function getEmailCellState(p: Prospect): EmailCellState {
  if (p.email_checked_at === null) return 'pending';
  if (p.email === null) return 'no_email';
  return 'has_email';
}

// Only 'mismatch' is a finding worth a marker. 'no_website' means no
// phone was found ON THE SITE (not "no website" -- misleading name, never
// surface it verbatim), and neither it nor 'no_gbp' is surfaced here.
export function hasPhoneMismatch(p: Prospect): boolean {
  return p.nap_phone_match === 'mismatch';
}

// -- Prospect query layer ------------------------------------------------
//
// Same discipline as the v1 file: filter/sort/paginate behind ONE async
// function so a real Supabase query replaces only the function body.

let prospectStore: Prospect[] = mockProspects.map((p) => ({ ...p }));

export const CITY_SERVICE_AREA = '__service_area__';

export type ProspectFilters = {
  keyword: string;
  city: string;
  claim: 'toutes' | 'revendiquee' | 'non_revendiquee';
  website: 'tous' | 'own' | 'none' | 'not_controlled';
  email: 'tous' | 'verifie' | 'present_non_verifie' | 'aucun';
  search: string;
};

export const DEFAULT_PROSPECT_FILTERS: ProspectFilters = {
  keyword: 'tous',
  city: 'toutes',
  claim: 'toutes',
  website: 'tous',
  email: 'tous',
  search: '',
};

export type ProspectSortKey = 'maps_position' | 'potentiel' | 'rating' | 'delivered_at' | 'measured_at';
export type ProspectSortDir = 'asc' | 'desc';
export type ProspectSort = { key: ProspectSortKey; dir: ProspectSortDir };

// Default: seo_score ascending, i.e. Potentiel (100 - seo_score)
// descending -- lowest seo_score first, since lowest means most
// opportunity. Nulls (not yet scored) sort FIRST under this specific
// default, not last -- see the comment on compareProspects for why.
export const DEFAULT_PROSPECT_SORT: ProspectSort = { key: 'potentiel', dir: 'desc' };
export const DEFAULT_PAGE_SIZE = 50;

function matchesFilters(p: Prospect, f: ProspectFilters): boolean {
  if (f.keyword !== 'tous' && p.keyword !== f.keyword) return false;

  if (f.city === CITY_SERVICE_AREA) {
    if (p.city !== null) return false;
  } else if (f.city !== 'toutes' && p.city !== f.city) {
    return false;
  }

  if (f.claim === 'revendiquee' && p.is_claimed !== true) return false;
  if (f.claim === 'non_revendiquee' && p.is_claimed !== false) return false;

  if (f.website === 'own' && p.website_kind !== 'own') return false;
  if (f.website === 'none' && p.website_kind !== 'none') return false;
  if (
    f.website === 'not_controlled' &&
    !(
      p.website_kind === 'booking_platform' ||
      p.website_kind === 'social' ||
      p.website_kind === 'directory'
    )
  ) {
    return false;
  }

  if (f.email === 'verifie' && p.email_status !== 'deliverable') return false;
  if (
    f.email === 'present_non_verifie' &&
    !(
      p.email_status === 'risky' ||
      p.email_status === 'pending_verification' ||
      p.email_status === 'unknown'
    )
  ) {
    return false;
  }
  if (f.email === 'aucun' && !(p.email_status === null || p.email_status === 'invalid')) {
    return false;
  }

  const q = f.search.trim().toLowerCase();
  if (q !== '') {
    const hit =
      p.business_name.toLowerCase().includes(q) || (p.category ?? '').toLowerCase().includes(q);
    if (!hit) return false;
  }

  return true;
}

function getSortValue(p: Prospect, key: ProspectSortKey): number | null {
  switch (key) {
    case 'maps_position':
      return p.maps_position;
    case 'potentiel':
      return p.seo_score === null ? null : 100 - p.seo_score;
    case 'rating':
      return p.rating;
    case 'delivered_at':
      return p.delivered_at ? new Date(p.delivered_at).getTime() : null;
    case 'measured_at':
      return new Date(p.measured_at).getTime();
  }
}

function compareProspects(a: Prospect, b: Prospect, sort: ProspectSort): number {
  const va = getSortValue(a, sort.key);
  const vb = getSortValue(b, sort.key);
  if (va === null && vb === null) return 0;

  // Potentiel descending (the default view) is the ONE place nulls sort
  // FIRST, not last -- every other column, and potentiel ascending, keep
  // nulls last below. This looks backwards on its own; it is deliberate.
  //
  // In the first minute of a campaign every lead has seo_score === null
  // (MBI hasn't run yet). "Nulls last" under the default sort would push
  // every single lead to the bottom simultaneously -- the list would
  // render as empty until enrichment finishes, which is the exact
  // opposite of what /app/campagnes/[id]'s progress screen exists to
  // demonstrate: leads arriving and being visible immediately. An
  // unscored lead is the NEWEST thing in the list, not the least
  // interesting one, and it's already callable -- the phone comes from
  // the Google listing before any enrichment runs.
  if (sort.key === 'potentiel' && sort.dir === 'desc') {
    if (va === null) return -1;
    if (vb === null) return 1;
    return vb - va;
  }

  if (va === null) return 1;
  if (vb === null) return -1;
  const diff = va - vb;
  return sort.dir === 'asc' ? diff : -diff;
}

// Shared by fetchProspects and fetchProspectStatusCounts, which the spec
// explicitly says fetch against "the same filters" -- one helper instead
// of duplicating six conditions across two functions.
//
// CITY_SERVICE_AREA is not in the spec's filter table, but it's a real,
// exported constant this app's UI actually offers as a filter option
// (prospects/page.tsx) -- dropping it here would silently regress a real
// feature, not just leave a spec gap unfilled, so it's preserved as an
// IS NULL check, the same pattern as email: 'aucun' below.
function applyProspectFilters(query: any, f: ProspectFilters) {
  if (f.keyword !== 'tous') query = query.eq('keyword', f.keyword);

  if (f.city === CITY_SERVICE_AREA) {
    query = query.is('city', null);
  } else if (f.city !== 'toutes') {
    query = query.eq('city', f.city);
  }

  // claim must not match null -- is_claimed IS NULL is a third state
  // (provider never returned the field), not "not revendiquee". .eq()
  // already excludes nulls in Postgres; no .or() needed or wanted here.
  if (f.claim === 'revendiquee') query = query.eq('is_claimed', true);
  if (f.claim === 'non_revendiquee') query = query.eq('is_claimed', false);

  if (f.website === 'own') query = query.eq('website_kind', 'own');
  if (f.website === 'none') query = query.eq('website_kind', 'none');
  if (f.website === 'not_controlled') {
    query = query.in('website_kind', ['booking_platform', 'social', 'directory']);
  }

  if (f.email === 'verifie') query = query.eq('email_status', 'deliverable');
  if (f.email === 'present_non_verifie') {
    query = query.in('email_status', ['risky', 'unknown', 'pending_verification']);
  }
  // Filters on email IS NULL, not email_status -- a lead awaiting
  // enrichment has both null and belongs here; the agency has no address
  // for it either way. email_checked_at (display-only) is what
  // distinguishes "checked, none found" from "not yet checked".
  if (f.email === 'aucun') query = query.is('email', null);

  const q = f.search.trim();
  if (q !== '') query = query.ilike('business_name', `%${q}%`);

  return query;
}

function applyTabFilter(query: any, tab: ProspectStatusTab) {
  switch (tab) {
    case 'tous':
      return query;
    case 'a_traiter':
      return query.is('outcome', null);
    case 'en_cours':
      return query.eq('outcome', 'in_progress');
    case 'sans_reponse':
      return query.eq('outcome', 'no_response');
    case 'gagnes':
      return query.eq('outcome', 'won');
    // Maps to 'lost' -- the database CHECK allows exactly
    // won | lost | no_response | in_progress; there is no 'ignored' value.
    case 'ignores':
      return query.eq('outcome', 'lost');
  }
}

// potentiel is the one sort key that doesn't map straight to a column:
// the UI shows 100 - seo_score as "Potentiel", so potentiel descending
// means seo_score ASCENDING (lowest score = most opportunity). Get this
// backwards and the list shows the least interesting leads first, with
// no error anywhere to catch it.
//
// nullsFirst only for the default view (potentiel, desc) -- in a
// campaign's first minute every lead has seo_score === null (not yet
// enriched). Nulls-last there would render as an empty list exactly
// when the progress screen exists to show leads arriving. Every other
// case, including potentiel ascending, keeps nulls last -- this looks
// asymmetric and is deliberate, not a mistake.
function applyProspectSort(query: any, sort: ProspectSort) {
  const col = sort.key === 'potentiel' ? 'seo_score' : sort.key;
  const ascending = sort.key === 'potentiel' ? sort.dir === 'desc' : sort.dir === 'asc';
  const nullsFirst = sort.key === 'potentiel' && sort.dir === 'desc';
  // Deterministic tiebreaker -- without it, equal-scoring rows can land
  // in a different order per page, so a lead could appear twice or not
  // at all across pagination. The mock never showed this since a JS
  // sort is stable; a Postgres query with ties is not.
  return query.order(col, { ascending, nullsFirst }).order('id');
}

export async function fetchProspects(params: {
  filters: ProspectFilters;
  tab: ProspectStatusTab;
  sort: ProspectSort;
  page: number;
  pageSize: number;
}): Promise<{ rows: Prospect[]; totalCount: number }> {
  const supabase = createClient();
  let query = supabase.from('prospect_view').select('*', { count: 'exact' });
  query = applyProspectFilters(query, params.filters);
  query = applyTabFilter(query, params.tab);
  query = applyProspectSort(query, params.sort);
  const from = (params.page - 1) * params.pageSize;
  query = query.range(from, from + params.pageSize - 1);

  const { data, error, count } = await query;
  if (error) {
    console.error('fetchProspects query failed', error);
  }
  return { rows: (data as Prospect[] | null) ?? [], totalCount: count ?? 0 };
}

// Six head-only queries (no rows, count only), one per tab, run together
// rather than fetching every row and counting in JS -- that would defeat
// pagination and pull the agency's entire lead list into the browser
// just to render tab badges.
export async function fetchProspectStatusCounts(
  filters: ProspectFilters,
): Promise<Record<ProspectStatusTab, number>> {
  const supabase = createClient();
  const tabs: ProspectStatusTab[] = ['tous', 'a_traiter', 'en_cours', 'sans_reponse', 'gagnes', 'ignores'];

  const results = await Promise.all(
    tabs.map((tab) => {
      let query = supabase.from('prospect_view').select('id', { count: 'exact', head: true });
      query = applyProspectFilters(query, filters);
      query = applyTabFilter(query, tab);
      return query;
    }),
  );

  const counts: Record<ProspectStatusTab, number> = {
    tous: 0,
    a_traiter: 0,
    en_cours: 0,
    sans_reponse: 0,
    gagnes: 0,
    ignores: 0,
  };
  tabs.forEach((tab, i) => {
    if (results[i].error) {
      console.error(`fetchProspectStatusCounts: ${tab} query failed`, results[i].error);
    }
    counts[tab] = results[i].count ?? 0;
  });
  return counts;
}

// The only write in this pass. Both columns, always -- a CHECK
// constraint (leads_outcome_at_chk) requires outcome_at whenever
// outcome is set, so writing outcome alone would fail.
//
// Writes to leads, not prospect_view -- the view is read-only. The
// grant here is column-level (outcome, outcome_at, outcome_notes and
// nothing else); attempting to update any other column is refused by
// the database on purpose, so a client can't rewrite delivered_at or
// email through this path.
export async function updateProspectOutcome(
  id: string,
  outcome: Prospect['outcome'],
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('leads')
    .update({ outcome, outcome_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    console.error('updateProspectOutcome: update failed', error);
  }
}

// Now async against real data -- callers updated accordingly
// (prospects/page.tsx). No DISTINCT in PostgREST, so dedupe happens
// client-side; fine at ~107 rows, would become an RPC if that ever
// changes.
export async function getAvailableKeywords(): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('prospect_view').select('keyword');
  if (error) {
    console.error('getAvailableKeywords query failed', error);
    return [];
  }
  return Array.from(new Set((data as { keyword: string }[]).map((r) => r.keyword))).sort();
}

// city can be null -- a service-area business hiding its address, not a
// city literally called "null". Filtered out before the dropdown ever
// sees it.
export async function getAvailableCities(): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('prospect_view').select('city');
  if (error) {
    console.error('getAvailableCities query failed', error);
    return [];
  }
  return Array.from(
    new Set(
      (data as { city: string | null }[]).filter((r) => r.city !== null).map((r) => r.city as string),
    ),
  ).sort();
}

// -- Commune autocomplete -------------------------------------------------
//
// Search on slug (accent-stripped already at generation time), and expand
// "st-" / "ste-" -> "saint-" / "sainte-" so a French user typing
// "St-Etienne" finds it. Always resolves to code_insee -- the caller must
// never submit the name (slug is NOT unique, brief 5.2 / DDD KU-71).

function normaliseQuery(q: string): string {
  return q
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/^st-/, 'saint-')
    .replace(/^ste-/, 'sainte-');
}

export type CommuneSearchResult = {
  results: Commune[];
  totalMatches: number;
};

// Ordered by population descending, not alphabetically -- someone typing
// "saint" almost certainly wants Saint-Étienne, not an obscure hamlet
// that happens to sort first. Capped at `limit`, but totalMatches reports
// the REAL match count against all 34,746 communes (mocked here against
// 200) so the caller can tell the user when their town might be truncated
// out of the list -- "saint" alone matches roughly 3,500 real communes.
// Requires 2+ characters: one character matches thousands of rows and
// helps nobody.
export async function searchCommunes(query: string, limit = 8): Promise<CommuneSearchResult> {
  const q = normaliseQuery(query);
  if (q.length < 2) return { results: [], totalMatches: 0 };
  const matches = mockCommunes.filter((c) => c.slug.includes(q));
  const sorted = [...matches].sort((a, b) => (b.population ?? 0) - (a.population ?? 0));
  return { results: sorted.slice(0, limit), totalMatches: matches.length };
}

export async function getCommuneByCodeInsee(code: string): Promise<Commune | null> {
  return mockCommunes.find((c) => c.code_insee === code) ?? null;
}

// -- Campaigns ------------------------------------------------------------

export function completionPct(c: Campaign): number {
  if (c.total_grids === 0) return 0;
  return Math.round((c.completed_grids / c.total_grids) * 100);
}

let campaignStore: Campaign[] = mockCampaigns.map((c) => ({ ...c }));

export type AgencyPlanUsage = {
  tierName: string;
  maxActiveCampaigns: number | null; // null = unlimited (enterprise)
  activeCampaigns: number; // count of status === 'in_progress', matching enforce_max_campaigns
  // Lead quota -- the number an agency actually cares about. Consumed at
  // DELIVERY (deliver_leads), not at scan or qualification -- see the
  // pipeline note on the Prospect type. Resets each billing period.
  leads_delivered_this_period: number;
  max_leads_per_month: number | null; // null = unlimited (enterprise)
  period_end: string; // ISO -- when it resets
};

// Toggle this to simulate a brand-new free-tier agency: zero delivered
// prospects, zero campaigns, the 20-lead/1-campaign/€0 tier from the
// "Auth, the free tier, and the public site" doc. Real version would
// derive this from subscription_tier_id and actual row counts, not a
// manual flag -- this exists so both /app/prospects' and /app/campagnes'
// empty states are genuinely reachable and testable, not just correct in
// theory. Flip to true, reload, flip back when done.
const MOCK_FREE_TIER_EMPTY_AGENCY = false;

const mockFreeTierPlanUsage: AgencyPlanUsage = {
  tierName: 'Free',
  maxActiveCampaigns: 1,
  activeCampaigns: 0,
  leads_delivered_this_period: 0,
  max_leads_per_month: 20,
  period_end: '2026-09-14T00:00:00Z',
};

// Growth tier mocked throughout this session: max_active_campaigns = 6,
// confirmed in subscription_tiers seed data (functions_live.sql). Sits
// exactly at the limit (6 real in_progress campaigns below) so the
// at-limit state is genuinely reachable, not asserted by a mismatched
// number.
// Lead quota set mid-range on purpose (247/400, ~62%) -- neither the
// empty state nor the at-limit state, so the DEFAULT view exercises the
// plain/unremarkable case. The amber (>=80%) and red (100%) states are
// real code paths but, like the campaign at-limit state before this was
// fixed, not currently reachable by eye without deliberately changing
// these two numbers -- flagged rather than silently left untested.
const mockPlanUsage: AgencyPlanUsage = {
  tierName: 'Growth',
  maxActiveCampaigns: 6,
  activeCampaigns: campaignStore.filter((c) => c.status === 'in_progress').length,
  leads_delivered_this_period: 247,
  max_leads_per_month: 400,
  period_end: '2026-09-14T00:00:00Z',
};

// Standalone -- the app header needs just this, on every screen, without
// pulling the full campaigns list along with it.
//
// REAL QUERY, converted per Opus's instructions as the one function
// proving the full chain works: session -> JWT -> auth.uid() ->
// agency_members -> RLS policy. Every other function in this file is
// still mock data -- deliberately not converted yet.
//
// NO agency_id filter anywhere in these three queries -- that's the
// entire point. RLS resolves the current user's agency from
// agency_members and adds that filter itself; writing .eq('agency_id',
// ...) here would make this prove nothing, since it would return the
// right row whether the policies actually work or not.
//
// .single() (not .maybeSingle()) on the two row-fetches is deliberate:
// it makes a broken chain surface as a loud, distinct error rather than
// silently returning undefined -- which would look identical to "this
// agency genuinely has no data" to anything reading the result. Telling
// those two apart is the entire purpose of this step, per Opus.
export async function fetchAgencyPlanUsage(): Promise<AgencyPlanUsage> {
  const supabase = createClient();
  const now = new Date().toISOString();

  const [quotaResult, agencyResult, campaignsResult] = await Promise.all([
    supabase
      .from('lead_quota_periods')
      .select('leads_quota, leads_used, period_end')
      .lte('period_start', now)
      .gt('period_end', now)
      .single(),
    // Relies on agencies -> subscription_tiers via subscription_tier_id
    // (the FK Supabase's nested-select syntax auto-joins on). Assumes
    // this resolves to a single nested object, not an array -- correct
    // for a belongs-to relationship, but if that assumption is wrong
    // it'll surface immediately as a shape mismatch while testing this,
    // which is exactly what this diagnostic step is for.
    //
    // max_leads_per_month deliberately NOT selected here -- see below.
    supabase.from('agencies').select('subscription_tiers(tier_name, max_active_campaigns)').single(),
    supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
  ]);

  if (quotaResult.error) {
    console.error('fetchAgencyPlanUsage: lead_quota_periods query failed', quotaResult.error);
  }
  if (agencyResult.error) {
    console.error('fetchAgencyPlanUsage: agencies/subscription_tiers query failed', agencyResult.error);
  }
  if (campaignsResult.error) {
    console.error('fetchAgencyPlanUsage: campaigns count query failed', campaignsResult.error);
  }

  const tier = (agencyResult.data as any)?.subscription_tiers;

  return {
    tierName: tier?.tier_name ?? '',
    // max_active_campaigns correctly comes from subscription_tiers --
    // enforced live by a trigger, not snapshotted into a period, so the
    // tier's current value genuinely is the right source, unlike the
    // lead quota below.
    maxActiveCampaigns: tier?.max_active_campaigns ?? null,
    activeCampaigns: campaignsResult.count ?? 0,
    leads_delivered_this_period: (quotaResult.data as any)?.leads_used ?? 0,
    // Bug fixed per Opus: this must come from lead_quota_periods.leads_quota,
    // NOT subscription_tiers.max_leads_per_month. A quota period keeps the
    // quota it was CREATED with -- a mid-period tier upgrade doesn't
    // retroactively raise it. try_consume_quota reads leads_quota from
    // this same table and never consults the tier, so showing the tier's
    // number here would let the dashboard promise more headroom than the
    // database actually enforces.
    max_leads_per_month: (quotaResult.data as any)?.leads_quota ?? null,
    period_end: (quotaResult.data as any)?.period_end ?? '',
  };
}

// -- Billing (brief 5.5) -------------------------------------------------
//
// PRICING, confirmed by Opus against the LIVE database: Growth 143 EUR/mo
// (1 430 EUR/yr), matching v1.6+'s ordering and the lead allowances
// (Growth 400 < Business 850). seed.sql had growth/business swapped and
// was confirmed stale. The v1.5 numbers used here previously (119) were
// ALSO out of date -- not just from the wrong document, but an older
// price entirely. Real current prices, monthly / annual (annual =
// monthly x10, two months free):
//   Trial      57 / 570     100 leads   2 campaigns
//   Starter    86 / 860     200 leads   3
//   Growth    143 / 1430    400 leads   6   <- this mock's tier
//   Business  287 / 2870    850 leads  12
//   Premium   503 / 5030  1 800 leads  25
export type Invoice = {
  id: string;
  date: string; // ISO
  amountEur: number;
  status: 'paid' | 'open' | 'failed';
};

export type BillingInfo = {
  tierName: string;
  billingCycle: 'monthly' | 'annual';
  priceEur: number;
  nextBillingDate: string; // ISO -- from Stripe. Can differ from nextQuotaResetDate.
  // Separate from AgencyPlanUsage.period_end structurally, but holds the
  // SAME real-world date -- both describe the same quota-reset event, so
  // they must agree (a person seeing "14 septembre" on /app/prospects and
  // a different date here would rightly read that as a bug). What's
  // NOT the same event is nextBillingDate: per the v1.8 billing/quota
  // decoupling, the quota period is anchored to billing_anchor_at, not
  // Stripe's invoice date. They coincide for a stable monthly
  // subscription and drift apart on a tier change, a failed-payment
  // retry, a cancellation/reactivation, or (the clearest case) any
  // annual plan at all -- one invoice a year, twelve quota resets.
  nextQuotaResetDate: string; // ISO
  paymentMethodBrand: string;
  paymentMethodLast4: string;
  invoices: Invoice[];
};

const mockBillingInfo: BillingInfo = {
  tierName: 'Growth',
  billingCycle: 'monthly',
  priceEur: 143,
  // Deliberately NOT the same date as nextQuotaResetDate below -- even on
  // a nominally-stable monthly plan, showing them equal here would look
  // like the same field duplicated rather than two real, independently-
  // sourced dates that simply happen to be close together.
  nextBillingDate: '2026-09-18T00:00:00Z',
  nextQuotaResetDate: '2026-09-14T00:00:00Z', // matches AgencyPlanUsage.period_end
  paymentMethodBrand: 'Visa',
  paymentMethodLast4: '4242',
  invoices: [
    { id: 'inv_0015', date: '2026-08-14T09:00:00Z', amountEur: 143, status: 'paid' },
    { id: 'inv_0014', date: '2026-07-14T09:00:00Z', amountEur: 143, status: 'paid' },
    { id: 'inv_0013', date: '2026-06-14T09:00:00Z', amountEur: 143, status: 'paid' },
    { id: 'inv_0012', date: '2026-05-14T09:00:00Z', amountEur: 143, status: 'paid' },
    { id: 'inv_0011', date: '2026-04-14T09:00:00Z', amountEur: 143, status: 'paid' },
    { id: 'inv_0010', date: '2026-03-14T09:00:00Z', amountEur: 143, status: 'paid' },
    { id: 'inv_0009', date: '2026-02-14T09:00:00Z', amountEur: 143, status: 'paid' },
    { id: 'inv_0008', date: '2026-01-14T09:00:00Z', amountEur: 143, status: 'paid' },
    { id: 'inv_0007', date: '2025-12-14T09:00:00Z', amountEur: 143, status: 'paid' },
    { id: 'inv_0006', date: '2025-11-14T09:00:00Z', amountEur: 143, status: 'paid' },
    { id: 'inv_0005', date: '2025-10-14T09:00:00Z', amountEur: 143, status: 'paid' },
    { id: 'inv_0004', date: '2025-09-14T09:00:00Z', amountEur: 143, status: 'paid' },
    { id: 'inv_0003', date: '2025-08-14T09:00:00Z', amountEur: 143, status: 'paid' },
    { id: 'inv_0002', date: '2025-07-14T09:00:00Z', amountEur: 143, status: 'paid' },
    { id: 'inv_0001', date: '2025-06-14T09:00:00Z', amountEur: 143, status: 'paid' },
  ],
};

export async function fetchBillingInfo(): Promise<BillingInfo> {
  return mockBillingInfo;
}

// -- Account & brand (brief 5.6, /app/parametres) ------------------------
//
// Real columns, confirmed in MVP_Document (§7, "What IS built from day
// one"): agencies.logo_url, primary_colour, contact_email, contact_phone.
// Logo constraints, same source, exact: PNG or SVG only, maximum
// 400x150px, maximum 500KB. primary_colour is CHECK'd against
// ^#[0-9A-Fa-f]{6}$ -- 6-digit hex only, # required.
//
// agencyName is NOT one of the four columns above -- it doesn't appear
// in any brief I have for this section. It's here because the masthead
// preview's text-fallback (when no logo is set) needs SOMETHING to
// display in brand colour, and the real PDF template (server.js)
// confirms this exact pattern exists: `.logo-text{ ...color:var(--brand)
// }`. Flagging this as an addition, not a silent invention -- worth
// confirming with Opus whether this maps to an existing column
// (agencies.name?) or needs one.

export type AccountInfo = {
  name: string;
  email: string;
};

export type BrandInfo = {
  agencyName: string;
  logoUrl: string | null; // null = no logo uploaded yet -> text fallback in the masthead
  primaryColour: string; // hex, '#RRGGBB'
  contactPhone: string | null;
  contactEmail: string | null;
};

const mockAccountInfo: AccountInfo = {
  name: 'Camille Rousseau',
  email: 'camille@agence-nova-seo.fr',
};

const mockBrandInfo: BrandInfo = {
  agencyName: 'Nova SEO',
  logoUrl: null,
  primaryColour: '#1E3A72', // same navy as this dashboard's own default -- a placeholder value, not a claim the agency picked it
  contactPhone: '+33612345678',
  contactEmail: 'contact@agence-nova-seo.fr',
};

export async function fetchAccountInfo(): Promise<AccountInfo> {
  return mockAccountInfo;
}

export async function fetchBrandInfo(): Promise<BrandInfo> {
  return mockBrandInfo;
}

// STUBS -- update the in-memory mock so the UI reflects a save
// immediately (consistent with how outcome/prospect updates already
// behave elsewhere), but nothing here persists anywhere real. Logo
// upload specifically has NO backend at all yet -- MVP_Document is
// explicit that the Supabase Storage bucket doesn't exist yet.
export async function updateAccountInfo(input: {
  name: string;
  email: string;
}): Promise<{ ok: true; message: string }> {
  mockAccountInfo.name = input.name;
  mockAccountInfo.email = input.email;
  return { ok: true, message: 'Enregistré localement. La sauvegarde réelle n\u2019est pas encore câblée.' };
}

export async function updateBrandInfo(
  input: Partial<Omit<BrandInfo, 'logoUrl'>>,
): Promise<{ ok: true; message: string }> {
  Object.assign(mockBrandInfo, input);
  return { ok: true, message: 'Enregistré localement. La sauvegarde réelle n\u2019est pas encore câblée.' };
}

export async function fetchCampaignsOverview(): Promise<{
  campaigns: Campaign[];
  planUsage: AgencyPlanUsage;
}> {
  return {
    campaigns: MOCK_FREE_TIER_EMPTY_AGENCY ? [] : campaignStore,
    planUsage: await fetchAgencyPlanUsage(),
  };
}

export async function fetchCampaign(id: string): Promise<Campaign | null> {
  return campaignStore.find((c) => c.id === id) ?? null;
}

// -- Campaign progress polling (brief 5.3, corrected by Opus) -----------
//
// Real poll shape: { total, scanned, inFlight, businesses, leadsQualified,
// leadsEnriched, leadsDelivered }. Cheap -- counts bounded by total_grids
// or by this campaign's own lead rows, never anything unbounded. Poll
// every 3s from the caller.
//
// Qualification/enrichment/delivery are COUNTS, not booleans, because
// they're per-lead marker states, not campaign-level events -- same
// marker-not-value rule as the three-state cells:
//   qualification   a lead row exists for this campaign at all
//   enrichment      leads.mbi_fetched_at IS NOT NULL
//   delivery        leads.delivered_at IS NOT NULL
// Both stages run in batches, so a single "completion moment" is
// arbitrary -- a campaign is 40% enriched for a while, not "not enriched"
// then suddenly "enriched". A count also degrades gracefully: enrichment
// is gated against remaining quota, so a campaign may legitimately never
// reach 100% enriched, and a boolean would sit false forever while a
// count reads 150 / 400 and is honest about it.
export type CampaignProgress = {
  total: number;
  scanned: number;
  inFlight: number;
  businesses: number;
  leadsQualified: number;
  leadsEnriched: number;
  leadsDelivered: number; // the one that puts leads on /app/prospects
};

// A town campaign is 40-150 grid points and completes in ~3 minutes,
// measured end to end on Paris/Bordeaux/Lille. At a 3s poll interval
// that's ~60 polls -- the increment below is sized so ANY campaign here
// finishes in roughly that many polls, matching the measured timing
// regardless of its actual total_grids.
const POLLS_TO_COMPLETE = 60;

// Pure funnel simulation, separated out so both the live poll (below) and
// the non-mutating initial paint (campaign-detail-client.tsx) compute
// counts the SAME way, rather than the client re-deriving its own
// version of this logic.
//
// This whole function is mock-only arithmetic standing in for real
// per-lead marker counts -- there is nothing here to port forward, only
// the SHAPE (three lagging, capped counts) needs to survive into the
// real implementation.
export function computeCampaignFunnel(
  businessesFound: number,
  scanPct: number,
  actualDeliverable: number,
): { leadsQualified: number; leadsEnriched: number; leadsDelivered: number } {
  const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

  // Measured across every scan run so far: ~31,000 businesses produced
  // 13,883 high-opportunity leads, ~45% -- not a guess. The plausibility
  // filter and opportunity tiering both cut hard; a scan finding 1,650
  // businesses yields ~740 leads, not ~1,485.
  const QUALIFY_RATE = 0.45;
  const ENRICH_CAP = 0.85; // quota-gated -- may never reach 100% of qualified

  const leadsQualified = Math.round(businessesFound * QUALIFY_RATE);

  // Enrichment lags qualification -- doesn't start moving until scanning
  // is a bit underway, then catches up toward its cap by the time
  // scanning finishes.
  const enrichProgress = clamp01((scanPct - 0.15) / 0.85);
  const leadsEnriched = Math.round(leadsQualified * ENRICH_CAP * enrichProgress);

  // Delivery lags enrichment further still, and is hard-capped at
  // whatever this campaign's actual mock leads are -- the mock can't
  // manufacture more delivered rows than exist in the 40-row set.
  const deliverProgress = clamp01((scanPct - 0.3) / 0.7);
  const leadsDelivered = Math.min(actualDeliverable, Math.round(leadsEnriched * deliverProgress));

  return { leadsQualified, leadsEnriched, leadsDelivered };
}

export async function fetchCampaignProgress(id: string): Promise<CampaignProgress | null> {
  const c = campaignStore.find((c) => c.id === id);
  if (c === undefined) return null;

  // Advances state as a SIDE EFFECT of being polled -- this is the only
  // way to fake movement without a real backend behind it. The real
  // endpoint is a pure read; the actual advancement happens independently
  // in the background via the real scanning pipeline, not because
  // something polled it. Do not read this as a description of how the
  // real endpoint should behave.
  if (c.status === 'in_progress' && c.completed_grids < c.total_grids) {
    // Density (businesses per grid point) is derived from the campaign's
    // OWN numbers where it already has some progress, so the rate stays
    // consistent with what's already shown on /app/campagnes; a fixed
    // default covers a campaign starting from zero, where that ratio
    // doesn't exist yet.
    const density = c.completed_grids > 0 ? c.businesses_found / c.completed_grids : 3.4;
    const increment = Math.max(1, Math.ceil(c.total_grids / POLLS_TO_COMPLETE));
    c.completed_grids = Math.min(c.total_grids, c.completed_grids + increment);
    c.businesses_found = Math.round(c.completed_grids * density);
  }

  const total = c.total_grids;
  const scanned = c.completed_grids;
  // Tapers toward 0 as scanning finishes -- an arbitrary but plausible
  // concurrency figure, never exceeding what's actually left to scan.
  const inFlight = scanned >= total ? 0 : Math.min(8, total - scanned);
  const scanPct = total > 0 ? scanned / total : 0;

  const matching = prospectStore.filter((p) => p.keyword === c.keyword && p.city === c.commune.nom);
  const funnel = computeCampaignFunnel(c.businesses_found, scanPct, matching.length);

  return {
    total,
    scanned,
    inFlight,
    businesses: c.businesses_found,
    leadsQualified: funnel.leadsQualified,
    leadsEnriched: funnel.leadsEnriched,
    leadsDelivered: funnel.leadsDelivered,
  };
}

// A campaign's delivered leads are exactly the prospects whose
// campaign_id matches -- NOT keyword+city. A lead's city is whatever
// commune Google reports for that business, and a Lille campaign
// legitimately returns businesses in Roubaix, Villeneuve-d'Ascq,
// Lambersart, etc. -- Google ignores administrative boundaries, and
// that's correct behaviour, not a data leak. Filtering on city would
// silently drop most of a campaign's real leads with no error, just
// fewer rows than there should be.
export async function fetchProspectsForCampaign(id: string): Promise<Prospect[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('prospect_view').select('*').eq('campaign_id', id);
  if (error) {
    console.error('fetchProspectsForCampaign query failed', error);
  }
  return (data as Prospect[] | null) ?? [];
}

// STUB -- deliberately does not create anything. See the v1 file's
// equivalent comment for the full real-implementation TODO list (advisory
// lock, server-side re-check, keyword normalisation, grid sweep, n8n
// webhook) -- unchanged in spirit, now gated by max_active_campaigns
// (enforce_max_campaigns) rather than max_keywords/max_regions.
export async function createCampaign(input: {
  keyword: string;
  codeInsee: string;
}): Promise<{ ok: true; message: string }> {
  // eslint-disable-next-line no-console
  console.log('[stub] createCampaign called with', input, '-- no real effect.');
  return {
    ok: true,
    message:
      "Formulaire enregistre localement. La creation reelle de campagne (quota, grille, n8n) n'est pas encore cablee.",
  };
}
