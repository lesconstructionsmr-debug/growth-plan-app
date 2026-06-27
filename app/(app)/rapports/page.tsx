'use client'

import { BarChart3, TrendingUp, Receipt, Clock, Building2, FileText } from 'lucide-react'

const SECTIONS = [
  { icon: TrendingUp, label: 'Chiffre d\'affaires',   sub: 'Revenus par période',      color: 'var(--green)'  },
  { icon: FileText,   label: 'Devis',                   sub: 'Taux de conversion',       color: 'var(--amber)'  },
  { icon: Receipt,    label: 'Factures & paiements',   sub: 'Encaissements, retards',   color: 'var(--gold)'   },
  { icon: Building2,  label: 'Projets',                 sub: 'Rentabilité par chantier', color: 'var(--blue)'   },
  { icon: Clock,      label: 'Heures travaillées',      sub: 'Pointage par employé',     color: 'var(--purple)' },
]

export default function RapportsPage() {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <BarChart3 size={18} color="var(--gold)" />
        <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>Rapports</h1>
      </div>

      <div style={{
        background: 'var(--ga)', border: '0.5px solid var(--gold-3)',
        borderRadius: '8px', padding: '12px 16px',
        fontSize: '12px', color: 'var(--gold-2)',
      }}>
        Les rapports seront disponibles une fois les premières données enregistrées.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
        {SECTIONS.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} style={{
              background: 'var(--bg-1)', border: '0.5px solid var(--line)',
              borderRadius: '10px', padding: '18px',
              display: 'flex', flexDirection: 'column', gap: '10px',
              opacity: 0.6,
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={15} color={s.color} strokeWidth={1.7} />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>{s.label}</div>
                <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginTop: '2px' }}>{s.sub}</div>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--txt-3)' }}>Bientôt disponible</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
