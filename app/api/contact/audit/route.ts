import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const ALLOWED_ORIGINS = [
  'https://growth-plan.ca',
  'https://www.growth-plan.ca',
  'https://app.growth-plan.ca',
]

function corsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin') || ''
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

function json(req: NextRequest, body: object, status: number) {
  return NextResponse.json(body, { status, headers: corsHeaders(req) })
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) })
}

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
      return json(req, { error: 'Nom et entreprise requis', stored: false }, 400)
    }
    if (!emailTrim && !tel) {
      return json(req, { error: 'Email ou téléphone requis', stored: false }, 400)
    }

    const companyId = process.env.LANDING_LEADS_COMPANY_ID?.trim()
    if (!companyId) {
      console.error('[Contact Audit] LANDING_LEADS_COMPANY_ID manquant')
      return json(req, { error: 'LANDING_LEADS_COMPANY_ID non configuré sur Netlify', stored: false }, 503)
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
      console.error('[Contact Audit] SUPABASE_SERVICE_ROLE_KEY manquant')
      return json(req, { error: 'SUPABASE_SERVICE_ROLE_KEY non configuré sur Netlify', stored: false }, 503)
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
      return json(req, { error: `Enregistrement échoué: ${error.message}`, stored: false }, 500)
    }

    return json(req, { success: true, stored: true, lead_id: data.id }, 200)
  } catch (err) {
    console.error('[Contact Audit]', err)
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return json(req, { error: message, stored: false }, 500)
  }
}
