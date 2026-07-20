import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/layout/theme-provider'

export const metadata: Metadata = {
  title: "Plangrowth — Architecte de l'Évolution Numérique | growth-plan.ca",
  description: "Structure • Acquisition • Scalabilité pour entrepreneurs et compagnies de services.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}