import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import LandingPage from '@/app/(public)/landing/page'

export const dynamic = 'force-dynamic'

export default async function RootPage() {
  const headersList = headers()
  const host = headersList.get('host') || ''

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Si l'utilisateur est déjà connecté -> aller directement au Dashboard ERP
    if (user) {
      redirect('/dashboard')
    }

    // 2. Si le domaine est app.growth-plan.ca (sous-domaine ERP) -> aller à l'écran de connexion ERP
    if (host.startsWith('app.')) {
      redirect('/login')
    }
  } catch (err) {
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) {
      throw err
    }
  }

  // 3. Sur le domaine principal (growth-plan.ca) -> afficher la Landing Page d'acquisition Plangrowth
  return <LandingPage />
}
