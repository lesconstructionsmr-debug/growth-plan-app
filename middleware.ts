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

  // Fail-closed : sans config Supabase, on BLOQUE l'accès aux pages protégées
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('[middleware] Env Supabase manquante — accès refusé (fail-closed)')
    return new NextResponse('Configuration serveur incomplète', { status: 503 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set(name, value)
          response = NextResponse.next({ request })
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set(name, '')
          response = NextResponse.next({ request })
          response.cookies.set(name, '', options)
        },
      },
    }
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch (err) {
    console.warn('[middleware] Jetons d\'authentification obsolètes/invalides — nettoyage session')
  }

  // Pas connecté ou jeton obsolète → /login avec nettoyage des jetons corrompus
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    const redirectResponse = NextResponse.redirect(loginUrl)
    request.cookies.getAll().forEach(c => {
      if (c.name.includes('sb-') || c.name.includes('auth-token')) {
        redirectResponse.cookies.delete(c.name)
      }
    })
    return redirectResponse
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
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('status, trial_end, current_period_end')
      .eq('company_id', profile.company_id)
      .limit(1)

    const sub = subs?.[0] ?? null
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
