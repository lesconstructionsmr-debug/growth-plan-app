import { NextRequest, NextResponse } from 'next/server'
import { requireCompanyAdmin, apiError } from '@/lib/api/auth'

export async function POST(_request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY manquant' }, { status: 500 })
    }

    const { supabase, companyId } = await requireCompanyAdmin()

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('company_id', companyId)
      .single()

    const stripeCustomerId = subscription?.stripe_customer_id ?? process.env.STRIPE_TEST_CUSTOMER_ID ?? null

    if (!stripeCustomerId) {
      return NextResponse.json({ error: 'Aucun abonnement trouvé pour cet utilisateur' }, { status: 404 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

    const params = new URLSearchParams({
      customer: stripeCustomerId,
      return_url: `${baseUrl}/parametres`,
    })

    const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
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

    return NextResponse.json({ url: session.url })
  } catch (err) {
    return apiError(err, '[POST /api/stripe/portal]')
  }
}
