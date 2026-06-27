import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ── Codes promo gérés côté serveur ───────────────────────────────
// Ajoute ici tous tes codes. La clé = code (majuscules), la valeur = jours d'essai.
const PROMO_CODES: Record<string, { trialDays: number; label: string }> = {
  'PLANG45': { trialDays: 45, label: '45 jours gratuits' },
  // Ajoute d'autres codes ici si besoin :
  // 'LANCEMENT30': { trialDays: 30, label: '30 jours gratuits' },
}

// POST /api/stripe/checkout
export async function POST(request: NextRequest) {
  try {
    const { periode, promoCode } = await request.json()

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY manquant dans .env.local' }, { status: 500 })
    }

    // Valider le code promo (insensible à la casse)
    const promo = promoCode ? PROMO_CODES[promoCode.trim().toUpperCase()] : null
    const trialDays = promo ? promo.trialDays : 14  // 14 jours par défaut

    // Récupérer l'utilisateur connecté (requis)
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const customerEmail = user.email

    const priceId = periode === 'annuel'
      ? process.env.STRIPE_PRICE_ANNUAL
      : process.env.STRIPE_PRICE_MONTHLY

    if (!priceId) {
      return NextResponse.json({
        error: `Price ID manquant. Ajoutez STRIPE_PRICE_${periode.toUpperCase()} dans .env.local`,
      }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

    // Construire les paramètres Stripe
    const params = new URLSearchParams({
      'mode':                             'subscription',
      'line_items[0][price]':             priceId,
      'line_items[0][quantity]':          '1',
      'success_url':                      `${baseUrl}/dashboard?abonnement=succes${promo ? `&promo=${promoCode}` : ''}`,
      'cancel_url':                       `${baseUrl}/tarifs?annule=1`,
      'billing_address_collection':       'auto',
      'subscription_data[trial_period_days]': String(trialDays),
      'locale':                           'fr-CA',
      // Métadonnées pour traçabilité
      'subscription_data[metadata][promo_code]': promoCode?.trim().toUpperCase() ?? '',
      'subscription_data[metadata][trial_days]': String(trialDays),
    })

    // Ne pas afficher le champ code promo Stripe si on a déjà appliqué un code custom
    // (sinon on laisse allow_promotion_codes pour d'éventuels coupons Stripe natifs)
    if (!promo) {
      params.append('allow_promotion_codes', 'true')
    }

    if (customerEmail) params.append('customer_email', customerEmail)

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const session = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: session.error?.message ?? 'Erreur Stripe' }, { status: res.status })
    }

    return NextResponse.json({
      url: session.url,
      trialDays,
      promoApplied: !!promo,
      promoLabel: promo?.label ?? null,
    })

  } catch (err) {
    console.error('[stripe/checkout]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// GET /api/stripe/checkout?code=PLANG45 — valider un code promo sans déclencher le checkout
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')?.trim().toUpperCase()
  if (!code) return NextResponse.json({ valid: false, error: 'Code manquant' })

  const promo = PROMO_CODES[code]
  if (!promo) return NextResponse.json({ valid: false, error: 'Code invalide ou expiré' }, { status: 404 })

  return NextResponse.json({ valid: true, ...promo, code })
}
