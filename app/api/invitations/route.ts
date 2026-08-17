import { NextRequest, NextResponse } from 'next/server'
import { requireCompanyAdmin, apiError } from '@/lib/api/auth'
import { sendResendEmail } from '@/lib/email/signup-confirmation'
import { escapeHtml } from '@/lib/email/links'
import { getSiteUrl } from '@/lib/auth/site-url'

export const dynamic = 'force-dynamic'

// GET — liste les membres + invitations de la compagnie
export async function GET() {
  try {
    const { supabase, companyId } = await requireCompanyAdmin()

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

    const { supabase, user, companyId } = await requireCompanyAdmin()

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

    const joinUrl = `${getSiteUrl()}/join?token=${data.token}`
    const roleLabel = role === 'admin' ? 'administrateur' : 'collaborateur'
    const sent = await sendResendEmail({
      to: email.trim().toLowerCase(),
      subject: 'Invitation — Plan Growth',
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;color:#B8922A;font-weight:700">PLAN GROWTH</p>
          <h1 style="margin:0 0 16px;font-size:22px;color:#0A0A0A">Vous êtes invité dans une équipe</h1>
          <p style="font-size:14px;color:#444;line-height:1.6;margin:0 0 24px">
            On vous invite en tant que <strong>${escapeHtml(roleLabel)}</strong>.
            Cliquez le bouton, puis connectez-vous avec <strong>${escapeHtml(email.trim().toLowerCase())}</strong>.
          </p>
          <a href="${joinUrl}" style="display:inline-block;background:#D4960C;color:#0A0A0A;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">
            Rejoindre l'équipe
          </a>
          <p style="font-size:12px;color:#888;margin-top:24px;line-height:1.5">
            Si le bouton ne fonctionne pas, copiez ce lien :<br/>${escapeHtml(joinUrl)}
          </p>
        </div>
      `,
    })
    if (!sent.ok) console.error('[invitations] courriel', sent.error)

    return NextResponse.json({
      ...data,
      join_url: joinUrl,
      email_sent: sent.ok,
      email_error: sent.ok ? null : sent.error,
    }, { status: 201 })
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

    const { supabase, companyId } = await requireCompanyAdmin()

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
