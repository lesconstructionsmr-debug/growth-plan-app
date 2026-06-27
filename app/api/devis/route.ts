import { NextRequest, NextResponse } from 'next/server'
import { createDevis } from '@/lib/api/devis'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
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
    console.error('[POST /api/devis]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne' },
      { status: 500 }
    )
  }
}
