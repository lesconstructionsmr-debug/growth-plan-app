import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LandingPage from '@/app/(public)/landing/page'

export const dynamic = 'force-dynamic'

export default async function RootPage() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Si l'utilisateur est déjà connecté, rediriger immédiatement vers l'ERP (/dashboard)
    if (user) {
      redirect('/dashboard')
    }
  } catch (err) {
    // Si la redirection a été déclenchée, la laisser passer
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) {
      throw err
    }
    // Sinon, afficher la landing page
  }

  // Pour les visiteurs non connectés, afficher la Landing Page d'acquisition
  return <LandingPage />
}
