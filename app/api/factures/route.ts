import { NextRequest, NextResponse } from 'next/server'
import { requireCompanyAdmin, apiError } from '@/lib/api/auth'
import { createFacture } from '@/lib/api/factures'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    await requireCompanyAdmin()
    const body = await req.json()

    const facture = await createFacture({
      client_id:      body.client_id,
      devis_id:       body.reference_devis || undefined,
      numero:         body.numero,
      titre:          body.titre,
      date_emission:  body.date_emission,
      date_echeance:  body.date_echeance,
      mode_reglement: body.mode_reglement,
      notes:          body.notes_client,
      notes_internes: body.notes_internes,
      lignes:         body.lignes,
      appliquer_tps:  body.appliquer_tps,
      appliquer_tvq:  body.appliquer_tvq,
    })

    return NextResponse.json(facture, {
      status: 201,
      headers: { 'Cache-Control': 'private, no-cache, no-store, must-revalidate' },
    })
  } catch (err) {
    return apiError(err, '[POST /api/factures]')
  }
}
