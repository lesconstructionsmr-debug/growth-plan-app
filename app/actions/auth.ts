'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

function makeSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

export async function signUp(formData: FormData) {
  const email       = formData.get('email') as string
  const password    = formData.get('password') as string
  const fullName    = formData.get('full_name') as string
  const companyName = formData.get('company_name') as string
  const telephone   = formData.get('telephone') as string
  const ville       = formData.get('ville') as string
  const vertical    = formData.get('vertical') as string
  const teamSize    = formData.get('team_size') as string

  const supabase = makeSupabase()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, company_name: companyName, telephone, ville, vertical, team_size: teamSize },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://app.growth-plan.ca'}/auth/callback`,
    },
  })

  if (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/onboarding/confirmation')
}

export async function signIn(formData: FormData) {
  const email    = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = makeSupabase()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    let msg = 'Email ou mot de passe incorrect.'
    if (error.message.toLowerCase().includes('email not confirmed')) {
      msg = 'Courriel non confirme - verifiez votre boite de reception.'
    }
    redirect(`/login?error=${encodeURIComponent(msg)}`)
  }

  redirect('/dashboard')
}
