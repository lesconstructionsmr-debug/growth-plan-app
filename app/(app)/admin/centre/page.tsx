'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Crosshair, CheckSquare, Users, Crown, Plus, Loader2,
  AlertCircle, CheckCircle2, Circle, Clock, Trash2, X,
} from 'lucide-react'

type Onglet = 'vue' | 'taches' | 'leads'

interface Snapshot {
  tachesOuvertes: number
  tachesUrgentes: number
  tachesEnRetard: number
  leadsActifs: number
  leadsChauds: number
  essais: number
  abonnesActifs: number
  migrationRequise?: boolean
}

interface Task {
  id: string
  titre: string
  notes: string | null
  statut: string
  priorite: string
  due_date: string | null
  lead_id: string | null
}

interface Lead {
  id: string
  nom: string
  email: string | null
  telephone: string | null
  entreprise: string | null
  source: string | null
  statut: string
  besoin: string | null
  taille_equipe: string | null
  score: number | null
  notes: string | null
}

const TASK_STATUT: Record<string, string> = {
  a_faire: 'À faire', en_cours: 'En cours', fait: 'Fait', annule: 'Annulé',
}
const PRIORITE: Record<string, { label: string; color: string }> = {
  basse: { label: 'Basse', color: 'var(--txt-3)' },
  normale: { label: 'Normale', color: 'var(--blue)' },
  haute: { label: 'Haute', color: 'var(--amber)' },
  urgente: { label: 'Urgente', color: 'var(--red)' },
}
const LEAD_STATUT: Record<string, { label: string; color: string }> = {
  nouveau: { label: 'Nouveau', color: 'var(--txt-3)' },
  contacte: { label: 'Contacté', color: 'var(--blue)' },
  qualifie: { label: 'Qualifié', color: 'var(--amber)' },
  essai: { label: 'Essai', color: 'var(--purple, #8B5CF6)' },
  client: { label: 'Client', color: 'var(--green)' },
  perdu: { label: 'Perdu', color: 'var(--red)' },
}
const BESOIN: Record<string, string> = {
  structure_numerique: 'Structure numérique',
  optimisation: 'Optimisation d\'affaires',
  les_deux: 'Les deux',
  autre: 'Autre',
}

const inp: React.CSSProperties = {
  background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px',
  padding: '9px 12px', fontSize: '13px', color: 'var(--txt-1)', outline: 'none',
  width: '100%', boxSizing: 'border-box',
}
const labelSt: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '5px',
}

export default function ControlCenterPage() {
  const [onglet, setOnglet] = useState<Onglet>('vue')
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showTask, setShowTask] = useState(false)
  const [showLead, setShowLead] = useState(false)
  const [saving, setSaving] = useState(false)
  const [taskForm, setTaskForm] = useState({ titre: '', notes: '', priorite: 'normale', due_date: '' })
  const [leadForm, setLeadForm] = useState({
    nom: '', email: '', telephone: '', entreprise: '', source: 'manuel',
    besoin: 'les_deux', taille_equipe: '2-5', notes: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [s, t, l] = await Promise.all([
        fetch('/api/admin/control-center').then(r => r.json()),
        fetch('/api/admin/tasks').then(r => r.json()),
        fetch('/api/admin/saas-leads').then(r => r.json()),
      ])
      if (s.error) throw new Error(s.error)
      setSnap(s)
      setTasks(Array.isArray(t) ? t : [])
      setLeads(Array.isArray(l) ? l : [])
      if (t?.error || l?.error) {
        setError(t?.error || l?.error || 'Migration 0016 requise dans Supabase')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function createTask(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const r = await fetch('/api/admin/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskForm),
    })
    setSaving(false)
    if (!r.ok) {
      const d = await r.json().catch(() => ({}))
      setError(d.error || 'Impossible de créer la tâche')
      return
    }
    setShowTask(false)
    setTaskForm({ titre: '', notes: '', priorite: 'normale', due_date: '' })
    await load()
  }

  async function patchTask(id: string, patch: Partial<Task>) {
    await fetch('/api/admin/tasks', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    })
    await load()
  }

  async function deleteTask(id: string) {
    await fetch(`/api/admin/tasks?id=${id}`, { method: 'DELETE' })
    await load()
  }

  async function createLead(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const r = await fetch('/api/admin/saas-leads', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadForm),
    })
    setSaving(false)
    if (!r.ok) {
      const d = await r.json().catch(() => ({}))
      setError(d.error || 'Impossible de créer le lead')
      return
    }
    setShowLead(false)
    setLeadForm({
      nom: '', email: '', telephone: '', entreprise: '', source: 'manuel',
      besoin: 'les_deux', taille_equipe: '2-5', notes: '',
    })
    await load()
    setOnglet('leads')
  }

  async function patchLead(id: string, patch: Partial<Lead>) {
    await fetch('/api/admin/saas-leads', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    })
    await load()
  }

  const openTasks = tasks.filter(t => t.statut === 'a_faire' || t.statut === 'en_cours')
  const pipelineLeads = leads.filter(l => !['client', 'perdu'].includes(l.statut))

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px', background: 'var(--ga)',
            border: '0.5px solid var(--gold-3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Crosshair size={20} color="var(--gold)" />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--txt-1)', margin: 0 }}>Centre de contrôle</h1>
            <p style={{ fontSize: '12px', color: 'var(--txt-3)', margin: '2px 0 0' }}>
              Tes tâches · Leads d&apos;adhésion Plan Growth · Abonnés
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={() => setShowTask(true)} style={btnGold}>
            <Plus size={14} /> Tâche
          </button>
          <button type="button" onClick={() => setShowLead(true)} style={btnGhost}>
            <Plus size={14} /> Lead adhésion
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '12px 14px',
          background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.35)',
          borderRadius: '8px', fontSize: '12px', color: 'var(--txt-1)',
        }}>
          <AlertCircle size={14} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}{snap?.migrationRequise ? ' — lance supabase/migrations/0016_platform_control_center.sql' : ''}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px', borderBottom: '0.5px solid var(--line)', paddingBottom: '2px' }}>
        {([
          { id: 'vue' as const, label: 'Vue d\'ensemble', icon: Crosshair },
          { id: 'taches' as const, label: 'Tâches', icon: CheckSquare },
          { id: 'leads' as const, label: 'Leads adhésion', icon: Users },
        ]).map(tab => {
          const Icon = tab.icon
          const active = onglet === tab.id
          return (
            <button key={tab.id} type="button" onClick={() => setOnglet(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
              background: 'none', border: 'none', borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent',
              color: active ? 'var(--gold-2)' : 'var(--txt-3)', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}>
              <Icon size={13} /> {tab.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--txt-3)', padding: '40px', justifyContent: 'center' }}>
          <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Chargement…
        </div>
      ) : (
        <>
          {onglet === 'vue' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Kpi label="Tâches ouvertes" value={String(snap?.tachesOuvertes ?? openTasks.length)} sub={`${snap?.tachesUrgentes ?? 0} urgentes`} color="var(--amber)" />
                <Kpi label="En retard" value={String(snap?.tachesEnRetard ?? 0)} sub="Échéance dépassée" color="var(--red)" />
                <Kpi label="Leads actifs" value={String(snap?.leadsActifs ?? pipelineLeads.length)} sub={`${snap?.leadsChauds ?? 0} chauds`} color="var(--blue)" />
                <Kpi label="Essais / Actifs" value={`${snap?.essais ?? 0} / ${snap?.abonnesActifs ?? 0}`} sub="Abonnements Stripe" color="var(--green)" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Panel title="Prochaines tâches" hrefTab={() => setOnglet('taches')}>
                  {openTasks.length === 0 ? (
                    <Empty text="Aucune tâche ouverte. Ajoute ta première." />
                  ) : openTasks.slice(0, 6).map(t => (
                    <Row key={t.id}
                      title={t.titre}
                      meta={`${PRIORITE[t.priorite]?.label ?? t.priorite}${t.due_date ? ` · ${t.due_date}` : ''}`}
                      action={() => patchTask(t.id, { statut: 'fait' })}
                      actionLabel="Fait"
                    />
                  ))}
                </Panel>
                <Panel title="Pipeline adhésion" hrefTab={() => setOnglet('leads')}>
                  {pipelineLeads.length === 0 ? (
                    <Empty text="Aucun lead d'adhésion. Capture un prospect Plan Growth." />
                  ) : pipelineLeads.slice(0, 6).map(l => (
                    <div key={l.id} style={{ padding: '10px 14px', borderBottom: '0.5px solid var(--line)' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>{l.nom}{l.entreprise ? ` — ${l.entreprise}` : ''}</div>
                      <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginTop: '2px' }}>
                        {LEAD_STATUT[l.statut]?.label ?? l.statut}
                        {l.score != null ? ` · ${l.score} pts` : ''}
                        {l.besoin ? ` · ${BESOIN[l.besoin] ?? l.besoin}` : ''}
                      </div>
                    </div>
                  ))}
                </Panel>
              </div>

              <Link href="/admin/abonnes" style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px',
                background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px',
                textDecoration: 'none', color: 'var(--txt-1)',
              }}>
                <Crown size={16} color="var(--gold)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Abonnés SaaS</div>
                  <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>Essais, actifs, retards de paiement</div>
                </div>
              </Link>
            </div>
          )}

          {onglet === 'taches' && (
            <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>
              {tasks.length === 0 ? <Empty text="Aucune tâche." pad /> : tasks.map(t => {
                const p = PRIORITE[t.priorite] ?? PRIORITE.normale
                const done = t.statut === 'fait'
                return (
                  <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                    borderBottom: '0.5px solid var(--line)', opacity: done ? 0.55 : 1,
                  }}>
                    <button type="button" onClick={() => patchTask(t.id, { statut: done ? 'a_faire' : 'fait' })}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: done ? 'var(--green)' : 'var(--txt-3)' }}>
                      {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', textDecoration: done ? 'line-through' : 'none' }}>{t.titre}</div>
                      <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginTop: '2px' }}>
                        <span style={{ color: p.color }}>{p.label}</span>
                        {' · '}{TASK_STATUT[t.statut] ?? t.statut}
                        {t.due_date ? ` · échéance ${t.due_date}` : ''}
                      </div>
                      {t.notes && <div style={{ fontSize: '11px', color: 'var(--txt-2)', marginTop: '4px' }}>{t.notes}</div>}
                    </div>
                    <select value={t.statut} onChange={e => patchTask(t.id, { statut: e.target.value })}
                      style={{ ...inp, width: 'auto', fontSize: '11px', padding: '6px 8px' }}>
                      {Object.entries(TASK_STATUT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <button type="button" onClick={() => deleteTask(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {onglet === 'leads' && (
            <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>
              {leads.length === 0 ? <Empty text="Aucun lead d'adhésion." pad /> : leads.map(l => {
                const st = LEAD_STATUT[l.statut] ?? LEAD_STATUT.nouveau
                return (
                  <div key={l.id} style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--line)', display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--txt-1)' }}>{l.nom}</div>
                      <div style={{ fontSize: '11px', color: 'var(--txt-3)', marginTop: '2px' }}>
                        {[l.entreprise, l.email, l.telephone].filter(Boolean).join(' · ')}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--txt-2)', marginTop: '6px' }}>
                        {l.besoin ? BESOIN[l.besoin] : '—'}
                        {l.taille_equipe ? ` · équipe ${l.taille_equipe}` : ''}
                        {l.score != null ? ` · score ${l.score}` : ''}
                        {l.source ? ` · ${l.source}` : ''}
                      </div>
                      {l.notes && <div style={{ fontSize: '11px', color: 'var(--txt-2)', marginTop: '4px' }}>{l.notes}</div>}
                    </div>
                    <select value={l.statut} onChange={e => patchLead(l.id, { statut: e.target.value })}
                      style={{ ...inp, width: '140px', fontSize: '11px', color: st.color, fontWeight: 600 }}>
                      {Object.entries(LEAD_STATUT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    {(l.statut === 'qualifie' || l.statut === 'essai') && (
                      <button type="button" onClick={() => {
                        setTaskForm({
                          titre: `Suivre ${l.nom}${l.entreprise ? ` (${l.entreprise})` : ''}`,
                          notes: `Lead adhésion · ${LEAD_STATUT[l.statut]?.label}`,
                          priorite: (l.score ?? 0) >= 70 ? 'haute' : 'normale',
                          due_date: '',
                        })
                        setShowTask(true)
                      }} style={{ ...btnGhost, padding: '8px 10px', fontSize: '11px' }}>
                        <Clock size={12} /> Tâche
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {showTask && (
        <Modal title="Nouvelle tâche" onClose={() => setShowTask(false)}>
          <form onSubmit={createTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelSt}>Titre *</label>
              <input required value={taskForm.titre} onChange={e => setTaskForm(f => ({ ...f, titre: e.target.value }))}
                placeholder="Relancer le prospect…" style={inp} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelSt}>Priorité</label>
                <select value={taskForm.priorite} onChange={e => setTaskForm(f => ({ ...f, priorite: e.target.value }))} style={inp}>
                  {Object.entries(PRIORITE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>Échéance</label>
                <input type="date" value={taskForm.due_date} onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))} style={inp} />
              </div>
            </div>
            <div>
              <label style={labelSt}>Notes</label>
              <textarea value={taskForm.notes} onChange={e => setTaskForm(f => ({ ...f, notes: e.target.value }))}
                rows={3} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <button type="submit" disabled={saving} style={btnGold}>
              {saving ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Plus size={14} />}
              Créer
            </button>
          </form>
        </Modal>
      )}

      {showLead && (
        <Modal title="Lead d'adhésion Plan Growth" onClose={() => setShowLead(false)}>
          <form onSubmit={createLead} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelSt}>Nom *</label>
              <input required value={leadForm.nom} onChange={e => setLeadForm(f => ({ ...f, nom: e.target.value }))}
                placeholder="Maxime Tremblay" style={inp} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelSt}>Courriel</label>
                <input type="email" value={leadForm.email} onChange={e => setLeadForm(f => ({ ...f, email: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={labelSt}>Téléphone</label>
                <input value={leadForm.telephone} onChange={e => setLeadForm(f => ({ ...f, telephone: e.target.value }))} style={inp} />
              </div>
            </div>
            <div>
              <label style={labelSt}>Entreprise</label>
              <input value={leadForm.entreprise} onChange={e => setLeadForm(f => ({ ...f, entreprise: e.target.value }))}
                placeholder="Construction X" style={inp} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelSt}>Besoin</label>
                <select value={leadForm.besoin} onChange={e => setLeadForm(f => ({ ...f, besoin: e.target.value }))} style={inp}>
                  {Object.entries(BESOIN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>Taille d&apos;équipe</label>
                <select value={leadForm.taille_equipe} onChange={e => setLeadForm(f => ({ ...f, taille_equipe: e.target.value }))} style={inp}>
                  <option value="solo">Solo</option>
                  <option value="2-5">2–5</option>
                  <option value="6-15">6–15</option>
                  <option value="16+">16+</option>
                </select>
              </div>
            </div>
            <div>
              <label style={labelSt}>Notes</label>
              <textarea value={leadForm.notes} onChange={e => setLeadForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} placeholder="Structure numérique, optimisation…" style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <button type="submit" disabled={saving} style={btnGold}>
              {saving ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Plus size={14} />}
              Ajouter au pipeline
            </button>
          </form>
        </Modal>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 720px) {
          .cc-grid { grid-template-columns: 1fr !important; }
        }`}</style>
    </div>
  )
}

const btnGold: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--gold)', border: 'none',
  borderRadius: '9px', padding: '9px 14px', fontSize: '12px', fontWeight: 700, color: '#0A0A0A', cursor: 'pointer',
}
const btnGhost: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--bg-1)', border: '0.5px solid var(--line)',
  borderRadius: '9px', padding: '9px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)', cursor: 'pointer',
}

function Kpi({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{
      background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px',
      padding: '14px 16px', flex: 1, minWidth: '140px',
    }}>
      <div style={{ fontSize: '11px', color: 'var(--txt-3)', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--txt-1)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '10px', color, marginTop: '6px' }}>{sub}</div>
    </div>
  )
}

function Panel({ title, children, hrefTab }: { title: string; children: React.ReactNode; hrefTab: () => void }) {
  return (
    <div className="cc-grid" style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 14px', borderBottom: '0.5px solid var(--line)',
      }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--txt-1)' }}>{title}</span>
        <button type="button" onClick={hrefTab} style={{ background: 'none', border: 'none', color: 'var(--gold-2)', fontSize: '10px', cursor: 'pointer', fontWeight: 600 }}>
          Voir tout
        </button>
      </div>
      {children}
    </div>
  )
}

function Row({ title, meta, action, actionLabel }: { title: string; meta: string; action: () => void; actionLabel: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderBottom: '0.5px solid var(--line)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>{title}</div>
        <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>{meta}</div>
      </div>
      <button type="button" onClick={action} style={{ ...btnGhost, padding: '5px 8px', fontSize: '10px' }}>{actionLabel}</button>
    </div>
  )
}

function Empty({ text, pad }: { text: string; pad?: boolean }) {
  return (
    <div style={{ padding: pad ? '40px 20px' : '28px 16px', textAlign: 'center', fontSize: '12px', color: 'var(--txt-3)' }}>{text}</div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '14px',
        padding: '24px', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt-1)', margin: 0 }}>{title}</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)' }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
