'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  FileText, Plus, Search, ChevronRight,
  Clock, CheckCircle2, XCircle, Send,
  AlertCircle, RotateCcw, Archive
} from 'lucide-react'
import type { StatutDevis } from '@/lib/types/models'

// ── Config statuts ───────────────────────────────────────────
const STATUTS: { value: StatutDevis | 'tous'; label: string; color: string; icon: React.ElementType }[] = [
  { value: 'tous',      label: 'Tous',       color: 'var(--txt-3)', icon: FileText     },
  { value: 'brouillon', label: 'Brouillon',  color: 'var(--txt-3)', icon: Archive      },
  { value: 'envoye',    label: 'Envoyé',     color: 'var(--blue)',  icon: Send         },
  { value: 'vu',        label: 'Vu',         color: 'var(--purple)',icon: Clock        },
  { value: 'approuve',  label: 'Approuvé',   color: 'var(--green)', icon: CheckCircle2 },
  { value: 'refuse',    label: 'Refusé',     color: 'var(--red)',   icon: XCircle      },
  { value: 'expire',    label: 'Expiré',     color: 'var(--amber)', icon: AlertCircle  },
  { value: 'converti',  label: 'Facturé',    color: 'var(--gold)',  icon: RotateCcw    },
]

interface DevisRow {
  id: string
  numero: string
  titre: string
  client_nom: string
  statut: StatutDevis
  date_emission: string
  date_validite: string | null
  total_ttc: number
}


function statutBadge(statut: StatutDevis) {
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

export default function DevisPage() {
  const [search, setSearch] = useState('')
  const [statut, setStatut] = useState<StatutDevis | 'tous'>('tous')
  const [devis, setDevis] = useState<DevisRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase
      .from('devis')
      .select('id, numero, titre, statut, date_emission, valide_jusqu_au, montant_ttc, clients(nom)')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setDevis((data ?? []).map((d: any) => ({
          id: d.id,
          numero: d.numero,
          titre: d.titre ?? '',
          client_nom: d.clients?.nom ?? '—',
          statut: d.statut as StatutDevis,
          date_emission: d.date_emission,
          date_validite: d.valide_jusqu_au ?? null,
          total_ttc: Number(d.montant_ttc ?? 0),
        })))
        setLoading(false)
      })
  }, [])

  const filtered = devis.filter(d => {
    const matchSearch = d.titre.toLowerCase().includes(search.toLowerCase())
      || d.client_nom.toLowerCase().includes(search.toLowerCase())
      || d.numero.toLowerCase().includes(search.toLowerCase())
    const matchStatut = statut === 'tous' || d.statut === statut
    return matchSearch && matchStatut
  })

  // Statistiques rapides
  const stats = {
    total:     devis.length,
    enAttente: devis.filter(d => ['envoye', 'vu'].includes(d.statut)).length,
    approuves: devis.filter(d => d.statut === 'approuve').length,
    montant:   devis.filter(d => ['envoye', 'vu', 'approuve'].includes(d.statut))
                 .reduce((s, d) => s + d.total_ttc, 0),
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={18} color="var(--gold)" />
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>Devis</h1>
          <span style={{
            fontSize: '11px', color: 'var(--txt-3)',
            background: 'var(--bg-3)', borderRadius: '5px', padding: '2px 7px',
          }}>
            {loading ? '…' : stats.total}
          </span>
        </div>
        <a href="/devis/nouveau" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'var(--gold)', borderRadius: '8px', padding: '8px 14px',
          fontSize: '12px', fontWeight: 600, color: '#0A0A0A', textDecoration: 'none',
        }}>
          <Plus size={13} /> Nouveau devis
        </a>
      </div>

      {/* Stats rapides */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {[
          { label: 'En attente d\'approbation', value: stats.enAttente.toString(), color: 'var(--amber)' },
          { label: 'Approuvés',                  value: stats.approuves.toString(),  color: 'var(--green)' },
          { label: 'Valeur pipeline',
            value: stats.montant.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }),
            color: 'var(--gold-2)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-1)', border: '0.5px solid var(--line)',
            borderRadius: '8px', padding: '10px 16px', flex: 1, minWidth: '140px',
          }}>
            <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>{s.label}</div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: s.color, marginTop: '4px' }}>{s.value}</div>
          </div>
        ))}
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
            placeholder="Rechercher un devis..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'none', border: 'none', outline: 'none',
              fontSize: '12px', color: 'var(--txt-1)', width: '100%',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {STATUTS.map(s => (
            <button
              key={s.value}
              onClick={() => setStatut(s.value as StatutDevis | 'tous')}
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
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '100px 1fr 140px 90px 100px 80px 20px',
          gap: '10px', padding: '10px 16px',
          background: 'var(--bg-2)', borderBottom: '0.5px solid var(--line)',
        }}>
          {['Numéro', 'Client / Titre', 'Date', 'Validité', 'Statut', 'Total TTC', ''].map((h, i) => (
            <div key={i} style={{ fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {h}
            </div>
          ))}
        </div>

        {/* Lignes */}
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '10px' }}>
            <FileText size={32} color="var(--bg-4)" strokeWidth={1.2} />
            <p style={{ fontSize: '13px', color: 'var(--txt-3)', margin: 0 }}>
              {search ? 'Aucun devis trouvé' : 'Aucun devis pour l\'instant'}
            </p>
            <a href="/devis/nouveau" style={{ fontSize: '12px', color: 'var(--gold-2)', textDecoration: 'none' }}>
              + Créer le premier devis
            </a>
          </div>
        ) : (
          filtered.map(d => (
            <a key={d.id} href={`/devis/${d.id}`} style={{
              display: 'grid',
              gridTemplateColumns: '100px 1fr 140px 90px 100px 80px 20px',
              gap: '10px', padding: '12px 16px',
              borderBottom: '0.5px solid var(--line)',
              textDecoration: 'none', alignItems: 'center',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: '11px', color: 'var(--gold-2)', fontWeight: 600 }}>{d.numero}</span>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--txt-1)', fontWeight: 500 }}>{d.titre}</div>
                <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>{d.client_nom}</div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--txt-3)' }}>
                {new Date(d.date_emission).toLocaleDateString('fr-CA')}
              </span>
              <span style={{ fontSize: '11px', color: d.date_validite && new Date(d.date_validite) < new Date() ? 'var(--red)' : 'var(--txt-3)' }}>
                {d.date_validite ? new Date(d.date_validite).toLocaleDateString('fr-CA') : '—'}
              </span>
              {statutBadge(d.statut)}
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)', textAlign: 'right' }}>
                {d.total_ttc.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </span>
              <ChevronRight size={13} color="var(--txt-3)" />
            </a>
          ))
        )}
      </div>
    </div>
  )
}
