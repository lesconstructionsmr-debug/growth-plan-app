'use client'

import { Receipt, Plus, Search } from 'lucide-react'
import { useState } from 'react'

type StatutDepense = 'toutes' | 'en_attente' | 'approuvee' | 'remboursee' | 'refusee'

const FILTRES: { id: StatutDepense; label: string }[] = [
  { id: 'toutes',      label: 'Toutes'      },
  { id: 'en_attente',  label: 'En attente'  },
  { id: 'approuvee',   label: 'Approuvée'   },
  { id: 'remboursee',  label: 'Remboursée'  },
  { id: 'refusee',     label: 'Refusée'     },
]

const CATEGORIES = [
  'Matériaux', 'Outillage', 'Sous-traitant', 'Transport', 'Hébergement', 'Équipement', 'Autre',
]

const DEPENSES_PLACEHOLDER: never[] = []

const statutStyle = (s: string): React.CSSProperties => {
  const map: Record<string, { bg: string; color: string }> = {
    en_attente: { bg: 'var(--amber)18', color: 'var(--amber)' },
    approuvee:  { bg: 'var(--green)18',  color: 'var(--green)'  },
    remboursee: { bg: 'var(--blue)18',   color: 'var(--blue)'   },
    refusee:    { bg: 'var(--red)18',    color: 'var(--red)'    },
  }
  const c = map[s] ?? { bg: 'var(--bg-2)', color: 'var(--txt-3)' }
  return {
    display: 'inline-flex', alignItems: 'center',
    padding: '3px 8px', borderRadius: '20px',
    fontSize: '10px', fontWeight: 600,
    background: c.bg, color: c.color,
  }
}

const labelMap: Record<string, string> = {
  en_attente: 'En attente',
  approuvee:  'Approuvée',
  remboursee: 'Remboursée',
  refusee:    'Refusée',
}

export default function DepensesPage() {
  const [filtre, setFiltre] = useState<StatutDepense>('toutes')
  const [recherche, setRecherche] = useState('')

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-2)', border: '0.5px solid var(--line)',
    borderRadius: '7px', padding: '8px 10px 8px 32px',
    fontSize: '12px', color: 'var(--txt-1)', outline: 'none', width: '100%',
    fontFamily: 'inherit',
  }

  const filtered = DEPENSES_PLACEHOLDER

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Receipt size={18} color="var(--gold)" />
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>
            Dépenses
          </h1>
          <span style={{
            background: 'var(--bg-2)', border: '0.5px solid var(--line)',
            borderRadius: '20px', padding: '2px 8px', fontSize: '11px', color: 'var(--txt-3)',
          }}>
            {filtered.length}
          </span>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'var(--gold)', border: 'none', borderRadius: '8px',
          padding: '8px 14px', fontSize: '12px', fontWeight: 600,
          color: '#0A0A0A', cursor: 'pointer',
        }}>
          <Plus size={14} /> Nouvelle dépense
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { label: 'Ce mois-ci',    value: '0 $',        color: 'var(--txt-1)' },
          { label: 'En attente',    value: '0 $',        color: 'var(--amber)'  },
          { label: 'Non facturées', value: '0 dépenses', color: 'var(--red)'    },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-1)', border: '0.5px solid var(--line)',
            borderRadius: '10px', padding: '16px 18px',
          }}>
            <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginBottom: '6px' }}>{s.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Recherche */}
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-3)' }} />
        <input
          type="text"
          placeholder="Rechercher une dépense..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {FILTRES.map(f => (
          <button
            key={f.id}
            onClick={() => setFiltre(f.id)}
            style={{
              padding: '5px 12px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer',
              border: filtre === f.id ? '0.5px solid var(--gold)' : '0.5px solid var(--line)',
              background: filtre === f.id ? 'var(--gold-3)' : 'var(--bg-2)',
              color: filtre === f.id ? 'var(--gold-2)' : 'var(--txt-3)',
              fontWeight: filtre === f.id ? 600 : 400,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--bg-1)', border: '0.5px solid var(--line)',
        borderRadius: '10px', overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 120px 130px 120px 100px 100px',
          padding: '10px 16px',
          borderBottom: '0.5px solid var(--line)',
        }}>
          {['DESCRIPTION / PROJET', 'CATÉGORIE', 'DATE', 'MONTANT', 'STATUT', 'REÇU'].map(h => (
            <div key={h} style={{ fontSize: '9px', fontWeight: 700, color: 'var(--txt-3)', letterSpacing: '0.06em' }}>
              {h}
            </div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Receipt size={32} color="var(--txt-3)" strokeWidth={1} style={{ marginBottom: '12px' }} />
            <div style={{ fontSize: '13px', color: 'var(--txt-3)', marginBottom: '8px' }}>Aucune dépense pour l'instant</div>
            <button style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '12px', color: 'var(--gold)', fontWeight: 600,
            }}>
              + Enregistrer la première dépense
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
