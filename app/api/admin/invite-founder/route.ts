import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  return handleProvision(req)
}

export async function POST(req: NextRequest) {
  return handleProvision(req)
}

async function handleProvision(req: NextRequest) {
  try {
    const admin = createAdminClient()
    const url = new URL(req.url)
    const email = (url.searchParams.get('email') || 'natasha.heon@gmail.com').trim().toLowerCase()
    const password = url.searchParams.get('password') || 'Growth2026!'

    // 1. Récupérer la compagnie principale (celle du fondateur Max)
    const { data: companies } = await admin
      .from('companies')
      .select('id')
      .limit(1)

    const targetCompanyId = companies?.[0]?.id ?? null

    // 2. Chercher si l'utilisateur existe déjà dans auth.users
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

    // 3. Activer son profil et le lier à la compagnie
    await admin.from('profiles').upsert({
      id: userId,
      company_id: targetCompanyId,
      full_name: 'Natasha Heon',
      role: 'owner',
    }, { onConflict: 'id' })

    return NextResponse.json({
      success: true,
      email,
      password,
      company_id: targetCompanyId,
      login_url: 'https://app.growth-plan.ca/login',
      message: `Compte ${email} activé avec le mot de passe ${password} et rattaché à la compagnie ${targetCompanyId}`,
    })
  } catch (err) {
    console.error('[invite-founder error]', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Erreur activation',
    }, { status: 500 })
  }
}
