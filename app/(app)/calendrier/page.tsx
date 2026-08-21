'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { getBrowserClient } from '@/lib/supabase/browser'
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Clock, Loader2, User,
  X, MapPin, Trash2, Edit3, Check
} from 'lucide-react'

/* ───────────── constants ───────────── */
const JOURS_COURT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const JOURS_LONG  = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche']
const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

const HEURES = Array.from({ length: 13 }, (_, i) => i + 7) // 7h → 19h

const TYPE_OPTIONS = [
  { value: 'rdv',        label: 'RDV',        color: '#4a8fd4' },
  { value: 'visite',     label: 'Visite',     color: '#5CB87A' },
  { value: 'evenement',  label: 'Événement',  color: '#B8922A' },
] as const

const STATUT_OPTIONS = [
  { value: 'planifie',  label: 'Planifié' },
  { value: 'confirme',  label: 'Confirmé' },
  { value: 'complete',  label: 'Complété' },
  { value: 'annule',    label: 'Annulé' },
] as const

type ViewMode = 'jour' | 'semaine' | 'mois'

/* ───────────── interfaces ───────────── */
interface CalEvent {
  id: string
  titre: string
  type: string
  description: string | null
  date: string
  heure_debut: string | null
  heure_fin: string | null
  client_id: string | null
  job_id: string | null
  employe_id: string | null
  adresse: string | null
  couleur: string | null
  statut: string
  employes?: { nom: string } | null
  clients?: { nom: string } | null
}

interface Employe { id: string; nom: string; poste: string | null }
interface ClientOption { id: string; nom: string }
interface JobOption { id: string; titre: string }

/* ───────────── date helpers ───────────── */
function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function getMonday(d: Date) { const r = new Date(d); const day = r.getDay(); r.setDate(r.getDate() - (day === 0 ? 6 : day - 1)); return r }
function isSameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate() }

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstDayOfMonth(y: number, m: number) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1 }

function timeToMinutes(t: string | null) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

function getTypeColor(type: string, couleur: string | null) {
  if (couleur) return couleur
  return TYPE_OPTIONS.find(t => t.value === type)?.color ?? '#B8922A'
}

/* ───────────── COMPONENT ───────────── */
export default function CalendrierPage() {
  const today = new Date()
  const [view, setView] = useState<ViewMode>('semaine')
  const [currentDate, setCurrentDate] = useState(today)
  const [events, setEvents] = useState<CalEvent[]>([])
  const [employes, setEmployes] = useState<Employe[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [jobs, setJobs] = useState<JobOption[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null)
  const [formData, setFormData] = useState({
    titre: '', type: 'rdv', description: '', date: '',
    heure_debut: '09:00', heure_fin: '10:00',
    client_id: '', job_id: '', employe_id: '', adresse: '', statut: 'planifie',
  })

  // Detail panel
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null)

  const supabase = getBrowserClient()

  /* ── load dropdown options ── */
  useEffect(() => {
    supabase.from('employes').select('id, nom, poste').order('nom').then(({ data }) => setEmployes(data ?? []))
    supabase.from('clients').select('id, nom').order('nom').then(({ data }) => setClients(data ?? []))
    supabase.from('jobs').select('id, titre').order('titre').then(({ data }) => setJobs(data ?? []))
  }, [])

  /* ── compute date range for current view ── */
  const { rangeStart, rangeEnd } = useMemo(() => {
    if (view === 'jour') {
      return { rangeStart: dateKey(currentDate), rangeEnd: dateKey(currentDate) }
    }
    if (view === 'semaine') {
      const mon = getMonday(currentDate)
      return { rangeStart: dateKey(mon), rangeEnd: dateKey(addDays(mon, 6)) }
    }
    // mois
    const y = currentDate.getFullYear(), m = currentDate.getMonth()
    const first = new Date(y, m, 1)
    const last = new Date(y, m + 1, 0)
    return { rangeStart: dateKey(first), rangeEnd: dateKey(last) }
  }, [view, currentDate])

  /* ── load events ── */
  const loadEvents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/calendar-events?start=${rangeStart}&end=${rangeEnd}`)
      if (res.ok) setEvents(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }, [rangeStart, rangeEnd])

  useEffect(() => { loadEvents() }, [loadEvents])

  /* ── navigation ── */
  function goToday() { setCurrentDate(new Date()) }
  function goPrev() {
    if (view === 'jour') setCurrentDate(d => addDays(d, -1))
    else if (view === 'semaine') setCurrentDate(d => addDays(d, -7))
    else setCurrentDate(d => { const r = new Date(d); r.setMonth(r.getMonth() - 1); return r })
  }
  function goNext() {
    if (view === 'jour') setCurrentDate(d => addDays(d, 1))
    else if (view === 'semaine') setCurrentDate(d => addDays(d, 7))
    else setCurrentDate(d => { const r = new Date(d); r.setMonth(r.getMonth() + 1); return r })
  }

  /* ── title label ── */
  const titleLabel = useMemo(() => {
    if (view === 'jour') return currentDate.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    if (view === 'semaine') {
      const mon = getMonday(currentDate)
      const sun = addDays(mon, 6)
      return `${mon.getDate()} ${MOIS[mon.getMonth()]} — ${sun.getDate()} ${MOIS[sun.getMonth()]} ${sun.getFullYear()}`
    }
    return `${MOIS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
  }, [view, currentDate])

  /* ── modal handlers ── */
  function openCreate(date?: string, heure?: string, employeId?: string) {
    setEditingEvent(null)
    setFormData({
      titre: '', type: 'rdv', description: '',
      date: date || dateKey(currentDate),
      heure_debut: heure || '09:00',
      heure_fin: heure ? `${String(Number(heure.split(':')[0]) + 1).padStart(2, '0')}:00` : '10:00',
      client_id: '', job_id: '', employe_id: employeId || '', adresse: '', statut: 'planifie',
    })
    setShowModal(true)
  }

  function openEdit(evt: CalEvent) {
    setEditingEvent(evt)
    setFormData({
      titre: evt.titre, type: evt.type, description: evt.description || '',
      date: evt.date, heure_debut: evt.heure_debut || '09:00', heure_fin: evt.heure_fin || '10:00',
      client_id: evt.client_id || '', job_id: evt.job_id || '', employe_id: evt.employe_id || '',
      adresse: evt.adresse || '', statut: evt.statut,
    })
    setSelectedEvent(null)
    setShowModal(true)
  }

  async function handleSave() {
    if (!formData.titre.trim() || !formData.date) return
    const payload = {
      ...formData,
      client_id: formData.client_id || null,
      job_id: formData.job_id || null,
      employe_id: formData.employe_id || null,
    }

    if (editingEvent) {
      await fetch('/api/calendar-events', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingEvent.id, ...payload }) })
    } else {
      await fetch('/api/calendar-events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    setShowModal(false)
    loadEvents()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/calendar-events?id=${id}`, { method: 'DELETE' })
    setSelectedEvent(null)
    loadEvents()
  }

  /* ── events for a specific day ── */
  function eventsForDay(d: string) { return events.filter(e => e.date === d) }

  /* ── week days array ── */
  const weekDays = useMemo(() => {
    const mon = getMonday(currentDate)
    return Array.from({ length: 7 }, (_, i) => addDays(mon, i))
  }, [currentDate])

  /* ── current time line ── */
  const nowMinutes = today.getHours() * 60 + today.getMinutes()
  const startMinute = 7 * 60
  const endMinute = 19 * 60
  const nowPct = Math.max(0, Math.min(100, ((nowMinutes - startMinute) / (endMinute - startMinute)) * 100))

  /* ──────────── LOADING ──────────── */
  if (loading && events.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '10px', color: 'var(--txt-3)' }}>
      <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: '13px' }}>Chargement du calendrier…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  /* ──────────── RENDER ──────────── */
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1200px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={18} color="var(--gold)" />
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>Calendrier</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* View toggle */}
          {(['jour', 'semaine', 'mois'] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
              background: view === v ? 'var(--gold)' : 'var(--bg-2)',
              color: view === v ? '#000' : 'var(--txt-2)',
              border: view === v ? 'none' : '0.5px solid var(--line)',
            }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
          <button onClick={() => openCreate()} style={{
            display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px',
            background: 'var(--gold)', color: '#000', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer',
          }}>
            <Plus size={14} /> Nouveau
          </button>
        </div>
      </div>

      {/* ── Nav ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button onClick={goPrev} style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: 'var(--txt-1)', display: 'flex', alignItems: 'center' }}><ChevronLeft size={14} /></button>
        <button onClick={goNext} style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: 'var(--txt-1)', display: 'flex', alignItems: 'center' }}><ChevronRight size={14} /></button>
        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--txt-1)', minWidth: '200px' }}>{titleLabel}</span>
        <button onClick={goToday} style={{ background: 'none', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '11px', color: 'var(--txt-3)' }}>Aujourd'hui</button>
      </div>

      {/* ── Main grid with optional detail panel ── */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedEvent ? '1fr 280px' : '1fr', gap: '16px', alignItems: 'start' }}>

        {/* ─── WEEK VIEW ─── */}
        {view === 'semaine' && (
          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(7, 1fr)', borderBottom: '0.5px solid var(--line)' }}>
              <div style={{ padding: '10px 0' }} />
              {weekDays.map((d, i) => {
                const isT = isSameDay(d, today)
                return (
                  <div key={i} style={{ padding: '10px 6px', textAlign: 'center', borderLeft: '0.5px solid var(--line)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--txt-3)', textTransform: 'uppercase', fontWeight: 600 }}>{JOURS_COURT[i]}</div>
                    <div style={{ fontSize: '16px', fontWeight: isT ? 700 : 400, color: isT ? 'var(--gold)' : 'var(--txt-1)', background: isT ? 'var(--gold-3)' : 'transparent', borderRadius: '50%', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                      {d.getDate()}
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Time grid */}
            <div style={{ position: 'relative' }}>
              {/* Current time line */}
              {nowMinutes >= startMinute && nowMinutes <= endMinute && weekDays.some(d => isSameDay(d, today)) && (
                <div style={{ position: 'absolute', top: `${nowPct}%`, left: '50px', right: 0, height: '2px', background: '#E06060', zIndex: 5, pointerEvents: 'none' }}>
                  <div style={{ position: 'absolute', left: '-4px', top: '-3px', width: '8px', height: '8px', borderRadius: '50%', background: '#E06060' }} />
                </div>
              )}
              {HEURES.map(h => (
                <div key={h} style={{ display: 'grid', gridTemplateColumns: '50px repeat(7, 1fr)', minHeight: '50px', borderBottom: '0.5px solid var(--line)' }}>
                  <div style={{ padding: '4px 6px 0 0', textAlign: 'right', fontSize: '10px', color: 'var(--txt-3)' }}>{h}:00</div>
                  {weekDays.map((d, di) => {
                    const dk = dateKey(d)
                    const dayEvts = eventsForDay(dk).filter(e => {
                      const m = timeToMinutes(e.heure_debut)
                      return m !== null && m >= h * 60 && m < (h + 1) * 60
                    })
                    return (
                      <div key={di} onClick={() => openCreate(dk, `${String(h).padStart(2, '0')}:00`)}
                        style={{ borderLeft: '0.5px solid var(--line)', padding: '2px', cursor: 'pointer', position: 'relative', minHeight: '50px' }}>
                        {dayEvts.map(evt => {
                          const c = getTypeColor(evt.type, evt.couleur)
                          return (
                            <div key={evt.id} onClick={(e) => { e.stopPropagation(); setSelectedEvent(evt) }}
                              style={{ background: `${c}22`, border: `1px solid ${c}44`, borderLeft: `3px solid ${c}`, borderRadius: '4px', padding: '3px 5px', marginBottom: '2px', cursor: 'pointer', fontSize: '10px' }}>
                              <div style={{ fontWeight: 600, color: c, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evt.titre}</div>
                              <div style={{ color: 'var(--txt-3)', fontSize: '9px' }}>
                                {evt.heure_debut?.slice(0, 5)}{evt.heure_fin ? ` - ${evt.heure_fin.slice(0, 5)}` : ''}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── DAY VIEW ─── */}
        {view === 'jour' && (
          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>
            {/* Employee column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: `50px ${employes.length > 0 ? `repeat(${Math.max(employes.length, 1)}, 1fr)` : '1fr'}`, borderBottom: '0.5px solid var(--line)' }}>
              <div style={{ padding: '10px 0' }} />
              {employes.length > 0 ? employes.map(emp => (
                <div key={emp.id} style={{ padding: '10px 6px', textAlign: 'center', borderLeft: '0.5px solid var(--line)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-1)' }}>{emp.nom}</div>
                  {emp.poste && <div style={{ fontSize: '9px', color: 'var(--txt-3)' }}>{emp.poste}</div>}
                </div>
              )) : (
                <div style={{ padding: '10px 6px', textAlign: 'center', borderLeft: '0.5px solid var(--line)', fontSize: '11px', color: 'var(--txt-3)' }}>Tous</div>
              )}
            </div>
            {/* Time slots */}
            <div style={{ position: 'relative' }}>
              {isSameDay(currentDate, today) && nowMinutes >= startMinute && nowMinutes <= endMinute && (
                <div style={{ position: 'absolute', top: `${nowPct}%`, left: '50px', right: 0, height: '2px', background: '#E06060', zIndex: 5, pointerEvents: 'none' }}>
                  <div style={{ position: 'absolute', left: '-4px', top: '-3px', width: '8px', height: '8px', borderRadius: '50%', background: '#E06060' }} />
                </div>
              )}
              {HEURES.map(h => {
                const dk = dateKey(currentDate)
                const cols = employes.length > 0 ? employes : [{ id: '__all', nom: 'Tous', poste: null }]
                return (
                  <div key={h} style={{ display: 'grid', gridTemplateColumns: `50px ${cols.length > 0 ? `repeat(${cols.length}, 1fr)` : '1fr'}`, minHeight: '50px', borderBottom: '0.5px solid var(--line)' }}>
                    <div style={{ padding: '4px 6px 0 0', textAlign: 'right', fontSize: '10px', color: 'var(--txt-3)' }}>{h}:00</div>
                    {cols.map(emp => {
                      const dayEvts = eventsForDay(dk).filter(e => {
                        const m = timeToMinutes(e.heure_debut)
                        const matchHour = m !== null && m >= h * 60 && m < (h + 1) * 60
                        if (emp.id === '__all') return matchHour
                        return matchHour && e.employe_id === emp.id
                      })
                      return (
                        <div key={emp.id} onClick={() => openCreate(dk, `${String(h).padStart(2, '0')}:00`, emp.id !== '__all' ? emp.id : undefined)}
                          style={{ borderLeft: '0.5px solid var(--line)', padding: '2px', cursor: 'pointer', minHeight: '50px' }}>
                          {dayEvts.map(evt => {
                            const c = getTypeColor(evt.type, evt.couleur)
                            return (
                              <div key={evt.id} onClick={(e) => { e.stopPropagation(); setSelectedEvent(evt) }}
                                style={{ background: `${c}22`, border: `1px solid ${c}44`, borderLeft: `3px solid ${c}`, borderRadius: '4px', padding: '3px 5px', marginBottom: '2px', cursor: 'pointer', fontSize: '10px' }}>
                                <div style={{ fontWeight: 600, color: c, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evt.titre}</div>
                                <div style={{ color: 'var(--txt-3)', fontSize: '9px' }}>
                                  {evt.heure_debut?.slice(0, 5)}{evt.heure_fin ? ` - ${evt.heure_fin.slice(0, 5)}` : ''}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── MONTH VIEW ─── */}
        {view === 'mois' && (() => {
          const y = currentDate.getFullYear(), m = currentDate.getMonth()
          const daysInMonth = getDaysInMonth(y, m)
          const firstDay = getFirstDayOfMonth(y, m)
          const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
          while (cells.length % 7 !== 0) cells.push(null)
          const isToday = (d: number) => d === today.getDate() && m === today.getMonth() && y === today.getFullYear()

          return (
            <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '0.5px solid var(--line)' }}>
                {JOURS_COURT.map(j => (
                  <div key={j} style={{ padding: '10px 0', textAlign: 'center', fontSize: '10px', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase' }}>{j}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
                {cells.map((day, i) => {
                  const dk = day ? `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : ''
                  const evs = day ? eventsForDay(dk) : []
                  return (
                    <div key={i} onClick={() => day && openCreate(dk)} style={{
                      minHeight: '80px', padding: '5px',
                      borderRight: (i + 1) % 7 === 0 ? 'none' : '0.5px solid var(--line)',
                      borderBottom: i < cells.length - 7 ? '0.5px solid var(--line)' : 'none',
                      cursor: day ? 'pointer' : 'default',
                      background: day && isToday(day) ? 'rgba(184,146,42,0.06)' : 'transparent',
                    }}>
                      {day && (
                        <>
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', fontSize: '11px', fontWeight: isToday(day) ? 700 : 400, color: isToday(day) ? 'var(--gold)' : 'var(--txt-2)', background: isToday(day) ? 'var(--gold-3)' : 'transparent' }}>
                            {day}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '3px' }}>
                            {evs.slice(0, 3).map(e => {
                              const c = getTypeColor(e.type, e.couleur)
                              return (
                                <div key={e.id} onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e) }}
                                  style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '3px', background: `${c}22`, color: c, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {e.heure_debut?.slice(0, 5)} {e.titre}
                                </div>
                              )
                            })}
                            {evs.length > 3 && <div style={{ fontSize: '9px', color: 'var(--txt-3)', paddingLeft: '4px' }}>+{evs.length - 3} autres</div>}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* ─── DETAIL PANEL ─── */}
        {selectedEvent && (
          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', overflow: 'hidden', position: 'sticky', top: '24px' }}>
            <div style={{ padding: '12px 14px', borderBottom: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>Détails</span>
              <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)' }}><X size={14} /></button>
            </div>
            <div style={{ padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: getTypeColor(selectedEvent.type, selectedEvent.couleur) }} />
                <span style={{ fontSize: '10px', fontWeight: 600, color: getTypeColor(selectedEvent.type, selectedEvent.couleur), textTransform: 'uppercase' }}>
                  {TYPE_OPTIONS.find(t => t.value === selectedEvent.type)?.label ?? selectedEvent.type}
                </span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '10px' }}>{selectedEvent.titre}</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: 'var(--txt-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={11} color="var(--txt-3)" />
                  {new Date(selectedEvent.date + 'T12:00:00').toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                {selectedEvent.heure_debut && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={11} color="var(--txt-3)" />
                    {selectedEvent.heure_debut.slice(0, 5)}{selectedEvent.heure_fin ? ` — ${selectedEvent.heure_fin.slice(0, 5)}` : ''}
                  </div>
                )}
                {selectedEvent.employes?.nom && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={11} color="var(--txt-3)" />{selectedEvent.employes.nom}</div>
                )}
                {selectedEvent.clients?.nom && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={11} color="var(--txt-3)" />{selectedEvent.clients.nom}</div>
                )}
                {selectedEvent.adresse && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={11} color="var(--txt-3)" />{selectedEvent.adresse}</div>
                )}
                {selectedEvent.description && (
                  <div style={{ marginTop: '6px', color: 'var(--txt-3)', lineHeight: '1.4' }}>{selectedEvent.description}</div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button onClick={() => openEdit(selectedEvent)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '7px', borderRadius: '6px', background: 'var(--bg-2)', color: 'var(--txt-1)', fontSize: '11px', fontWeight: 500, border: '0.5px solid var(--line)', cursor: 'pointer' }}>
                  <Edit3 size={12} /> Modifier
                </button>
                <button onClick={() => handleDelete(selectedEvent.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '7px 10px', borderRadius: '6px', background: 'rgba(224,96,96,0.1)', color: '#E06060', fontSize: '11px', fontWeight: 500, border: '0.5px solid rgba(224,96,96,0.2)', cursor: 'pointer' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── CREATION / EDIT MODAL ─── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', width: '440px', maxHeight: '80vh', overflow: 'auto', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>
                {editingEvent ? 'Modifier l\'événement' : 'Nouvel événement'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Type */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {TYPE_OPTIONS.map(t => (
                  <button key={t.value} onClick={() => setFormData(f => ({ ...f, type: t.value }))}
                    style={{ flex: 1, padding: '7px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                      background: formData.type === t.value ? `${t.color}22` : 'var(--bg-2)',
                      color: formData.type === t.value ? t.color : 'var(--txt-3)',
                      border: formData.type === t.value ? `1px solid ${t.color}44` : '0.5px solid var(--line)',
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Titre */}
              <input placeholder="Titre *" value={formData.titre} onChange={e => setFormData(f => ({ ...f, titre: e.target.value }))}
                style={{ padding: '8px 10px', borderRadius: '6px', border: '0.5px solid var(--line)', background: 'var(--bg-2)', color: 'var(--txt-1)', fontSize: '12px', outline: 'none' }} />

              {/* Date + heures */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <input type="date" value={formData.date} onChange={e => setFormData(f => ({ ...f, date: e.target.value }))}
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '0.5px solid var(--line)', background: 'var(--bg-2)', color: 'var(--txt-1)', fontSize: '12px', outline: 'none' }} />
                <input type="time" value={formData.heure_debut} onChange={e => setFormData(f => ({ ...f, heure_debut: e.target.value }))}
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '0.5px solid var(--line)', background: 'var(--bg-2)', color: 'var(--txt-1)', fontSize: '12px', outline: 'none' }} />
                <input type="time" value={formData.heure_fin} onChange={e => setFormData(f => ({ ...f, heure_fin: e.target.value }))}
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '0.5px solid var(--line)', background: 'var(--bg-2)', color: 'var(--txt-1)', fontSize: '12px', outline: 'none' }} />
              </div>

              {/* Employé */}
              <select value={formData.employe_id} onChange={e => setFormData(f => ({ ...f, employe_id: e.target.value }))}
                style={{ padding: '8px 10px', borderRadius: '6px', border: '0.5px solid var(--line)', background: 'var(--bg-2)', color: 'var(--txt-1)', fontSize: '12px', outline: 'none' }}>
                <option value="">— Employé (optionnel) —</option>
                {employes.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
              </select>

              {/* Client */}
              <select value={formData.client_id} onChange={e => setFormData(f => ({ ...f, client_id: e.target.value }))}
                style={{ padding: '8px 10px', borderRadius: '6px', border: '0.5px solid var(--line)', background: 'var(--bg-2)', color: 'var(--txt-1)', fontSize: '12px', outline: 'none' }}>
                <option value="">— Client (optionnel) —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>

              {/* Job */}
              <select value={formData.job_id} onChange={e => setFormData(f => ({ ...f, job_id: e.target.value }))}
                style={{ padding: '8px 10px', borderRadius: '6px', border: '0.5px solid var(--line)', background: 'var(--bg-2)', color: 'var(--txt-1)', fontSize: '12px', outline: 'none' }}>
                <option value="">— Chantier (optionnel) —</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.titre}</option>)}
              </select>

              {/* Adresse */}
              <input placeholder="Adresse (optionnel)" value={formData.adresse} onChange={e => setFormData(f => ({ ...f, adresse: e.target.value }))}
                style={{ padding: '8px 10px', borderRadius: '6px', border: '0.5px solid var(--line)', background: 'var(--bg-2)', color: 'var(--txt-1)', fontSize: '12px', outline: 'none' }} />

              {/* Description */}
              <textarea placeholder="Notes (optionnel)" value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} rows={2}
                style={{ padding: '8px 10px', borderRadius: '6px', border: '0.5px solid var(--line)', background: 'var(--bg-2)', color: 'var(--txt-1)', fontSize: '12px', outline: 'none', resize: 'vertical' }} />

              {/* Save */}
              <button onClick={handleSave} style={{
                padding: '10px', borderRadius: '6px', background: 'var(--gold)', color: '#000',
                fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}>
                <Check size={15} /> {editingEvent ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
