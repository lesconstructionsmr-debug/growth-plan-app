import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, companyId } = await requireCompany()

    const { data: devis } = await supabase
      .from('devis')
      .select('id, numero, titre, statut, montant_ttc, valide_jusqu_au, portal_token, clients(nom, email), companies(name)')
      .eq('id', params.id)
      .eq('company_id', companyId)
      .maybeSingle()

    if (!devis) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })

    const { message } = await req.json().catch(() => ({ message: '' }))
    const cli = devis.clients as any ?? {}
    const org = devis.companies as any ?? {}
    const portalUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/portal/devis/${devis.portal_token}`

    if (process.env.RESEND_API_KEY && cli.email) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? 'noreply@growth-plan.ca',
          to: cli.email,
          subject: `Devis ${devis.numero} — ${org.name ?? 'Votre entrepreneur'}`,
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#fff">
              <h2 style="color:#B8922A;margin-bottom:8px">${org.name ?? 'Votre entrepreneur'}</h2>
              <p style="white-space:pre-line;color:#333;line-height:1.6">${message || `Bonjour ${cli.nom},\n\nVeuillez trouver ci-joint votre devis ${devis.numero} — ${devis.titre}.`}</p>
              <div style="margin:32px 0;text-align:center">
                <a href="${portalUrl}" style="background:#B8922A;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:15px">
                  Consulter et approuver le devis →
                </a>
              </div>
              <p style="color:#888;font-size:12px">Ce devis est valide jusqu'au ${devis.valide_jusqu_au ?? '—'}.</p>
            </div>
          `,
        }),
      }).catch(err => console.error('[devis/envoyer] Resend error:', err))
    }

    // Mettre à jour le statut à 'envoye' si encore brouillon
    if (devis.statut === 'brouillon') {
      await supabase
        .from('devis')
        .update({ statut: 'envoye', updated_at: new Date().toISOString() })
        .eq('id', params.id)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return apiError(err, '[POST /api/devis/envoyer]')
  }
}
