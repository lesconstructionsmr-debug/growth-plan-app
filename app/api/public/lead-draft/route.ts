import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * POST /api/public/lead-draft
 * Ingestion publique de brouillon de lead (capture d'abandon de formulaire et paramètres UTM Ads).
 * Accepte: { lead_id?, email?, telephone?, nom?, entreprise?, besoin?, taille_equipe?, utm_source?, utm_medium?, utm_campaign?, utm_content?, source? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim() : null
    const telephone = typeof body.telephone === 'string' ? body.telephone.trim() : null
    const nom = typeof body.nom === 'string' ? body.nom.trim() : (email || telephone || 'Prospect Incomplet')
    const lead_id = typeof body.lead_id === 'string' ? body.lead_id : null

    // Au moins un email, téléphone ou nom est nécessaire
    if (!email && !telephone && !nom) {
      return NextResponse.json({ error: 'Au moins un contact (email ou téléphone) est requis' }, { status: 400 })
    }

    const admin = createAdminClient()

    // 1. Si lead_id est fourni, mettre à jour la ligne existante
    if (lead_id) {
      const { data: updated, error: updateErr } = await admin
        .from('platform_leads')
        .update({
          nom: nom || undefined,
          email: email || undefined,
          telephone: telephone || undefined,
          entreprise: body.entreprise?.trim() || undefined,
          besoin: body.besoin || undefined,
          taille_equipe: body.taille_equipe || undefined,
          utm_source: body.utm_source?.trim() || undefined,
          utm_medium: body.utm_medium?.trim() || undefined,
          utm_campaign: body.utm_campaign?.trim() || undefined,
          utm_content: body.utm_content?.trim() || undefined,
          source: body.source?.trim() || (body.utm_source ? `Ads (${body.utm_source})` : 'Formulaire Web'),
          abandoned_at: new Date().toISOString(),
        })
        .eq('id', lead_id)
        .select()
        .maybeSingle()

      if (!updateErr && updated) {
        return NextResponse.json({ success: true, lead_id: updated.id, status: updated.statut })
      }
    }

    // 2. Si un email correspond déjà à un lead en statut "incomplet", on le met à jour
    if (email) {
      const { data: existing } = await admin
        .from('platform_leads')
        .select('id, statut')
        .eq('email', email)
        .maybeSingle()

      if (existing) {
        const { data: updated, error: errExist } = await admin
          .from('platform_leads')
          .update({
            nom: nom || undefined,
            telephone: telephone || undefined,
            entreprise: body.entreprise?.trim() || undefined,
            besoin: body.besoin || undefined,
            taille_equipe: body.taille_equipe || undefined,
            utm_source: body.utm_source?.trim() || undefined,
            utm_medium: body.utm_medium?.trim() || undefined,
            utm_campaign: body.utm_campaign?.trim() || undefined,
            utm_content: body.utm_content?.trim() || undefined,
            abandoned_at: existing.statut === 'incomplet' ? new Date().toISOString() : undefined,
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (!errExist && updated) {
          return NextResponse.json({ success: true, lead_id: updated.id, status: updated.statut })
        }
      }
    }

    // 3. Sinon, créer un nouveau lead avec le statut 'incomplet'
    const { data: newLead, error: insertErr } = await admin
      .from('platform_leads')
      .insert({
        nom,
        email,
        telephone,
        entreprise: body.entreprise?.trim() || null,
        source: body.source?.trim() || (body.utm_source ? `Pub ${body.utm_source}` : 'Instagram / Web'),
        statut: 'incomplet',
        besoin: body.besoin || null,
        taille_equipe: body.taille_equipe || null,
        utm_source: body.utm_source?.trim() || null,
        utm_medium: body.utm_medium?.trim() || null,
        utm_campaign: body.utm_campaign?.trim() || null,
        utm_content: body.utm_content?.trim() || null,
        abandoned_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertErr) {
      console.error('[Public Lead Draft] Error inserting draft:', insertErr)
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde du brouillon' }, { status: 500 })
    }

    return NextResponse.json({ success: true, lead_id: newLead.id, status: newLead.statut })
  } catch (err) {
    console.error('[Public Lead Draft]', err)
    return NextResponse.json({ error: 'Erreur serveur draft lead' }, { status: 500 })
  }
}
