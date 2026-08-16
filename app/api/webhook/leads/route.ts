import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyWebhookSecret } from '@/lib/api/webhook-auth'

export const dynamic = 'force-dynamic'

// POST /api/webhook/leads — Webhook public pour capturer des leads depuis Facebook, Google Ads, Zapier, Make ou votre Site Web
export async function POST(req: NextRequest) {
  if (!verifyWebhookSecret(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const {
      company_id,
      nom,
      email,
      telephone,
      source = 'Formulaire Web / Pubs',
      valeur = 0,
      notes = ''
    } = body

    if (!nom || !telephone && !email) {
      return NextResponse.json({ error: 'Nom et au moins un contact (email ou téléphone) requis' }, { status: 400 })
    }

    if (!company_id) {
      return NextResponse.json({ error: 'company_id requis' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Insérer le lead dans le CRM
    const { data: lead, error } = await admin
      .from('leads')
      .insert({
        company_id,
        nom,
        email: email || '',
        telephone: telephone || '',
        source,
        valeur: Number(valeur) || 0,
        statut: 'nouveau',
        notes,
      })
      .select('*')
      .single()

    if (error) {
      console.error('[Webhook Leads] Erreur Supabase:', error)
      return NextResponse.json({ error: 'Erreur lors de l\'enregistrement du lead' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Lead capturé avec succès dans le CRM !',
      lead,
    })
  } catch (err) {
    console.error('[Webhook Leads]', err)
    return NextResponse.json({ error: 'Erreur serveur webhook leads' }, { status: 500 })
  }
}
