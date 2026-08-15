import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

type EmailOtpType = 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email'

function publicOrigin(request: Request) {
  const url = new URL(request.url)
  const host = request.headers.get('x-forwarded-host') || url.host
  const proto = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '') || 'https'
  return `${proto}://${host}`
}

function safeNext(path: string | null) {
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    return '/dashboard'
  }
  return path
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const origin = publicOrigin(request)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = safeNext(searchParams.get('next'))
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  const cookieStore = cookies()
  const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookiesToSet.push({ name, value, options })
        },
        remove(name: string, options: CookieOptions) {
          cookiesToSet.push({ name, value: '', options })
        },
      },
    }
  )

  let authError: string | null = null

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) authError = exchangeError.message
  } else if (token_hash && type) {
    const { error: otpError } = await supabase.auth.verifyOtp({ token_hash, type })
    if (otpError) authError = otpError.message
  } else {
    authError = 'Lien de confirmation invalide ou expiré.'
  }

  if (authError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(authError)}`
    )
  }

  const dest = type === 'recovery' ? '/forgot-password?step=reset' : next
  const response = NextResponse.redirect(`${origin}${dest}`)
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })
  return response
}
