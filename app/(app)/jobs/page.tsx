'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  Building2, Plus, Search, MapPin, Calendar, Clock,
  CheckCircle2, PauseCircle, XCircle, Circle, Users,
  Trash2, CheckSquare, Square, Edit3, Loader2
} from 'lucide-react'
import type { StatutProjet } from '@/lib/types/models'

const STATUTS: { value: StatutProjet; label: string; color: string }[] = [
  { value: 'brouillon',  label: 'Brouillon',    color: 'var(--txt-3)' },
  { value: 'en_attente', label: 'En attente',   color: 'var(--amber)' },
  { value: 'en_cours',   label: 'En cours',     color: 'var(--blue)'  },
  { value: 'en_pause',   label: 'En pause',     color: 'var(--purple)' },
  { value: 'termine',    label: 'Terminé',      color: 'var(--green)' },
  { value: 'annule',     label: 'Annulé',       color: 'var(--red)'   },
]

interface JobRow {
  id: string
  titre: string
  client_nom: string
  statut: StatutProjet
  ville_chantier: string | null
  date_debut: string | null
  date_fin_prevue: string | null
  budget_estime: number | null
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n)

export default function JobsPage() {
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<string>('tous')
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadJobs = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('jobs')
      .select('id, titre, statut, date_debut, date_fin, budget, adresse, clients(nom)')
      .order('created_at', { ascending: false })

    setJobs((data ?? []).map((j: any) => ({
      id: j.id,
      titre: j.titre,
      client_nom: j.clients?.nom ?? '—',
      statut: (j.statut || 'brouillon') as StatutProjet,
      ville_chantier: j.adresse ?? null,
      date_debut: j.date_debut ?? null,
      date_fin_prevue: j.date_fin ?? null,
      budget_estime: j.budget ? Number(j.budget) : null,
    })))
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadJobs() }, [loadJobs])

  // ── ÉDITION DIRECTE SUR LA CELLULE ─────────────────────────────
  async function updateInlineField(id: string, field: 'titre' | 'statut' | 'budget' | 'adresse', value: any) {
    setJobs(prev => prev.map(j => {
      if (j.id !== id) return j
      if (field === 'budget') return { ...j, budget_estime: parseFloat(value) || null }
      return { ...j, [field]: value }
    }))

    const valToSave = field === 'budget' ? (parseFloat(value) || null) : value
    await supabase.from('jobs').update({ [field]: valToSave }).eq('id', id)
  }

  async function handleDelete(id: string) {
    if (!confirm('Voulez-vous vraiment supprimer ce chantier ?')) return
    await supabase.from('jobs').delete().eq('id', id)
    loadJobs()
  }

  async function handleBatchDelete() {
    if (selectedIds.length === 0) return
    if (!confirm(`Voulez-vous vraiment supprimer les ${selectedIds.length} chantiers sélectionnés ?`)) return
    await supabase.from('jobs').delete().in('id', selectedIds)
    setSelectedIds([])
    loadJobs()
  }

  const filtered = jobs.filter(j => {
    const matchSearch = j.titre.toLowerCase().includes(search.toLowerCase())
      || j.client_nom.toLowerCase().includes(search.toLowerCase())
    const matchStatut = statutFilter === 'tous' || j.statut === statutFilter
    return matchSearch && matchStatut
  })

  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt-1)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={20} color="var(--gold)" /> Chantiers & Projets
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--txt-3)', marginTop: '2px' }}>
            Suivi des chantiers et modification directe du titre, budget et statut dans le tableau
          </div>
        </div>
        <a
          href="/jobs/nouveau"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--gold)', borderRadius: '8px', padding: '9px 16px',
            fontSize: '13px', fontWeight: 700, color: '#0A0A0A', textDecoration: 'none',
          }}
        >
          <Plus size={15} /> Nouveau chantier
        </a>
      </div>

      {/* Sélection en masse */}
      {selectedIds.length > 0 && (
        <div style={{
          background: 'var(--ga)', border: '1px solid var(--gold)',
          borderRadius: '10px', padding: '12px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare size={16} />
            {selectedIds.length} chantier(s) sélectionné(s)
          </div>
          <button
            onClick={handleBatchDelete}
            style={{ background: 'var(--red)20', border: '0.5px solid var(--red)', color: 'var(--red)', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Trash2 size={13} /> Supprimer la sélection
          </button>
        </div>
      )}

      {/* Recherche & Filtres */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={14} color="var(--txt-3)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Rechercher un chantier ou client…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--bg-2)', border: '0.5px solid var(--line)',
              borderRadius: '8px', padding: '8px 12px 8px 34px',
              fontSize: '12px', color: 'var(--txt-1)', outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {['tous', 'brouillon', 'en_attente', 'en_cours', 'en_pause', 'termine', 'annule'].map(s => (
            <button
              key={s}
              onClick={() => setStatutFilter(s)}
              style={{
                background: statutFilter === s ? 'var(--gold)20' : 'var(--bg-2)',
                border: statutFilter === s ? '0.5px solid var(--gold)' : '0.5px solid var(--line)',
                color: statutFilter === s ? 'var(--gold-2)' : 'var(--txt-2)',
                borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* TABLEAU AVEC ÉDITION DIRECTE SUR CELLULE */}
      <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 160px 140px 120px 60px', padding: '10px 18px', borderBottom: '0.5px solid var(--line)', background: 'var(--bg-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => setSelectedIds(allSelected ? [] : filtered.map(j => j.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: allSelected ? 'var(--gold)' : 'var(--txt-3)' }}>
              {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
            </button>
          </div>
          {['TITRE DE CHANTIERS (ÉDITABLE)', 'CLIENT', 'BUDGET ($ ÉDITABLE)', 'STATUT (ÉDITABLE)', 'ACTIONS'].map((h, i) => (
            <div key={i} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--txt-3)', letterSpacing: '0.06em', textAlign: h.includes('BUDGET') ? 'right' : 'left' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '8px', color: 'var(--txt-3)', fontSize: '12px' }}>
            <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
            Chargement…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '10px' }}>
            <Building2 size={32} color="var(--txt-3)" strokeWidth={1.2} />
            <p style={{ fontSize: '13px', color: 'var(--txt-3)', margin: 0 }}>Aucun chantier trouvé</p>
          </div>
        ) : (
          filtered.map((j, idx) => {
            const isSelected = selectedIds.includes(j.id)
            const stCfg = STATUTS.find(s => s.value === j.statut) || STATUTS[0]

            return (
              <div
                key={j.id}
                style={{
                  display: 'grid', gridTemplateColumns: '40px 1fr 160px 140px 120px 60px',
                  padding: '10px 18px', borderBottom: idx < filtered.length - 1 ? '0.5px solid var(--line)' : 'none',
                  alignItems: 'center', background: isSelected ? 'var(--ga)' : 'transparent',
                }}
              >
                {/* Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button onClick={() => setSelectedIds(prev => prev.includes(j.id) ? prev.filter(x => x !== j.id) : [...prev, j.id])} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isSelected ? 'var(--gold)' : 'var(--txt-3)' }}>
                    {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </div>

                {/* 1. TITRE EN SAISIE DIRECTE */}
                <div>
                  <input
                    type="text"
                    defaultValue={j.titre}
                    onBlur={e => e.target.value !== j.titre && updateInlineField(j.id, 'titre', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                    style={{
                      width: '100%', boxSizing: 'border-box', background: 'transparent',
                      border: '1px solid transparent', borderRadius: '5px', padding: '3px 6px',
                      fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', outline: 'none',
                    }}
                    onFocus={e => (e.target.style.background = 'var(--bg-2)', e.target.style.borderColor = 'var(--gold)')}
                    onBlurCapture={e => (e.target.style.background = 'transparent', e.target.style.borderColor = 'transparent')}
                  />
                </div>

                {/* 2. CLIENT */}
                <div style={{ fontSize: '12px', color: 'var(--txt-2)' }}>
                  {j.client_nom}
                </div>

                {/* 3. BUDGET EN SAISIE DIRECTE */}
                <div style={{ textAlign: 'right' }}>
                  <input
                    type="number"
                    step="100"
                    defaultValue={j.budget_estime ?? ''}
                    placeholder="0"
                    onBlur={e => parseFloat(e.target.value) !== (j.budget_estime || 0) && updateInlineField(j.id, 'budget', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                    style={{
                      width: '100px', boxSizing: 'border-box', background: 'transparent',
                      border: '1px solid transparent', borderRadius: '5px', padding: '3px 6px',
                      fontSize: '13px', fontWeight: 700, color: 'var(--gold-2)', textAlign: 'right', outline: 'none',
                    }}
                    onFocus={e => (e.target.style.background = 'var(--bg-2)', e.target.style.borderColor = 'var(--gold)')}
                    onBlurCapture={e => (e.target.style.background = 'transparent', e.target.style.borderColor = 'transparent')}
                  />
                </div>

                {/* 4. STATUT EN DROPDOWN DIRECT */}
                <div>
                  <select
                    value={j.statut}
                    onChange={e => updateInlineField(j.id, 'statut', e.target.value)}
                    style={{
                      appearance: 'none', WebkitAppearance: 'none',
                      background: `${stCfg.color}18`, color: stCfg.color,
                      border: `1px solid ${stCfg.color}40`,
                      borderRadius: '20px', padding: '4px 10px',
                      fontSize: '10px', fontWeight: 600, cursor: 'pointer', outline: 'none',
                    }}
                  >
                    {STATUTS.map(s => (
                      <option key={s.value} value={s.value} style={{ background: '#1F2937', color: '#F3F4F6' }}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                  <a
                    href={`/jobs/${j.id}`}
                    title="Fiche détaillée"
                    style={{ background: 'var(--bg-3)', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '5px 6px', color: 'var(--txt-2)', display: 'inline-flex' }}
                  >
                    <Edit3 size={13} />
                  </a>
                  <button
                    onClick={() => handleDelete(j.id)}
                    title="Supprimer"
                    style={{ background: 'var(--red)15', border: '0.5px solid var(--red)30', borderRadius: '6px', padding: '5px 6px', cursor: 'pointer', color: 'var(--red)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
