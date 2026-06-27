'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  HardHat, Plus, Search,
  CheckCircle2, XCircle,
} from 'lucide-react'

interface EmployeRow {
  id: string
  nom: string
  email: string | null
  poste: string | null
  actif: boolean
}

export default function EmployesPage() {
  const [search, setSearch] = useState('')
  const [employes, setEmployes] = useState<EmployeRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase
      .from('employes')
      .select('id, nom, email, poste, statut')
      .order('nom', { ascending: true })
      .then(({ data }) => {
        setEmployes((data ?? []).map((e: any) => ({
          id: e.id,
          nom: e.nom,
          email: e.email ?? null,
          poste: e.poste ?? null,
          actif: e.statut !== 'inactif',
        })))
        setLoading(false)
      })
  }, [])

  const filtered = employes.filter(e =>
    e.nom.toLowerCase().includes(search.toLowerCase())
    || (e.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HardHat size={18} color="var(--gold)" />
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>Employés</h1>
          <span style={{ fontSize: '11px', color: 'var(--txt-3)', background: 'var(--bg-3)', borderRadius: '5px', padding: '2px 7px' }}>
            {loading ? '…' : employes.length}
          </span>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'var(--gold)', borderRadius: '8px', padding: '8px 14px',
          fontSize: '12px', fontWeight: 600, color: '#0A0A0A', border: 'none', cursor: 'pointer',
        }}>
          <Plus size={13} /> Inviter
        </button>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'var(--bg-1)', border: '0.5px solid var(--line)',
        borderRadius: '8px', padding: '7px 12px', maxWidth: '300px',
      }}>
        <Search size={13} color="var(--txt-3)" />
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background: 'none', border: 'none', outline: 'none', fontSize: '12px', color: 'var(--txt-1)', width: '100%' }}
        />
      </div>

      <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '10px' }}>
            <HardHat size={32} color="var(--bg-4)" strokeWidth={1.2} />
            <p style={{ fontSize: '13px', color: 'var(--txt-3)', margin: 0 }}>Aucun employé pour l'instant</p>
          </div>
        ) : (
          filtered.map(e => {
            const initials = e.nom.split(' ').map((w: string) => w[0]).slice(0, 2).join('')
            return (
              <div key={e.id} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '12px 16px', borderBottom: '0.5px solid var(--line)',
              }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                  background: 'var(--ga)', border: '0.5px solid var(--gold-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 600, color: 'var(--gold-2)',
                }}>
                  {initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--txt-1)' }}>{e.nom}</div>
                  <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>{e.email ?? '—'}</div>
                </div>
                {e.poste && (
                  <span style={{
                    fontSize: '10px', padding: '3px 8px', borderRadius: '5px',
                    background: 'rgba(74,143,212,0.12)', color: 'var(--blue)',
                  }}>
                    {e.poste}
                  </span>
                )}
                <span style={{ fontSize: '11px', color: e.actif ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {e.actif ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                  {e.actif ? 'Actif' : 'Inactif'}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
