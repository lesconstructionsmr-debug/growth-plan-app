import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// POST /api/stripe/portal
// Redirige le client vers son portail Stripe pour gérer son abonnement
// (changer de plan, mettre à jour le paiement, annuler, voir les factures)
export async function POST(_request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'STRIPE_SECRET_KEY manquant' }, { status: 500 })
  }

  // Récupérer le stripe_customer_id de l'utilisateur connecté
  let stripeCustomerId: string | null = null

  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value, set: () => {}, remove: () => {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('company_id', profile.company_id)
      .single()

    stripeCustomerId = subscription?.stripe_customer_id ?? process.env.STRIPE_TEST_CUSTOMER_ID ?? null

  } catch (err) {
    console.error('[stripe/portal]', err)
    return NextResponse.json({ error: 'Erreur d\'authentification' }, { status: 500 })
  }

  if (!stripeCustomerId) {
    return NextResponse.json({ error: 'Aucun abonnement trouvé pour cet utilisateur' }, { status: 404 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  // Créer une session portail Stripe
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
}
