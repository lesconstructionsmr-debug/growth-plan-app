import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

// GET — liste les membres + invitations de la compagnie
export async function GET() {
  try {
    const { supabase, companyId } = await requireCompany()

    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    return apiError(err, '[GET /api/invitations]')
  }
}

// POST — envoyer une invitation
export async function POST(req: NextRequest) {
  try {
    const { email, role } = await req.json()
    if (!email?.trim()) return NextResponse.json({ error: 'Email requis' }, { status: 400 })

    const { supabase, user, companyId } = await requireCompany()

    // Vérifier si déjà invité
    const { data: existing } = await supabase
      .from('invitations')
      .select('id').eq('company_id', companyId).eq('email', email.trim()).maybeSingle()
    if (existing) return NextResponse.json({ error: 'Cet email a déjà une invitation en cours' }, { status: 409 })

    // Créer l'invitation
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        company_id:  companyId,
        email:       email.trim().toLowerCase(),
        role:        role ?? 'collaborateur',
        invited_by:  user.id,
      })
      .select()
      .single()

    if (error) throw error

    // Envoyer email via Resend
    if (process.env.RESEND_API_KEY) {
      // data.token = colonne token (gen_random_bytes) — PAS data.id (S2.1)
      const joinUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://app.growth-plan.ca'}/join?token=${data.token}`
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? 'noreply@growth-plan.ca',
          to: email.trim(),
          subject: 'Invitation — Plan Growth ERP',
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
              <h2 style="margin:0 0 16px;font-size:20px;color:#0A0A0A;">Vous avez été invité à rejoindre Plan Growth</h2>
              <p style="font-size:14px;color:#444;line-height:1.6;margin:0 0 24px;">
                Vous avez été invité en tant que <strong>${role ?? 'collaborateur'}</strong>.
                Cliquez sur le bouton ci-dessous pour créer votre compte et accéder à la plateforme.
              </p>
              <a href="${joinUrl}" style="display:inline-block;background:#D4960C;color:#0A0A0A;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">
                Accepter l'invitation →
              </a>
              <p style="font-size:12px;color:#888;margin-top:24px;line-height:1.5;">
                Ce lien est personnel et ne doit pas être partagé.
              </p>
            </div>
          `,
        }),
      }).catch(err => console.error('[invitations] Erreur envoi email:', err))
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return apiError(err, '[POST /api/invitations]')
  }
}

// DELETE — révoquer une invitation
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    const { supabase, companyId } = await requireCompany()

    // .select('id') = vérifier qu'une ligne a réellement été supprimée (S2.2)
    const { data, error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)
      .select('id')
    if (error) throw error
    if (!data?.length) return NextResponse.json({ error: 'Invitation introuvable' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return apiError(err, '[DELETE /api/invitations]')
  }
}
