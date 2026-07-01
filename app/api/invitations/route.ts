import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/api/supabase-server'

export const dynamic = 'force-dynamic'

// GET — liste les membres + invitations de la compagnie
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json([], { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('company_id').eq('id', user.id).single()
    if (!profile?.company_id) return NextResponse.json([])

    const { data } = await supabase
      .from('invitations')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })

    return NextResponse.json(data ?? [])
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST — envoyer une invitation
export async function POST(req: NextRequest) {
  try {
    const { email, role } = await req.json()
    if (!email?.trim()) return NextResponse.json({ error: 'Email requis' }, { status: 400 })

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('company_id').eq('id', user.id).single()
    if (!profile?.company_id) return NextResponse.json({ error: 'Compagnie introuvable' }, { status: 400 })

    // Vérifier si déjà invité
    const { data: existing } = await supabase
      .from('invitations')
      .select('id').eq('company_id', profile.company_id).eq('email', email.trim()).single()
    if (existing) return NextResponse.json({ error: 'Cet email a déjà une invitation en cours' }, { status: 409 })

    // Créer l'invitation
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        company_id:  profile.company_id,
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
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// DELETE — révoquer une invitation
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    const supabase = createClient()
    const { error } = await supabase.from('invitations').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
