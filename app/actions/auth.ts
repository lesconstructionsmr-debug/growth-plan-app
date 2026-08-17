'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getAuthCallbackUrl, isDuplicateSignup } from '@/lib/auth/site-url'
import { sendSignupConfirmationEmail, sendPasswordResetEmail } from '@/lib/email/signup-confirmation'

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
  const email       = (formData.get('email') as string)?.trim()
  const password    = formData.get('password') as string
  const fullName    = formData.get('full_name') as string
  const companyName = formData.get('company_name') as string
  const telephone   = formData.get('telephone') as string
  const ville       = formData.get('ville') as string
  const vertical    = formData.get('vertical') as string
  const teamSize    = formData.get('team_size') as string

  const supabase = makeSupabase()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, company_name: companyName, telephone, ville, vertical, team_size: teamSize },
      emailRedirectTo: getAuthCallbackUrl(),
    },
  })

  if (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`)
  }

  if (isDuplicateSignup(data.user)) {
    redirect(`/onboarding?error=${encodeURIComponent(
      'Un compte existe déjà pour ce courriel. Connectez-vous ou réinitialisez votre mot de passe.'
    )}`)
  }

  // Confirm email désactivé côté Supabase → session immédiate
  if (data.session) {
    redirect('/dashboard')
  }

  const sent = await sendSignupConfirmationEmail(email)
  if (!sent.ok) {
    console.error('[signUp] confirmation email', sent.error)
    redirect(`/onboarding/confirmation?email=${encodeURIComponent(email)}&sent=0`)
  }

  redirect(`/onboarding/confirmation?email=${encodeURIComponent(email)}`)
}

export async function signIn(formData: FormData) {
  const email    = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = makeSupabase()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  const next = String(formData.get('next') || '')
  const nextQs = next.startsWith('/') && !next.startsWith('//')
    ? `&next=${encodeURIComponent(next)}`
    : ''

  if (error) {
    let msg = 'Email ou mot de passe incorrect.'
    if (error.message.toLowerCase().includes('email not confirmed')) {
      msg = 'Courriel non confirmé — vérifiez votre boîte de réception.'
    }
    redirect(`/login?error=${encodeURIComponent(msg)}${nextQs}`)
  }

  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
  redirect(safeNext)
}

export async function resendConfirmation(email: string) {
  const sent = await sendSignupConfirmationEmail(email)
  if (!sent.ok) return { error: sent.error }
  return { ok: true as const }
}

export async function sendResetPasswordEmail(email: string) {
  const sent = await sendPasswordResetEmail(email)
  if (!sent.ok) return { error: sent.error }
  return { ok: true as const }
}
