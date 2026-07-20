import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

// POST /api/messages — Envoie un message par courriel au client et l'enregistre en base
export async function POST(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompany()
    const { client_id, contenu } = await req.json()

    if (!client_id || !contenu?.trim()) {
      return NextResponse.json({ error: 'Client et contenu requis' }, { status: 400 })
    }

    // 1. Récupérer le client et l'entreprise
    const [{ data: client }, { data: company }] = await Promise.all([
      supabase.from('clients').select('id, nom, email').eq('id', client_id).single(),
      supabase.from('companies').select('name').eq('id', companyId).single(),
    ])

    if (!client || !client.email) {
      return NextResponse.json({ error: 'Le client n\'a pas d\'adresse email valide' }, { status: 400 })
    }

    const companyName = company?.name || 'Votre entreprise'
    const clientEmail = client.email
    const clientNom = client.nom

    // 2. Envoi du courriel au client via Resend (si clé configurée)
    let emailSent = false
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || 'noreply@growth-plan.ca',
            to: clientEmail,
            subject: `Nouveau message de ${companyName}`,
            text: `Bonjour ${clientNom},\n\nVous avez reçu un nouveau message de ${companyName} :\n\n"${contenu.trim()}"\n\nPour répondre, vous pouvez simplement répondre directement à ce courriel.\n\nCordialement,\n${companyName}`,
          }),
        })
        emailSent = true
      } catch (err) {
        console.error('[API Messages] Erreur Resend:', err)
      }
    }

    // 3. Consigner la note / message dans le journal
    const { data: note } = await supabase.from('notes').insert({
      company_id: companyId,
      client_id: client.id,
      type: 'note',
      contenu: `[Message envoyé au client] ${contenu.trim()}`,
    }).select('*').single()

    return NextResponse.json({
      success: true,
      emailSent,
      destinataire: clientEmail,
      note,
    })
  } catch (err) {
    return apiError(err, '[POST /api/messages]')
  }
}
