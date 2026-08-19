import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin, apiError } from '@/lib/api/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    await requirePlatformAdmin()
    const body = await req.json()
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

    // 2. S'assurer que le profil existe
    await admin.from('profiles').upsert({
      id: userId,
      full_name: 'Natasha Heon',
      role: 'owner',
    }, { onConflict: 'id' })

    return NextResponse.json({
      success: true,
      email,
      password,
      login_url: 'https://app.growth-plan.ca/login',
      message: `Compte administrateur configuré pour ${email}`,
    })
  } catch (err) {
    return apiError(err, '[POST /api/admin/invite-founder]')
  }
}
