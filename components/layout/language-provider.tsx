'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type Language = 'fr' | 'en'

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  toggleLang: () => void
  t: (key: string, defaultText?: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'fr',
  setLang: () => {},
  toggleLang: () => {},
  t: (key, defaultText) => defaultText || key,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('fr')

  useEffect(() => {
    const saved = localStorage.getItem('app_lang') as Language
    if (saved === 'fr' || saved === 'en') {
      setLangState(saved)
    }
  }, [])

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    localStorage.setItem('app_lang', newLang)
  }

  const toggleLang = () => {
    const next = lang === 'fr' ? 'en' : 'fr'
    setLang(next)
  }

  const t = (key: string, defaultText?: string): string => {
    if (lang === 'en' && translationsEn[key]) {
      return translationsEn[key]
    }
    return defaultText || translationsFr[key] || key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}

const translationsFr: Record<string, string> = {
  "Vue d'ensemble": "Vue d'ensemble",
  "Opérations": "Opérations",
  "Facturation": "Facturation",
  "Rapports": "Rapports",
  "Admin SaaS": "Admin SaaS",
  "Dashboard": "Dashboard",
  "Acquisition": "Acquisition",
  "Contenu IA": "Contenu IA",
  "Leads / CRM": "Leads / CRM",
  "Chantiers": "Chantiers",
  "Calendrier": "Calendrier",
  "Clients": "Clients",
  "Employés": "Employés",
  "Sous-traitants": "Sous-traitants",
  "Devis": "Devis",
  "Offres": "Offres",
  "Factures": "Factures",
  "Dépenses": "Dépenses",
  "Marché": "Marché",
  "Paramètres": "Paramètres",
  "Abonnés": "Abonnés",
  "Dossiers Prêts": "Dossiers Prêts",
  "Prêteurs": "Prêteurs",
  "Emprunteurs": "Emprunteurs",
  "Commissions": "Commissions",
  "Déconnexion": "Déconnexion",
}

const translationsEn: Record<string, string> = {
  "Vue d'ensemble": "Overview",
  "Opérations": "Operations",
  "Facturation": "Billing",
  "Rapports": "Reports",
  "Admin SaaS": "SaaS Admin",
  "Dashboard": "Dashboard",
  "Acquisition": "Acquisition",
  "Contenu IA": "AI Content",
  "Leads / CRM": "Leads / CRM",
  "Chantiers": "Jobs & Projects",
  "Calendrier": "Calendar",
  "Clients": "Clients",
  "Employés": "Employees",
  "Sous-traitants": "Subcontractors",
  "Devis": "Estimates",
  "Offres": "Offers",
  "Factures": "Invoices",
  "Dépenses": "Expenses",
  "Marché": "Market Trends",
  "Paramètres": "Settings",
  "Abonnés": "Subscribers",
  "Dossiers Prêts": "Loan Files",
  "Prêteurs": "Lenders",
  "Emprunteurs": "Borrowers",
  "Commissions": "Commissions",
  "Déconnexion": "Sign Out",
  "MODE CHANTIERS": "CONSTRUCTION MODE",
  "MODE IMMOBILIER": "REAL ESTATE MODE",
}
