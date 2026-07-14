'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  Receipt, ChevronLeft, Plus, Trash2, Check,
  Loader2, AlertCircle, User, Building2, Calendar,
  FileText, ChevronDown
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────
interface LigneFacture {
  id: string
  description: string
  quantite: number
  unite: string
  prix_unitaire: number
}

type ModeReglement = 'virement' | 'cheque' | 'carte' | 'comptant' | 'autre'

interface FormData {
  client_id: string
  reference_devis: string
  numero: string
  date_emission: string
  date_echeance: string
  mode_reglement: ModeReglement
  notes_client: string
  notes_internes: string
  lignes: LigneFacture[]
  appliquer_tps: boolean
  appliquer_tvq: boolean
}

// ── Constantes ─────────────────────────────────────────────────
const TPS = 0.05
const TVQ = 0.09975

interface ClientOption { id: string; nom: string; type?: string }
interface DevisOption { id: string; numero: string; montant: number }

const MODES_REGLEMENT: { value: ModeReglement; label: string }[] = [
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'cheque',   label: 'Chèque'            },
  { value: 'carte',    label: 'Carte de crédit'   },
  { value: 'comptant', label: 'Comptant'           },
  { value: 'autre',    label: 'Autre'              },
]

const UNITES = ['h', 'u', 'pi²', 'pi lin.', 'forfait', 'm²', 'lot', 'verge']

function today() {
  return new Date().toISOString().split('T')[0]
}
function addDays(d: string, n: number) {
  const date = new Date(d)
  date.setDate(date.getDate() + n)
  return date.toISOString().split('T')[0]
}

let nextId = 1
function genId() { return `l${nextId++}` }

// ── Utilitaires ────────────────────────────────────────────────
function formatCAD(n: number) {
  return n.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })
}

// ── Composants ─────────────────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '5px' }}>
      {children}{required && <span style={{ color: 'var(--red)', marginLeft: '3px' }}>*</span>}
    </label>
  )
}

function StyledInput({
  value, onChange, placeholder, type = 'text',
}: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: 'var(--bg-2)', border: '0.5px solid var(--line)',
        borderRadius: '7px', padding: '8px 11px', fontSize: '12px',
        color: 'var(--txt-1)', outline: 'none', width: '100%', boxSizing: 'border-box',
      }}
      onFocus={e => (e.target.style.borderColor = 'var(--gold-3)')}
      onBlur={e => (e.target.style.borderColor = 'var(--line)')}
    />
  )
}

// ── Page ───────────────────────────────────────────────────────
export default function NouvelleFacturePage() {
  const router = useRouter()

  const [form, setForm] = useState<FormData>({
    client_id: '',
    reference_devis: '',
    numero: '', // Initialisé vide pour éviter les erreurs d'hydratation SSR/Client
    date_emission: today(),
    date_echeance: addDays(today(), 30),
    mode_reglement: 'virement',
    notes_client: '',
    notes_internes: '',
    lignes: [
      { id: genId(), description: '', quantite: 1, unite: 'u', prix_unitaire: 0 },
    ],
    appliquer_tps: true,
    appliquer_tvq: true,
  })

  // Générer le numéro uniquement sur le client après montage
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      numero: prev.numero || `FAC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`
    }))
  }, [])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [clients, setClients] = useState<ClientOption[]>([])
  const [devisMap, setDevisMap] = useState<Record<string, DevisOption[]>>({})

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.from('clients').select('id, nom').order('nom').then(({ data }) => {
      setClients((data ?? []).map((c: any) => ({ id: c.id, nom: c.nom })))
    })
    supabase.from('devis').select('id, numero, montant_ttc, client_id').in('statut', ['approuve', 'brouillon', 'envoye']).order('created_at', { ascending: false }).then(({ data }) => {
      const map: Record<string, DevisOption[]> = {}
      ;(data ?? []).forEach((d: any) => {
        if (!d.client_id) return
        if (!map[d.client_id]) map[d.client_id] = []
        map[d.client_id].push({ id: d.id, numero: d.numero, montant: Number(d.montant_ttc ?? 0) })
      })
      setDevisMap(map)
    })
  }, [])

  // ── Lignes ────────────────────────────────
  const addLigne = () => {
    setForm(f => ({
      ...f,
      lignes: [...f.lignes, { id: genId(), description: '', quantite: 1, unite: 'u', prix_unitaire: 0 }],
    }))
  }

  const updateLigne = (id: string, field: keyof LigneFacture, value: string | number) => {
    setForm(f => ({
      ...f,
      lignes: f.lignes.map(l => l.id === id ? { ...l, [field]: value } : l),
    }))
  }

  const removeLigne = (id: string) => {
    setForm(f => ({ ...f, lignes: f.lignes.filter(l => l.id !== id) }))
  }

  // ── Totaux ────────────────────────────────
  const subtotal = form.lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0)
  const montantTPS = form.appliquer_tps ? subtotal * TPS : 0
  const montantTVQ = form.appliquer_tvq ? subtotal * TVQ : 0
  const total = subtotal + montantTPS + montantTVQ

  // ── Validation ────────────────────────────
  function validate(): boolean {
    const errs: typeof errors = {}
    if (!form.client_id) errs.client_id = 'Sélectionner un client'
    if (!form.date_echeance) errs.date_echeance = 'Date requise'
    if (form.lignes.every(l => !l.description.trim())) errs.lignes = 'Ajouter au moins une ligne'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setStatus('saving')
    try {
      const res = await fetch('/api/factures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(await res.text())
      setStatus('saved')
      await new Promise(r => setTimeout(r, 600))
      router.push('/factures')
    } catch (err) {
      console.error('[handleSubmit facture]', err)
      setStatus('idle')
      alert('Erreur lors de la création — vérifiez votre connexion et réessayez.')
    }
  }

  const clientSelectionne = clients.find(c => c.id === form.client_id)
  const devisDisponibles = form.client_id ? (devisMap[form.client_id] ?? []) : []

  return (
    <div style={{ padding: '24px', maxWidth: '820px' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'var(--bg-2)', border: '0.5px solid var(--line)',
            borderRadius: '7px', padding: '6px 10px', cursor: 'pointer',
            color: 'var(--txt-2)', display: 'flex', alignItems: 'center',
          }}
        >
          <ChevronLeft size={14} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Receipt size={17} color="var(--gold)" />
          <h1 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>Nouvelle facture</h1>
        </div>
        <span style={{
          fontSize: '11px', color: 'var(--txt-3)',
          background: 'var(--bg-3)', borderRadius: '5px', padding: '2px 8px',
        }}>
          {form.numero}
        </span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ── Identification ───────────────────── */}
        <div style={{
          background: 'var(--bg-1)', border: '0.5px solid var(--line)',
          borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>Identification</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <Label>Numéro de facture</Label>
              <StyledInput
                value={form.numero}
                onChange={v => setForm(f => ({ ...f, numero: v }))}
                placeholder="FAC-2026-001"
              />
            </div>
            <div>
              <Label required>Date d'émission</Label>
              <StyledInput type="date" value={form.date_emission} onChange={v => setForm(f => ({ ...f, date_emission: v }))} />
            </div>
            <div>
              <Label required>Date d'échéance</Label>
              <StyledInput type="date" value={form.date_echeance} onChange={v => setForm(f => ({ ...f, date_echeance: v }))} />
              {errors.date_echeance && <div style={{ fontSize: '10px', color: 'var(--red)', marginTop: '3px' }}>{errors.date_echeance}</div>}
            </div>
          </div>

          {/* Échéances rapides */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--txt-3)' }}>Échéance rapide :</span>
            {[
              { label: 'Net 15', days: 15 },
              { label: 'Net 30', days: 30 },
              { label: 'Net 45', days: 45 },
              { label: 'Net 60', days: 60 },
            ].map(e => (
              <button
                key={e.label} type="button"
                onClick={() => setForm(f => ({ ...f, date_echeance: addDays(f.date_emission, e.days) }))}
                style={{
                  background: 'var(--bg-2)', border: '0.5px solid var(--line)',
                  borderRadius: '5px', padding: '3px 8px', fontSize: '10px',
                  color: 'var(--txt-3)', cursor: 'pointer',
                }}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Client ───────────────────────────── */}
        <div style={{
          background: 'var(--bg-1)', border: `0.5px solid ${errors.client_id ? 'var(--red)' : 'var(--line)'}`,
          borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>Client</div>
            {errors.client_id && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--red)' }}>
                <AlertCircle size={10} /> {errors.client_id}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <Label required>Sélectionner un client</Label>
              <div style={{ position: 'relative' }}>
                <select
                  value={form.client_id}
                  onChange={e => setForm(f => ({ ...f, client_id: e.target.value, reference_devis: '' }))}
                  style={{
                    background: 'var(--bg-2)', border: '0.5px solid var(--line)',
                    borderRadius: '7px', padding: '8px 32px 8px 11px',
                    fontSize: '12px', color: form.client_id ? 'var(--txt-1)' : 'var(--txt-3)',
                    outline: 'none', width: '100%', appearance: 'none', cursor: 'pointer',
                  }}
                >
                  <option value="">— Choisir un client —</option>
                  {clients.length === 0 && <option disabled>Chargement…</option>}
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
                <ChevronDown size={12} color="var(--txt-3)" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>

            <div>
              <Label>Référence devis {devisDisponibles.length === 0 && form.client_id && <span style={{ color: 'var(--txt-3)', fontWeight: 400 }}>(aucun)</span>}</Label>
              <div style={{ position: 'relative' }}>
                <select
                  value={form.reference_devis}
                  onChange={e => setForm(f => ({ ...f, reference_devis: e.target.value }))}
                  disabled={devisDisponibles.length === 0}
                  style={{
                    background: 'var(--bg-2)', border: '0.5px solid var(--line)',
                    borderRadius: '7px', padding: '8px 32px 8px 11px',
                    fontSize: '12px', color: form.reference_devis ? 'var(--txt-1)' : 'var(--txt-3)',
                    outline: 'none', width: '100%', appearance: 'none',
                    cursor: devisDisponibles.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: devisDisponibles.length === 0 ? 0.5 : 1,
                  }}
                >
                  <option value="">— Lier un devis —</option>
                  {devisDisponibles.map(d => (
                    <option key={d.numero} value={d.numero}>{d.numero} · {formatCAD(d.montant)}</option>
                  ))}
                </select>
                <ChevronDown size={12} color="var(--txt-3)" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>
          </div>

          {clientSelectionne && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', background: 'var(--bg-2)', borderRadius: '7px',
            }}>
              {clientSelectionne.type === 'entreprise'
                ? <Building2 size={13} color="var(--blue)" />
                : <User size={13} color="var(--gold)" />
              }
              <span style={{ fontSize: '12px', color: 'var(--txt-1)', fontWeight: 500 }}>{clientSelectionne.nom}</span>
              <span style={{ fontSize: '10px', color: 'var(--txt-3)' }}>— sélectionné</span>
            </div>
          )}
        </div>

        {/* ── Lignes de facturation ─────────────── */}
        <div style={{
          background: 'var(--bg-1)', border: `0.5px solid ${errors.lignes ? 'var(--red)' : 'var(--line)'}`,
          borderRadius: '10px', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'grid', gap: '8px', padding: '10px 14px',
            gridTemplateColumns: '1fr 70px 80px 110px 100px 36px',
            background: 'var(--bg-2)', borderBottom: '0.5px solid var(--line)',
            fontSize: '10px', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            <div>Description</div>
            <div style={{ textAlign: 'center' }}>Qté</div>
            <div style={{ textAlign: 'center' }}>Unité</div>
            <div style={{ textAlign: 'right' }}>Prix unit.</div>
            <div style={{ textAlign: 'right' }}>Total</div>
            <div />
          </div>

          {/* Lignes */}
          <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {form.lignes.map((ligne, idx) => (
              <div key={ligne.id} style={{
                display: 'grid', gap: '8px',
                gridTemplateColumns: '1fr 70px 80px 110px 100px 36px',
                alignItems: 'center',
              }}>
                <input
                  value={ligne.description}
                  onChange={e => updateLigne(ligne.id, 'description', e.target.value)}
                  placeholder={`Poste ${idx + 1}…`}
                  style={{
                    background: 'var(--bg-2)', border: '0.5px solid var(--line)',
                    borderRadius: '6px', padding: '6px 9px', fontSize: '12px',
                    color: 'var(--txt-1)', outline: 'none', width: '100%', boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--gold-3)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--line)')}
                />
                <input
                  type="number" min={0} step="0.01"
                  value={ligne.quantite === 0 ? '' : ligne.quantite}
                  onChange={e => updateLigne(ligne.id, 'quantite', parseFloat(e.target.value) || 0)}
                  style={{
                    background: 'var(--bg-2)', border: '0.5px solid var(--line)',
                    borderRadius: '6px', padding: '6px 9px', fontSize: '12px',
                    color: 'var(--txt-1)', outline: 'none', width: '100%', boxSizing: 'border-box', textAlign: 'center',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--gold-3)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--line)')}
                />
                <select
                  value={ligne.unite}
                  onChange={e => updateLigne(ligne.id, 'unite', e.target.value)}
                  style={{
                    background: 'var(--bg-2)', border: '0.5px solid var(--line)',
                    borderRadius: '6px', padding: '6px 9px', fontSize: '12px',
                    color: 'var(--txt-1)', outline: 'none', width: '100%',
                  }}
                >
                  {UNITES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <input
                  type="number" min={0} step="0.01"
                  value={ligne.prix_unitaire === 0 ? '' : ligne.prix_unitaire}
                  onChange={e => updateLigne(ligne.id, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  style={{
                    background: 'var(--bg-2)', border: '0.5px solid var(--line)',
                    borderRadius: '6px', padding: '6px 9px', fontSize: '12px',
                    color: 'var(--txt-1)', outline: 'none', width: '100%', boxSizing: 'border-box', textAlign: 'right',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--gold-3)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--line)')}
                />
                <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--txt-1)', fontWeight: 500, paddingRight: '4px' }}>
                  {formatCAD(ligne.quantite * ligne.prix_unitaire)}
                </div>
                <button
                  type="button" onClick={() => removeLigne(ligne.id)}
                  disabled={form.lignes.length === 1}
                  style={{
                    background: 'none', border: 'none', cursor: form.lignes.length === 1 ? 'default' : 'pointer',
                    color: form.lignes.length === 1 ? 'var(--bg-4)' : 'var(--txt-3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '4px',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ padding: '8px 14px 14px' }}>
            <button
              type="button" onClick={addLigne}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'none', border: '0.5px dashed var(--line)',
                borderRadius: '6px', padding: '7px 14px',
                fontSize: '11px', color: 'var(--txt-3)', cursor: 'pointer', width: '100%',
                justifyContent: 'center',
              }}
            >
              <Plus size={12} /> Ajouter une ligne
            </button>
          </div>

          {/* Totaux */}
          <div style={{
            borderTop: '0.5px solid var(--line)', padding: '14px 16px',
            display: 'flex', justifyContent: 'flex-end',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '240px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--txt-2)' }}>
                <span>Sous-total</span>
                <span>{formatCAD(subtotal)}</span>
              </div>

              {/* TPS */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--txt-2)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.appliquer_tps}
                    onChange={e => setForm(f => ({ ...f, appliquer_tps: e.target.checked }))}
                    style={{ accentColor: 'var(--gold)', cursor: 'pointer' }}
                  />
                  TPS (5 %)
                </label>
                <span style={{ color: form.appliquer_tps ? 'var(--txt-2)' : 'var(--txt-3)' }}>
                  {formatCAD(montantTPS)}
                </span>
              </div>

              {/* TVQ */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--txt-2)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.appliquer_tvq}
                    onChange={e => setForm(f => ({ ...f, appliquer_tvq: e.target.checked }))}
                    style={{ accentColor: 'var(--gold)', cursor: 'pointer' }}
                  />
                  TVQ (9,975 %)
                </label>
                <span style={{ color: form.appliquer_tvq ? 'var(--txt-2)' : 'var(--txt-3)' }}>
                  {formatCAD(montantTVQ)}
                </span>
              </div>

              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '14px', fontWeight: 700, color: 'var(--txt-1)',
                borderTop: '0.5px solid var(--line)', paddingTop: '8px', marginTop: '2px',
              }}>
                <span>Total TTC</span>
                <span style={{ color: 'var(--gold)' }}>{formatCAD(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Mode de règlement ─────────────────── */}
        <div style={{
          background: 'var(--bg-1)', border: '0.5px solid var(--line)',
          borderRadius: '10px', padding: '16px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '10px' }}>
            Mode de règlement accepté
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {MODES_REGLEMENT.map(m => (
              <button
                key={m.value} type="button"
                onClick={() => setForm(f => ({ ...f, mode_reglement: m.value }))}
                style={{
                  padding: '5px 12px', border: `0.5px solid ${form.mode_reglement === m.value ? 'var(--gold-3)' : 'var(--line)'}`,
                  borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 500,
                  background: form.mode_reglement === m.value ? 'var(--ga)' : 'var(--bg-2)',
                  color: form.mode_reglement === m.value ? 'var(--gold-2)' : 'var(--txt-3)',
                  transition: 'all 0.12s',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Notes ────────────────────────────── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
        }}>
          {[
            { field: 'notes_client' as const,    label: 'Notes pour le client',  placeholder: 'Conditions de paiement, instructions…' },
            { field: 'notes_internes' as const,  label: 'Notes internes',        placeholder: 'Visible uniquement dans l\'ERP…'       },
          ].map(n => (
            <div key={n.field} style={{
              background: 'var(--bg-1)', border: '0.5px solid var(--line)',
              borderRadius: '10px', padding: '14px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', marginBottom: '8px' }}>{n.label}</div>
              <textarea
                value={form[n.field]}
                onChange={e => setForm(f => ({ ...f, [n.field]: e.target.value }))}
                placeholder={n.placeholder}
                rows={3}
                style={{
                  background: 'var(--bg-2)', border: '0.5px solid var(--line)',
                  borderRadius: '7px', padding: '8px 11px',
                  fontSize: '12px', color: 'var(--txt-1)', outline: 'none',
                  width: '100%', boxSizing: 'border-box', resize: 'vertical',
                  fontFamily: 'inherit',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--gold-3)')}
                onBlur={e => (e.target.style.borderColor = 'var(--line)')}
              />
            </div>
          ))}
        </div>

        {/* ── Actions ──────────────────────────── */}
        <div style={{
          display: 'flex', gap: '10px', justifyContent: 'space-between',
          alignItems: 'center', paddingBottom: '24px',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>
            La facture sera créée en statut <strong style={{ color: 'var(--amber)' }}>Brouillon</strong> — vous pourrez l'envoyer ensuite.
          </div>
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            <button
              type="button" onClick={() => router.back()}
              style={{
                background: 'var(--bg-2)', border: '0.5px solid var(--line)',
                borderRadius: '8px', padding: '9px 18px',
                fontSize: '12px', color: 'var(--txt-2)', cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              type="submit" disabled={status !== 'idle'}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: status === 'saved' ? 'var(--green)' : 'var(--gold)',
                border: 'none', borderRadius: '8px', padding: '9px 20px',
                fontSize: '12px', fontWeight: 600,
                color: status === 'saved' ? '#fff' : '#0A0A0A',
                cursor: status !== 'idle' ? 'default' : 'pointer',
                opacity: status !== 'idle' ? 0.85 : 1,
                transition: 'background 0.2s',
              }}
            >
              {status === 'saving' && <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />}
              {status === 'saved'  && <Check size={13} />}
              {status === 'saving' ? 'Création…'
                : status === 'saved' ? 'Créée !'
                : 'Créer la facture'}
            </button>
          </div>
        </div>

      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
