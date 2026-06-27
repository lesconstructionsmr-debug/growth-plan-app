'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  Users, Plus, Search, Filter,
  Building2, User, Phone, Mail,
  ChevronRight, MoreHorizontal,
  TrendingUp, CheckCircle2, Clock, Archive
} from 'lucide-react'
import type { StatutClient } from '@/lib/types/models'

// ── Types ────────────────────────────────────────────────────
interface ClientRow {
  id: string
  nom: string
  type: 'particulier' | 'entreprise'
  statut: StatutClient
  email: string | null
  telephone: string | null
  ville: string | null
  nombre_projets: number
  total_facture: number
  cree_le: string
}

// ── Config statuts ───────────────────────────────────────────
const STATUTS: { value: StatutClient | 'tous'; label: string; color: string }[] = [
  { value: 'tous',     label: 'Tous',      color: 'var(--txt-3)' },
  { value: 'prospect', label: 'Prospect',  color: 'var(--amber)' },
  { value: 'actif',    label: 'Actif',     color: 'var(--green)' },
  { value: 'inactif',  label: 'Inactif',   color: 'var(--txt-3)' },
  { value: 'archive',  label: 'Archivé',   color: 'var(--red)'   },
]

function statutIcon(s: StatutClient) {
  switch (s) {
    case 'actif':    return <CheckCircle2 size={11} color="var(--green)" />
    case 'prospect': return <TrendingUp   size={11} color="var(--amber)" />
    case 'inactif':  return <Clock        size={11} color="var(--txt-3)" />
    case 'archive':  return <Archive      size={11} color="var(--red)"   />
  }
}


// ── Composants ───────────────────────────────────────────────

function ClientCard({ client }: { client: ClientRow }) {
  return (
    <a
      href={`/clients/${client.id}`}
      style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '14px 16px',
        borderBottom: '0.5px solid var(--line)',
        textDecoration: 'none',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Avatar */}
      <div style={{
        width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0,
        background: client.type === 'entreprise' ? 'rgba(74,143,212,0.12)' : 'var(--ga)',
        border: `0.5px solid ${client.type === 'entreprise' ? 'rgba(74,143,212,0.3)' : 'var(--gold-3)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {client.type === 'entreprise'
          ? <Building2 size={15} color="var(--blue)" strokeWidth={1.7} />
          : <User size={15} color="var(--gold)" strokeWidth={1.7} />
        }
      </div>

      {/* Infos */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--txt-1)' }}>{client.nom}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
          {client.email && (
            <span style={{ fontSize: '11px', color: 'var(--txt-3)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Mail size={10} /> {client.email}
            </span>
          )}
          {client.telephone && (
            <span style={{ fontSize: '11px', color: 'var(--txt-3)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Phone size={10} /> {client.telephone}
            </span>
          )}
        </div>
      </div>

      {/* Ville */}
      <div style={{ fontSize: '11px', color: 'var(--txt-3)', minWidth: '80px', textAlign: 'center' }}>
        {client.ville ?? '—'}
      </div>

      {/* Projets */}
      <div style={{ fontSize: '12px', color: 'var(--txt-2)', minWidth: '60px', textAlign: 'center' }}>
        {client.nombre_projets} projet{client.nombre_projets !== 1 ? 's' : ''}
      </div>

      {/* Total */}
      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)', minWidth: '80px', textAlign: 'right' }}>
        {client.total_facture > 0
          ? `${client.total_facture.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}`
          : '—'
        }
      </div>

      {/* Statut */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '70px' }}>
        {statutIcon(client.statut)}
        <span style={{ fontSize: '11px', color: 'var(--txt-2)' }}>
          {STATUTS.find(s => s.value === client.statut)?.label}
        </span>
      </div>

      <ChevronRight size={13} color="var(--txt-3)" />
    </a>
  )
}

// ── Page principale ──────────────────────────────────────────
export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const [statut, setStatut] = useState<StatutClient | 'tous'>('tous')
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase
      .from('clients')
      .select('id, nom, email, telephone, ville, created_at')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setClients((data ?? []).map(c => ({
          id: c.id,
          nom: c.nom,
          type: 'particulier' as const,
          statut: 'actif' as const,
          email: c.email ?? null,
          telephone: c.telephone ?? null,
          ville: c.ville ?? null,
          nombre_projets: 0,
          total_facture: 0,
          cree_le: c.created_at,
        })))
        setLoading(false)
      })
  }, [])

  const filtered = clients.filter(c => {
    const matchSearch = c.nom.toLowerCase().includes(search.toLowerCase())
    const matchStatut = statut === 'tous' || c.statut === statut
    return matchSearch && matchStatut
  })

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px' }}>

      {/* ── En-tête ─────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={18} color="var(--gold)" />
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>Clients</h1>
          <span style={{
            fontSize: '11px', color: 'var(--txt-3)',
            background: 'var(--bg-3)', borderRadius: '5px', padding: '2px 7px',
          }}>
            {loading ? '…' : filtered.length}
          </span>
        </div>
        <a href="/clients/nouveau" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'var(--gold)', borderRadius: '8px', padding: '8px 14px',
          fontSize: '12px', fontWeight: 600, color: '#0A0A0A', textDecoration: 'none',
        }}>
          <Plus size={13} /> Nouveau client
        </a>
      </div>

      {/* ── Filtres ──────────────────────────────── */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Recherche */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--bg-1)', border: '0.5px solid var(--line)',
          borderRadius: '8px', padding: '7px 12px', flex: 1, minWidth: '200px', maxWidth: '320px',
        }}>
          <Search size={13} color="var(--txt-3)" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'none', border: 'none', outline: 'none',
              fontSize: '12px', color: 'var(--txt-1)', width: '100%',
            }}
          />
        </div>

        {/* Filtres statut */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {STATUTS.map(s => (
            <button
              key={s.value}
              onClick={() => setStatut(s.value)}
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

      {/* ── Tableau ──────────────────────────────── */}
      <div style={{
        background: 'var(--bg-1)',
        border: '0.5px solid var(--line)',
        borderRadius: '10px',
        overflow: 'hidden',
      }}>
        {/* Header colonnes */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          padding: '10px 16px',
          borderBottom: '0.5px solid var(--line)',
          background: 'var(--bg-2)',
        }}>
          <div style={{ width: '36px', flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Client</div>
          <div style={{ minWidth: '80px', textAlign: 'center', fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ville</div>
          <div style={{ minWidth: '60px', textAlign: 'center', fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Projets</div>
          <div style={{ minWidth: '80px', textAlign: 'right', fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Facturé</div>
          <div style={{ minWidth: '70px', fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Statut</div>
          <div style={{ width: '13px' }} />
        </div>

        {/* Lignes */}
        {filtered.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '60px 20px', gap: '10px',
          }}>
            <Users size={32} color="var(--bg-4)" strokeWidth={1.2} />
            <p style={{ fontSize: '13px', color: 'var(--txt-3)', margin: 0 }}>
              {search ? 'Aucun client trouvé' : 'Aucun client pour l\'instant'}
            </p>
            <a href="/clients/nouveau" style={{
              fontSize: '12px', color: 'var(--gold-2)', textDecoration: 'none', marginTop: '4px',
            }}>
              + Créer le premier client
            </a>
          </div>
        ) : (
          filtered.map(client => <ClientCard key={client.id} client={client} />)
        )}
      </div>
    </div>
  )
}
