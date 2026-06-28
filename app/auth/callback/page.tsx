'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const params = new URLSearchParams(window.location.search)
    const token_hash = params.get('token_hash')
    const type = params.get('type') as 'email' | 'signup' | 'magiclink' | 'recovery' | null
    const next = params.get('next') ?? '/dashboard'
    const error = params.get('error')
    const error_description = params.get('error_description')

    if (error) {
      router.replace(`/login?error=${encodeURIComponent(error_description || error)}`)
      return
    }

    // OTP flows (email confirm, password reset)
    if (token_hash && type) {
      supabase.auth.verifyOtp({ token_hash, type }).then(({ error }) => {
        if (error) router.replace('/login?error=otp_failed')
        else if (type === 'recovery') router.replace('/forgot-password?step=reset')
        else router.replace(next)
      })
      return
    }

    // Implicit flow: tokens arrive in URL hash — Supabase detects them automatically
    // via detectSessionInUrl: true. We just wait for onAuthStateChange.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        subscription.unsubscribe()
        router.replace(next)
      } else if (event === 'SIGNED_OUT') {
        subscription.unsubscribe()
        router.replace('/login?error=auth_failed')
      }
    })

    // Fallback: if no auth event after 8s, redirect to login
    const timeout = setTimeout(() => {
      subscription.unsubscribe()
      router.replace('/login?error=auth_timeout')
    }, 8000)

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [router])

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <p style={{ color: 'var(--txt-3)', fontSize: '13px' }}>Connexion en cours…</p>
    </div>
  )
}
