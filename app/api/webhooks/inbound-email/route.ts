import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * POST /api/webhooks/inbound-email
 *
 * Webhook public de réception des courriels entrants (compatible Resend Inbound, Postmark, SendGrid, Mailgun).
 * Intercepte les réponses directes des clients et les injecte automatiquement dans leur fil de discussion.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    // 1. Extraction de l'expéditeur (From)
    const rawFrom: string =
      body.from ||
      body.sender ||
      body.From ||
      body.headers?.from ||
      body.envelope?.from ||
      ''

    const emailMatch = rawFrom.match(/<([^>]+)>/) || rawFrom.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
    const senderEmail = (emailMatch ? emailMatch[1] : rawFrom).trim().toLowerCase()

    if (!senderEmail) {
      return NextResponse.json({ ok: false, error: 'Expéditeur (from) manquant' }, { status: 400 })
    }

    // 2. Extraction du sujet et du corps du message
    const subject: string = body.subject || body.Subject || 'Sans objet'
    let textContent: string = body.text || body.TextBody || body.stripped_text || body.html || body.HtmlBody || ''

    // Nettoyage rapide du HTML si nécessaire
    if (textContent.includes('<') && textContent.includes('>')) {
      textContent = textContent.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim()
    }

    if (!textContent.trim()) {
      textContent = '[Courriel sans texte visible ou pièce jointe]'
    }

    // 3. Recherche du client correspondant dans Supabase (via client Admin)
    const supabaseAdmin = createAdminClient()
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('id, company_id, nom, email')
      .ilike('email', senderEmail)
      .maybeSingle()

    if (!client) {
      console.log(`[inbound-email] Aucun client trouvé pour l'email: ${senderEmail}`)
      return NextResponse.json({
        ok: true,
        matched: false,
        message: `Courriel reçu mais aucun client associé à ${senderEmail}`,
      })
    }

    // 4. Insertion de la réponse du client dans la table 'notes'
    const noteContenu = `📬 [Courriel reçu de ${client.nom}] — ${subject}\n\n${textContent.trim()}`

    const { data: insertedNote, error: insertErr } = await supabaseAdmin
      .from('notes')
      .insert({
        company_id: client.company_id,
        client_id: client.id,
        type: 'email',
        contenu: noteContenu,
      })
      .select('id, created_at')
      .single()

    if (insertErr) {
      console.error('[inbound-email] Erreur insertion note:', insertErr)
      return NextResponse.json({ ok: false, error: 'Erreur insertion note' }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      matched: true,
      clientId: client.id,
      clientNom: client.nom,
      noteId: insertedNote?.id,
    })
  } catch (err: any) {
    console.error('[POST /api/webhooks/inbound-email] Exception:', err)
    return NextResponse.json({ ok: false, error: err?.message || 'Erreur interne' }, { status: 500 })
  }
}
