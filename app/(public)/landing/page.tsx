'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  DollarSign,
  Clock,
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
  Layers,
  Star,
  Building2,
  Wrench,
  ChevronDown,
  ChevronRight,
  Play,
  Send,
  X,
  PhoneCall,
  Crown,
  Check
} from 'lucide-react'

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
  // ROI Calculator State
  const [quotesPerMonth, setQuotesPerMonth] = useState<number>(15)
  const [avgProjectValue, setAvgProjectValue] = useState<number>(18000)
  const [currentWinRate, setCurrentWinRate] = useState<number>(25)

  // Demo Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    trade: 'Rénovation / Entrepreneur Général',
  })

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  // ROI Calculations - Formule réaliste et conservatrice (+5% de taux de signature)
  const newWinRate = Math.min(80, currentWinRate + 5)
  const currentMonthlyRevenue = (quotesPerMonth * (currentWinRate / 100)) * avgProjectValue
  const projectedMonthlyRevenue = (quotesPerMonth * (newWinRate / 100)) * avgProjectValue
  const monthlyGain = Math.round(projectedMonthlyRevenue - currentMonthlyRevenue)
  const yearlyGain = monthlyGain * 12
  const hoursSavedPerWeek = Math.round(quotesPerMonth * 0.4 + 2)

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitted(true)
  }

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
          <Link href="/" className="flex items-center space-x-3.5 group">
            <PlangrowthGoldLogo className="w-12 h-12 transform group-hover:scale-105 transition-transform duration-300" />
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FFF2B2] via-[#F5D061] to-[#D4AF37] drop-shadow-md">
                Plangrowth
              </span>
              <span className="text-[10px] text-amber-300/80 font-mono tracking-widest uppercase -mt-0.5">
                Architecte de l'Évolution Numérique
              </span>
            </div>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs font-bold uppercase tracking-wider text-slate-300">
            <a href="#roi-calculator" className="hover:text-amber-400 transition-colors">Calculateur ROI</a>
            <a href="#piliers" className="hover:text-amber-400 transition-colors">Les 3 Piliers</a>
            <a href="#modules" className="hover:text-amber-400 transition-colors">Fonctionnalités</a>
            <a href="#signature" className="hover:text-amber-400 transition-colors">Vision & Scalabilité</a>
            <a href="#tarifs" className="hover:text-amber-400 transition-colors">Tarifs</a>
          </nav>

          {/* CTA & ACCÈS ERP */}
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white px-4 py-2.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
            >
              Connexion ERP
            </Link>

            <button
              onClick={() => setIsModalOpen(true)}
              className="relative group p-[1px] rounded-xl overflow-hidden shadow-lg shadow-amber-500/20 focus:outline-none"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#F5D061] via-[#D4AF37] to-[#996D1D] rounded-xl group-hover:opacity-90 transition-opacity"></span>
              <span className="relative block px-5 py-2.5 rounded-[11px] bg-[#0A0B0E] text-amber-300 font-bold text-xs uppercase tracking-wider transition-all group-hover:bg-transparent group-hover:text-slate-950">
                Réserver un Audit ROI (15 min)
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
          <span>Structure • Acquisition • Scalabilité</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-5xl mx-auto">
          Transformez votre compagnie de service avec un{' '}
          <span className="bg-gradient-to-r from-[#FFF2B2] via-[#F5D061] to-[#D4AF37] bg-clip-text text-transparent drop-shadow-lg">
            Carnet de Commandes Premium
          </span>{' '}
          & un Contrôle Total de vos Marges.
        </h1>

        <p className="mt-8 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
          De la relance automatique du devis sous 24h jusqu'à l'élimination des fuites d'argent sur le terrain. 
          L'ERP conçu par <span className="text-amber-400 font-semibold">Plangrowth</span> pour structurer les entrepreneurs vers la scalabilité.
        </p>

        {/* CTA BUTTONS */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#F5D061] via-[#D4AF37] to-[#996D1D] text-slate-950 font-black text-sm uppercase tracking-wider shadow-2xl shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <span>Démarrer l'Essai Gratuit (14 jours)</span>
            <ArrowRight className="w-5 h-5 text-slate-950" />
          </button>
          <a
            href="#roi-calculator"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-amber-500/30 font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <Calculator className="w-5 h-5 text-amber-400" />
            <span>Calculer mes fuites de marge</span>
          </a>
        </div>

        {/* FOUNDER SIGNATURE BADGE */}
        <div className="mt-10 inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 text-xs">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></div>
          <span>Architecte de l'Évolution Numérique — <strong className="text-slate-200">Fondateur : Maxime Rochon</strong></span>
        </div>

        {/* TRUST BADGES */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-8 text-slate-400 text-xs font-semibold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>Relances Automatiques 24h</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>Image Devis Million-Dollar</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>Suivi Terrain & Zéro Reprise</span>
          </div>
        </div>

        {/* MOCKUP / DASHBOARD PREVIEW */}
        <div className="mt-14 relative mx-auto max-w-5xl rounded-2xl p-2 bg-gradient-to-b from-[#D4AF37]/30 via-slate-900 to-slate-950 shadow-2xl shadow-amber-500/15 border border-amber-500/30">
          <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 p-6 md:p-8">
            <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-3">
                <PlangrowthGoldLogo className="w-7 h-7" />
                <span className="text-xs text-amber-300 font-mono font-bold">tableau-de-bord.growth-plan.ca</span>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 font-mono border border-amber-500/20 font-bold">
                ● Suivi en temps réel des chantiers &amp; devis
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Suivi &amp; Relances Devis (24h)</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-black text-white">14 Relances Envoyées</p>
                <p className="text-xs text-amber-400 mt-2 font-semibold">3 devis relancés signés ce mois-ci</p>
              </div>

              <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Marge Brute Contrôlée</span>
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-black text-white">32.5 %</p>
                <p className="text-xs text-slate-400 mt-2 font-medium">Alertes dérives matériaux &amp; temps</p>
              </div>

              <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Standardisation &amp; Qualité</span>
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-black text-white">100% Fiches Qualité</p>
                <p className="text-xs text-amber-400 mt-2 font-semibold">Validation photo avant fermeture</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CALCULATEUR ROI INTERACTIF & RÉALISTE */}
      <section id="roi-calculator" className="py-20 bg-slate-950 border-y border-amber-500/20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-amber-400 font-mono text-xs uppercase tracking-widest font-bold">
              📊 Analyse de Récupération de Chiffre d'Affaires — Plangrowth
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
              Combien de soumissions perdez-vous par simple manque de suivi au bon moment ?
            </h2>
            <p className="text-slate-400 mt-4 text-base">
              80% des contrats se signent au premier entrepreneur qui effectue un suivi professionnel sous 24h. Calculez votre potentiel de récupération.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-900/80 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
            {/* INPUT CONTROLS */}
            <div className="lg:col-span-7 space-y-8">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-semibold text-slate-200">Nombre de devis envoyés par mois</label>
                  <span className="text-lg font-bold text-amber-400 font-mono bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                    {quotesPerMonth} devis
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
                  <label className="text-sm font-semibold text-slate-200">Valeur moyenne d'un projet / chantier ($)</label>
                  <span className="text-lg font-bold text-amber-400 font-mono bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                    {avgProjectValue.toLocaleString('fr-CA')} $
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
                  <label className="text-sm font-semibold text-slate-200">Taux de signature actuel (%)</label>
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
              
              <h3 className="text-xs uppercase font-mono tracking-widest text-slate-400">Potentiel de Récupération Estimé</h3>
              
              <div className="mt-4">
                <span className="text-sm text-slate-400">Chiffre d'affaires annuel récupérable :</span>
                <p className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFF2B2] via-[#F5D061] to-[#D4AF37] font-mono tracking-tight mt-1">
                  +{yearlyGain.toLocaleString('fr-CA')} $
                </p>
                <p className="text-xs text-amber-300 font-medium mt-1">
                  soit +{monthlyGain.toLocaleString('fr-CA')} $ / mois (~1 à 2 contrats additionnels signés)
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Temps administratif économisé :</span>
                  <span className="text-white font-bold font-mono">{hoursSavedPerWeek}h / semaine</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Amélioration estimée du taux de signature :</span>
                  <span className="text-amber-400 font-bold font-mono">+{newWinRate - currentWinRate}% ({currentWinRate}% → {newWinRate}%)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Seuil de rentabilité ERP :</span>
                  <span className="text-amber-300 font-bold font-mono">Rentabilisé dès le 1er devis récupéré</span>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full mt-6 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#F5D061] via-[#D4AF37] to-[#996D1D] text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <span>Tester mon potentiel de relance (Audit 15 min)</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>

              <p className="text-[10px] text-slate-500 mt-3 text-center">
                * Estimation basée sur un gain réaliste de +5% de signature grâce aux relances automatiques 24h.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LES 3 PILIERS STRATÉGIQUES */}
      <section id="piliers" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-amber-400 font-mono text-xs uppercase tracking-widest font-bold">
            🏆 L'Orchestration Plangrowth
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-3">
            3 Piliers stratégiques pour régner sur votre marché.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* PILIER 1 : FINANCIER */}
          <div className="bg-slate-900/90 p-8 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-all hover:-translate-y-1 group shadow-xl">
            <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
              <BarChart3 className="w-7 h-7" />
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">Pilier 1</span>
            <h3 className="text-xl font-bold text-white mt-2">📊 Rentabilité & Relance Devis 24h</h3>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              Ne laissez aucun devis refroidir. Le système relance vos prospects par SMS & Email sous 24h et calcule vos marges réelles en temps réel.
            </p>
            <ul className="mt-6 space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Alertes fuites de marge automatiques</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Facturation d'acompte en 1 clic</span>
              </li>
            </ul>
          </div>

          {/* PILIER 2 : MARQUE & CONVERSION */}
          <div className="bg-slate-900/90 p-8 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-all hover:-translate-y-1 group shadow-xl">
            <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
              <Sparkles className="w-7 h-7" />
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">Pilier 2</span>
            <h3 className="text-xl font-bold text-white mt-2">🧲 Image de Marque & Clients Premium</h3>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              Présentez des devis interactifs d'aspect haut de gamme avec signature électronique. Proposez un portail client transparent qui vous démarque.
            </p>
            <ul className="mt-6 space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Signature électronique sécurisée</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Portail client transparent</span>
              </li>
            </ul>
          </div>

          {/* PILIER 3 : OPÉRATIONNEL LEAN */}
          <div className="bg-slate-900/90 p-8 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-all hover:-translate-y-1 group shadow-xl">
            <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
              <Wrench className="w-7 h-7" />
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">Pilier 3</span>
            <h3 className="text-xl font-bold text-white mt-2">⚙️ Standardisation Terrain & Zéro Reprise</h3>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              Éliminez les quiproquos avec vos équipes et sous-traitants. Planning d'intervention synchronisé et fiches de vérification qualité.
            </p>
            <ul className="mt-6 space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Planning sous-traitants synchronisé</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Contrôle qualité photo obligatoire</span>
              </li>
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
              Plangrowth
            </h2>
            <p className="text-amber-300 text-xs font-mono uppercase tracking-widest mt-1">
              Architecte de l'Évolution Numérique
            </p>
            <p className="text-slate-400 text-sm font-semibold tracking-wider uppercase mt-2">
              Structure • Acquisition • Scalabilité
            </p>

            <blockquote className="mt-8 text-slate-300 italic text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              "Notre mission est simple : donner à chaque entrepreneur et entreprise de service la structure technologique indispensable pour sécuriser leurs marges et passer du chaos opérationnel à la scalabilité financière."
            </blockquote>

            <div className="mt-8 pt-6 border-t border-slate-800/80 inline-block">
              <span className="text-xs text-slate-400">Fondateur :</span>
              <p className="text-base font-bold text-white tracking-wide">Maxime Rochon</p>
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
              🛠️ La Suite Complète BTP & Services
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
              Chaque outil dont votre compagnie a besoin.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/30 transition-all">
              <FileText className="w-8 h-8 text-amber-400 mb-4" />
              <h4 className="text-lg font-bold text-white">Devis & Chiffrage Ultra-Rapide</h4>
              <p className="text-slate-400 text-sm mt-2">
                Bibliothèque d'articles intégrée, calcul des coûts de main-d'œuvre et envoi PDF/Web instantané.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/30 transition-all">
              <Zap className="w-8 h-8 text-amber-400 mb-4" />
              <h4 className="text-lg font-bold text-white">Relances 24h & Automatisations</h4>
              <p className="text-slate-400 text-sm mt-2">
                Relance SMS/Email personnalisée sans lever le petit doigt pour clôturer les devis en attente.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/30 transition-all">
              <Users className="w-8 h-8 text-amber-400 mb-4" />
              <h4 className="text-lg font-bold text-white">Planning & Sous-Traitants</h4>
              <p className="text-slate-400 text-sm mt-2">
                Assignation des équipes par glisser-déposer, notifications automatiques des horaires d'intervention.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/30 transition-all">
              <Smartphone className="w-8 h-8 text-amber-400 mb-4" />
              <h4 className="text-lg font-bold text-white">App Mobile Terrain</h4>
              <p className="text-slate-400 text-sm mt-2">
                Pointage des heures, photos de chantier et bon de travail validé directement sur le smartphone des équipes.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/30 transition-all">
              <DollarSign className="w-8 h-8 text-amber-400 mb-4" />
              <h4 className="text-lg font-bold text-white">Suivi Financier & Facturation</h4>
              <p className="text-slate-400 text-sm mt-2">
                Factures d'avancement, gestion des extras/avenants et synchronisation avec vos comptes.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/30 transition-all">
              <ShieldCheck className="w-8 h-8 text-amber-400 mb-4" />
              <h4 className="text-lg font-bold text-white">Standardisation & Zéro Reprise</h4>
              <p className="text-slate-400 text-sm mt-2">
                Listes de contrôle qualité obligatoires avant la fermeture du chantier pour garantir la satisfaction client.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TARIFICATION TRANSPARENTE */}
      <section id="tarifs" className="py-24 bg-slate-950 border-t border-slate-800 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-amber-400 font-mono text-xs uppercase tracking-widest font-bold">
              💰 Investissement Rentabilisé Dès Le Premier Devis
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
              Des tarifs clairs pour chaque niveau d'entreprise.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* PLAN PRO */}
            <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">Pro Solo</span>
                <h3 className="text-2xl font-bold text-white mt-1">Artisan & Indépendant</h3>
                <p className="text-slate-400 text-xs mt-2">Pour les entrepreneurs qui gèrent tout eux-mêmes.</p>
                
                <div className="mt-6">
                  <span className="text-4xl font-extrabold text-white font-mono">149 $</span>
                  <span className="text-slate-400 text-sm"> / mois</span>
                </div>

                <ul className="mt-8 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Jusqu'à 2 utilisateurs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Devis & Factures illimités</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Relances 24h automatisées</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>App mobile terrain</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full mt-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all"
              >
                Essayer 14 jours gratuit
              </button>
            </div>

            {/* PLAN BUSINESS (POPULAIRE) */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500 relative flex flex-col justify-between shadow-2xl shadow-amber-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#F5D061] to-[#D4AF37] text-slate-950 font-black text-xs font-mono uppercase tracking-wider">
                Le Plus Populaire
              </div>

              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase">Croissance Équipe</span>
                <h3 className="text-2xl font-bold text-white mt-1">Entrepreneur Général</h3>
                <p className="text-slate-400 text-xs mt-2">Pour les entreprises avec équipes et sous-traitants.</p>

                <div className="mt-6">
                  <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FFF2B2] via-[#F5D061] to-[#D4AF37] font-mono">299 $</span>
                  <span className="text-slate-400 text-sm"> / mois</span>
                </div>

                <ul className="mt-8 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Jusqu'à 10 utilisateurs & sous-traitants</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Tout du plan Pro Solo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Gestion avancée des sous-traitants</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Module Zéro Reprise & contrôle qualité</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Accompagnement Onboarding Lean (1h)</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full mt-8 py-3 rounded-xl bg-gradient-to-r from-[#F5D061] via-[#D4AF37] to-[#996D1D] text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all"
              >
                Démarrer mon audit & essai
              </button>
            </div>

            {/* PLAN ENTERPRISE */}
            <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">Compagnie & Multi-Chantiers</span>
                <h3 className="text-2xl font-bold text-white mt-1">Génie Civil & Commercial</h3>
                <p className="text-slate-400 text-xs mt-2">Pour les grandes structures et réseaux de franchises.</p>

                <div className="mt-6">
                  <span className="text-4xl font-extrabold text-white font-mono">Sur mesure</span>
                </div>

                <ul className="mt-8 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Utilisateurs illimités</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Intégrations sur mesure API & ERP legacy</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Account Manager & Consultant Lean dédié</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full mt-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all"
              >
                Nous contacter
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA FOOTER BANNER */}
      <section className="py-20 bg-gradient-to-r from-[#F5D061] via-[#D4AF37] to-[#996D1D] text-slate-950 relative z-10 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Prêt à faire passer votre compagnie au niveau supérieur ?
          </h2>
          <p className="mt-4 text-base sm:text-lg font-bold text-slate-900 max-w-2xl mx-auto">
            Plangrowth — Architecte de l'Évolution Numérique
          </p>
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-300 font-black text-sm uppercase tracking-wider shadow-2xl transition-all flex items-center gap-3"
            >
              <span>Réserver mon Audit ROI & Démo (Gratuit)</span>
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
                Structure • Acquisition • Scalabilité — Fondateur : Maxime Rochon
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <Link href="/conditions-utilisation" className="hover:text-slate-300">Conditions d'utilisation</Link>
            <Link href="/politique-confidentialite" className="hover:text-slate-300">Politique de confidentialité</Link>
            <Link href="/support" className="hover:text-slate-300">Support</Link>
          </div>
        </div>
      </footer>

      {/* MODAL AUDIT & DEMO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0B0E]/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => { setIsModalOpen(false); setFormSubmitted(false); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            {!formSubmitted ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <PlangrowthGoldLogo className="w-10 h-10" />
                  <div>
                    <h3 className="text-xl font-bold text-white">Audit ROI Plangrowth (15 min)</h3>
                    <p className="text-xs text-amber-400 font-mono">100% Gratuit — Sans aucun engagement</p>
                  </div>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4 mt-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Nom complet</label>
                    <input
                      type="text"
                      required
                      placeholder="Jean Tremblay"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Nom de votre entreprise / compagnie</label>
                    <input
                      type="text"
                      required
                      placeholder="Les Constructions Tremblay inc."
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Email professionnel</label>
                      <input
                        type="email"
                        required
                        placeholder="jean@construction.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Téléphone (SMS relance)</label>
                      <input
                        type="tel"
                        required
                        placeholder="(514) 555-0199"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Secteur d'activité principal</label>
                    <select
                      value={formData.trade}
                      onChange={(e) => setFormData({ ...formData, trade: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                    >
                      <option value="Rénovation / Entrepreneur Général">Rénovation / Entrepreneur Général</option>
                      <option value="Électricité / Plomberie / CVAC">Électricité / Plomberie / CVAC</option>
                      <option value="Charpente & Structure">Charpente & Structure</option>
                      <option value="Finition & Aménagement Intérieur">Finition & Aménagement Intérieur</option>
                      <option value="Génie Civil & Commercial">Génie Civil & Commercial</option>
                      <option value="Autre Service Spécialisé">Autre Service Spécialisé</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-6 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#F5D061] via-[#D4AF37] to-[#996D1D] text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4 text-slate-950" />
                    <span>Confirmer ma demande d'Audit ROI</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white">Demande reçue avec succès !</h3>
                <p className="text-sm text-slate-300 mt-2">
                  Merci {formData.name}. L'équipe Plangrowth vous contactera dans les 24 heures au {formData.phone} pour votre audit de rentabilité.
                </p>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
