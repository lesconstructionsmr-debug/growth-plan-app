import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'email' | 'signup' | 'magiclink' | 'recovery' | null
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error_description || error)}`
    )
  }

  const pendingCookies: { name: string; value: string; options?: CookieOptions }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          pendingCookies.push(...cookiesToSet)
        },
      },
    }
  )

  const applyTo = (response: NextResponse) => {
    pendingCookies.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options)
    )
    return response
  }

  if (token_hash && type) {
    const { error: otpError } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!otpError) {
      const redirectTo = type === 'recovery'
        ? `${origin}/forgot-password?step=reset`
        : `${origin}${next}`
      return applyTo(NextResponse.redirect(redirectTo))
    }
    return NextResponse.redirect(`${origin}/login?error=otp_failed`)
  }

  if (code) {
    const { error: codeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!codeError) {
      return applyTo(NextResponse.redirect(`${origin}${next}`))
    }
    const msg = encodeURIComponent(codeError.message || 'code_exchange_failed')
    return NextResponse.redirect(`${origin}/login?error=${msg}`)
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`)
}