import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, apiError } from '@/lib/api/auth'
import { createDevis } from '@/lib/api/devis'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    await requireCompany()
    const body = await req.json()

    const devis = await createDevis({
      client_id:        body.client_id,
      titre:            body.titre,
      numero:           body.numero,
      date_emission:    body.date_emission,
      valide_jusqu_au:  body.date_validite,
      reference_projet: body.reference_projet,
      notes:            body.notes_client,
      notes_internes:   body.notes_internes,
      lignes:           body.lignes,
      appliquer_tps:    body.appliquer_tps,
      appliquer_tvq:    body.appliquer_tvq,
      statut:           body.statut ?? 'brouillon',
    })

    return NextResponse.json(devis, { status: 201 })
  } catch (err) {
    return apiError(err, '[POST /api/devis]')
  }
}
