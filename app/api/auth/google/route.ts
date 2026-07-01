import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const cookieStore = cookies()
  const { origin } = new URL(request.url)

  // Collect cookies set during OAuth init so we can attach them to the redirect response
  const cookiesSet: { name: string; value: string; options?: CookieOptions }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options?: CookieOptions) {
          cookiesSet.push({ name, value, options })
        },
        remove(name: string, options?: CookieOptions) {
          cookiesSet.push({ name, value: '', options })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/login?error=oauth_init_failed`)
  }

  // Attach PKCE cookies directly on the redirect response
  const response = NextResponse.redirect(data.url)
  cookiesSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options ?? {})
  })

  return response
}
