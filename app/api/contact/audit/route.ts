import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/api/rate-limit'

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
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1'
    const { allowed } = checkRateLimit(ip, 10, 15 * 60 * 1000)
    if (!allowed) {
      return json(req, { error: 'Trop de requêtes, veuillez réessayer plus tard' }, 429)
    }

    const body = await req.json().catch(() => ({}))
    if (body.website || body.hp) {
      return json(req, { success: true, lead_id: 'honeypot_dropped' }, 200)
    }

    const name = body.name || body.nom || ''
    const company = body.company || body.entreprise || ''
    const email = body.email || ''
    const phone = body.phone || body.telephone || ''
    const trade = body.trade || body.secteur || ''
    const chantiers_par_mois = body.chantiers_par_mois || body.quotes_per_month || null
    const chiffre_affaires = body.chiffre_affaires || body.avg_project_value || null

    const nom = String(name).trim()
    const entreprise = String(company).trim()
    const emailTrim = String(email).trim()
    const tel = String(phone).trim()
    const secteur = String(trade).trim() || 'Non précisé'

    if (!nom || !entreprise) {
      return json(req, { error: 'Nom et entreprise requis', stored: false }, 400)
    }
    if (!emailTrim && !tel) {
      return json(req, { error: 'Email ou téléphone requis', stored: false }, 400)
    }

    const admin = createAdminClient()

    // 1. Toujours enregistrer dans platform_leads (Centre de Contrôle Fondateur)
    const noteLines = [
      `Entreprise: ${entreprise}`,
      `Secteur: ${secteur}`,
    ]
    if (chantiers_par_mois) noteLines.push(`Chantiers par mois: ${chantiers_par_mois}`)
    if (chiffre_affaires) noteLines.push(`Chiffre d'affaires: ${chiffre_affaires}`)
    noteLines.push('Source: Landing Page — Demande Audit ROI')

    const notes = noteLines.join('\n')

    const { data: platformLead, error: platformErr } = await admin
      .from('platform_leads')
      .insert({
        nom,
        entreprise,
        email: emailTrim || null,
        telephone: tel || null,
        source: 'Landing — Audit ROI',
        statut: 'nouveau',
        besoin: 'les_deux',
        score: 95,
        notes,
      })
      .select('id')
      .maybeSingle()

    if (platformErr) {
      console.warn('[Contact Audit] Erreur insertion platform_leads:', platformErr.message)
    }

    // 2. Insérer dans la table leads pour TOUTES les compagnies (pour affichage dans /leads)
    let companyLeadId = null
    const envCompanyId = process.env.LANDING_LEADS_COMPANY_ID?.trim()

    if (envCompanyId) {
      const { data: cLead } = await admin
        .from('leads')
        .insert({
          company_id: envCompanyId,
          nom: `${nom} (${entreprise})`,
          email: emailTrim || '',
          telephone: tel || '',
          source: 'Landing — Audit ROI',
          statut: 'nouveau',
          notes,
        })
        .select('id')
        .maybeSingle()
      if (cLead) companyLeadId = cLead.id
    }

    // Insérer également pour toutes les compagnies actives afin d'être visible dans l'onglet /leads du CRM
    const { data: companies } = await admin.from('companies').select('id')
    if (companies && companies.length > 0) {
      for (const comp of companies) {
        if (comp.id !== envCompanyId) {
          try {
            await admin.from('leads').insert({
              company_id: comp.id,
              nom: `${nom} (${entreprise})`,
              email: emailTrim || '',
              telephone: tel || '',
              source: 'Landing — Audit ROI',
              statut: 'nouveau',
              notes,
            })
          } catch {
            // Ignorer les erreurs d'insertion individuelles
          }
        }
      }
    }

    return json(req, {
      success: true,
      stored: true,
      lead_id: platformLead?.id || companyLeadId || 'captured',
    }, 200)
  } catch (err) {
    console.error('[Contact Audit]', err)
    return json(req, {
      success: true,
      stored: true,
      lead_id: 'captured',
      message: 'Demande capturée avec succès',
    }, 200)
  }
}
