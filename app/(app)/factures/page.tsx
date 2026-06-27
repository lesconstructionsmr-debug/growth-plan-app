'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  Receipt, Plus, Search, ChevronRight,
  CheckCircle2, Clock, AlertCircle, XCircle,
  Send, Circle, RotateCcw, Bell
} from 'lucide-react'
import type { StatutFacture } from '@/lib/types/models'

const STATUTS: { value: StatutFacture | 'tous'; label: string; color: string; icon: React.ElementType }[] = [
  { value: 'tous',      label: 'Toutes',      color: 'var(--txt-3)', icon: Circle       },
  { value: 'brouillon', label: 'Brouillon',   color: 'var(--txt-3)', icon: Circle       },
  { value: 'envoyee',   label: 'Envoyée',     color: 'var(--blue)',  icon: Send         },
  { value: 'vue',       label: 'Vue',         color: 'var(--purple)',icon: Clock        },
  { value: 'partielle', label: 'Partielle',   color: 'var(--amber)', icon: RotateCcw    },
  { value: 'payee',     label: 'Payée ✓',     color: 'var(--green)', icon: CheckCircle2 },
  { value: 'en_retard', label: 'En retard',   color: 'var(--red)',   icon: AlertCircle  },
  { value: 'annulee',   label: 'Annulée',     color: 'var(--txt-3)', icon: XCircle      },
]

interface FactureRow {
  id: string
  numero: string
  titre: string
  client_nom: string
  statut: StatutFacture
  date_emission: string
  date_echeance: string | null
  total_ttc: number
  montant_paye: number
  solde_restant: number
}


function statutBadge(statut: StatutFacture) {
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

export default function FacturesPage() {
  const [search, setSearch] = useState('')
  const [statut, setStatut] = useState<StatutFacture | 'tous'>('tous')
  const [factures, setFactures] = useState<FactureRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase
      .from('factures')
      .select('id, numero, titre, statut, date_emission, date_echeance, montant_ttc, clients(nom)')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setFactures((data ?? []).map((f: any) => {
          const total = Number(f.montant_ttc ?? 0)
          const paye = f.statut === 'payee' ? total : 0
          return {
            id: f.id,
            numero: f.numero,
            titre: f.titre ?? '',
            client_nom: f.clients?.nom ?? '—',
            statut: f.statut as StatutFacture,
            date_emission: f.date_emission,
            date_echeance: f.date_echeance ?? null,
            total_ttc: total,
            montant_paye: paye,
            solde_restant: total - paye,
          }
        }))
        setLoading(false)
      })
  }, [])

  const filtered = factures.filter(f => {
    const matchSearch = f.titre.toLowerCase().includes(search.toLowerCase())
      || f.client_nom.toLowerCase().includes(search.toLowerCase())
      || f.numero.toLowerCase().includes(search.toLowerCase())
    const matchStatut = statut === 'tous' || f.statut === statut
    return matchSearch && matchStatut
  })

  const totalImpaye = factures
    .filter(f => ['envoyee', 'vue', 'partielle', 'en_retard'].includes(f.statut))
    .reduce((s, f) => s + f.solde_restant, 0)
  const totalPaye = factures
    .filter(f => f.statut === 'payee')
    .reduce((s, f) => s + f.total_ttc, 0)
  const enRetard = factures.filter(f => f.statut === 'en_retard').length

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Receipt size={18} color="var(--gold)" />
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>Factures</h1>
          <span style={{
            fontSize: '11px', color: 'var(--txt-3)',
            background: 'var(--bg-3)', borderRadius: '5px', padding: '2px 7px',
          }}>
            {loading ? '…' : factures.length}
          </span>
          {enRetard > 0 && (
            <span style={{
              fontSize: '11px', color: 'var(--red)',
              background: 'rgba(224,96,96,0.1)', borderRadius: '5px', padding: '2px 7px',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <AlertCircle size={10} /> {enRetard} en retard
            </span>
          )}
        </div>
        <a href="/factures/nouvelle" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'var(--gold)', borderRadius: '8px', padding: '8px 14px',
          fontSize: '12px', fontWeight: 600, color: '#0A0A0A', textDecoration: 'none',
        }}>
          <Plus size={13} /> Nouvelle facture
        </a>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {[
          { label: 'À collecter',  value: totalImpaye.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }), color: 'var(--amber)' },
          { label: 'En retard',    value: `${enRetard} facture${enRetard !== 1 ? 's' : ''}`, color: 'var(--red)'   },
          { label: 'Encaissé (total)', value: totalPaye.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }), color: 'var(--green)' },
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

      {/* Bannière rappels automatiques */}
      {enRetard > 0 && (
        <div style={{
          background: 'var(--red)10', border: '0.5px solid var(--red)',
          borderRadius: '10px', padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <Bell size={15} color="var(--red)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '2px' }}>
              {enRetard} facture{enRetard > 1 ? 's' : ''} en retard — rappels automatiques activés
            </div>
            <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>
              Un rappel de paiement est envoyé automatiquement 7 jours après la date d'échéance, puis chaque 7 jours. Consultez chaque facture pour envoyer un rappel manuel.
            </div>
          </div>
          <span style={{
            padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 600,
            background: 'var(--red)20', color: 'var(--red)', whiteSpace: 'nowrap',
          }}>
            Auto-rappel ON
          </span>
        </div>
      )}

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
            placeholder="Rechercher une facture..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', fontSize: '12px', color: 'var(--txt-1)', width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {STATUTS.map(s => (
            <button
              key={s.value}
              onClick={() => setStatut(s.value as StatutFacture | 'tous')}
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
          gridTemplateColumns: '100px 1fr 100px 100px 90px 90px 90px 20px',
          gap: '10px', padding: '10px 16px',
          background: 'var(--bg-2)', borderBottom: '0.5px solid var(--line)',
        }}>
          {['Numéro', 'Client / Titre', 'Émission', 'Échéance', 'Statut', 'Total TTC', 'Solde dû', ''].map((h, i) => (
            <div key={i} style={{ fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '10px' }}>
            <Receipt size={32} color="var(--bg-4)" strokeWidth={1.2} />
            <p style={{ fontSize: '13px', color: 'var(--txt-3)', margin: 0 }}>
              {search ? 'Aucune facture trouvée' : 'Aucune facture pour l\'instant'}
            </p>
            <a href="/factures/nouvelle" style={{ fontSize: '12px', color: 'var(--gold-2)', textDecoration: 'none' }}>
              + Créer la première facture
            </a>
          </div>
        ) : (
          filtered.map(f => (
            <a key={f.id} href={`/factures/${f.id}`} style={{
              display: 'grid',
              gridTemplateColumns: '100px 1fr 100px 100px 90px 90px 90px 20px',
              gap: '10px', padding: '12px 16px',
              borderBottom: '0.5px solid var(--line)',
              textDecoration: 'none', alignItems: 'center',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: '11px', color: 'var(--gold-2)', fontWeight: 600 }}>{f.numero}</span>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--txt-1)', fontWeight: 500 }}>{f.titre}</div>
                <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>{f.client_nom}</div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--txt-3)' }}>{new Date(f.date_emission).toLocaleDateString('fr-CA')}</span>
              <span style={{ fontSize: '11px', color: f.date_echeance && f.statut === 'en_retard' ? 'var(--red)' : 'var(--txt-3)' }}>
                {f.date_echeance ? new Date(f.date_echeance).toLocaleDateString('fr-CA') : '—'}
              </span>
              {statutBadge(f.statut)}
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>
                {f.total_ttc.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: f.solde_restant > 0 ? 'var(--red)' : 'var(--green)' }}>
                {f.solde_restant > 0
                  ? f.solde_restant.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })
                  : '✓ Payée'}
              </span>
              <ChevronRight size={13} color="var(--txt-3)" />
            </a>
          ))
        )}
      </div>
    </div>
  )
}
