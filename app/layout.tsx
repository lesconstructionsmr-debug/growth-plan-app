import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { LanguageProvider } from '@/components/layout/language-provider'

export const metadata: Metadata = {
  title: {
    default: 'Growth-Plan ERP — Gestion BTP & Agence',
    template: '%s | Growth-Plan ERP',
  },
  description:
    'Solution ERP complète de gestion de chantiers, devis, facturation, conformité CCQ/SEAO et acquisition pour entrepreneurs généralistes et agences au Québec.',
  keywords: [
    'ERP construction Québec',
    'devis BTP',
    'facturation chantier',
    'SEAO',
    'CCQ',
    'gestion de projets construction',
  ],
  authors: [{ name: 'Growth-Plan' }],
  metadataBase: new URL('https://app.growth-plan.ca'),
  openGraph: {
    type: 'website',
    locale: 'fr_CA',
    url: 'https://app.growth-plan.ca',
    siteName: 'Growth-Plan ERP',
    title: 'Growth-Plan ERP — Gestion BTP & Agence',
    description:
      'Solution ERP complète de gestion de chantiers, devis, facturation et conformité au Québec.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Growth-Plan ERP',
    description: 'Solution ERP complète de gestion de chantiers et devis au Québec.',
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Growth Plan ERP',
  },
  icons: {
    apple: '/icon-192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0c0e12',
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