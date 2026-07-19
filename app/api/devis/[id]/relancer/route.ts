import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

// POST /api/devis/[id]/relancer — Envoie une relance par email pour un devis
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, companyId } = await requireCompany()
    const { messageCustom } = await req.json().catch(() => ({}))

    // 1. Récupérer le devis et le client
    const { data: devis, error: devisErr } = await supabase
      .from('devis')
      .select('*, clients(*), companies(*)')
      .eq('id', params.id)
      .eq('company_id', companyId)
      .single()

    if (devisErr || !devis) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
    }

    const clientEmail = devis.clients?.email
    const clientNom = devis.clients?.nom || 'Client'
    const companyName = devis.companies?.name || 'Votre entreprise'

    if (!clientEmail) {
      return NextResponse.json({ error: 'Le client n\'a pas d\'adresse courriel renseignée.' }, { status: 400 })
    }

    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.growth-plan.ca'}/portal/devis/${devis.portal_token}`

    const message = messageCustom || `Bonjour ${clientNom},\n\nNous nous permettons de vous relancer concernant le devis ${devis.numero} (${devis.titre}) d'un montant de ${devis.montant_ttc} $ TTC.\n\nVous pouvez le consulter et l'approuver directement en ligne ici : ${portalUrl}\n\nN'hésitez pas à nous contacter si vous avez des questions.\n\nCordialement,\n${companyName}`

    // 2. Envoi de l'email via Resend si disponible, sinon mode simulation
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
            subject: `[Rappel] Devis ${devis.numero} — ${companyName}`,
            text: message,
          }),
        })
        emailSent = true
      } catch (e) {
        console.error('[relancer devis] Erreur Resend:', e)
      }
    }

    // 3. Consigner la relance dans l'historique
    await supabase.from('relances').insert({
      company_id: companyId,
      devis_id: devis.id,
      canal: 'email',
      destinataire: clientEmail,
      message,
    })

    // 4. Mettre à jour l'horodatage du devis
    await supabase.from('devis').update({ updated_at: new Date().toISOString() }).eq('id', devis.id)

    return NextResponse.json({
      success: true,
      message: emailSent
        ? `Relance envoyée avec succès à ${clientEmail}`
        : `Relance enregistrée pour ${clientEmail} (mode démo)`,
    })
  } catch (err) {
    return apiError(err, '[POST /api/devis/[id]/relancer]')
  }
}
