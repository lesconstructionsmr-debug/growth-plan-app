import { NextResponse } from 'next/server'
import { createClient } from '@/lib/api/supabase-server'
import { getSiteUrl } from '@/lib/auth/site-url'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', getSiteUrl()))
}
