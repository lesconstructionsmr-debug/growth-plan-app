import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/login', '/register', '/forgot-password',
  '/politique-confidentialite', '/conditions-utilisation',
  '/support', '/tarifs', '/join', '/onboarding',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Laisser passer les routes publiques et API
  if (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/portal/') ||
    pathname.startsWith('/auth/')
  ) {
    return response
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Pas connecté → /login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Récupérer le profil (company_id)
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id && pathname !== '/onboarding') {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Vérifier l'abonnement actif
  if (profile?.company_id) {
    const now = new Date().toISOString()
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status, trial_end, current_period_end')
      .eq('company_id', profile.company_id)
      .in('status', ['trialing', 'active', 'past_due'])
      .single()

    const hasAccess =
      sub?.status === 'active' ||
      sub?.status === 'past_due' ||
      (sub?.status === 'trialing' && sub?.trial_end && sub.trial_end > now)

    if (!hasAccess && pathname !== '/tarifs') {
      return NextResponse.redirect(new URL('/tarifs?expire=1', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
