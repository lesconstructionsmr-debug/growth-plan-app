import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function AdhesionRedirectPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === 'string') {
      params.set(key, value)
    } else if (Array.isArray(value)) {
      value.forEach(v => params.append(key, v))
    }
  }
  const queryString = params.toString()
  redirect(`/onboarding${queryString ? `?${queryString}` : ''}`)
}
