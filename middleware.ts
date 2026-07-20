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

  // Headers de sécurité
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  const host = request.headers.get('host') || request.nextUrl.hostname

  // Sur app.growth-plan.ca, la racine '/' va TOUJOURS vers l'ERP (/dashboard -> /login si non connecté)
  if (host.startsWith('app.') && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Laisser passer immédiatement les routes publiques et API (ex: growth-plan.ca principal)
  if (
    pathname === '/' ||
    pathname === '/landing' ||
    PUBLIC_PATHS.some(p => p !== '/' && pathname.startsWith(p)) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/portal/') ||
    pathname.startsWith('/auth/')
  ) {
    return response
  }

  // Fail-closed : sans config Supabase
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
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
    console.warn('[middleware] Auth token warning handled cleanly')
  }

  // Pas connecté ou jeton obsolète → /login
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

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
