import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { canAccessControlCenter, canUseAgenceMode } from '@/lib/platform-admin'
import { canAccessRoute } from '@/lib/auth/permissions'

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/politique-confidentialite',
  '/conditions-utilisation',
  '/support',
  '/tarifs',
  '/join',
  '/onboarding',
  '/adhesion',
]

const PUBLIC_API_PREFIXES = [
  '/api/auth/',
  '/api/public/',
  '/api/contact/',
  '/api/portal/',
  '/api/join',
  '/api/onboarding',
  '/api/stripe/webhook',
  '/api/cron/',
  '/api/webhook',
  '/api/webhooks',
]

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return res
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = applySecurityHeaders(NextResponse.next({ request }))

  const host = (
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    request.nextUrl.hostname ||
    ''
  ).toLowerCase()

  // Sur app.growth-plan.ca, la racine '/' va TOUJOURS vers l'ERP (/dashboard -> /login si non connecté)
  if ((host.startsWith('app.') || host.includes('app.growth-plan')) && pathname === '/') {
    return applySecurityHeaders(NextResponse.redirect(new URL('/dashboard', request.url)))
  }

  const isPublicApi = PUBLIC_API_PREFIXES.some(prefix => {
    const cleanPrefix = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix
    return pathname === cleanPrefix || pathname.startsWith(cleanPrefix + '/')
  })

  const isPublicNonApiPath =
    pathname === '/' ||
    pathname === '/landing' ||
    PUBLIC_PATHS.some(p => p !== '/' && (pathname === p || pathname.startsWith(p + '/'))) ||
    pathname.startsWith('/portal/') ||
    pathname.startsWith('/auth/')

  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  // Si pas de config Supabase et qu'on est sur une route publique -> servir la page publique sans bloquer
  if (!hasSupabaseConfig) {
    if (isPublicNonApiPath || isPublicApi) {
      return response
    }
    // Fail-closed pour les routes protégées ERP sans config Supabase
    return applySecurityHeaders(new NextResponse('Configuration serveur incomplète', { status: 503 }))
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set(name, value)
          response = NextResponse.next({ request })
          applySecurityHeaders(response)
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set(name, '')
          response = NextResponse.next({ request })
          applySecurityHeaders(response)
          response.cookies.set(name, '', options)
        },
      },
    }
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch {
    console.warn('[middleware] Auth token warning handled cleanly')
  }

  // Traitement si utilisateur non connecté
  if (!user) {
    if (pathname.startsWith('/api/')) {
      if (!isPublicApi) {
        return applySecurityHeaders(NextResponse.json({ error: 'Non autorisé' }, { status: 401 }))
      }
      return response
    }

    if (isPublicNonApiPath) {
      return response
    }

    const loginUrl = new URL('/login', request.url)
    const redirectResponse = applySecurityHeaders(NextResponse.redirect(loginUrl))
    request.cookies.getAll().forEach(c => {
      if (c.name.includes('sb-') || c.name.includes('auth-token')) {
        redirectResponse.cookies.delete(c.name)
      }
    })
    return redirectResponse
  }

  // Traitement si utilisateur connecté
  // Verification accès admin pour routes HTML /admin et routes API /api/admin/
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
  if (isAdminRoute) {
    if (!canAccessControlCenter(user.email)) {
      if (pathname.startsWith('/api/')) {
        return applySecurityHeaders(
          NextResponse.json({ error: 'Accès refusé - Droits administrateur requis' }, { status: 403 })
        )
      }
      return applySecurityHeaders(
        NextResponse.redirect(new URL('/dashboard?error=admin_forbidden', request.url))
      )
    }
  }

  // Pour les requêtes API (hors /api/admin déjà vérifié ci-dessus), on autorise le passage
  if (pathname.startsWith('/api/')) {
    return response
  }

  // RBAC Phase 2 — page-level RBAC route checks
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role ?? 'owner'

  let vertical: string | undefined
  if (profile?.company_id) {
    const { data: company } = await supabase
      .from('companies')
      .select('vertical')
      .eq('id', profile.company_id)
      .maybeSingle()
    vertical = canUseAgenceMode(user.email) ? (company?.vertical ?? undefined) : 'construction'
  }

  const agencePaths = ['/dossiers', '/preteurs', '/commissions']
  if (!canUseAgenceMode(user.email) && agencePaths.some(p => pathname === p || pathname.startsWith(`${p}/`))) {
    return applySecurityHeaders(NextResponse.redirect(new URL('/dashboard', request.url)))
  }

  const collabHome = (vertical === 'agence' || vertical === 'courtier') ? '/dossiers' : '/jobs'

  if (!canAccessRoute(role, pathname, vertical)) {
    const dest = new URL(collabHome, request.url)
    dest.searchParams.set('error', 'access_denied')
    return applySecurityHeaders(NextResponse.redirect(dest))
  }

  // Employés : /dashboard → accueil collab (canAccessRoute ci-dessus couvre déjà ce cas)
  if (pathname === '/dashboard' && !canAccessRoute(role, '/dashboard', vertical)) {
    return applySecurityHeaders(NextResponse.redirect(new URL(collabHome, request.url)))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
