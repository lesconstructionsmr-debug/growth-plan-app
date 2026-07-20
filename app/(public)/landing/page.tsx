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
  PhoneCall
} from 'lucide-react'

export default function LandingPage() {
  // ROI Calculator State
  const [quotesPerMonth, setQuotesPerMonth] = useState<number>(12)
  const [avgProjectValue, setAvgProjectValue] = useState<number>(15000)
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

  // ROI Calculations
  // Relance 24h increases win rate by ~35% relative (+8-10% absolute)
  const newWinRate = Math.min(80, currentWinRate + 12)
  const currentMonthlyRevenue = (quotesPerMonth * (currentWinRate / 100)) * avgProjectValue
  const projectedMonthlyRevenue = (quotesPerMonth * (newWinRate / 100)) * avgProjectValue
  const monthlyGain = projectedMonthlyRevenue - currentMonthlyRevenue
  const yearlyGain = monthlyGain * 12
  const hoursSavedPerWeek = Math.round(quotesPerMonth * 0.75 + 4) // devis + gestion terrain

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950 font-sans antialiased overflow-x-hidden">
      
      {/* BACKGROUND DECORATION */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-amber-500/10 via-blue-600/5 to-transparent blur-3xl rounded-full opacity-60"></div>
        <div className="absolute top-[40%] -right-[200px] w-[600px] h-[600px] bg-amber-500/5 blur-3xl rounded-full"></div>
        <div className="absolute top-[70%] -left-[200px] w-[600px] h-[600px] bg-blue-500/5 blur-3xl rounded-full"></div>
      </div>

      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 font-black text-slate-950 text-xl">
              GP
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                GROWTH PLAN <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">ERP BTP</span>
              </span>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest -mt-0.5">Structure & Scalabilité</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#roi-calculator" className="hover:text-amber-400 transition-colors">Calculateur ROI</a>
            <a href="#piliers" className="hover:text-amber-400 transition-colors">Les 3 Piliers</a>
            <a href="#modules" className="hover:text-amber-400 transition-colors">Fonctionnalités</a>
            <a href="#temoignages" className="hover:text-amber-400 transition-colors">Résultats Client</a>
            <a href="#tarifs" className="hover:text-amber-400 transition-colors">Tarifs</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-all"
            >
              Connexion
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="relative group overflow-hidden rounded-xl p-[1px] font-semibold text-sm focus:outline-none"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 rounded-xl group-hover:opacity-90 transition-opacity"></span>
              <span className="relative block px-5 py-2.5 rounded-[11px] bg-slate-950 text-amber-300 font-bold transition-colors group-hover:bg-transparent group-hover:text-slate-950">
                Réserver un Audit ROI (15 min)
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-16 pb-20 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-400 text-xs sm:text-sm font-medium mb-8 shadow-xl shadow-amber-500/5 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Le Système d'Acquisition & de Gestion pour Entrepreneurs BTP & Services</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] max-w-5xl mx-auto">
          Remplissez votre carnet de commandes avec des{' '}
          <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
            clients premium
          </span>{' '}
          & contrôlez votre rentabilité terrain.
        </h1>

        <p className="mt-8 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
          De la signature du devis relancé en 24h jusqu'au zéro reprise de travaux sur le chantier. 
          L'ERP tout-en-un conçu pour éliminer les fuites de marge et structurer votre compagnie pour la croissance.
        </p>

        {/* CTA BUTTONS */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-base shadow-xl shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <span>Démarrer l'Essai Gratuit (14 jours)</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <a
            href="#roi-calculator"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-base transition-all flex items-center justify-center gap-2"
          >
            <Calculator className="w-5 h-5 text-amber-400" />
            <span>Calculer mes fuites de marge</span>
          </a>
        </div>

        {/* TRUST BADGES */}
        <div className="mt-12 pt-8 border-t border-slate-800/60 flex flex-wrap items-center justify-center gap-8 text-slate-400 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Installation en 5 minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Relances automatiques SMS & Email</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Application Mobile Chantiers Android & iOS</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Accompagnement Lean dédié</span>
          </div>
        </div>

        {/* MOCKUP / DASHBOARD PREVIEW */}
        <div className="mt-14 relative mx-auto max-w-5xl rounded-2xl p-2 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 shadow-2xl shadow-amber-500/10 border border-slate-800">
          <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-800 p-6 md:p-8">
            <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-xs text-slate-500 font-mono ml-2">tableau-de-bord.growth-plan.ca</span>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
                ● En direct : +35% conversion devis
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Devis Relancés (24h)</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-white">18 / 18 Signés</p>
                <p className="text-xs text-emerald-400 mt-2 font-medium">↑ +42,000 $ ce mois-ci</p>
              </div>

              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Marge Brute Moyenne</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-white">38.4 %</p>
                <p className="text-xs text-slate-400 mt-2 font-medium">+6.2% vs marché BTP</p>
              </div>

              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Suivi Terrain & Lean</span>
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white">0 Reprise de travaux</p>
                <p className="text-xs text-blue-400 mt-2 font-medium">100% des délais respectés</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CALCULATEUR ROI INTERACTIF */}
      <section id="roi-calculator" className="py-20 bg-slate-900/50 border-y border-slate-800 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-amber-400 font-mono text-xs uppercase tracking-widest font-bold">
              📊 Le Stratège Financier & Rentabilité
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
              Combien d'argent perdez-vous chaque mois sans relance automatique ?
            </h2>
            <p className="text-slate-400 mt-4 text-base">
              Ajustez vos chiffres actuels ci-dessous et découvrez le potentiel d'augmentation directe de votre chiffre d'affaires.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-950 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
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
                  <label className="text-sm font-semibold text-slate-200">Valeur moyenne d'un chantier ($)</label>
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
            <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 rounded-xl border border-amber-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-2xl rounded-full"></div>
              
              <h3 className="text-xs uppercase font-mono tracking-widest text-slate-400">Impact Financier Estimé</h3>
              
              <div className="mt-4">
                <span className="text-sm text-slate-400">Revenu supplémentaire annuel :</span>
                <p className="text-4xl sm:text-5xl font-black text-amber-400 font-mono tracking-tight mt-1">
                  +{yearlyGain.toLocaleString('fr-CA')} $
                </p>
                <p className="text-xs text-emerald-400 font-medium mt-1">
                  soit +{monthlyGain.toLocaleString('fr-CA')} $ / mois de chiffre d'affaires net
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Temps de gestion économisé :</span>
                  <span className="text-white font-bold font-mono">{hoursSavedPerWeek}h / semaine</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Nouveau taux de signature estimé :</span>
                  <span className="text-emerald-400 font-bold font-mono">{newWinRate} %</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Retour sur investissement ERP :</span>
                  <span className="text-amber-400 font-bold font-mono">&gt; 35x abonnement</span>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full mt-6 py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Capturer cette croissance maintenant</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* LES 3 PILIERS STRATÉGIQUES */}
      <section id="piliers" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-amber-400 font-mono text-xs uppercase tracking-widest font-bold">
            🏆 L'Orchestration Globale Growth Plan
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-3">
            Construit autour de 3 piliers inébranlables pour les entrepreneurs.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* PILIER 1 : FINANCIER */}
          <div className="bg-slate-900/80 p-8 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition-all hover:-translate-y-1 group">
            <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
              <BarChart3 className="w-7 h-7" />
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">Pilier 1</span>
            <h3 className="text-xl font-bold text-white mt-2">📊 Rentabilité & Relance Devis 24h</h3>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              Ne laissez aucun devis refroidir. Notre système relance vos clients par SMS & Email sous 24h et suit vos marges réelles en temps réel sur chaque chantier.
            </p>
            <ul className="mt-6 space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Alertes de fuite de marge automatique</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Facturation d'acompte instantanée</span>
              </li>
            </ul>
          </div>

          {/* PILIER 2 : MARQUE & CONVERSION */}
          <div className="bg-slate-900/80 p-8 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition-all hover:-translate-y-1 group">
            <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:bg-blue-500 group-hover:text-slate-950 transition-colors">
              <Sparkles className="w-7 h-7" />
            </div>
            <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">Pilier 2</span>
            <h3 className="text-xl font-bold text-white mt-2">🧲 Image de Marque & Clients Premium</h3>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              Présentez des devis interactifs d'aspect "Million-Dollar" avec signature électronique. Proposez un portail client transparent qui vous démarque de 99% des artisans.
            </p>
            <ul className="mt-6 space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                <span>Signature électronique en 1 clic</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                <span>Portail de suivi de chantier pour le client</span>
              </li>
            </ul>
          </div>

          {/* PILIER 3 : OPÉRATIONNEL LEAN */}
          <div className="bg-slate-900/80 p-8 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition-all hover:-translate-y-1 group">
            <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
              <Wrench className="w-7 h-7" />
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">Pilier 3</span>
            <h3 className="text-xl font-bold text-white mt-2">⚙️ Standardisation Terrain & Zéro Reprise</h3>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              Éliminez les quiproquos avec vos équipes et sous-traitants. Planning d'intervention synchronisé, fiches de vérification qualité et pointage géolocalisé.
            </p>
            <ul className="mt-6 space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Gestion sous-traitants & horaires</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Contrôle qualité photo obligatoire</span>
              </li>
            </ul>
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
              Chaque outil dont votre compagnie a besoin pour régner sur son marché.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all">
              <FileText className="w-8 h-8 text-amber-400 mb-4" />
              <h4 className="text-lg font-bold text-white">Devis & Chiffrage Ultra-Rapide</h4>
              <p className="text-slate-400 text-sm mt-2">
                Bibliothèque d'articles intégrée, calcul des coûts de main-d'œuvre et envoi PDF/Web instantané.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all">
              <Zap className="w-8 h-8 text-amber-400 mb-4" />
              <h4 className="text-lg font-bold text-white">Relances 24h & Automatisations</h4>
              <p className="text-slate-400 text-sm mt-2">
                Relance SMS/Email personnalisée sans lever le petit doigt pour clôturer les devis en attente.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all">
              <Users className="w-8 h-8 text-amber-400 mb-4" />
              <h4 className="text-lg font-bold text-white">Planning & Sous-Traitants</h4>
              <p className="text-slate-400 text-sm mt-2">
                Assignation des équipes par glisser-déposer, notifications automatiques des horaires d'intervention.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all">
              <Smartphone className="w-8 h-8 text-amber-400 mb-4" />
              <h4 className="text-lg font-bold text-white">App Mobile Terrain</h4>
              <p className="text-slate-400 text-sm mt-2">
                Pointage des heures, photos de chantier et bon de travail validé directement sur le smartphone de vos gars.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all">
              <DollarSign className="w-8 h-8 text-amber-400 mb-4" />
              <h4 className="text-lg font-bold text-white">Suivi Financier & Facturation</h4>
              <p className="text-slate-400 text-sm mt-2">
                Factures d'avancement, gestion des extras/avenants et synchronisation avec vos comptes.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all">
              <ShieldCheck className="w-8 h-8 text-amber-400 mb-4" />
              <h4 className="text-lg font-bold text-white">Standardisation & Zéro Reprise</h4>
              <p className="text-slate-400 text-sm mt-2">
                Listes de contrôle qualité obligatoires avant la fermeture du chantier pour garantir la satisfaction client.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TÉMOIGNAGES & RÉSULTATS */}
      <section id="temoignages" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-amber-400 font-mono text-xs uppercase tracking-widest font-bold">
            📈 Retours du Terrain
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
            Ils ont transformé leur entreprise de construction.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/90 p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex text-amber-400 gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed italic">
                "Avant Growth Plan, on perdait au moins 4 à 5 devis par mois simplement parce qu'on n'avait pas le temps de rappeler les clients. Avec la relance 24h automatique, notre taux de conversion a bondi de 28% à 44%."
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
              <div>
                <h5 className="text-sm font-bold text-white">Marc-André L.</h5>
                <p className="text-xs text-slate-400">Rénovation Prestige (12 employés)</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                +64,000 $/an
              </span>
            </div>
          </div>

          <div className="bg-slate-900/90 p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex text-amber-400 gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed italic">
                "Le suivi des sous-traitants et l'application mobile terrain nous ont sauvé 10h de maux de tête par semaine. Plus aucune reprise de travaux non facturée !"
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
              <div>
                <h5 className="text-sm font-bold text-white">Stéphane G.</h5>
                <p className="text-xs text-slate-400">Électricité & Génie Civil</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                0 Reprise
              </span>
            </div>
          </div>

          <div className="bg-slate-900/90 p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex text-amber-400 gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed italic">
                "Les devis ont l'air tellement professionnels que nos clients acceptent nos prix sans même négocier. C'est le meilleur investissement de l'année."
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
              <div>
                <h5 className="text-sm font-bold text-white">Julie R.</h5>
                <p className="text-xs text-slate-400">Design & Aménagement Commercial</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                Marge +35%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* TARIFICATION TRANSPARENTE */}
      <section id="tarifs" className="py-24 bg-slate-900/40 border-t border-slate-800 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-amber-400 font-mono text-xs uppercase tracking-widest font-bold">
              💰 Investissement Rentabilisé Dès Le Premier Devis
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
              Des tarifs clairs, sans engagement ni frais cachés.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* PLAN PRO */}
            <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
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
                className="w-full mt-8 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700 transition-all"
              >
                Essayer 14 jours gratuit
              </button>
            </div>

            {/* PLAN BUSINESS (POPULAIRE) */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500 relative flex flex-col justify-between shadow-2xl shadow-amber-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-amber-500 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider">
                Le Plus Populaire
              </div>

              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase">Croissance Équipe</span>
                <h3 className="text-2xl font-bold text-white mt-1">Entrepreneur Général</h3>
                <p className="text-slate-400 text-xs mt-2">Pour les entreprises avec équipes et sous-traitants.</p>

                <div className="mt-6">
                  <span className="text-4xl font-extrabold text-amber-400 font-mono">299 $</span>
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
                className="w-full mt-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all"
              >
                Démarrer mon audit & essai
              </button>
            </div>

            {/* PLAN ENTERPRISE */}
            <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
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
                className="w-full mt-8 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700 transition-all"
              >
                Nous contacter
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <h2 className="text-3xl font-extrabold text-white text-center mb-12">Foire aux questions</h2>
        
        <div className="space-y-4">
          {[
            {
              q: "Combien de temps faut-il pour prendre en main Growth Plan ERP ?",
              a: "Moins de 15 minutes. Notre interface a été pensée pour les entrepreneurs qui passent leur journée sur le terrain, pas derrière un ordinateur. L'application mobile s'installe en 1 clic."
            },
            {
              q: "Comment fonctionnent les relances automatiques sous 24h ?",
              a: "Dès qu'un devis est envoyé par email ou SMS, notre système détecte quand le client l'ouvre. Si le devis n'est pas signé dans les 24h, un SMS chaleureux et professionnel est envoyé automatiquement de votre part."
            },
            {
              q: "Est-ce adapté aux sous-traitants et équipes de chantier ?",
              a: "Absolument. Vous pouvez donner un accès restreint à vos sous-traitants pour qu'ils voient uniquement leur planning, les photos du chantier et la fiche de contrôle qualité."
            },
            {
              q: "Y a-t-il un engagement à long terme ?",
              a: "Aucun engagement. Vous pouvez annuler votre abonnement mensuel à tout moment en 1 seul clic."
            }
          ].map((item, idx) => (
            <div key={idx} className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full px-6 py-4 text-left flex items-center justify-between font-bold text-white hover:text-amber-400 transition-colors"
              >
                <span>{item.q}</span>
                {openFaq === idx ? <ChevronDown className="w-5 h-5 text-amber-400" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
              </button>
              {openFaq === idx && (
                <div className="px-6 pb-4 text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA FOOTER BANNER */}
      <section className="py-20 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 relative z-10 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Prêt à faire passer votre compagnie BTP au niveau supérieur ?
          </h2>
          <p className="mt-4 text-base sm:text-lg font-medium text-slate-900 max-w-2xl mx-auto">
            Rejoignez les entrepreneurs qui ont sécurisé leur carnet de commandes et éliminé les fuites de rentabilité.
          </p>
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-300 font-bold text-lg shadow-2xl transition-all flex items-center gap-3"
            >
              <span>Réserver mon Audit ROI & Démo (Gratuit)</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 bg-slate-950 border-t border-slate-900 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">GP</div>
            <span className="font-bold text-slate-300">Growth Plan ERP BTP</span>
            <span>© 2026 Les Constructions MR / growth-plan.ca</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => { setIsModalOpen(false); setFormSubmitted(false); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            {!formSubmitted ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Réserver mon Audit ROI (15 min)</h3>
                    <p className="text-xs text-slate-400">100% Gratuit — Sans aucun engagement</p>
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
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Nom de votre compagnie / entreprise</label>
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
                    className="w-full mt-6 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Confirmer ma demande d'Audit ROI</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white">Demande reçue avec succès !</h3>
                <p className="text-sm text-slate-300 mt-2">
                  Merci {formData.name}. Un spécialiste de l'équipe Growth Plan vous contactera dans les 24 heures au {formData.phone} pour votre audit de rentabilité.
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
