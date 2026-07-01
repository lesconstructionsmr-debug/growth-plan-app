'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function signIn(_prevState: { error: string } | null, formData: FormData) {
  const email    = formData.get('email') as string
  const password = formData.get('password') as string

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()                { return cookieStore.getAll() },
        setAll(cookiesToSet)    {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { error: 'Courriel non confirme - verifiez votre boite de reception.' }
    }
    if (error.message.toLowerCase().includes('invalid login')) {
      return { error: 'Email ou mot de passe incorrect.' }
    }
    return { error: `Erreur: ${error.message}` }
  }

  redirect('/dashboard')
}
