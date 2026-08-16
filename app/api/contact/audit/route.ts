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
      return NextResponse.json({ error: 'Nom et entreprise requis' }, { status: 400 })
    }
    if (!emailTrim && !tel) {
      return NextResponse.json({ error: 'Email ou téléphone requis' }, { status: 400 })
    }

    const notes = [
      `Entreprise: ${entreprise}`,
      `Secteur: ${secteur}`,
      'Source: Landing — Audit ROI Plangrowth',
    ].join('\n')

    const companyId = process.env.LANDING_LEADS_COMPANY_ID

    if (companyId) {
      const admin = createAdminClient()
      const { error } = await admin.from('leads').insert({
        company_id: companyId,
        nom: `${nom} (${entreprise})`,
        email: emailTrim || '',
        telephone: tel || '',
        source: 'Landing — Audit ROI',
        statut: 'nouveau',
        notes,
      })

      if (error) {
        console.error('[Contact Audit] Erreur Supabase:', error)
        return NextResponse.json({ error: 'Erreur lors de l\'enregistrement' }, { status: 500 })
      }
    } else {
      console.info('[Contact Audit] Demande reçue (LANDING_LEADS_COMPANY_ID non configuré):', {
        nom,
        entreprise,
        email: emailTrim,
        tel,
        secteur,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Contact Audit]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
