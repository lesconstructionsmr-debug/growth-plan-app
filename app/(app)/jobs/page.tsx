'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  Building2, Plus, Search, ChevronRight,
  MapPin, Calendar, Clock, CheckCircle2,
  PauseCircle, XCircle, Circle, Users
} from 'lucide-react'
import type { StatutProjet } from '@/lib/types/models'

const STATUTS: { value: StatutProjet | 'tous'; label: string; color: string; icon: React.ElementType }[] = [
  { value: 'tous',       label: 'Tous',         color: 'var(--txt-3)', icon: Circle       },
  { value: 'brouillon',  label: 'Brouillon',    color: 'var(--txt-3)', icon: Circle       },
  { value: 'en_attente', label: 'En attente',   color: 'var(--amber)', icon: Clock        },
  { value: 'en_cours',   label: 'En cours',     color: 'var(--blue)',  icon: Building2    },
  { value: 'en_pause',   label: 'En pause',     color: 'var(--purple)',icon: PauseCircle  },
  { value: 'termine',    label: 'Terminé',      color: 'var(--green)', icon: CheckCircle2 },
  { value: 'annule',     label: 'Annulé',       color: 'var(--red)',   icon: XCircle      },
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
  responsable_nom: string | null
}


function statutBadge(statut: StatutProjet) {
  const s = STATUTS.find(x => x.value === statut)
  if (!s) return null
  const Icon = s.icon
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '10px', padding: '3px 8px', borderRadius: '5px',
      background: `${s.color}18`, color: s.color, fontWeight: 500,
    }}>
      <Icon size={10} /> {s.label}
    </span>
  )
}

export default function JobsPage() {
  const [search, setSearch] = useState('')
  const [statut, setStatut] = useState<StatutProjet | 'tous'>('tous')
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase
      .from('jobs')
      .select('id, titre, statut, date_debut, date_fin, budget, adresse, clients(nom)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setJobs((data ?? []).map((j: any) => ({
          id: j.id,
          titre: j.titre,
          client_nom: j.clients?.nom ?? '—',
          statut: j.statut as StatutProjet,
          ville_chantier: j.adresse ?? null,
          date_debut: j.date_debut ?? null,
          date_fin_prevue: j.date_fin ?? null,
          budget_estime: j.budget ?? null,
          responsable_nom: null,
        })))
        setLoading(false)
      })
  }, [])

  const filtered = jobs.filter(j => {
    const matchSearch = j.titre.toLowerCase().includes(search.toLowerCase())
      || j.client_nom.toLowerCase().includes(search.toLowerCase())
    const matchStatut = statut === 'tous' || j.statut === statut
    return matchSearch && matchStatut
  })

  const actifs = jobs.filter(j => j.statut === 'en_cours').length

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Building2 size={18} color="var(--gold)" />
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>Jobs / Projets</h1>
          <span style={{
            fontSize: '11px', color: 'var(--txt-3)',
            background: 'var(--bg-3)', borderRadius: '5px', padding: '2px 7px',
          }}>
            {loading ? '…' : jobs.length}
          </span>
          {actifs > 0 && (
            <span style={{
              fontSize: '11px', color: 'var(--blue)',
              background: 'rgba(74,143,212,0.12)', borderRadius: '5px', padding: '2px 7px',
            }}>
              {actifs} en cours
            </span>
          )}
        </div>
        <a href="/jobs/nouveau" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'var(--gold)', borderRadius: '8px', padding: '8px 14px',
          fontSize: '12px', fontWeight: 600, color: '#0A0A0A', textDecoration: 'none',
        }}>
          <Plus size={13} /> Nouveau job
        </a>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--bg-1)', border: '0.5px solid var(--line)',
          borderRadius: '8px', padding: '7px 12px', flex: 1, minWidth: '200px', maxWidth: '300px',
        }}>
          <Search size={13} color="var(--txt-3)" />
          <input
            type="text"
            placeholder="Rechercher un job..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', fontSize: '12px', color: 'var(--txt-1)', width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {STATUTS.map(s => (
            <button
              key={s.value}
              onClick={() => setStatut(s.value as StatutProjet | 'tous')}
              style={{
                background: statut === s.value ? 'var(--ga)' : 'var(--bg-1)',
                border: `0.5px solid ${statut === s.value ? 'var(--gold-3)' : 'var(--line)'}`,
                borderRadius: '6px', padding: '5px 10px',
                fontSize: '11px', cursor: 'pointer',
                color: statut === s.value ? 'var(--gold-2)' : 'var(--txt-3)',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div style={{
        background: 'var(--bg-1)', border: '0.5px solid var(--line)',
        borderRadius: '10px', overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 120px 100px 100px 90px 80px 20px',
          gap: '10px', padding: '10px 16px',
          background: 'var(--bg-2)', borderBottom: '0.5px solid var(--line)',
        }}>
          {['Projet / Client', 'Localisation', 'Début', 'Fin prévue', 'Statut', 'Budget', ''].map((h, i) => (
            <div key={i} style={{ fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '10px' }}>
            <Building2 size={32} color="var(--bg-4)" strokeWidth={1.2} />
            <p style={{ fontSize: '13px', color: 'var(--txt-3)', margin: 0 }}>
              {search ? 'Aucun job trouvé' : 'Aucun job pour l\'instant'}
            </p>
            <a href="/jobs/nouveau" style={{ fontSize: '12px', color: 'var(--gold-2)', textDecoration: 'none' }}>
              + Créer le premier job
            </a>
          </div>
        ) : (
          filtered.map(job => (
            <a key={job.id} href={`/jobs/${job.id}`} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px 100px 100px 90px 80px 20px',
              gap: '10px', padding: '12px 16px',
              borderBottom: '0.5px solid var(--line)',
              textDecoration: 'none', alignItems: 'center',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <div style={{ fontSize: '12px', color: 'var(--txt-1)', fontWeight: 500 }}>{job.titre}</div>
                <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>{job.client_nom}</div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--txt-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {job.ville_chantier ? <><MapPin size={10} />{job.ville_chantier}</> : '—'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--txt-3)' }}>
                {job.date_debut ? new Date(job.date_debut).toLocaleDateString('fr-CA') : '—'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--txt-3)' }}>
                {job.date_fin_prevue ? new Date(job.date_fin_prevue).toLocaleDateString('fr-CA') : '—'}
              </span>
              {statutBadge(job.statut)}
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>
                {job.budget_estime
                  ? job.budget_estime.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })
                  : '—'}
              </span>
              <ChevronRight size={13} color="var(--txt-3)" />
            </a>
          ))
        )}
      </div>
    </div>
  )
}
