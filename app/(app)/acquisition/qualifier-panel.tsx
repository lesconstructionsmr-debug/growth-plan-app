'use client'

import { useEffect, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase/browser'
import Link from 'next/link'
import { Loader2, Save, CheckCircle2 } from 'lucide-react'
import { scoreLead } from '@/lib/leads/acquisition'

type LeadRow = {
  id: string
  nom: string
  source: string | null
  statut: string
  score: number | null
  valeur_estimee: number | null
}

export default function QualifierPanel() {
  const supabase = getBrowserClient()
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [leadId, setLeadId] = useState('')
  const [typeProjet, setTypeProjet] = useState<'reno' | 'commercial' | 'construction'>('reno')
  const [budget, setBudget] = useState<'froid' | 'tiede' | 'chaud'>('tiede')
  const [delai, setDelai] = useState<'flexible' | 'moyen' | 'urgent'>('urgent')
  const [saving, setSaving] = useState(false)
  const [ok, setOk] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('leads')
      .select('id, nom, source, statut, score, valeur_estimee')
      .in('statut', ['nouveau', 'contacté', 'contacte'])
      .order('created_at', { ascending: false })
      .limit(40)
      .then(({ data, error: err }) => {
        if (err && (err.message?.includes('score') || err.code === '42703')) {
          return supabase
            .from('leads')
            .select('id, nom, source, statut, valeur_estimee')
            .in('statut', ['nouveau', 'contacté', 'contacte'])
            .order('created_at', { ascending: false })
            .limit(40)
            .then(r => {
              setLeads((r.data ?? []).map(l => ({ ...l, score: null })))
              if (r.data?.[0]) setLeadId(r.data[0].id)
            })
        }
        const rows = (data ?? []) as LeadRow[]
        setLeads(rows)
        if (rows[0]) setLeadId(rows[0].id)
      })
  }, [supabase])

  const result = scoreLead({ typeProjet, budget, delai })
  const selected = leads.find(l => l.id === leadId)

  async function save() {
    if (!leadId) return
    setSaving(true)
    setOk('')
    setError('')
    const statut = result.points >= 70 ? 'qualifié' : 'contacté'
    const notes = `Chaleur ${result.chaleur} (${result.points} pts). ${result.points >= 70 ? 'Priorité devis.' : 'Relancer.'}`
    const payload: Record<string, unknown> = {
      statut,
      valeur_estimee: result.valeurEstimee,
      notes,
      score: result.points,
    }
    let { error: upd } = await supabase.from('leads').update(payload).eq('id', leadId)
    if (upd && (upd.message?.includes('score') || upd.code === '42703')) {
      delete payload.score
      const retry = await supabase.from('leads').update(payload).eq('id', leadId)
      upd = retry.error
    }
    setSaving(false)
    if (upd) {
      setError(upd.message)
      return
    }
    setLeads(prev => prev.filter(l => l.id !== leadId))
    setOk(`${selected?.nom ?? 'Prospect'} → ${statut} · ${result.valeurEstimee.toLocaleString('fr-CA')} $ estimés`)
    setLeadId(leads.find(l => l.id !== leadId)?.id ?? '')
  }

  const field: React.CSSProperties = {
    width: '100%', background: 'var(--bg-2)', border: '0.5px solid var(--line)',
    borderRadius: '7px', padding: '9px 12px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: 'var(--ga)', border: '0.5px solid var(--gold-3)', borderRadius: '10px', padding: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--txt-1)', marginBottom: '6px' }}>
          Qualifier un vrai prospect
        </div>
        <p style={{ fontSize: '12px', color: 'var(--txt-2)', margin: 0, lineHeight: 1.6 }}>
          Ça écrit dans le CRM : chaleur, valeur estimée, et statut (Qualifié si 70 pts et plus). Pas un simulateur.
        </p>
      </div>

      {leads.length === 0 ? (
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '20px', fontSize: '13px', color: 'var(--txt-2)' }}>
          Aucun prospect neuf à qualifier.{' '}
          <Link href="/leads" style={{ color: 'var(--gold-2)' }}>Ouvrir Leads / CRM</Link>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '20px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px' }}>Prospect</label>
          <select value={leadId} onChange={e => setLeadId(e.target.value)} style={{ ...field, marginBottom: '14px' }}>
            {leads.map(l => (
              <option key={l.id} value={l.id}>
                {l.nom} · {l.source || 'sans source'} · {l.statut}
              </option>
            ))}
          </select>

          <label style={{ display: 'block', fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px' }}>Type de travaux</label>
          <select value={typeProjet} onChange={e => setTypeProjet(e.target.value as typeof typeProjet)} style={{ ...field, marginBottom: '14px' }}>
            <option value="reno">Rénovation mineure</option>
            <option value="commercial">Commercial / sous-traitance</option>
            <option value="construction">Maison neuve / agrandissement</option>
          </select>

          <label style={{ display: 'block', fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px' }}>Budget estimé</label>
          <select value={budget} onChange={e => setBudget(e.target.value as typeof budget)} style={{ ...field, marginBottom: '14px' }}>
            <option value="froid">Moins de 10 000 $</option>
            <option value="tiede">10 000 – 40 000 $</option>
            <option value="chaud">Plus de 40 000 $</option>
          </select>

          <label style={{ display: 'block', fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px' }}>Délai</label>
          <select value={delai} onChange={e => setDelai(e.target.value as typeof delai)} style={{ ...field }}>
            <option value="flexible">Plus de 3 mois</option>
            <option value="moyen">Dans 1 à 3 mois</option>
            <option value="urgent">Tout de suite</option>
          </select>

          <div style={{
            marginTop: '16px', padding: '14px', background: 'var(--bg-2)', border: '0.5px solid var(--line)',
            borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--txt-3)', textTransform: 'uppercase' }}>Chaleur</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: result.points >= 70 ? 'var(--red)' : result.points >= 45 ? 'var(--amber)' : 'var(--txt-2)' }}>
                {result.chaleur} · {result.points} pts
              </div>
              <div style={{ fontSize: '12px', color: 'var(--txt-3)', marginTop: '4px' }}>
                Valeur écrite au CRM : {result.valeurEstimee.toLocaleString('fr-CA')} $
              </div>
            </div>
            <button
              type="button"
              onClick={save}
              disabled={saving || !leadId}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'var(--gold)', color: '#0A0A0A', border: 'none',
                borderRadius: '8px', padding: '10px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
              }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Enregistrer dans le CRM
            </button>
          </div>
        </div>
      )}

      {ok && (
        <div style={{ fontSize: '12px', color: 'var(--green)', background: 'var(--green)12', border: '0.5px solid var(--green)', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={14} /> {ok}
        </div>
      )}
      {error && (
        <div style={{ fontSize: '12px', color: 'var(--red)', background: 'var(--red)12', border: '0.5px solid var(--red)', borderRadius: '8px', padding: '10px 12px' }}>
          {error}
        </div>
      )}
    </div>
  )
}
