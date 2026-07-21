import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { LanguageProvider } from '@/components/layout/language-provider'

export const metadata: Metadata = {
  title: "Growth Plan ERP — Solution Gestion Construction & Peinture | app.growth-plan.ca",
  description: "ERP & CRM pour entrepreneurs au Québec. Devis 24h, facturation, suivi de chantiers et relances automatiques.",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Growth Plan ERP',
  },
  icons: {
    apple: '/icon-192.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <ThemeProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}