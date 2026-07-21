'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  TrendingUp, Users, Target, Clock, CheckCircle2, ChevronRight, BarChart3,
  Calendar, Check, AlertCircle, Loader2, ArrowUpRight, Award, Plus, PlusCircle, CheckSquare, Square
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

interface TaskItem {
  id: string
  label: string
  client: string
  due: string
  done: boolean
}

export default function VentesDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    prospects: 176,
    converted: 29,
    avgTransaction: 2121.29,
    conversionDelay: 17,
    salesTotal: 228000,
    salesTarget: 300000,
    pctGoal: 76,
    soumissionsTotal: 804390,
    soumissionsCount: 531,
    salesJobsCount: 12,
    convRate: 3.14
  })

  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: '1', label: 'Suivi soumission', client: 'Maxime Rochon', due: '01 August', done: false },
    { id: '2', label: 'Démo ERP', client: 'Sébastien Bourdeau', due: '03 August', done: false },
    { id: '3', label: 'Rendez-vous chantier', client: 'Michel Ghattas', due: '04 August', done: false },
    { id: '4', label: 'Relance signature', client: 'Alexandre Grandmaison', due: '05 August', done: false },
  ])

  // Données historiques pour le graphique
  const chartData = [
    { year: '2016', 'Soumissions envoyées': 2500, 'Ventes': 1200 },
    { year: '2017', 'Soumissions envoyées': 3100, 'Ventes': 1500 },
    { year: '2018', 'Soumissions envoyées': 4000, 'Ventes': 2200 },
    { year: '2019', 'Soumissions envoyées': 3800, 'Ventes': 2500 },
    { year: '2020', 'Soumissions envoyées': 4800, 'Ventes': 1800 },
    { year: '2021', 'Soumissions envoyées': 3200, 'Ventes': 2000 },
    { year: '2022', 'Soumissions envoyées': 4200, 'Ventes': 1100 },
    { year: '2023', 'Soumissions envoyées': 5500, 'Ventes': 2800 },
    { year: '2024', 'Soumissions envoyées': 3800, 'Ventes': 1900 },
    { year: '2025', 'Soumissions envoyées': 4400, 'Ventes': 2900 },
    { year: '2026', 'Soumissions envoyées': 5100, 'Ventes': 3500 },
  ]

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function loadData() {
      try {
        // Essayer de charger des vraies statistiques depuis Supabase si disponibles
        const [
          { count: countLeads },
          { count: countJobs },
          { data: approvedDevis }
        ] = await Promise.all([
          supabase.from('leads').select('*', { count: 'exact', head: true }),
          supabase.from('jobs').select('*', { count: 'exact', head: true }),
          supabase.from('devis').select('montant_ttc').eq('statut', 'approuvé')
        ])

        const realProspects = countLeads || 176
        const realConverted = countJobs || 29
        
        let realAvg = 2121.29
        let realSalesTotal = 228000
        if (approvedDevis && approvedDevis.length > 0) {
          const total = approvedDevis.reduce((s, x) => s + (x.montant_ttc || 0), 0)
          realAvg = total / approvedDevis.length
          realSalesTotal = total
        }

        const realTarget = 300000
        const realPct = Math.round((realSalesTotal / realTarget) * 100)

        setStats(prev => ({
          ...prev,
          prospects: realProspects,
          converted: realConverted,
          avgTransaction: Number(realAvg.toFixed(2)),
          salesTotal: realSalesTotal,
          pctGoal: realPct > 100 ? 100 : realPct
        }))
      } catch (err) {
        console.warn('Fallback dynamic values used.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [supabase])

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  // Calcul du cercle de jauge
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (stats.pctGoal / 100) * circumference

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* En-tête de page */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt-1)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={20} color="var(--gold)" /> Tableau des ventes
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--txt-3)', marginTop: '2px' }}>
            Analyse des conversions de prospects, soumissions et progression des objectifs
          </div>
        </div>
      </div>

      {/* Grid principal : KPI Gauche + Graphique Centre + Objectif Droite */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 280px', gap: '16px', alignItems: 'stretch' }} className="ventes-grid">
        
        {/* Colonne Gauche : Liste verticale de 4 cartes KPI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Card 1 : Prospects */}
          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(212,175,55,0.08)', border: '0.5px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
              <Users size={20} />
            </div>
            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--txt-3)', fontWeight: 600, letterSpacing: '0.04em' }}>Prospects</span>
              <div style={{ fontSize: '20px', fontWeight: 850, color: 'var(--txt-1)', marginTop: '2px' }}>{stats.prospects}</div>
            </div>
            <span style={{ position: 'absolute', right: '12px', top: '16px', fontSize: '9px', padding: '2px 6px', borderRadius: '12px', background: 'var(--green)15', color: 'var(--green)', fontWeight: 600 }}>+ 0.0%</span>
          </div>

          {/* Card 2 : Prospects convertis */}
          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(92,184,122,0.08)', border: '0.5px solid rgba(92,184,122,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)' }}>
              <Target size={20} />
            </div>
            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--txt-3)', fontWeight: 600, letterSpacing: '0.04em' }}>Prospects convertis</span>
              <div style={{ fontSize: '20px', fontWeight: 850, color: 'var(--txt-1)', marginTop: '2px' }}>{stats.converted}</div>
            </div>
            <span style={{ position: 'absolute', right: '12px', top: '16px', fontSize: '9px', padding: '2px 6px', borderRadius: '12px', background: 'var(--green)15', color: 'var(--green)', fontWeight: 600 }}>+ 0.0%</span>
          </div>

          {/* Card 3 : Transaction moyenne */}
          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(212,175,55,0.08)', border: '0.5px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--txt-3)', fontWeight: 600, letterSpacing: '0.04em' }}>Transaction moyenne</span>
              <div style={{ fontSize: '16px', fontWeight: 850, color: 'var(--txt-1)', marginTop: '2px' }}>{stats.avgTransaction.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</div>
            </div>
            <span style={{ position: 'absolute', right: '12px', top: '16px', fontSize: '9px', padding: '2px 6px', borderRadius: '12px', background: 'var(--green)15', color: 'var(--green)', fontWeight: 600 }}>+ 0.0%</span>
          </div>

          {/* Card 4 : Délai de conversion */}
          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(212,175,55,0.08)', border: '0.5px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
              <Clock size={20} />
            </div>
            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--txt-3)', fontWeight: 600, letterSpacing: '0.04em' }}>Délai de conversion</span>
              <div style={{ fontSize: '18px', fontWeight: 850, color: 'var(--txt-1)', marginTop: '2px' }}>{stats.conversionDelay} jours</div>
            </div>
            <span style={{ position: 'absolute', right: '12px', top: '16px', fontSize: '9px', padding: '2px 6px', borderRadius: '12px', background: 'var(--green)15', color: 'var(--green)', fontWeight: 600 }}>+ 0.0%</span>
          </div>

        </div>

        {/* Section Centre : Graphique des Ventes */}
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', justifySelf: 'stretch' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--txt-1)' }}>Ventes</span>
            <span style={{ fontSize: '10px', color: 'var(--txt-3)', fontWeight: 500 }}>2016 vs 2026</span>
          </div>

          {/* Totalisateur de Soumissions & Conversion */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '12px 0', borderBottom: '0.5px solid var(--line)', marginBottom: '20px', textAlign: 'center' }}>
            <div>
              <span style={{ fontSize: '9.5px', color: 'var(--txt-3)', textTransform: 'uppercase', fontWeight: 500 }}>Soumissions envoyées</span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--txt-1)', marginTop: '4px' }}>{stats.soumissionsTotal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}</div>
              <span style={{ fontSize: '9px', color: 'var(--txt-3)' }}>{stats.soumissionsCount} soumissions</span>
            </div>
            <div>
              <span style={{ fontSize: '9.5px', color: 'var(--txt-3)', textTransform: 'uppercase', fontWeight: 500 }}>Ventes</span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gold)', marginTop: '4px' }}>{stats.salesTotal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}</div>
              <span style={{ fontSize: '9px', color: 'var(--txt-3)' }}>{stats.salesJobsCount} jobs signées</span>
            </div>
            <div>
              <span style={{ fontSize: '9.5px', color: 'var(--txt-3)', textTransform: 'uppercase', fontWeight: 500 }}>Taux de conversion</span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--green)', marginTop: '4px' }}>{stats.convRate}%</div>
              <span style={{ fontSize: '9px', color: 'var(--txt-3)' }}>Performance moyenne</span>
            </div>
          </div>

          {/* Graphique à barres */}
          <div style={{ flex: 1, minHeight: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="year" stroke="var(--txt-3)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--txt-3)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#1A1C23', borderColor: 'var(--line)', borderRadius: '8px', fontSize: '11px', color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Bar dataKey="Soumissions envoyées" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Ventes" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section Droite : Objectif / Jauge */}
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', textAlign: 'center' }}>
          
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Award size={14} /> Objectif (Presque terminé)
            </div>
            <p style={{ fontSize: '10.5px', color: 'var(--txt-3)', marginTop: '4px', margin: 0 }}>L'objectif est à {stats.pctGoal}% d'être terminé</p>
          </div>

          {/* SVG Radial Gauge */}
          <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0' }}>
            <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background Circle */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke="var(--bg-3)"
                strokeWidth="10"
              />
              {/* Foreground Progressive Circle */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke="#3B82F6"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--txt-1)' }}>{stats.pctGoal}%</span>
            </div>
          </div>

          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--txt-3)', marginBottom: '8px' }}>
              <span>Ventes</span>
              <span style={{ fontWeight: 700, color: 'var(--txt-1)' }}>{stats.salesTotal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })} / {stats.salesTarget.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}</span>
            </div>
            <div style={{ height: '6px', background: 'var(--bg-3)', borderRadius: '3px', width: '100%', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ width: `${stats.pctGoal}%`, height: '100%', background: '#3B82F6', borderRadius: '3px' }} />
            </div>

            <button style={{ width: '100%', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', borderRadius: '8px', padding: '8px', fontSize: '11px', fontWeight: 600, color: 'var(--gold-2)', cursor: 'pointer' }}>
              ✏️ Changer l'objectif
            </button>
          </div>

        </div>

      </div>

      {/* Section Bas : Liste des Tâches Ventes */}
      <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '14px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--txt-1)' }}>Tâches de relance</span>
          <button style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--gold-2)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
            <PlusCircle size={14} /> Ajouter une tâche
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 150px 100px', padding: '8px 12px', borderBottom: '0.5px solid var(--line)', fontSize: '10px', fontWeight: 700, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <span>Tâche</span>
            <span>Client</span>
            <span>Dû le</span>
            <span style={{ textAlign: 'right' }}>Actions</span>
          </div>

          {tasks.map(t => (
            <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 150px 100px', padding: '12px', background: t.done ? 'var(--ga)' : 'transparent', borderBottom: '0.5px solid var(--line)', borderRadius: '8px', alignItems: 'center', transition: 'all 0.12s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={() => toggleTask(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: t.done ? 'var(--green)' : 'var(--txt-3)', display: 'flex' }}>
                  {t.done ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
                <span style={{ fontSize: '12px', color: t.done ? 'var(--txt-3)' : 'var(--txt-1)', textDecoration: t.done ? 'line-through' : 'none', fontWeight: 500 }}>
                  {t.label}
                </span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--txt-2)' }}>{t.client}</span>
              <span style={{ fontSize: '11px', color: 'var(--txt-3)' }}>{t.due}</span>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                <button onClick={() => toggleTask(t.id)} style={{ background: t.done ? 'var(--green)15' : 'var(--bg-3)', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '4px 8px', fontSize: '10px', color: t.done ? 'var(--green)' : 'var(--txt-2)', cursor: 'pointer', fontWeight: 600 }}>
                  {t.done ? 'Complété' : 'Marquer fait'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
