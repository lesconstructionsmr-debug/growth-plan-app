import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, apiError } from '@/lib/api/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { companyId } = await requireCompany()
    const body = await req.json().catch(() => ({}))
    const email = (body.email || 'natasha.heon@gmail.com').trim().toLowerCase()
    const password = body.password || 'Growth2026!'

    const admin = createAdminClient()

    // 1. Chercher si l'utilisateur existe déjà
    const { data: listData } = await admin.auth.admin.listUsers()
    const existing = listData?.users?.find(u => u.email?.toLowerCase() === email)

    let userId: string

    if (existing) {
      userId = existing.id
      const { error: updateErr } = await admin.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
      })
      if (updateErr) throw updateErr
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Natasha Heon' },
      })
      if (createErr) throw createErr
      userId = created.user.id
    }

    // 2. Associer son profil à la MÊME COMPAGNIE que vous avec rôle administrateur/propriétaire
    await admin.from('profiles').upsert({
      id: userId,
      company_id: companyId,
      full_name: 'Natasha Heon',
      role: 'owner',
    }, { onConflict: 'id' })

    return NextResponse.json({
      success: true,
      email,
      password,
      company_id: companyId,
      login_url: 'https://app.growth-plan.ca/login',
      message: `Compte Natasha configuré et rattaché à votre compte entreprise (company_id: ${companyId})`,
    })
  } catch (err) {
    return apiError(err, '[POST /api/admin/invite-founder]')
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}
