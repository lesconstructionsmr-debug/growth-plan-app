import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, apiError } from '@/lib/api/auth'

const PROMO_CODES: Record<string, { trialDays: number; label: string }> = {
  'PLANG45': { trialDays: 45, label: '45 jours gratuits' },
  'BIENVENUE30': { trialDays: 30, label: '30 jours gratuits' },
}

export async function POST(request: NextRequest) {
  try {
    const { periode, promoCode } = await request.json().catch(() => ({}))
    const { user, companyId } = await requireCompany()

    const promo = promoCode ? PROMO_CODES[promoCode.trim().toUpperCase()] : null
    const trialDays = promo ? promo.trialDays : 14

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin || 'https://app.growth-plan.ca'

    if (!process.env.STRIPE_SECRET_KEY) {
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
      return NextResponse.json({
        url: `${baseUrl}/dashboard?abonnement=essai_actif&trial=${trialDays}`,
        trialDays,
        promoApplied: !!promo,
        fallbackTrial: true,
      })
    }

    const params = new URLSearchParams({
      'mode':                                   'subscription',
      'line_items[0][price]':                   priceId,
      'line_items[0][quantity]':                '1',
      'success_url':                            `${baseUrl}/dashboard?abonnement=succes${promo ? `&promo=${promoCode}` : ''}`,
      'cancel_url':                             `${baseUrl}/tarifs?annule=1`,
      'billing_address_collection':             'auto',
      'subscription_data[trial_period_days]':   String(trialDays),
      'locale':                                 'fr-CA',
      'subscription_data[metadata][company_id]': companyId,
      'subscription_data[metadata][user_id]':   user.id,
      'subscription_data[metadata][promo_code]': promoCode?.trim().toUpperCase() ?? '',
      'subscription_data[metadata][trial_days]': String(trialDays),
    })

    if (!promo) params.append('allow_promotion_codes', 'true')
    if (user.email) params.append('customer_email', user.email)

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
    return apiError(err, '[POST /api/stripe/checkout]')
  }
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')?.trim().toUpperCase()
  if (!code) return NextResponse.json({ valid: false, error: 'Code manquant' })

  const promo = PROMO_CODES[code]
  if (!promo) return NextResponse.json({ valid: false, error: 'Code invalide ou expiré' }, { status: 404 })

  return NextResponse.json({ valid: true, trialDays: promo.trialDays, label: promo.label })
}
