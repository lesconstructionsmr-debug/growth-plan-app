import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseScanJson } from '@/lib/depenses/parse-scan'
import { readDocument } from '@/lib/depenses/read-document'
import { extractInboxKey, matchJob } from '@/lib/depenses/match-job'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function inboundAuthorized(req: NextRequest): boolean {
  const secrets = [
    process.env.INBOUND_EMAIL_SECRET,
    process.env.LEADS_WEBHOOK_SECRET,
    process.env.RESEND_WEBHOOK_SECRET,
  ].filter(Boolean) as string[]
  if (secrets.length === 0) return false
  const q = req.nextUrl.searchParams.get('secret') || ''
  const header = req.headers.get('x-webhook-secret') || ''
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || ''
  return secrets.some(s => s === q || s === header || s === bearer)
}

function recipientsOf(body: Record<string, unknown>): string[] {
  const data = (body.data && typeof body.data === 'object' ? body.data : body) as Record<string, unknown>
  const to = data.to ?? body.to
  if (Array.isArray(to)) return to.map(String)
  if (typeof to === 'string') return [to]
  const receivedFor = data.received_for
  if (Array.isArray(receivedFor)) return receivedFor.map(String)
  return []
}

export async function POST(req: NextRequest) {
  try {
    if (!inboundAuthorized(req)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({})) as Record<string, unknown>
    const data = (body.data && typeof body.data === 'object' ? body.data : body) as Record<string, unknown>
    const toList = recipientsOf(body)
    const key = toList.map(extractInboxKey).find(Boolean)
    if (!key) {
      return NextResponse.json({ ok: true, skipped: 'pas une boîte dépenses' })
    }

    const admin = createAdminClient()
    const { data: company } = await admin
      .from('companies')
      .select('id, name')
      .eq('expenses_inbox_key', key)
      .maybeSingle()

    if (!company) {
      return NextResponse.json({ error: 'Boîte inconnue' }, { status: 404 })
    }

    const emailId = String(data.email_id ?? body.email_id ?? '')
    const subject = String(data.subject ?? body.subject ?? '')
    let text = String(data.text ?? body.text ?? body.html ?? '')
    const inboundBase = emailId || `${Date.now()}`

    const { data: jobs } = await admin
      .from('jobs')
      .select('id, titre, adresse')
      .eq('company_id', company.id)
      .limit(200)

    const attachments = await loadAttachments(data, body, emailId)
    let created = 0
    const haystackParts = [subject, text]

    if (attachments.length === 0) {
      const fromText = guessFromText(subject, text)
      if (fromText) {
        const job = matchJob(jobs ?? [], haystackParts.join(' '))
        const ok = await insertDepense(admin, {
          companyId: company.id,
          jobId: job?.id ?? null,
          parsed: fromText,
          inboundRef: `${inboundBase}:body`,
          subject,
        })
        if (ok) created++
      }
    }

    for (const att of attachments) {
      haystackParts.push(att.filename)
      const raw = await readDocument(att.b64, att.mime)
      let parsed = guessFromText(subject, text)
      if (raw) {
        try { parsed = parseScanJson(raw) } catch { /* texte brut */ }
      }
      if (!parsed?.montant) continue
      const job = matchJob(jobs ?? [], haystackParts.join(' '))
      const ok = await insertDepense(admin, {
        companyId: company.id,
        jobId: job?.id ?? null,
        parsed,
        inboundRef: `${inboundBase}:${att.id}`,
        subject,
      })
      if (ok) created++
    }

    return NextResponse.json({ ok: true, created, company: company.name })
  } catch (err) {
    console.error('[inbound-invoices]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

async function insertDepense(
  admin: ReturnType<typeof createAdminClient>,
  input: {
    companyId: string
    jobId: string | null
    parsed: { description: string; montant: number; date_depense: string; categorie: string }
    inboundRef: string
    subject: string
  },
): Promise<boolean> {
  const desc = input.parsed.description || input.subject || 'Facture courriel'
  const { error } = await admin.from('depenses').insert({
    company_id: input.companyId,
    job_id: input.jobId,
    description: desc.slice(0, 200),
    montant: input.parsed.montant,
    categorie: input.parsed.categorie || 'Autre',
    date_depense: input.parsed.date_depense,
    source: 'Courriel',
    inbound_ref: input.inboundRef,
  })
  if (error && (error.message?.includes('duplicate') || error.code === '23505')) return false
  if (error && (error.message?.includes('inbound_ref') || error.message?.includes('source') || error.code === '42703')) {
    const retry = await admin.from('depenses').insert({
      company_id: input.companyId,
      job_id: input.jobId,
      description: `[Courriel] ${desc}`.slice(0, 200),
      montant: input.parsed.montant,
      categorie: input.parsed.categorie || 'Autre',
      date_depense: input.parsed.date_depense,
    })
    return !retry.error
  }
  if (error) {
    console.error('[inbound insert]', error)
    return false
  }
  return true
}

function guessFromText(subject: string, text: string): {
  description: string; montant: number; date_depense: string; categorie: string
} | null {
  const blob = `${subject} ${text}`
  const m = blob.replace(/\s/g, ' ').match(/(\d[\d\s]{0,8}[.,]\d{2})\s*\$/)
    || blob.match(/\$\s*(\d[\d\s]{0,8}[.,]\d{2})/)
  if (!m) return null
  const montant = Number(m[1].replace(/\s/g, '').replace(',', '.'))
  if (!montant) return null
  return {
    description: subject.trim() || 'Facture courriel',
    montant,
    date_depense: new Date().toISOString().split('T')[0],
    categorie: 'Autre',
  }
}

type Att = { id: string; filename: string; mime: string; b64: string }

async function loadAttachments(
  data: Record<string, unknown>,
  body: Record<string, unknown>,
  emailId: string,
): Promise<Att[]> {
  const raw = (data.attachments ?? body.attachments) as unknown
  const out: Att[] = []

  if (Array.isArray(raw)) {
    for (const a of raw) {
      if (!a || typeof a !== 'object') continue
      const row = a as Record<string, unknown>
      const b64 = String(row.content ?? row.content_base64 ?? '').replace(/^data:[^;]+;base64,/, '')
      const mime = String(row.content_type ?? row.mime ?? '')
      if (b64 && mime) {
        out.push({
          id: String(row.id ?? row.filename ?? out.length),
          filename: String(row.filename ?? 'piece'),
          mime,
          b64,
        })
      }
    }
  }

  if (out.length > 0 || !emailId || !process.env.RESEND_API_KEY) return out

  const listRes = await fetch(`https://api.resend.com/emails/receiving/${emailId}/attachments`, {
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  })
  if (!listRes.ok) return out
  const list = await listRes.json() as { data?: Array<{ id: string; filename?: string; content_type?: string; download_url?: string }> }
  for (const att of list.data ?? []) {
    if (!att.download_url) continue
    const mime = att.content_type || ''
    if (!mime.startsWith('image/') && mime !== 'application/pdf') continue
    const fileRes = await fetch(att.download_url)
    if (!fileRes.ok) continue
    const buf = Buffer.from(await fileRes.arrayBuffer())
    out.push({
      id: att.id,
      filename: att.filename || 'piece',
      mime,
      b64: buf.toString('base64'),
    })
  }
  return out
}
