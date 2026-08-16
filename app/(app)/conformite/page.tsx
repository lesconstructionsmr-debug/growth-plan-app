'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Shield, HardHat, Percent, Landmark, Plus, Loader2,
  ExternalLink, CheckCircle2, Trash2,
} from 'lucide-react'
import {
  CCQ_METIERS, SEAO_STATUTS, RETENUE_STATUTS,
  calcRetenueGarantie, formatCad,
} from '@/lib/qc/conformite'

type Tab = 'ccq' | 'retenues' | 'seao'

interface JobOption { id: string; titre: string }

const inp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--bg-2)', border: '0.5px solid var(--line)',
  borderRadius: '8px', padding: '8px 10px',
  fontSize: '12px', color: 'var(--txt-1)', outline: 'none', fontFamily: 'inherit',
}

const card: React.CSSProperties = {
  background: 'var(--bg-1)', border: '0.5px solid var(--line)',
  borderRadius: '10px', padding: '16px 18px',
}

export default function ConformitePage() {
  const [tab, setTab] = useState<Tab>('ccq')
  const [jobs, setJobs] = useState<JobOption[]>([])
  const [loading, setLoading] = useState(true)

  const [ccqEntries, setCcqEntries] = useState<any[]>([])
  const [retenues, setRetenues] = useState<any[]>([])
  const [seaoAvis, setSeaoAvis] = useState<any[]>([])

  const [ccqForm, setCcqForm] = useState({ job_id: '', metier: CCQ_METIERS[0] as string, date: new Date().toISOString().split('T')[0], heures: '8', notes: '' })
  const [retForm, setRetForm] = useState({ job_id: '', description: '', facture_montant: '', date_echeance: '' })
  const [seaoForm, setSeaoForm] = useState({ numero_avis: '', titre: '', organisme: '', date_cloture: '', montant_estime: '', url: '' })

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [jobsRes, ccqRes, retRes, seaoRes] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/qc/ccq'),
        fetch('/api/qc/retenues'),
        fetch('/api/qc/seao'),
      ])
      const jobsData = jobsRes.ok ? await jobsRes.json() : []
      setJobs(jobsData.map((j: { id: string; titre: string }) => ({ id: j.id, titre: j.titre })))
      setCcqEntries(ccqRes.ok ? await ccqRes.json() : [])
      setRetenues(retRes.ok ? await retRes.json() : [])
      setSeaoAvis(seaoRes.ok ? await seaoRes.json() : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  async function addCcq(e: React.FormEvent) {
    e.preventDefault()
    if (!ccqForm.job_id) return
    const res = await fetch('/api/qc/ccq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...ccqForm, heures: Number(ccqForm.heures) }),
    })
    if (res.ok) { setCcqForm(f => ({ ...f, heures: '8', notes: '' })); loadAll() }
  }

  async function addRetenue(e: React.FormEvent) {
    e.preventDefault()
    if (!retForm.job_id || !retForm.description) return
    const res = await fetch('/api/qc/retenues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...retForm, facture_montant: Number(retForm.facture_montant) }),
    })
    if (res.ok) { setRetForm({ job_id: '', description: '', facture_montant: '', date_echeance: '' }); loadAll() }
  }

  async function addSeao(e: React.FormEvent) {
    e.preventDefault()
    if (!seaoForm.numero_avis || !seaoForm.titre) return
    const res = await fetch('/api/qc/seao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...seaoForm,
        montant_estime: seaoForm.montant_estime ? Number(seaoForm.montant_estime) : null,
      }),
    })
    if (res.ok) { setSeaoForm({ numero_avis: '', titre: '', organisme: '', date_cloture: '', montant_estime: '', url: '' }); loadAll() }
  }

  async function libererRetenue(id: string) {
    await fetch('/api/qc/retenues', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, statut: 'liberee', date_liberation: new Date().toISOString().split('T')[0] }),
    })
    loadAll()
  }

  const previewRetenue = retForm.facture_montant
    ? calcRetenueGarantie(Number(retForm.facture_montant))
    : null

  const TABS = [
    { id: 'ccq' as Tab, label: 'CCQ — Temps par métier', icon: HardHat },
    { id: 'retenues' as Tab, label: 'Retenue 10 %', icon: Percent },
    { id: 'seao' as Tab, label: 'SEAO — Appels d\'offres', icon: Landmark },
  ]

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Shield size={18} color="var(--gold)" />
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>Conformité Québec</h1>
          <p style={{ fontSize: '11px', color: 'var(--txt-3)', margin: '4px 0 0' }}>
            CCQ · Retenue de garantie 10 % · SEAO — différenciateurs terrain pour entrepreneurs généraux au Québec
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
              background: active ? 'var(--ga)' : 'var(--bg-2)',
              border: `0.5px solid ${active ? 'var(--gold-3)' : 'var(--line)'}`,
              color: active ? 'var(--gold-2)' : 'var(--txt-2)',
              fontWeight: active ? 600 : 400,
            }}>
              <Icon size={13} /> {t.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--txt-3)', padding: '32px' }}>
          <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Chargement…
        </div>
      ) : (
        <>
          {/* CCQ */}
          {tab === 'ccq' && (
            <>
              <form onSubmit={addCcq} style={{ ...card, display: 'grid', gridTemplateColumns: '1fr 140px 120px 80px auto', gap: '10px', alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--txt-3)', display: 'block', marginBottom: '4px' }}>Chantier</label>
                  <select value={ccqForm.job_id} onChange={e => setCcqForm(f => ({ ...f, job_id: e.target.value }))} required style={inp}>
                    <option value="">— Chantier —</option>
                    {jobs.map(j => <option key={j.id} value={j.id}>{j.titre}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--txt-3)', display: 'block', marginBottom: '4px' }}>Métier CCQ</label>
                  <select value={ccqForm.metier} onChange={e => setCcqForm(f => ({ ...f, metier: e.target.value }))} style={inp}>
                    {CCQ_METIERS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--txt-3)', display: 'block', marginBottom: '4px' }}>Date</label>
                  <input type="date" value={ccqForm.date} onChange={e => setCcqForm(f => ({ ...f, date: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--txt-3)', display: 'block', marginBottom: '4px' }}>Heures</label>
                  <input type="number" step="0.25" min="0" value={ccqForm.heures} onChange={e => setCcqForm(f => ({ ...f, heures: e.target.value }))} style={inp} />
                </div>
                <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--gold)', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, color: '#0A0A0A', cursor: 'pointer', height: '36px' }}>
                  <Plus size={13} /> Ajouter
                </button>
              </form>
              <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                {ccqEntries.length === 0 ? (
                  <p style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--txt-3)', margin: 0 }}>Aucune feuille de temps CCQ.</p>
                ) : ccqEntries.map((e, i) => (
                  <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 80px 40px', padding: '12px 18px', borderBottom: i < ccqEntries.length - 1 ? '0.5px solid var(--line)' : 'none', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>{e.jobs?.titre ?? '—'}</div>
                      <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>{e.profiles?.full_name ?? 'Employé'}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--blue)' }}>{e.metier}</div>
                    <div style={{ fontSize: '11px', color: 'var(--txt-2)' }}>{new Date(e.date).toLocaleDateString('fr-CA')}</div>
                    <div style={{ fontSize: '12px', fontWeight: 600 }}>{e.heures} h</div>
                    <button onClick={async () => { await fetch(`/api/qc/ccq?id=${e.id}`, { method: 'DELETE' }); loadAll() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Retenues 10% */}
          {tab === 'retenues' && (
            <>
              <form onSubmit={addRetenue} style={{ ...card, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>Nouvelle retenue de garantie (10 %)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--txt-3)', display: 'block', marginBottom: '4px' }}>Chantier</label>
                    <select value={retForm.job_id} onChange={e => setRetForm(f => ({ ...f, job_id: e.target.value }))} required style={inp}>
                      <option value="">— Chantier —</option>
                      {jobs.map(j => <option key={j.id} value={j.id}>{j.titre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--txt-3)', display: 'block', marginBottom: '4px' }}>Montant facture sous-traitant ($)</label>
                    <input type="number" step="0.01" min="0" value={retForm.facture_montant} onChange={e => setRetForm(f => ({ ...f, facture_montant: e.target.value }))} required style={inp} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--txt-3)', display: 'block', marginBottom: '4px' }}>Description / facture</label>
                  <input value={retForm.description} onChange={e => setRetForm(f => ({ ...f, description: e.target.value }))} placeholder="Facture #ST-2026-042 — Plomberie phase 2" required style={inp} />
                </div>
                {previewRetenue && (
                  <div style={{ display: 'flex', gap: '20px', padding: '10px 14px', background: 'var(--amber)10', borderRadius: '8px', border: '0.5px solid var(--amber)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--txt-2)' }}>Retenue 10 %: <strong style={{ color: 'var(--amber)' }}>{formatCad(previewRetenue.montantRetenu)}</strong></span>
                    <span style={{ fontSize: '12px', color: 'var(--txt-2)' }}>Paiement net: <strong>{formatCad(previewRetenue.montantNet)}</strong></span>
                  </div>
                )}
                <button type="submit" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--gold)', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 600, color: '#0A0A0A', cursor: 'pointer' }}>
                  <Plus size={13} /> Enregistrer la retenue
                </button>
              </form>
              <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                {retenues.length === 0 ? (
                  <p style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--txt-3)', margin: 0 }}>Aucune retenue enregistrée.</p>
                ) : retenues.map((r, i) => {
                  const statutLabel = RETENUE_STATUTS.find(s => s.value === r.statut)?.label ?? r.statut
                  return (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: i < retenues.length - 1 ? '0.5px solid var(--line)' : 'none' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>{r.description}</div>
                        <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginTop: '2px' }}>
                          {r.jobs?.titre} · {formatCad(Number(r.facture_montant))} · retenue {formatCad(Number(r.montant_retenu))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: r.statut === 'liberee' ? 'var(--green)18' : 'var(--amber)18', color: r.statut === 'liberee' ? 'var(--green)' : 'var(--amber)' }}>
                          {statutLabel}
                        </span>
                        {r.statut === 'active' && (
                          <button onClick={() => libererRetenue(r.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: '0.5px solid var(--green)', borderRadius: '7px', padding: '4px 8px', fontSize: '10px', color: 'var(--green)', cursor: 'pointer' }}>
                            <CheckCircle2 size={11} /> Libérer
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* SEAO */}
          {tab === 'seao' && (
            <>
              <form onSubmit={addSeao} style={{ ...card, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>Nouvel avis SEAO</div>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px' }}>
                  <input value={seaoForm.numero_avis} onChange={e => setSeaoForm(f => ({ ...f, numero_avis: e.target.value }))} placeholder="No avis" required style={inp} />
                  <input value={seaoForm.titre} onChange={e => setSeaoForm(f => ({ ...f, titre: e.target.value }))} placeholder="Titre de l'appel d'offres" required style={inp} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <input value={seaoForm.organisme} onChange={e => setSeaoForm(f => ({ ...f, organisme: e.target.value }))} placeholder="Organisme (Ville, MTQ…)" style={inp} />
                  <input type="date" value={seaoForm.date_cloture} onChange={e => setSeaoForm(f => ({ ...f, date_cloture: e.target.value }))} style={inp} />
                  <input type="number" value={seaoForm.montant_estime} onChange={e => setSeaoForm(f => ({ ...f, montant_estime: e.target.value }))} placeholder="Montant estimé $" style={inp} />
                </div>
                <input value={seaoForm.url} onChange={e => setSeaoForm(f => ({ ...f, url: e.target.value }))} placeholder="URL SEAO (https://…)" style={inp} />
                <button type="submit" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--gold)', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 600, color: '#0A0A0A', cursor: 'pointer' }}>
                  <Plus size={13} /> Ajouter l&apos;avis
                </button>
              </form>
              <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                {seaoAvis.length === 0 ? (
                  <p style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--txt-3)', margin: 0 }}>Aucun avis SEAO suivi.</p>
                ) : seaoAvis.map((a, i) => {
                  const statutLabel = SEAO_STATUTS.find(s => s.value === a.statut)?.label ?? a.statut
                  const cloture = a.date_cloture ? new Date(a.date_cloture) : null
                  const urgent = cloture && cloture.getTime() - Date.now() < 7 * 86400000
                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: i < seaoAvis.length - 1 ? '0.5px solid var(--line)' : 'none', background: urgent ? 'var(--red)06' : 'transparent' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>{a.numero_avis} — {a.titre}</div>
                        <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginTop: '2px' }}>
                          {a.organisme ?? 'Organisme'} · Clôture {a.date_cloture ? new Date(a.date_cloture).toLocaleDateString('fr-CA') : '—'}
                          {a.montant_estime ? ` · ${formatCad(Number(a.montant_estime))}` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: 'var(--bg-3)', color: 'var(--txt-2)' }}>{statutLabel}</span>
                        {a.url && (
                          <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
