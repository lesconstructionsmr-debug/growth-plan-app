import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import LandingPage from '@/app/(public)/landing/page'

export const dynamic = 'force-dynamic'

export default async function RootPage() {
  const headersList = headers()
  const host = (
    headersList.get('x-forwarded-host') ||
    headersList.get('host') ||
    ''
  ).toLowerCase()

  // 1. SUR LE SOUS-DOMAINE APP (app.growth-plan.ca) -> TOUJOURS L'ERP (/dashboard ou /login)
  if (host.startsWith('app.') || host.includes('app.growth-plan')) {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        redirect('/dashboard')
      }
    } catch (err) {
      if ((err as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) {
        throw err
      }
    }
    // Si non connecté ou sans session -> Écran de connexion ERP (/login)
    redirect('/login')
  }

  // 2. SUR LE DOMAINE PRINCIPAL (growth-plan.ca)
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      redirect('/dashboard')
    }
  } catch (err) {
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) {
      throw err
    }
  }

  // Si visiteur non connecté sur growth-plan.ca -> Landing Page Marketing
  return <LandingPage />
}
