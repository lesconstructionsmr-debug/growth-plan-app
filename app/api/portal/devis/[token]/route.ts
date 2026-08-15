import { NextRequest, NextResponse } from 'next/server'
import { createAnonClient } from '@/lib/supabase/anon'

export const dynamic = 'force-dynamic'

function isValidPortalToken(token: string): boolean {
  return typeof token === 'string' && token.length >= 32 && /^[a-f0-9]+$/i.test(token)
}

// GET /api/portal/devis/[token] — public, via RPC SECURITY DEFINER (sans notes_internes)
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    if (!isValidPortalToken(params.token)) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 400 })
    }

    const supabase = createAnonClient()
    const { data, error } = await supabase.rpc('portal_get_devis', { p_token: params.token })

    if (error) {
      console.error('[portal/devis GET]', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
    if (!data) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })

    return NextResponse.json(data)
  } catch (err) {
    console.error('[portal/devis GET]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/portal/devis/[token] — approuver ou refuser via RPC
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    if (!isValidPortalToken(params.token)) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 400 })
    }

    const { action, motif, signatureData, signataireNom } = await req.json()
    if (action !== 'approuve' && action !== 'refuse') {
      return NextResponse.json({ error: 'action invalide' }, { status: 400 })
    }

    const supabase = createAnonClient()
    const { data, error } = await supabase.rpc('portal_update_devis', {
      p_token:          params.token,
      p_action:         action,
      p_motif:          motif ?? null,
      p_signature_data: signatureData ?? null,
      p_signataire_nom: signataireNom ?? null,
    })

    if (error) {
      const msg = error.message ?? ''
      if (msg.includes('introuvable') || error.code === 'P0002') {
        return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
      }
      if (msg.includes('déjà été traité') || msg.includes('deja ete traite')) {
        return NextResponse.json({ error: 'Ce devis a déjà été traité' }, { status: 409 })
      }
      if (msg.includes('action invalide') || msg.includes('Token invalide')) {
        return NextResponse.json({ error: msg }, { status: 400 })
      }
      console.error('[portal/devis POST]', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    // Notifier la compagnie par email si Resend est configuré
    if (process.env.RESEND_API_KEY && data) {
      const result = data as {
        client_nom?: string
        client_email?: string
        company_name?: string
        action?: string
      }
      const clientNom = result.client_nom ?? 'Client'
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
    console.error('[portal/devis POST]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
