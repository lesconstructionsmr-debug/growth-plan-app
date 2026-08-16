'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  TrendingUp, Users, Target, Clock, BarChart3,
  Award, PlusCircle, CheckSquare, Square
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

interface ChartRow {
  year: string
  'Soumissions envoyées': number
  Ventes: number
}

const DEFAULT_SALES_TARGET = 300000
const SENT_DEVIS_STATUTS = ['envoye', 'vu', 'approuve', 'converti'] as const
const CONVERTED_JOB_STATUTS = ['en_cours', 'termine', 'terminé'] as const
const FOLLOWUP_DEVIS_STATUTS = ['envoye', 'vu'] as const

function formatDue(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-CA', { day: '2-digit', month: 'long' })
}

function yearFrom(value: string | null | undefined): number | null {
  if (!value) return null
  const y = new Date(value).getFullYear()
  return Number.isFinite(y) ? y : null
}

function buildYearRange(endYear: number, count = 5): string[] {
  return Array.from({ length: count }, (_, i) => String(endYear - (count - 1) + i))
}

function clientNom(clients: { nom: string } | { nom: string }[] | null | undefined): string {
  if (!clients) return '—'
  if (Array.isArray(clients)) return clients[0]?.nom ?? '—'
  return clients.nom ?? '—'
}

export default function VentesDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    prospects: 0,
    converted: 0,
    avgTransaction: 0,
    conversionDelay: 0,
    salesTotal: 0,
    salesTarget: DEFAULT_SALES_TARGET,
    pctGoal: 0,
    soumissionsTotal: 0,
    soumissionsCount: 0,
    salesJobsCount: 0,
    convRate: 0,
  })

  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [chartData, setChartData] = useState<ChartRow[]>([])
  const [chartRangeLabel, setChartRangeLabel] = useState('')

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  )

  useEffect(() => {
    async function loadData() {
      try {
        const currentYear = new Date().getFullYear()
        const years = buildYearRange(currentYear)
        setChartRangeLabel(`${years[0]} — ${years[years.length - 1]}`)

        const [
          { count: countLeads },
          { count: countConverted },
          { data: soumissionsDevis },
          { data: approvedDevis },
          { data: paidFactures },
          { data: chartDevis },
          { data: chartFactures },
          { data: chartJobs },
          { data: followupLeads },
          { data: followupDevis },
          { data: company },
        ] = await Promise.all([
          supabase.from('leads').select('*', { count: 'exact', head: true }),
          supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .in('statut', [...CONVERTED_JOB_STATUTS]),
          supabase
            .from('devis')
            .select('montant_ttc')
            .in('statut', [...SENT_DEVIS_STATUTS]),
          supabase
            .from('devis')
            .select('montant_ttc, statut')
            .in('statut', ['approuve', 'converti']),
          supabase.from('factures').select('montant_ttc').eq('statut', 'payee'),
          supabase
            .from('devis')
            .select('date_emission, envoye_le, created_at, statut')
            .in('statut', [...SENT_DEVIS_STATUTS]),
          supabase
            .from('factures')
            .select('montant_ttc, date_paiement, date_emission')
            .eq('statut', 'payee'),
          supabase
            .from('jobs')
            .select('budget, created_at, statut')
            .in('statut', [...CONVERTED_JOB_STATUTS]),
          supabase
            .from('leads')
            .select('id, nom, created_at')
            .eq('statut', 'nouveau')
            .order('created_at', { ascending: true })
            .limit(5),
          supabase
            .from('devis')
            .select('id, numero, statut, valide_jusqu_au, updated_at, clients(nom)')
            .in('statut', [...FOLLOWUP_DEVIS_STATUTS])
            .order('updated_at', { ascending: true })
            .limit(5),
          supabase.from('companies').select('*').limit(1).maybeSingle(),
        ])

        const prospects = countLeads ?? 0
        const converted = countConverted ?? 0

        const soumissionsCount = soumissionsDevis?.length ?? 0
        const soumissionsTotal = (soumissionsDevis ?? []).reduce(
          (s, d) => s + Number(d.montant_ttc ?? 0),
          0
        )

        const devisSalesTotal = (approvedDevis ?? []).reduce(
          (s, d) => s + Number(d.montant_ttc ?? 0),
          0
        )
        const facturesSalesTotal = (paidFactures ?? []).reduce(
          (s, f) => s + Number(f.montant_ttc ?? 0),
          0
        )
        const salesTotal = devisSalesTotal > 0 ? devisSalesTotal : facturesSalesTotal

        const avgTransaction = converted > 0 ? salesTotal / converted : 0
        const convRate = prospects > 0 ? (converted / prospects) * 100 : 0

        const companyRow = company as Record<string, unknown> | null
        const salesTarget = Number(
          companyRow?.sales_target ?? companyRow?.objectif_ventes ?? DEFAULT_SALES_TARGET
        )
        const pctGoalRaw = salesTarget > 0 ? (salesTotal / salesTarget) * 100 : 0
        const pctGoal = Math.min(Math.round(pctGoalRaw), 100)

        const yearSet = new Set(years.map(Number))
        const soumissionsByYear: Record<string, number> = Object.fromEntries(
          years.map(y => [y, 0])
        )
        const ventesByYear: Record<string, number> = Object.fromEntries(years.map(y => [y, 0]))

        for (const d of chartDevis ?? []) {
          const y = yearFrom(d.envoye_le ?? d.date_emission ?? d.created_at)
          if (y != null && yearSet.has(y)) {
            soumissionsByYear[String(y)] += 1
          }
        }

        for (const f of chartFactures ?? []) {
          const y = yearFrom(f.date_paiement ?? f.date_emission)
          if (y != null && yearSet.has(y)) {
            ventesByYear[String(y)] += Number(f.montant_ttc ?? 0)
          }
        }

        for (const j of chartJobs ?? []) {
          const y = yearFrom(j.created_at)
          if (y != null && yearSet.has(y)) {
            ventesByYear[String(y)] += Number(j.budget ?? 0)
          }
        }

        setChartData(
          years.map(year => ({
            year,
            'Soumissions envoyées': soumissionsByYear[year] ?? 0,
            Ventes: Math.round(ventesByYear[year] ?? 0),
          }))
        )

        const mergedTasks: (TaskItem & { sortKey: number })[] = [
          ...(followupLeads ?? []).map(l => ({
            id: `lead-${l.id}`,
            label: 'Suivi prospect',
            client: l.nom,
            due: formatDue(l.created_at),
            done: false,
            sortKey: new Date(l.created_at).getTime(),
          })),
          ...(followupDevis ?? []).map(d => ({
            id: `devis-${d.id}`,
            label: d.statut === 'vu' ? 'Relance devis' : 'Suivi soumission',
            client: clientNom(d.clients as { nom: string } | { nom: string }[] | null),
            due: formatDue(d.valide_jusqu_au ?? d.updated_at),
            done: false,
            sortKey: new Date(d.valide_jusqu_au ?? d.updated_at).getTime(),
          })),
        ]

        setTasks(
          mergedTasks
            .sort((a, b) => a.sortKey - b.sortKey)
            .slice(0, 5)
            .map(({ sortKey: _, ...task }) => task)
        )

        setStats({
          prospects,
          converted,
          avgTransaction: Number(avgTransaction.toFixed(2)),
          conversionDelay: 0,
          salesTotal,
          salesTarget,
          pctGoal,
          soumissionsTotal,
          soumissionsCount,
          salesJobsCount: converted,
          convRate: Number(convRate.toFixed(2)),
        })
      } catch (err) {
        console.warn('[ventes] loadData failed', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (stats.pctGoal / 100) * circumference

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>

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

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 280px', gap: '16px', alignItems: 'stretch' }} className="ventes-grid">

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(212,175,55,0.08)', border: '0.5px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
              <Users size={20} />
            </div>
            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--txt-3)', fontWeight: 600, letterSpacing: '0.04em' }}>Prospects</span>
              <div style={{ fontSize: '20px', fontWeight: 850, color: 'var(--txt-1)', marginTop: '2px' }}>
                {loading ? '…' : stats.prospects}
              </div>
            </div>
            <span style={{ position: 'absolute', right: '12px', top: '16px', fontSize: '9px', padding: '2px 6px', borderRadius: '12px', background: 'var(--green)15', color: 'var(--green)', fontWeight: 600 }}>+ 0.0%</span>
          </div>

          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(92,184,122,0.08)', border: '0.5px solid rgba(92,184,122,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)' }}>
              <Target size={20} />
            </div>
            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--txt-3)', fontWeight: 600, letterSpacing: '0.04em' }}>Prospects convertis</span>
              <div style={{ fontSize: '20px', fontWeight: 850, color: 'var(--txt-1)', marginTop: '2px' }}>
                {loading ? '…' : stats.converted}
              </div>
            </div>
            <span style={{ position: 'absolute', right: '12px', top: '16px', fontSize: '9px', padding: '2px 6px', borderRadius: '12px', background: 'var(--green)15', color: 'var(--green)', fontWeight: 600 }}>+ 0.0%</span>
          </div>

          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(212,175,55,0.08)', border: '0.5px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--txt-3)', fontWeight: 600, letterSpacing: '0.04em' }}>Transaction moyenne</span>
              <div style={{ fontSize: '16px', fontWeight: 850, color: 'var(--txt-1)', marginTop: '2px' }}>
                {loading ? '…' : stats.avgTransaction.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </div>
            </div>
            <span style={{ position: 'absolute', right: '12px', top: '16px', fontSize: '9px', padding: '2px 6px', borderRadius: '12px', background: 'var(--green)15', color: 'var(--green)', fontWeight: 600 }}>+ 0.0%</span>
          </div>

          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(212,175,55,0.08)', border: '0.5px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
              <Clock size={20} />
            </div>
            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--txt-3)', fontWeight: 600, letterSpacing: '0.04em' }}>Délai de conversion</span>
              <div style={{ fontSize: '18px', fontWeight: 850, color: 'var(--txt-1)', marginTop: '2px' }}>
                {loading ? '…' : `${stats.conversionDelay} jours`}
              </div>
            </div>
            <span style={{ position: 'absolute', right: '12px', top: '16px', fontSize: '9px', padding: '2px 6px', borderRadius: '12px', background: 'var(--green)15', color: 'var(--green)', fontWeight: 600 }}>+ 0.0%</span>
          </div>

        </div>

        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', justifySelf: 'stretch' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--txt-1)' }}>Ventes</span>
            <span style={{ fontSize: '10px', color: 'var(--txt-3)', fontWeight: 500 }}>{chartRangeLabel}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '12px 0', borderBottom: '0.5px solid var(--line)', marginBottom: '20px', textAlign: 'center' }}>
            <div>
              <span style={{ fontSize: '9.5px', color: 'var(--txt-3)', textTransform: 'uppercase', fontWeight: 500 }}>Soumissions envoyées</span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--txt-1)', marginTop: '4px' }}>
                {stats.soumissionsTotal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
              </div>
              <span style={{ fontSize: '9px', color: 'var(--txt-3)' }}>{stats.soumissionsCount} soumissions</span>
            </div>
            <div>
              <span style={{ fontSize: '9.5px', color: 'var(--txt-3)', textTransform: 'uppercase', fontWeight: 500 }}>Ventes</span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gold)', marginTop: '4px' }}>
                {stats.salesTotal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
              </div>
              <span style={{ fontSize: '9px', color: 'var(--txt-3)' }}>{stats.salesJobsCount} jobs signées</span>
            </div>
            <div>
              <span style={{ fontSize: '9.5px', color: 'var(--txt-3)', textTransform: 'uppercase', fontWeight: 500 }}>Taux de conversion</span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--green)', marginTop: '4px' }}>{stats.convRate}%</div>
              <span style={{ fontSize: '9px', color: 'var(--txt-3)' }}>Performance moyenne</span>
            </div>
          </div>

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

        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', textAlign: 'center' }}>

          <div style={{ width: '100%' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Award size={14} /> Objectif (Presque terminé)
            </div>
            <p style={{ fontSize: '10.5px', color: 'var(--txt-3)', marginTop: '4px', margin: 0 }}>L'objectif est à {stats.pctGoal}% d'être terminé</p>
          </div>

          <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0' }}>
            <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke="var(--bg-3)"
                strokeWidth="10"
              />
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

          {!loading && tasks.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: '12px', color: 'var(--txt-3)' }}>
              Aucune tâche de relance en attente
            </div>
          ) : (
            tasks.map(t => (
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
            ))
          )}
        </div>
      </div>

    </div>
  )
}
