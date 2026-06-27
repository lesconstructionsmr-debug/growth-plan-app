'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  TrendingUp, Plus, MessageCircle, FileText,
  Building2, User, Phone, Mail, Calendar,
  ChevronDown, MoreHorizontal, GripVertical
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────
type StatutPipeline =
  | 'nouveau'
  | 'contacté'
  | 'qualifié'
  | 'proposition'
  | 'gagné'
  | 'perdu'

interface Lead {
  id: string
  nom: string
  entreprise?: string
  telephone?: string
  email?: string
  montant_estime?: number
  date_creation: string
  statut: StatutPipeline
  priorite: 'basse' | 'normale' | 'haute'
  tags?: string[]
}

// ── Colonnes kanban ──────────────────────────────────────────
const COLONNES: { id: StatutPipeline; label: string; color: string; icon: React.ElementType }[] = [
  { id: 'nouveau',     label: 'Nouveau lead',  color: 'var(--txt-3)', icon: MessageCircle },
  { id: 'contacté',   label: 'Contacté',      color: 'var(--amber)', icon: FileText      },
  { id: 'qualifié',   label: 'Qualifié',      color: 'var(--blue)',  icon: FileText      },
  { id: 'proposition',label: 'Proposition',   color: 'var(--purple)',icon: Calendar      },
  { id: 'gagné',      label: 'Gagné ✓',       color: 'var(--green)', icon: Building2     },
  { id: 'perdu',      label: 'Perdu',         color: 'var(--red)',   icon: Building2     },
]


// ── Composants ───────────────────────────────────────────────

function LeadCard({ lead }: { lead: Lead }) {
  const prioriteColor = lead.priorite === 'haute' ? 'var(--red)' : lead.priorite === 'normale' ? 'var(--amber)' : 'var(--txt-3)'
  return (
    <div style={{
      background: 'var(--bg-1)',
      border: '0.5px solid var(--line)',
      borderRadius: '9px',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      cursor: 'grab',
      transition: 'box-shadow 0.12s',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* Top: nom + priorité */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--txt-1)' }}>{lead.nom}</div>
          {lead.entreprise && (
            <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginTop: '1px' }}>{lead.entreprise}</div>
          )}
        </div>
        <div style={{
          width: '7px', height: '7px', borderRadius: '50%',
          background: prioriteColor, flexShrink: 0, marginTop: '3px',
        }} />
      </div>

      {/* Contact */}
      {(lead.telephone || lead.email) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {lead.telephone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: 'var(--txt-3)' }}>
              <Phone size={9} /> {lead.telephone}
            </div>
          )}
          {lead.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: 'var(--txt-3)' }}>
              <Mail size={9} /> {lead.email}
            </div>
          )}
        </div>
      )}

      {/* Montant + date */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {lead.montant_estime ? (
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gold-2)' }}>
            {lead.montant_estime.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
          </span>
        ) : (
          <span style={{ fontSize: '10px', color: 'var(--txt-3)' }}>—</span>
        )}
        <span style={{ fontSize: '10px', color: 'var(--txt-3)' }}>
          {new Date(lead.date_creation).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex', gap: '4px', paddingTop: '4px',
        borderTop: '0.5px solid var(--line)',
      }}>
        <button style={{
          flex: 1, background: 'var(--ga)', border: '0.5px solid var(--gold-3)',
          borderRadius: '5px', padding: '4px 0',
          fontSize: '10px', color: 'var(--gold-2)', cursor: 'pointer',
        }}>
          Devis
        </button>
        <button style={{
          flex: 1, background: 'var(--bg-2)', border: '0.5px solid var(--line)',
          borderRadius: '5px', padding: '4px 0',
          fontSize: '10px', color: 'var(--txt-3)', cursor: 'pointer',
        }}>
          Appeler
        </button>
      </div>
    </div>
  )
}

function Colonne({ col, leads }: { col: typeof COLONNES[0]; leads: Lead[] }) {
  const Icon = col.icon
  const total = leads.reduce((s, l) => s + (l.montant_estime ?? 0), 0)

  return (
    <div style={{
      width: '230px', minWidth: '230px',
      display: 'flex', flexDirection: 'column',
      gap: '8px',
    }}>
      {/* Header colonne */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 10px',
        background: 'var(--bg-1)', border: '0.5px solid var(--line)',
        borderRadius: '8px',
        borderTop: `2px solid ${col.color}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Icon size={12} color={col.color} strokeWidth={1.8} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)' }}>{col.label}</span>
          <span style={{
            fontSize: '10px', color: 'var(--txt-3)',
            background: 'var(--bg-3)', borderRadius: '4px', padding: '1px 5px',
          }}>
            {leads.length}
          </span>
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)', padding: '2px' }}>
          <Plus size={12} />
        </button>
      </div>

      {/* Total colonne */}
      {total > 0 && (
        <div style={{ fontSize: '10px', color: 'var(--txt-3)', textAlign: 'center' }}>
          {total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
        </div>
      )}

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '120px' }}>
        {leads.map(lead => <LeadCard key={lead.id} lead={lead} />)}

        {leads.length === 0 && (
          <div style={{
            border: '1px dashed var(--line)', borderRadius: '9px',
            padding: '20px 12px', textAlign: 'center',
            fontSize: '10px', color: 'var(--txt-3)',
          }}>
            Déposer ici
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────
export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase
      .from('leads')
      .select('id, nom, email, telephone, valeur_estimee, statut, created_at, source')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setLeads((data ?? []).map((l: any) => ({
          id: l.id,
          nom: l.nom,
          entreprise: l.source ?? undefined,
          telephone: l.telephone ?? undefined,
          email: l.email ?? undefined,
          montant_estime: l.valeur_estimee ? Number(l.valeur_estimee) : undefined,
          date_creation: l.created_at,
          statut: l.statut as StatutPipeline,
          priorite: 'normale' as const,
        })))
      })
  }, [])

  const totalPipeline = leads.reduce((s, l) => s + (l.montant_estime ?? 0), 0)

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp size={18} color="var(--gold)" />
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>Pipeline CRM</h1>
          <span style={{
            fontSize: '11px', color: 'var(--txt-3)',
            background: 'var(--bg-3)', borderRadius: '5px', padding: '2px 7px',
          }}>
            {leads.length} lead{leads.length !== 1 ? 's' : ''}
          </span>
          {totalPipeline > 0 && (
            <span style={{ fontSize: '12px', color: 'var(--gold-2)', fontWeight: 600 }}>
              · {totalPipeline.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
            </span>
          )}
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'var(--gold)', borderRadius: '8px', padding: '8px 14px',
          fontSize: '12px', fontWeight: 600, color: '#0A0A0A', border: 'none', cursor: 'pointer',
        }}>
          <Plus size={13} /> Nouveau lead
        </button>
      </div>

      {/* Kanban — scroll horizontal */}
      <div style={{
        display: 'flex', gap: '12px', overflowX: 'auto',
        paddingBottom: '12px', flex: 1,
      }}>
        {COLONNES.map(col => (
          <Colonne
            key={col.id}
            col={col}
            leads={leads.filter(l => l.statut === col.id)}
          />
        ))}
      </div>
    </div>
  )
}
