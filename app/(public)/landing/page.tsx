'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Calculator,
  Zap,
  BarChart3,
  FileText,
  Smartphone,
  Wrench,
  Send,
  X,
  Crown,
  Target,
  Calendar,
  CreditCard,
  FolderOpen,
  HardHat,
  UserCog,
  Loader2,
  Plug,
  Megaphone,
  ScanText,
  LineChart,
  Lock,
  Globe,
} from 'lucide-react'
import {
  SETUP_FEE_CAD,
  PRICING_BASE_MONTHLY_CAD,
  PRICING_TIERS,
  formatPriceCad,
} from '@/lib/stripe/pricing'
import { landingTranslations, Language } from '@/lib/i18n/landing-translations'

// Icone de Logo 3D Or Plangrowth (Barres + Flèche Ascendante + Courbe G)
const PlangrowthGoldLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="plangrowthGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF2B2" />
        <stop offset="25%" stopColor="#F5D061" />
        <stop offset="60%" stopColor="#D4AF37" />
        <stop offset="85%" stopColor="#996D1D" />
        <stop offset="100%" stopColor="#5E430F" />
      </linearGradient>
      <linearGradient id="plangrowthGoldDark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E2B044" />
        <stop offset="100%" stopColor="#7A5600" />
      </linearGradient>
      <filter id="goldGlowEffect" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#D4AF37" floodOpacity="0.4" />
      </filter>
    </defs>
    <g filter="url(#goldGlowEffect)">
      {/* Barres de croissance */}
      <rect x="24" y="52" width="10" height="34" rx="2" fill="url(#plangrowthGold)" />
      <rect x="40" y="40" width="10" height="46" rx="2" fill="url(#plangrowthGold)" />
      <rect x="56" y="28" width="10" height="58" rx="2" fill="url(#plangrowthGold)" />
      {/* Flèche dynamique ascendante */}
      <path d="M16 88 C26 72 42 52 70 32 L62 25 L98 16 L89 52 L81 44 C56 61 40 76 28 95 Z" fill="url(#plangrowthGold)" />
      {/* Boucle G dorée */}
      <path d="M48 74 C48 66 60 63 76 63 C90 63 98 70 98 81 C98 92 84 97 66 97 C50 97 40 92 40 85 L54 85 C54 88 59 90 66 90 C75 90 82 86 82 81 C82 76 75 72 66 72 C57 72 48 73 48 74 Z" fill="url(#plangrowthGoldDark)" />
    </g>
  </svg>
)

export default function LandingPage() {
  // Language State
  const [lang, setLang] = useState<Language>('fr')

  useEffect(() => {
    const saved = localStorage.getItem('plangrowth_lang') as Language
    if (saved === 'fr' || saved === 'en') {
      setLang(saved)
    }
  }, [])

  const changeLanguage = (newLang: Language) => {
    setLang(newLang)
    localStorage.setItem('plangrowth_lang', newLang)
  }

  const t = landingTranslations[lang]

  // ROI Calculator State
  const [quotesPerMonth, setQuotesPerMonth] = useState<number>(15)
  const [avgProjectValue, setAvgProjectValue] = useState<number>(18000)
  const [currentWinRate, setCurrentWinRate] = useState<number>(25)

  // Demo Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false)
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    trade: t.modal.tradeOptions[0],
  })

  useEffect(() => {
    setFormData(prev => ({ ...prev, trade: t.modal.tradeOptions[0] }))
  }, [lang, t.modal.tradeOptions])

  // ROI Calculations
  const newWinRate = Math.min(80, currentWinRate + 5)
  const currentMonthlyRevenue = (quotesPerMonth * (currentWinRate / 100)) * avgProjectValue
  const projectedMonthlyRevenue = (quotesPerMonth * (newWinRate / 100)) * avgProjectValue
  const monthlyGain = Math.round(projectedMonthlyRevenue - currentMonthlyRevenue)
  const yearlyGain = monthlyGain * 12
  const hoursSavedPerWeek = Math.round(quotesPerMonth * 0.4 + 2)

  const formatMoney = (val: number) => {
    if (lang === 'en') {
      return '$' + val.toLocaleString('en-US')
    }
    return val.toLocaleString('fr-CA') + ' $'
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitting(true)
    setFormError(null)
    try {
      const res = await fetch('/api/contact/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          quotes_per_month: quotesPerMonth,
          avg_project_value: avgProjectValue,
          language: lang,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error || t.modal.errorGeneric)
        return
      }
      setFormSubmitted(true)
      setTimeout(() => {
        const query = new URLSearchParams({
          nom: formData.name,
          company: formData.company,
          email: formData.email,
          phone: formData.phone,
        }).toString()
        window.location.href = `/onboarding?${query}`
      }, 1800)
    } catch {
      setFormError(t.modal.errorGeneric)
    } finally {
      setFormSubmitting(false)
    }
  }

  const moduleIcons = [
    FileText,
    Zap,
    Users,
    Smartphone,
    DollarSign,
    ShieldCheck,
    FolderOpen,
    HardHat,
    UserCog,
    BarChart3,
    ScanText,
    LineChart,
    Lock,
    Megaphone,
  ]

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-slate-100 selection:bg-amber-400 selection:text-slate-950 font-sans antialiased overflow-x-hidden">
      
      {/* BACKGROUND DECORATION BRANDING AMBIENT */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-amber-500/15 via-yellow-600/5 to-transparent blur-3xl rounded-full opacity-70"></div>
        <div className="absolute top-[35%] -right-[250px] w-[700px] h-[700px] bg-amber-500/10 blur-3xl rounded-full"></div>
        <div className="absolute top-[65%] -left-[250px] w-[700px] h-[700px] bg-amber-400/5 blur-3xl rounded-full"></div>
      </div>

      {/* HEADER / BRANDING NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#0A0B0E]/90 border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          
          {/* BRAND SIGNATURE LOGO */}
          <Link href="/" className="flex items-center space-x-3.5 group shrink-0">
            <PlangrowthGoldLogo className="w-12 h-12 transform group-hover:scale-105 transition-transform duration-300" />
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FFF2B2] via-[#F5D061] to-[#D4AF37] drop-shadow-md">
                Plangrowth
              </span>
              <span className="text-[10px] text-amber-300/80 font-mono tracking-widest uppercase -mt-0.5">
                {t.vision.subtitle}
              </span>
            </div>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden xl:flex items-center space-x-6 text-xs font-bold uppercase tracking-wider text-slate-300">
            <a href="#roi-calculator" className="hover:text-amber-400 transition-colors">{t.nav.roiCalculator}</a>
            <a href="#piliers" className="hover:text-amber-400 transition-colors">{t.nav.pillars}</a>
            <a href="#modules" className="hover:text-amber-400 transition-colors">{t.nav.features}</a>
            <a href="#quebec" className="hover:text-amber-400 transition-colors">{t.nav.quebec}</a>
            <a href="#acquisition" className="hover:text-amber-400 transition-colors">{t.nav.acquisition}</a>
            <a href="#signature" className="hover:text-amber-400 transition-colors">{t.nav.vision}</a>
            <Link href="/tarifs" className="hover:text-amber-400 transition-colors">{t.nav.pricing}</Link>
          </nav>

          {/* CTA, LANGUAGE & ACCÈS ERP */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* LANGUAGE SWITCHER */}
            <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1">
              <button
                onClick={() => changeLanguage('fr')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1 ${
                  lang === 'fr'
                    ? 'bg-gradient-to-r from-[#F5D061] via-[#D4AF37] to-[#996D1D] text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Passer en Français"
              >
                FR
              </button>
              <button
                onClick={() => changeLanguage('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1 ${
                  lang === 'en'
                    ? 'bg-gradient-to-r from-[#F5D061] via-[#D4AF37] to-[#996D1D] text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Switch to English"
              >
                EN
              </button>
            </div>

            <Link
              href="/login"
              className="text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white px-3 sm:px-4 py-2.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all hidden sm:inline-block"
            >
              {t.nav.erpLogin}
            </Link>

            <button
              onClick={() => setIsModalOpen(true)}
              className="relative group p-[1px] rounded-xl overflow-hidden shadow-lg shadow-amber-500/20 focus:outline-none"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#F5D061] via-[#D4AF37] to-[#996D1D] rounded-xl group-hover:opacity-90 transition-opacity"></span>
              <span className="relative block px-3 sm:px-5 py-2.5 rounded-[11px] bg-[#0A0B0E] text-amber-300 font-bold text-xs uppercase tracking-wider transition-all group-hover:bg-transparent group-hover:text-slate-950">
                {t.nav.bookAudit}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-16 pb-20 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        
        {/* BRAND SLOGAN BADGE */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-widest mb-8 shadow-2xl backdrop-blur-xl">
          <Crown className="w-4 h-4 text-amber-400" />
          <span>{t.hero.sloganBadge}</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-5xl mx-auto">
          {t.hero.titlePart1}
          <span className="bg-gradient-to-r from-[#FFF2B2] via-[#F5D061] to-[#D4AF37] bg-clip-text text-transparent drop-shadow-lg">
            {t.hero.titleGold}
          </span>
          {t.hero.titlePart2}
        </h1>

        <p className="mt-8 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
          {t.hero.subtitlePart1}
          <span className="text-amber-400 font-semibold">{t.hero.subtitleBrand}</span>
          {t.hero.subtitlePart2}
        </p>

        {/* CTA BUTTONS */}
        <div className="mt-10 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 max-w-3xl mx-auto">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#F5D061] via-[#D4AF37] to-[#996D1D] text-slate-950 font-black text-sm uppercase tracking-wider shadow-2xl shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <span>{t.hero.ctaRegister}</span>
            <ArrowRight className="w-5 h-5 text-slate-950" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-amber-500/30 font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>{t.hero.ctaAudit}</span>
          </button>
          <a
            href="#roi-calculator"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-amber-500/30 font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <Calculator className="w-5 h-5 text-amber-400" />
            <span>{t.hero.ctaRoi}</span>
          </a>
        </div>

        {/* FOUNDER SIGNATURE BADGE */}
        <div className="mt-10 inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 text-xs">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></div>
          <span>{t.hero.founderBadge}<strong className="text-slate-200">{t.hero.founderName}</strong></span>
        </div>

        {/* TRUST BADGES */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-8 text-slate-400 text-xs font-semibold uppercase tracking-wider">
          {t.hero.trustBadges.map((badge, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>{badge}</span>
            </div>
          ))}
        </div>

        {/* MOCKUP / DASHBOARD PREVIEW */}
        <div className="mt-14 relative mx-auto max-w-5xl rounded-2xl p-2 bg-gradient-to-b from-[#D4AF37]/30 via-slate-900 to-slate-950 shadow-2xl shadow-amber-500/15 border border-amber-500/30">
          <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 p-6 md:p-8">
            <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-3">
                <PlangrowthGoldLogo className="w-7 h-7" />
                <span className="text-xs text-amber-300 font-mono font-bold">{t.hero.dashboard.url}</span>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 font-mono border border-amber-500/20 font-bold">
                {t.hero.dashboard.liveTag}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>{t.hero.dashboard.card1Title}</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-black text-white">{t.hero.dashboard.card1Metric}</p>
                <p className="text-xs text-amber-400 mt-2 font-semibold">{t.hero.dashboard.card1Desc}</p>
              </div>

              <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>{t.hero.dashboard.card2Title}</span>
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-black text-white">{t.hero.dashboard.card2Metric}</p>
                <p className="text-xs text-slate-400 mt-2 font-medium">{t.hero.dashboard.card2Desc}</p>
              </div>

              <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>{t.hero.dashboard.card3Title}</span>
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-black text-white">{t.hero.dashboard.card3Metric}</p>
                <p className="text-xs text-amber-400 mt-2 font-semibold">{t.hero.dashboard.card3Desc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION FLUX OPÉRATIONNEL UNIFIÉ */}
      <section className="py-20 bg-slate-900/40 relative z-10 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-14">
            <span className="text-amber-400 font-mono text-xs uppercase tracking-widest font-bold">
              {t.flow.tag}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
              {t.flow.title}
            </h2>
            <p className="text-red-500 font-bold uppercase tracking-widest text-sm mt-2">
              {t.flow.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mt-16 relative">
            
            {/* Ligne de connexion décorative desktop */}
            <div className="hidden lg:block absolute top-[45px] left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-red-500/10 via-red-500/50 to-red-500/10 z-0"></div>

            {/* Étape 1 : CRM / Leads */}
            <div className="flex flex-col items-center text-center group z-10">
              <div className="w-[90px] h-[90px] rounded-full border-2 border-red-500 bg-slate-950 flex items-center justify-center text-red-500 group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-red-500/15">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-xs uppercase font-mono tracking-widest text-white mt-5 font-black">{t.flow.steps[0].title}</h3>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed max-w-[150px] mx-auto">
                {t.flow.steps[0].desc}
              </p>
            </div>

            {/* Étape 2 : Devis */}
            <div className="flex flex-col items-center text-center group z-10">
              <div className="w-[90px] h-[90px] rounded-full border-2 border-red-500 bg-slate-950 flex items-center justify-center text-red-500 group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-red-500/15">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-xs uppercase font-mono tracking-widest text-white mt-5 font-black">{t.flow.steps[1].title}</h3>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed max-w-[150px] mx-auto">
                {t.flow.steps[1].desc}
              </p>
            </div>

            {/* Étape 3 : Ventes */}
            <div className="flex flex-col items-center text-center group z-10">
              <div className="w-[90px] h-[90px] rounded-full border-2 border-red-500 bg-slate-950 flex items-center justify-center text-red-500 group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-red-500/15">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="text-xs uppercase font-mono tracking-widest text-white mt-5 font-black">{t.flow.steps[2].title}</h3>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed max-w-[150px] mx-auto">
                {t.flow.steps[2].desc}
              </p>
            </div>

            {/* Étape 4 : Planification */}
            <div className="flex flex-col items-center text-center group z-10">
              <div className="w-[90px] h-[90px] rounded-full border-2 border-red-500 bg-slate-950 flex items-center justify-center text-red-500 group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-red-500/15">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-xs uppercase font-mono tracking-widest text-white mt-5 font-black">{t.flow.steps[3].title}</h3>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed max-w-[150px] mx-auto">
                {t.flow.steps[3].desc}
              </p>
            </div>

            {/* Étape 5 : Opérations */}
            <div className="flex flex-col items-center text-center group z-10">
              <div className="w-[90px] h-[90px] rounded-full border-2 border-red-500 bg-slate-950 flex items-center justify-center text-red-500 group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-red-500/15">
                <Wrench className="w-8 h-8" />
              </div>
              <h3 className="text-xs uppercase font-mono tracking-widest text-white mt-5 font-black">{t.flow.steps[4].title}</h3>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed max-w-[150px] mx-auto">
                {t.flow.steps[4].desc}
              </p>
            </div>

            {/* Étape 6 : Paiements */}
            <div className="flex flex-col items-center text-center group z-10">
              <div className="w-[90px] h-[90px] rounded-full border-2 border-red-500 bg-slate-950 flex items-center justify-center text-red-500 group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-red-500/15">
                <CreditCard className="w-8 h-8" />
              </div>
              <h3 className="text-xs uppercase font-mono tracking-widest text-white mt-5 font-black">{t.flow.steps[5].title}</h3>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed max-w-[150px] mx-auto">
                {t.flow.steps[5].desc}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CALCULATEUR ROI INTERACTIF & RÉALISTE */}
      <section id="roi-calculator" className="py-20 bg-slate-950 border-y border-amber-500/20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-amber-400 font-mono text-xs uppercase tracking-widest font-bold">
              {t.roi.tag}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
              {t.roi.title}
            </h2>
            <p className="text-slate-400 mt-4 text-base">
              {t.roi.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-900/80 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
            {/* INPUT CONTROLS */}
            <div className="lg:col-span-7 space-y-8">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-semibold text-slate-200">{t.roi.labelQuotes}</label>
                  <span className="text-lg font-bold text-amber-400 font-mono bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                    {quotesPerMonth} {t.roi.unitQuotes}
                  </span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={50}
                  value={quotesPerMonth}
                  onChange={(e) => setQuotesPerMonth(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-semibold text-slate-200">{t.roi.labelProjectValue}</label>
                  <span className="text-lg font-bold text-amber-400 font-mono bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                    {formatMoney(avgProjectValue)}
                  </span>
                </div>
                <input
                  type="range"
                  min={2000}
                  max={100000}
                  step={1000}
                  value={avgProjectValue}
                  onChange={(e) => setAvgProjectValue(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-semibold text-slate-200">{t.roi.labelWinRate}</label>
                  <span className="text-lg font-bold text-amber-400 font-mono bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                    {currentWinRate} %
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={60}
                  step={5}
                  value={currentWinRate}
                  onChange={(e) => setCurrentWinRate(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            </div>

            {/* CALCULATED RESULT CARD */}
            <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 rounded-xl border border-amber-500/40 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/15 blur-3xl rounded-full"></div>
              
              <h3 className="text-xs uppercase font-mono tracking-widest text-slate-400">{t.roi.cardTag}</h3>
              
              <div className="mt-4">
                <span className="text-sm text-slate-400">{t.roi.cardYearlyLabel}</span>
                <p className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFF2B2] via-[#F5D061] to-[#D4AF37] font-mono tracking-tight mt-1">
                  +{formatMoney(yearlyGain)}
                </p>
                <p className="text-xs text-amber-300 font-medium mt-1">
                  {t.roi.cardMonthlyLabel}{formatMoney(monthlyGain)}{t.roi.cardMonthlySuffix}
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{t.roi.timeSavedLabel}</span>
                  <span className="text-white font-bold font-mono">{hoursSavedPerWeek} {t.roi.timeSavedUnit}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{t.roi.winRateGainLabel}</span>
                  <span className="text-amber-400 font-bold font-mono">+{newWinRate - currentWinRate}% ({currentWinRate}% → {newWinRate}%)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{t.roi.breakevenLabel}</span>
                  <span className="text-amber-300 font-bold font-mono">{t.roi.breakevenValue}</span>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full mt-6 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#F5D061] via-[#D4AF37] to-[#996D1D] text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <span>{t.roi.ctaButton}</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>

              <p className="text-[10px] text-slate-500 mt-3 text-center">
                {t.roi.disclaimer}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LES 3 PILIERS STRATÉGIQUES */}
      <section id="piliers" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-amber-400 font-mono text-xs uppercase tracking-widest font-bold">
            {t.pillars.tag}
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-3">
            {t.pillars.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* PILIER 1 */}
          <div className="bg-slate-900/90 p-8 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-all hover:-translate-y-1 group shadow-xl">
            <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
              <BarChart3 className="w-7 h-7" />
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">{t.pillars.items[0].tag}</span>
            <h3 className="text-xl font-bold text-white mt-2">{t.pillars.items[0].title}</h3>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              {t.pillars.items[0].desc}
            </p>
            <ul className="mt-6 space-y-2 text-xs text-slate-300">
              {t.pillars.items[0].bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* PILIER 2 */}
          <div className="bg-slate-900/90 p-8 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-all hover:-translate-y-1 group shadow-xl">
            <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
              <Sparkles className="w-7 h-7" />
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">{t.pillars.items[1].tag}</span>
            <h3 className="text-xl font-bold text-white mt-2">{t.pillars.items[1].title}</h3>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              {t.pillars.items[1].desc}
            </p>
            <ul className="mt-6 space-y-2 text-xs text-slate-300">
              {t.pillars.items[1].bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* PILIER 3 */}
          <div className="bg-slate-900/90 p-8 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-all hover:-translate-y-1 group shadow-xl">
            <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
              <Wrench className="w-7 h-7" />
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">{t.pillars.items[2].tag}</span>
            <h3 className="text-xl font-bold text-white mt-2">{t.pillars.items[2].title}</h3>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              {t.pillars.items[2].desc}
            </p>
            <ul className="mt-6 space-y-2 text-xs text-slate-300">
              {t.pillars.items[2].bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* BRAND VISION & SIGNATURE SECTION */}
      <section id="signature" className="py-20 bg-slate-950 border-t border-slate-800 relative z-10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full"></div>

            <PlangrowthGoldLogo className="w-20 h-20 mx-auto mb-6" />

            <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFF2B2] via-[#F5D061] to-[#D4AF37]">
              {t.vision.brand}
            </h2>
            <p className="text-amber-300 text-xs font-mono uppercase tracking-widest mt-1">
              {t.vision.subtitle}
            </p>
            <p className="text-slate-400 text-sm font-semibold tracking-wider uppercase mt-2">
              {t.vision.slogan}
            </p>

            <blockquote className="mt-8 text-slate-300 italic text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              {t.vision.quote}
            </blockquote>

            <div className="mt-8 pt-6 border-t border-slate-800/80 inline-block">
              <span className="text-xs text-slate-400">{t.vision.founderLabel}</span>
              <p className="text-base font-bold text-white tracking-wide">{t.vision.founderName}</p>
              <p className="text-xs text-amber-400 font-mono">growth-plan.ca</p>
            </div>
          </div>
        </div>
      </section>

      {/* MODULES DU PRODUIT */}
      <section id="modules" className="py-24 bg-slate-900/30 border-t border-slate-800 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-amber-400 font-mono text-xs uppercase tracking-widest font-bold">
              {t.modules.tag}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
              {t.modules.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {t.modules.items.map((mod, idx) => {
              const IconComponent = moduleIcons[idx] || FileText
              return (
                <div key={idx} className="p-6 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/30 transition-all">
                  <IconComponent className="w-8 h-8 text-amber-400 mb-4" />
                  <h4 className="text-lg font-bold text-white">{mod.title}</h4>
                  <p className="text-slate-400 text-sm mt-2">
                    {mod.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* DIFFÉRENCIATEURS QUÉBEC */}
      <section id="quebec" className="py-20 bg-slate-950 border-t border-slate-800 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-amber-400 font-mono text-xs uppercase tracking-widest font-bold">
              {t.quebec.tag}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
              {t.quebec.title}
            </h2>
            <p className="text-slate-400 mt-4 text-base">
              {t.quebec.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all">
              <FolderOpen className="w-10 h-10 text-amber-400 mb-4" />
              <h3 className="text-lg font-bold text-white">{t.quebec.card1Title}</h3>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                {t.quebec.card1Desc}
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all">
              <HardHat className="w-10 h-10 text-amber-400 mb-4" />
              <h3 className="text-lg font-bold text-white">{t.quebec.card2Title}</h3>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                {t.quebec.card2Bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all">
              <UserCog className="w-10 h-10 text-amber-400 mb-4" />
              <h3 className="text-lg font-bold text-white">{t.quebec.card3Title}</h3>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                {t.quebec.card3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ADHÉSION : SITE + PUBS → CRM */}
      <section id="acquisition" className="py-24 bg-slate-900/30 border-t border-slate-800 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-amber-400 font-mono text-xs uppercase tracking-widest font-bold">
              {t.acquisition.tag}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
              {t.acquisition.title}
            </h2>
            <p className="text-slate-400 mt-4 text-base leading-relaxed">
              {t.acquisition.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="p-8 rounded-2xl bg-slate-950 border border-amber-500/30">
              <Plug className="w-10 h-10 text-amber-400 mb-4" />
              <h3 className="text-lg font-bold text-white">{t.acquisition.cards[0].title}</h3>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                {t.acquisition.cards[0].desc}
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-slate-950 border border-amber-500/30">
              <Target className="w-10 h-10 text-amber-400 mb-4" />
              <h3 className="text-lg font-bold text-white">{t.acquisition.cards[1].title}</h3>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                {t.acquisition.cards[1].desc}
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-slate-950 border border-amber-500/30">
              <Megaphone className="w-10 h-10 text-amber-400 mb-4" />
              <h3 className="text-lg font-bold text-white">{t.acquisition.cards[2].title}</h3>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                {t.acquisition.cards[2].desc}
              </p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto p-6 sm:p-8 rounded-2xl bg-slate-950 border border-slate-800">
            <p className="text-sm font-semibold text-white mb-4">{t.acquisition.setupTitle}</p>
            <ol className="space-y-3 text-sm text-slate-300">
              {t.acquisition.steps.map((step, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="text-amber-400 font-mono font-bold shrink-0">{idx + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-slate-500 mt-5">
              {t.acquisition.disclaimer}
            </p>
          </div>
        </div>
      </section>

      {/* TARIFICATION TRANSPARENTE */}
      <section id="tarifs" className="py-24 bg-slate-950 border-t border-slate-800 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-amber-400 font-mono text-xs uppercase tracking-widest font-bold">
              {t.pricing.tag}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
              {t.pricing.title}
            </h2>
            <p className="text-slate-400 mt-4 text-sm">
              {t.pricing.subtitle}
            </p>
            <p className="text-slate-500 mt-2 text-xs">
              {t.pricing.userDef}
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-12 p-5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex gap-3 items-start mb-4">
              <Plug className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white">{t.pricing.setupFeeTitle}</p>
                <p className="text-xs text-slate-400 mt-1">{t.pricing.setupFeeLabel}</p>
              </div>
            </div>
            <ul className="space-y-2 text-xs text-slate-300 pl-8">
              {t.pricing.setupFeeIncludes.map(item => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
            {PRICING_TIERS.map((tier, idx) => {
              const tierTrans = t.pricing.tiers[idx] || {
                name: tier.name,
                subtitle: tier.subtitle,
                usersLabel: tier.usersLabel,
              }

              return (
                <div
                  key={tier.id}
                  className={`p-6 rounded-2xl flex flex-col justify-between ${
                    tier.popular
                      ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500 shadow-2xl shadow-amber-500/10 relative'
                      : 'bg-slate-900/90 border border-slate-800'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-[#F5D061] to-[#D4AF37] text-slate-950 font-black text-[10px] font-mono uppercase tracking-wider whitespace-nowrap">
                      {t.pricing.popularBadge}
                    </div>
                  )}

                  <div>
                    <span className={`text-xs font-mono font-bold uppercase ${tier.popular ? 'text-amber-400' : 'text-slate-400'}`}>
                      {tierTrans.name}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">{tierTrans.subtitle}</h3>

                    <div className="mt-5">
                      {tier.contactOnly ? (
                        <span className="text-2xl font-extrabold text-white font-mono">{t.pricing.contactOnlyText}</span>
                      ) : (
                        <>
                          <span className={`text-3xl font-extrabold font-mono ${tier.popular ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#FFF2B2] via-[#F5D061] to-[#D4AF37]' : 'text-white'}`}>
                            {lang === 'en' ? `$${tier.monthlyDisplayCad}` : `${formatPriceCad(tier.monthlyDisplayCad)} $`}
                          </span>
                          <span className="text-slate-400 text-sm"> {t.pricing.monthlySuffix}</span>
                          <p className="text-[10px] text-slate-500 mt-2">
                            {lang === 'en' ? `$${tier.annualTotalCad}` : `${formatPriceCad(tier.annualTotalCad)} $`} {t.pricing.annualSuffix}
                          </p>
                        </>
                      )}
                    </div>

                    <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{tierTrans.usersLabel}</span>
                      </li>
                      {t.pricing.bullets.map(item => (
                        <li key={item} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {tier.contactOnly ? (
                    <Link
                      href="/support"
                      className="w-full mt-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all text-center block"
                    >
                      {t.pricing.contactBtnText}
                    </Link>
                  ) : (
                    <Link
                      href="/tarifs"
                      className={`w-full mt-6 py-3 rounded-xl font-bold text-sm transition-all text-center block ${
                        tier.popular
                          ? 'bg-gradient-to-r from-[#F5D061] via-[#D4AF37] to-[#996D1D] text-slate-950 font-black uppercase tracking-wider shadow-lg shadow-amber-500/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      }`}
                    >
                      {t.pricing.trialBtnText}
                    </Link>
                  )}
                </div>
              )
            })}
          </div>

          <p className="text-center mt-10">
            <Link href="/tarifs" className="text-amber-400 hover:text-amber-300 text-sm font-semibold inline-flex items-center gap-2">
              {t.pricing.viewDetails}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </p>
        </div>
      </section>

      {/* FINAL CTA FOOTER BANNER */}
      <section className="py-20 bg-gradient-to-r from-[#F5D061] via-[#D4AF37] to-[#996D1D] text-slate-950 relative z-10 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            {t.ctaBanner.title}
          </h2>
          <p className="mt-4 text-base sm:text-lg font-bold text-slate-900 max-w-2xl mx-auto">
            {t.ctaBanner.subtitle}
          </p>
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-300 font-black text-sm uppercase tracking-wider shadow-2xl transition-all flex items-center gap-3"
            >
              <span>{t.ctaBanner.button}</span>
              <ArrowRight className="w-5 h-5 text-amber-300" />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER WITH BRAND SIGNATURE */}
      <footer className="py-12 bg-[#0A0B0E] border-t border-slate-900 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <PlangrowthGoldLogo className="w-8 h-8" />
            <div>
              <span className="font-bold text-slate-200 text-sm">Plangrowth</span>
              <p className="text-[10px] text-slate-500">
                {t.footer.tagline}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <Link href="/tarifs" className="hover:text-slate-300">{t.footer.tarifs}</Link>
            <Link href="/conditions-utilisation" className="hover:text-slate-300">{t.footer.terms}</Link>
            <Link href="/politique-confidentialite" className="hover:text-slate-300">{t.footer.privacy}</Link>
            <Link href="/support" className="hover:text-slate-300">{t.footer.support}</Link>
          </div>
        </div>
      </footer>

      {/* MODAL AUDIT & DEMO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0B0E]/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => { setIsModalOpen(false); setFormSubmitted(false); setFormError(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            {!formSubmitted ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <PlangrowthGoldLogo className="w-10 h-10" />
                  <div>
                    <h3 className="text-xl font-bold text-white">{t.modal.title}</h3>
                    <p className="text-xs text-amber-400 font-mono">{t.modal.subtitle}</p>
                  </div>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4 mt-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">{t.modal.labelName}</label>
                    <input
                      type="text"
                      required
                      placeholder={t.modal.placeholderName}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">{t.modal.labelCompany}</label>
                    <input
                      type="text"
                      required
                      placeholder={t.modal.placeholderCompany}
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">{t.modal.labelEmail}</label>
                      <input
                        type="email"
                        required
                        placeholder={t.modal.placeholderEmail}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">{t.modal.labelPhone}</label>
                      <input
                        type="tel"
                        required
                        placeholder={t.modal.placeholderPhone}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">{t.modal.labelTrade}</label>
                    <select
                      value={formData.trade}
                      onChange={(e) => setFormData({ ...formData, trade: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500 text-white"
                    >
                      {t.modal.tradeOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formError && (
                    <p className="text-xs text-red-400 text-center">{formError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="w-full mt-6 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#F5D061] via-[#D4AF37] to-[#996D1D] text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {formSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /><span>{t.modal.submitting}</span></>
                    ) : (
                      <><Send className="w-4 h-4 text-slate-950" /><span>{t.modal.submit}</span></>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white">{t.modal.successTitle}</h3>
                <p className="text-sm text-slate-300 mt-2">
                  {t.modal.successDesc.replace('{name}', formData.name).replace('{phone}', formData.phone)}
                </p>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors"
                >
                  {t.modal.close}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
