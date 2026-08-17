import { NextRequest, NextResponse } from 'next/server'
import { requireCompanyAdmin, apiError } from '@/lib/api/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const INGEST_PATH = '/api/public/leads'

function ingestUrl(req: NextRequest, token: string) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'app.growth-plan.ca'
  const proto = host.includes('localhost') ? 'http' : 'https'
  return `${proto}://${host}${INGEST_PATH}?token=${token}`
}

function snippet(url: string) {
  return `<!-- Plan Growth — formulaire Contact → CRM Leads -->
<form action="${url}" method="POST">
  <input type="text" name="nom" placeholder="Nom" required>
  <input type="email" name="email" placeholder="Courriel">
  <input type="tel" name="telephone" placeholder="Téléphone" required>
  <button type="submit">Envoyer</button>
</form>`
}

export async function GET(req: NextRequest) {
  try {
    const { companyId } = await requireCompanyAdmin()
    const admin = createAdminClient()

    const { data: company, error } = await admin
      .from('companies')
      .select('id, leads_ingest_token')
      .eq('id', companyId)
      .single()

    if (error) throw error

    let token = company.leads_ingest_token as string | null
    if (!token) {
      token = crypto.randomUUID()
      const { error: upd } = await admin
        .from('companies')
        .update({ leads_ingest_token: token })
        .eq('id', companyId)
      if (upd) throw upd
    }

    const url = ingestUrl(req, token)
    return NextResponse.json({
      token,
      url,
      snippet: snippet(url),
    })
  } catch (err) {
    return apiError(err, '[GET /api/company/leads-connect]')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { companyId } = await requireCompanyAdmin()
    const admin = createAdminClient()
    const token = crypto.randomUUID()

    const { error } = await admin
      .from('companies')
      .update({ leads_ingest_token: token })
      .eq('id', companyId)

    if (error) throw error

    const url = ingestUrl(req, token)
    return NextResponse.json({
      token,
      url,
      snippet: snippet(url),
    })
  } catch (err) {
    return apiError(err, '[POST /api/company/leads-connect]')
  }
}
