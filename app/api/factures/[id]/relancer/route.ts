import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

// POST /api/factures/[id]/relancer — Envoie un rappel de paiement pour une facture
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, companyId } = await requireCompany()
    const { messageCustom } = await req.json().catch(() => ({}))

    // 1. Récupérer la facture et le client
    const { data: facture, error: facErr } = await supabase
      .from('factures')
      .select('*, clients(*), companies(*)')
      .eq('id', params.id)
      .eq('company_id', companyId)
      .single()

    if (facErr || !facture) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
    }

    const clientEmail = facture.clients?.email
    const clientNom = facture.clients?.nom || 'Client'
    const companyName = facture.companies?.name || 'Votre entreprise'

    if (!clientEmail) {
      return NextResponse.json({ error: 'Le client n\'a pas d\'adresse courriel renseignée.' }, { status: 400 })
    }

    const message = messageCustom || `Bonjour ${clientNom},\n\nSauf erreur ou omission de notre part, nous constatons que la facture ${facture.numero} d'un montant de ${facture.montant_ttc} $ TTC émise le ${facture.date_emission} reste en attente de règlement.\n\nMerci de procéder au paiement dans les plus brefs délais par Virement Interac ou chèque.\n\nCordialement,\n${companyName}`

    // 2. Envoi par Resend si configuré
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
            subject: `[Rappel de paiement] Facture ${facture.numero} — ${companyName}`,
            text: message,
          }),
        })
        emailSent = true
      } catch (e) {
        console.error('[relancer facture] Erreur Resend:', e)
      }
    }

    // 3. Consigner la relance
    await supabase.from('relances').insert({
      company_id: companyId,
      facture_id: facture.id,
      canal: 'email',
      destinataire: clientEmail,
      message,
    })

    // 4. Passer le statut en 'en_retard' si échéance dépassée et toujours en brouillon/envoyée
    if (facture.statut !== 'payee' && facture.date_echeance && new Date(facture.date_echeance) < new Date()) {
      await supabase.from('factures').update({ statut: 'en_retard', updated_at: new Date().toISOString() }).eq('id', facture.id)
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? `Rappel de paiement envoyé avec succès à ${clientEmail}`
        : `Rappel de paiement consigné pour ${clientEmail} (mode démo)`,
    })
  } catch (err) {
    return apiError(err, '[POST /api/factures/[id]/relancer]')
  }
}
