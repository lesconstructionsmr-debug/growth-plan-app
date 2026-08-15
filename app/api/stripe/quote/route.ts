import { NextRequest, NextResponse } from 'next/server'
import { computeTierQuote, getPricingTier, type PricingTierId } from '@/lib/stripe/pricing'

export async function GET(request: NextRequest) {
  const tierId = request.nextUrl.searchParams.get('tier') as PricingTierId | null
  const tier = getPricingTier(tierId)

  if (!tier) {
    return NextResponse.json({ error: 'Forfait invalide' }, { status: 400 })
  }

  if (tier.contactOnly) {
    return NextResponse.json({ tier, contactOnly: true })
  }

  return NextResponse.json(computeTierQuote(tier.id))
}
