import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseJsonLead, type IngestFields } from '@/lib/leads/parse-ingest'

export const dynamic = 'force-dynamic'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
}

function json(body: object, status: number) {
  return NextResponse.json(body, { status, headers: CORS })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

async function readFields(req: NextRequest): Promise<IngestFields> {
  const urlToken = req.nextUrl.searchParams.get('token') || ''
  const contentType = req.headers.get('content-type') || ''
  const isForm =
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')

  if (!isForm) {
    const body = await req.json().catch(() => null)
    if (body && typeof body === 'object') {
      return parseJsonLead(body as Record<string, unknown>, urlToken)
    }
  }

  const form = await req.formData().catch(() => null)
  if (form) {
    return {
      token: String(form.get('token') ?? urlToken).trim(),
      nom: String(form.get('nom') ?? form.get('name') ?? '').trim(),
      email: String(form.get('email') ?? '').trim(),
      telephone: String(form.get('telephone') ?? form.get('phone') ?? '').trim(),
      source: String(form.get('source') ?? 'Formulaire site web').trim() || 'Formulaire site web',
      notes: String(form.get('notes') ?? '').trim(),
      googleKey: '',
      isGoogle: false,
    }
  }

  return parseJsonLead({}, urlToken)
}

/** POST /api/public/leads — Capture publique depuis le site du client (jeton par compagnie). */
export async function POST(req: NextRequest) {
  try {
    const fields = await readFields(req)
    const token = fields.token.trim()
    const nom = fields.nom.trim()
    const email = fields.email.trim()
    const telephone = fields.telephone.trim()
    const source = fields.source.trim() || (fields.isGoogle ? 'Google Ads' : 'Formulaire site web')
    const notes = fields.notes.trim()

    if (!token) {
      return json({ error: 'Jeton d\'intégration manquant', stored: false }, 400)
    }
    if (!nom) {
      return json({ error: 'Le nom est requis', stored: false }, 400)
    }
    if (!email && !telephone) {
      return json({ error: 'Courriel ou téléphone requis', stored: false }, 400)
    }

    const admin = createAdminClient()
    const { data: company, error: companyError } = await admin
      .from('companies')
      .select('id, name, leads_ingest_token')
      .eq('leads_ingest_token', token)
      .maybeSingle()

    if (companyError || !company) {
      return json({ error: 'Jeton invalide', stored: false }, 401)
    }

    if (fields.googleKey && fields.googleKey !== company.leads_ingest_token) {
      return json({ error: 'Clé Google Ads invalide', stored: false }, 401)
    }

    const { data: lead, error } = await admin
      .from('leads')
      .insert({
        company_id: company.id,
        nom,
        email: email || '',
        telephone: telephone || '',
        source,
        statut: 'nouveau',
        notes: notes || null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[Public Leads]', error)
      return json({ error: 'Erreur lors de l\'enregistrement', stored: false }, 500)
    }

    const wantsHtml = (req.headers.get('content-type') || '').includes('application/x-www-form-urlencoded')
      || (req.headers.get('content-type') || '').includes('multipart/form-data')
    const wantsJson = req.headers.get('accept')?.includes('application/json')

    if (wantsHtml && !wantsJson) {
      const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Demande envoyée</title></head>
<body style="font-family:system-ui,sans-serif;padding:48px;text-align:center;background:#0A0B0E;color:#e2e8f0">
  <h1 style="color:#F5D061">Demande envoyée</h1>
  <p>Merci. L&apos;équipe vous contacte sous 24 heures.</p>
</body></html>`
      return new NextResponse(html, {
        status: 200,
        headers: { ...CORS, 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    return json({
      success: true,
      stored: true,
      lead_id: lead.id,
      message: `Demande reçue — ${company.name}`,
    }, 200)
  } catch (err) {
    console.error('[Public Leads]', err)
    return json({ error: 'Erreur serveur', stored: false }, 500)
  }
}
