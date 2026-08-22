import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePlatformAdmin, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  return handleProvision(req)
}

export async function POST(req: NextRequest) {
  return handleProvision(req)
}

async function handleProvision(req: NextRequest) {
  try {
    await requirePlatformAdmin()
    const admin = createAdminClient()
    const url = new URL(req.url)
    const email = (url.searchParams.get('email') || 'natasha.heon@gmail.com').trim().toLowerCase()
    const password = url.searchParams.get('password') || 'Growth2026!'

    // 1. Récupérer l'organisation principale
    const { data: companies } = await admin
      .from('companies')
      .select('id, name')
      .limit(1)

    const targetCompany = companies?.[0]
    if (!targetCompany) {
      return NextResponse.json({ error: 'Aucune organisation trouvée' }, { status: 404 })
    }

    // 2. Créer ou mettre à jour l'utilisateur Supabase Auth avec le mot de passe et email_confirm: true
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

    // 3. Rattaché directement au profil de la compagnie
    await admin.from('profiles').upsert({
      id: userId,
      company_id: targetCompany.id,
      full_name: 'Natasha Heon',
      role: 'owner',
    }, { onConflict: 'id' })

    // 4. Générer aussi une invitation d'équipe formelle au cas où
    let joinUrl = ''
    const { data: existingInv } = await admin
      .from('invitations')
      .select('token')
      .eq('email', email)
      .maybeSingle()

    if (existingInv?.token) {
      joinUrl = `https://app.growth-plan.ca/join?token=${existingInv.token}`
    } else {
      const { data: newInv } = await admin
        .from('invitations')
        .insert({
          company_id: targetCompany.id,
          email,
          role: 'owner',
        })
        .select('token')
        .maybeSingle()
      if (newInv?.token) {
        joinUrl = `https://app.growth-plan.ca/join?token=${newInv.token}`
      }
    }

    return NextResponse.json({
      success: true,
      email,
      password,
      company_name: targetCompany.name,
      company_id: targetCompany.id,
      login_url: 'https://app.growth-plan.ca/login',
      join_url: joinUrl,
      message: `Compte Natasha configuré, mot de passe ${password} appliqué et rattaché à ${targetCompany.name}`,
    })
  } catch (err) {
    console.error('[invite-founder error]', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Erreur activation',
    }, { status: 500 })
  }
}
