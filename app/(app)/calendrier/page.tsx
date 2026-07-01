'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Calendar, ChevronLeft, ChevronRight, Plus, MapPin, Clock, Loader2, User } from 'lucide-react'

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

type TypeEvt = 'chantier' | 'devis' | 'facture'

interface Evt {
  id: string
  date: string
  titre: string
  type: TypeEvt
  sous_titre?: string
  couleur: string
}

const TYPE_LABEL: Record<TypeEvt, string> = {
  chantier: 'Chantier',
  devis:    'Devis',
  facture:  'Facture',
}

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstDayOfMonth(y: number, m: number) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1 }
function dateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function CalendrierPage() {
  const [events, setEvents]   = useState<Evt[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected]   = useState<Evt[] | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: jobs }, { data: devis }, { data: factures }] = await Promise.all([
      supabase.from('jobs').select('id, titre, date_debut, date_fin, statut, clients(nom)'),
      supabase.from('devis').select('id, numero, titre, valide_jusqu_au, clients(nom)').not('valide_jusqu_au', 'is', null),
      supabase.from('factures').select('id, numero, date_echeance, statut, clients(nom)').not('date_echeance', 'is', null),
    ])

    const evts: Evt[] = []

    // Jobs → début de chantier
    for (const j of jobs || []) {
      if (j.date_debut) evts.push({
        id: `job-${j.id}-start`,
        date: j.date_debut,
        titre: j.titre,
        type: 'chantier',
        sous_titre: (j as any).clients?.nom,
        couleur: j.statut === 'en_cours' ? '#B8922A' : j.statut === 'terminé' ? '#5CB87A' : '#4a8fd4',
      })
      if (j.date_fin && j.date_fin !== j.date_debut) evts.push({
        id: `job-${j.id}-end`,
        date: j.date_fin,
        titre: `Fin — ${j.titre}`,
        type: 'chantier',
        sous_titre: (j as any).clients?.nom,
        couleur: '#5CB87A',
      })
    }

    // Devis → date d'expiration
    for (const d of devis || []) {
      evts.push({
        id: `devis-${d.id}`,
        date: d.valide_jusqu_au!,
        titre: `Devis ${d.numero}${d.titre ? ` — ${d.titre}` : ''}`,
        type: 'devis',
        sous_titre: (d as any).clients?.nom,
        couleur: '#F59E0B',
      })
    }

    // Factures → date d'échéance
    for (const f of factures || []) {
      if (f.statut !== 'payée' && f.statut !== 'annulée') evts.push({
        id: `fac-${f.id}`,
        date: f.date_echeance!,
        titre: `Échéance ${f.numero}`,
        type: 'facture',
        sous_titre: (f as any).clients?.nom,
        couleur: f.statut === 'en_retard' ? '#E06060' : '#C9A84C',
      })
    }

    setEvents(evts.sort((a, b) => a.date.localeCompare(b.date)))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function eventsForDay(day: number) {
    const key = dateKey(year, month, day)
    return events.filter(e => e.date === key)
  }

  function handleDayClick(day: number) {
    const key = dateKey(year, month, day)
    const evs = events.filter(e => e.date === key)
    setSelectedDate(key)
    setSelected(evs.length > 0 ? evs : null)
  }

  function prev() { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  function next() { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay    = getFirstDayOfMonth(year, month)
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
  const evtsDuMois = events.filter(e => e.date.startsWith(monthKey))
  const chantiers  = evtsDuMois.filter(e => e.type === 'chantier').length
  const devisEvts  = evtsDuMois.filter(e => e.type === 'devis').length
  const factEvts   = evtsDuMois.filter(e => e.type === 'facture').length

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '10px', color: 'var(--txt-3)' }}>
      <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: '13px' }}>Chargement du calendrier…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={18} color="var(--gold)" />
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>Calendrier</h1>
          <span style={{ fontSize: '11px', color: 'var(--txt-3)', background: 'var(--bg-3)', borderRadius: '5px', padding: '2px 7px' }}>{evtsDuMois.length} événements</span>
        </div>
      </div>

      {/* Stats rapides */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {[
          { label: 'Dates chantier', val: chantiers, color: 'var(--gold)'   },
          { label: 'Échéances devis', val: devisEvts, color: 'var(--amber)' },
          { label: 'Échéances factures', val: factEvts, color: 'var(--red)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: s.color }}>{s.val}</span>
            <span style={{ fontSize: '11px', color: 'var(--txt-3)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Nav mois */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button onClick={prev} style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: 'var(--txt-1)', display: 'flex', alignItems: 'center' }}><ChevronLeft size={14} /></button>
        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--txt-1)', minWidth: '160px', textAlign: 'center' }}>{MOIS[month]} {year}</span>
        <button onClick={next} style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: 'var(--txt-1)', display: 'flex', alignItems: 'center' }}><ChevronRight size={14} /></button>
        <button onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()) }}
          style={{ background: 'none', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '11px', color: 'var(--txt-3)' }}>
          Aujourd'hui
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 260px' : '1fr', gap: '16px', alignItems: 'start' }}>
        {/* Grille */}
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '0.5px solid var(--line)' }}>
            {JOURS.map(j => (
              <div key={j} style={{ padding: '10px 0', textAlign: 'center', fontSize: '10px', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{j}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
            {cells.map((day, i) => {
              const evs = day ? eventsForDay(day) : []
              const key = day ? dateKey(year, month, day) : ''
              const isSel = key === selectedDate
              return (
                <div key={i} onClick={() => day && handleDayClick(day)} style={{
                  minHeight: '90px',
                  borderRight: (i + 1) % 7 === 0 ? 'none' : '0.5px solid var(--line)',
                  borderBottom: i < cells.length - 7 ? '0.5px solid var(--line)' : 'none',
                  padding: '6px',
                  background: isSel ? 'var(--ga)' : day && isToday(day) ? 'rgba(184,146,42,0.06)' : 'transparent',
                  cursor: day ? 'pointer' : 'default',
                  outline: isSel ? '0.5px solid var(--gold-3)' : 'none',
                }}>
                  {day && (
                    <>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', fontSize: '11px', fontWeight: isToday(day) ? 700 : 400, color: isToday(day) ? 'var(--gold)' : 'var(--txt-2)', background: isToday(day) ? 'var(--gold-3)' : 'transparent' }}>
                        {day}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                        {evs.slice(0, 2).map(e => (
                          <div key={e.id} style={{ fontSize: '9px', padding: '2px 5px', borderRadius: '3px', background: `${e.couleur}22`, color: e.couleur, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {e.titre}
                          </div>
                        ))}
                        {evs.length > 2 && <div style={{ fontSize: '9px', color: 'var(--txt-3)', paddingLeft: '5px' }}>+{evs.length - 2} autres</div>}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Panneau détail */}
        {selected && (
          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', overflow: 'hidden', position: 'sticky', top: '24px' }}>
            <div style={{ padding: '12px 14px', borderBottom: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>
                {selectedDate && new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <button onClick={() => { setSelected(null); setSelectedDate(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--txt-3)' }}>✕</button>
            </div>
            <div>
              {selected.map((e, i) => (
                <div key={e.id} style={{ padding: '12px 14px', borderBottom: i < selected.length - 1 ? '0.5px solid var(--line)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: e.couleur, flexShrink: 0 }} />
                    <span style={{ fontSize: '10px', fontWeight: 600, color: e.couleur }}>{TYPE_LABEL[e.type]}</span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '3px' }}>{e.titre}</div>
                  {e.sous_titre && <div style={{ fontSize: '10px', color: 'var(--txt-3)', display: 'flex', alignItems: 'center', gap: '4px' }}><User size={9} />{e.sous_titre}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Liste événements à venir */}
      {(() => {
        const todayStr = today.toISOString().split('T')[0]
        const upcoming = events.filter(e => e.date >= todayStr).slice(0, 8)
        if (upcoming.length === 0) return null
        return (
          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={13} color="var(--gold)" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>Prochains événements</span>
            </div>
            {upcoming.map((e, i) => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: i < upcoming.length - 1 ? '0.5px solid var(--line)' : 'none' }}>
                <div style={{ minWidth: '80px', fontSize: '10px', color: 'var(--txt-3)' }}>
                  {new Date(e.date + 'T12:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
                </div>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: e.couleur, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--txt-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.titre}</div>
                  {e.sous_titre && <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>{e.sous_titre}</div>}
                </div>
                <span style={{ fontSize: '9px', fontWeight: 600, color: e.couleur, background: `${e.couleur}18`, padding: '2px 7px', borderRadius: '20px', flexShrink: 0 }}>{TYPE_LABEL[e.type]}</span>
              </div>
            ))}
          </div>
        )
      })()}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
