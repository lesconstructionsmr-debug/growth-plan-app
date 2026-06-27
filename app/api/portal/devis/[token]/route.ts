import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/api/supabase-server'

export const dynamic = 'force-dynamic'

// GET /api/portal/devis/[token] — public, pas d'auth
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('devis')
      .select(`
        id, numero, titre, statut, lignes,
        date_emission, valide_jusqu_au,
        montant_ht, tps, tvq, montant_ttc,
        notes, notes_internes, portal_token,
        clients(nom, email, telephone, adresse),
        companies(name, telephone, adresse, tps_no, tvq_no)
      `)
      .eq('portal_token', params.token)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST /api/portal/devis/[token] — approuver ou refuser
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { action, motif } = await req.json()
    if (action !== 'approuve' && action !== 'refuse') {
      return NextResponse.json({ error: 'action invalide' }, { status: 400 })
    }

    const supabase = createClient()

    // Récupérer le devis pour vérifier qu'il est bien en attente
    const { data: existing } = await supabase
      .from('devis')
      .select('id, statut, clients(email, nom), companies(name)')
      .eq('portal_token', params.token)
      .single()

    if (!existing) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
    if (!['envoye', 'vu', 'brouillon'].includes(existing.statut)) {
      return NextResponse.json({ error: 'Ce devis a déjà été traité' }, { status: 409 })
    }

    const updateData: Record<string, unknown> = {
      statut: action,
      updated_at: new Date().toISOString(),
    }
    if (action === 'approuve') updateData.approuve_le = new Date().toISOString()

    const { error } = await supabase
      .from('devis')
      .update(updateData)
      .eq('portal_token', params.token)

    if (error) throw error

    // Notifier la compagnie par email si Resend est configuré
    if (process.env.RESEND_API_KEY) {
      const clientNom = (existing.clients as any)?.nom ?? 'Client'
      const companyNom = (existing.companies as any)?.name ?? 'votre compagnie'
      const label = action === 'approuve' ? '✅ APPROUVÉ' : '❌ REFUSÉ'
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? 'noreply@growth-plan.ca',
          to: process.env.RESEND_NOTIFY_EMAIL ?? process.env.RESEND_FROM ?? 'noreply@growth-plan.ca',
          subject: `Devis ${label} par ${clientNom}`,
          html: `
            <div style="font-family:sans-serif;padding:24px;max-width:480px;">
              <h2 style="margin:0 0 12px;">Devis ${label}</h2>
              <p style="color:#444;font-size:14px;line-height:1.6;">
                <strong>${clientNom}</strong> a ${action === 'approuve' ? 'approuvé' : 'refusé'} le devis.
                ${motif ? `<br/><br/>Motif: ${motif}` : ''}
              </p>
              <p style="font-size:12px;color:#888;">Connectez-vous à Plan Growth ERP pour voir les détails.</p>
            </div>
          `,
        }),
      }).catch(err => console.error('[portal/devis] Erreur email notif:', err))
    }

    return NextResponse.json({ success: true, action })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
