import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/** POST /api/contact/audit — Demande d'audit ROI depuis la landing page */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { name, company, email, phone, trade } = body as {
      name?: string
      company?: string
      email?: string
      phone?: string
      trade?: string
    }

    const nom = name?.trim()
    const entreprise = company?.trim()
    const emailTrim = email?.trim()
    const tel = phone?.trim()
    const secteur = trade?.trim() || 'Non précisé'

    if (!nom || !entreprise) {
      return NextResponse.json({ error: 'Nom et entreprise requis', stored: false }, { status: 400 })
    }
    if (!emailTrim && !tel) {
      return NextResponse.json({ error: 'Email ou téléphone requis', stored: false }, { status: 400 })
    }

    const companyId = process.env.LANDING_LEADS_COMPANY_ID?.trim()
    if (!companyId) {
      console.error('[Contact Audit] LANDING_LEADS_COMPANY_ID manquant')
      return NextResponse.json(
        { error: 'LANDING_LEADS_COMPANY_ID non configuré sur Netlify', stored: false },
        { status: 503 },
      )
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
      console.error('[Contact Audit] SUPABASE_SERVICE_ROLE_KEY manquant')
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY non configuré sur Netlify', stored: false },
        { status: 503 },
      )
    }

    const notes = [
      `Entreprise: ${entreprise}`,
      `Secteur: ${secteur}`,
      'Source: Landing — Audit ROI Plangrowth',
    ].join('\n')

    const admin = createAdminClient()
    const { data, error } = await admin.from('leads').insert({
      company_id: companyId,
      nom: `${nom} (${entreprise})`,
      email: emailTrim || '',
      telephone: tel || '',
      source: 'Landing — Audit ROI',
      statut: 'nouveau',
      notes,
    }).select('id').single()

    if (error) {
      console.error('[Contact Audit] Erreur Supabase:', error)
      return NextResponse.json(
        { error: `Enregistrement échoué: ${error.message}`, stored: false },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, stored: true, lead_id: data.id })
  } catch (err) {
    console.error('[Contact Audit]', err)
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: message, stored: false }, { status: 500 })
  }
}
