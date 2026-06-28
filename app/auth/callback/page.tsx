'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const token_hash = params.get('token_hash')
    const type = params.get('type') as 'email' | 'signup' | 'magiclink' | 'recovery' | null
    const error = params.get('error')
    const error_description = params.get('error_description')
    const next = params.get('next') ?? '/dashboard'

    if (error) {
      router.replace(`/login?error=${encodeURIComponent(error_description || error)}`)
      return
    }

    if (token_hash && type) {
      supabase.auth.verifyOtp({ token_hash, type }).then(({ error }) => {
        if (error) {
          router.replace('/login?error=otp_failed')
        } else if (type === 'recovery') {
          router.replace('/forgot-password?step=reset')
        } else {
          router.replace(next)
        }
      })
      return
    }

    if (code) {
      console.log('[callback] cookies available:', document.cookie.split(';').map(c => c.trim().split('=')[0]))
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        console.log('[callback] exchange error:', error?.message)
        if (error) {
          router.replace(`/login?error=${encodeURIComponent(error.message)}`)
        } else {
          router.replace(next)
        }
      })
      return
    }

    router.replace('/login?error=no_code')
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
