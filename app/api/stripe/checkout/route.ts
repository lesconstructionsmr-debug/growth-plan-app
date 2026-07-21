import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ── Codes promo gérés côté serveur ───────────────────────────────
const PROMO_CODES: Record<string, { trialDays: number; label: string }> = {
  'PLANG45': { trialDays: 45, label: '45 jours gratuits' },
  'BIENVENUE30': { trialDays: 30, label: '30 jours gratuits' },
}

// POST /api/stripe/checkout
export async function POST(request: NextRequest) {
  try {
    const { periode, promoCode } = await request.json().catch(() => ({}))

    // Récupérer l'utilisateur connecté (requis)
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value, set: () => {}, remove: () => {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const customerEmail = user.email

    // Récupérer le company_id de l'utilisateur connecté
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()
    const companyId = profile?.company_id

    // Valider le code promo (insensible à la casse)
    const promo = promoCode ? PROMO_CODES[promoCode.trim().toUpperCase()] : null
    const trialDays = promo ? promo.trialDays : 14  // 14 jours par défaut

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin || 'https://app.growth-plan.ca'

    // SI STRIPE N'EST PAS ENCORE CONFIGURÉ OU SI CLÉS ABSENTES EN PROD :
    // On active l'essai gratuit de 14 jours immédiatement et on redirige vers le dashboard !
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('[stripe/checkout] STRIPE_SECRET_KEY non configurée. Redirection vers essai gratuit dashboard.')
      return NextResponse.json({
        url: `${baseUrl}/dashboard?abonnement=essai_actif&trial=${trialDays}`,
        trialDays,
        promoApplied: !!promo,
        fallbackTrial: true,
      })
    }

    const priceId = (periode === 'annuel'
      ? process.env.STRIPE_PRICE_ANNUAL
      : process.env.STRIPE_PRICE_MONTHLY) || process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY

    if (!priceId) {
      console.warn('[stripe/checkout] Price ID manquant. Redirection vers essai gratuit dashboard.')
      return NextResponse.json({
        url: `${baseUrl}/dashboard?abonnement=essai_actif&trial=${trialDays}`,
        trialDays,
        promoApplied: !!promo,
        fallbackTrial: true,
      })
    }

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
      'subscription_data[metadata][company_id]': companyId ?? '',
      'subscription_data[metadata][promo_code]': promoCode?.trim().toUpperCase() ?? '',
      'subscription_data[metadata][trial_days]': String(trialDays),
    })

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
      console.error('[stripe/checkout] Erreur API Stripe:', session.error)
      // Fallback gracieux si Stripe échoue : redirige vers dashboard avec l'essai gratuit
      return NextResponse.json({
        url: `${baseUrl}/dashboard?abonnement=essai_actif&trial=${trialDays}`,
        trialDays,
        promoApplied: !!promo,
        fallbackTrial: true,
      })
    }

    return NextResponse.json({
      url: session.url,
      trialDays,
      promoApplied: !!promo,
      promoLabel: promo?.label ?? null,
    })

  } catch (err) {
    console.error('[stripe/checkout]', err)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.growth-plan.ca'
    return NextResponse.json({
      url: `${baseUrl}/dashboard?abonnement=essai_actif`,
      fallbackTrial: true,
    })
  }
}

// GET /api/stripe/checkout?code=PLANG45 — valider un code promo sans déclencher le checkout
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')?.trim().toUpperCase()
  if (!code) return NextResponse.json({ valid: false, error: 'Code manquant' })

  const promo = PROMO_CODES[code]
  if (!promo) return NextResponse.json({ valid: false, error: 'Code invalide ou expiré' }, { status: 404 })

  return NextResponse.json({
    valid: true,
    trialDays: promo.trialDays,
    label: promo.label,
  })
}
