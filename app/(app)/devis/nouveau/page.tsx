'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  FileText, ChevronLeft, Plus, Trash2, Check,
  Loader2, AlertCircle, User, Building2,
  ChevronDown, Eye, Send
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────
interface LigneDevis {
  id: string
  description: string
  quantite: number
  unite: string
  prix_unitaire: number
}

interface FormData {
  client_id: string
  titre: string
  numero: string
  date_emission: string
  date_validite: string
  reference_projet: string
  notes_client: string
  notes_internes: string
  lignes: LigneDevis[]
  appliquer_tps: boolean
  appliquer_tvq: boolean
}

// ── Constantes ─────────────────────────────────────────────────
const TPS = 0.05
const TVQ = 0.09975

interface ClientOption { id: string; nom: string; ville: string | null }

const UNITES = ['h', 'u', 'pi²', 'pi lin.', 'forfait', 'm²', 'lot', 'verge', 'jour']

const MODELES_LIGNES: { label: string; lignes: Omit<LigneDevis, 'id'>[] }[] = [
  {
    label: 'Peinture intérieur 4 1/2',
    lignes: [
      { description: 'Préparation des surfaces (sablage, plâtrage des trous & fissures)', quantite: 1, unite: 'forfait', prix_unitaire: 450 },
      { description: 'Apprêt scellant (murs & plafonds à repriser)', quantite: 1, unite: 'forfait', prix_unitaire: 350 },
      { description: 'Peinture latex 2 couches (Salon, Cuisine, 2 Chambres, Salle de bain)', quantite: 1, unite: 'forfait', prix_unitaire: 1850 },
      { description: 'Peinture plafonds (blanc plat spécialisé)', quantite: 1, unite: 'forfait', prix_unitaire: 650 },
      { description: 'Peinture boiseries, plinthes et cadrages de portes (2 couches)', quantite: 1, unite: 'forfait', prix_unitaire: 450 },
      { description: 'Nettoyage et protection des surfaces (bâches & ruban masquage)', quantite: 1, unite: 'forfait', prix_unitaire: 200 },
    ],
  },
  {
    label: 'Peinture intérieur 5 1/2',
    lignes: [
      { description: 'Préparation complète des surfaces (sablage, plâtrage, ponçage)', quantite: 1, unite: 'forfait', prix_unitaire: 650 },
      { description: 'Apprêt scellant haute adhérence', quantite: 1, unite: 'forfait', prix_unitaire: 480 },
      { description: 'Peinture latex premium 2 couches (Salon, Salle à manger, Cuisine, 3 Chambres, SDB)', quantite: 1, unite: 'forfait', prix_unitaire: 2650 },
      { description: 'Peinture plafonds complète (blanc plat anti-reflets)', quantite: 1, unite: 'forfait', prix_unitaire: 850 },
      { description: 'Peinture portes, cadrages, plinthes et moulures', quantite: 1, unite: 'forfait', prix_unitaire: 650 },
      { description: 'Nettoyage de fin de chantier & évacuation des déchets', quantite: 1, unite: 'forfait', prix_unitaire: 250 },
    ],
  },
  {
    label: 'Peinture extérieur (Bungalow & Unifamiliale)',
    lignes: [
      { description: 'Lavage sous pression de la façade, des corniches et des parements', quantite: 1, unite: 'forfait', prix_unitaire: 450 },
      { description: 'Grattage de la peinture écailleuse, sablage et traitement antirouille', quantite: 1, unite: 'forfait', prix_unitaire: 850 },
      { description: 'Apprêt extérieur haute performance (résistant au gel/dégel)', quantite: 1, unite: 'forfait', prix_unitaire: 750 },
      { description: 'Peinture extérieure acrylique 2 couches (Rebord de toit, corniches, fascia)', quantite: 1, unite: 'forfait', prix_unitaire: 1950 },
      { description: 'Peinture portes extérieures, cadres de fenêtres et garage', quantite: 1, unite: 'forfait', prix_unitaire: 850 },
      { description: 'Revêtement de balcon / Galerie extérieure (antidérapant)', quantite: 1, unite: 'forfait', prix_unitaire: 650 },
    ],
  },
  {
    label: 'Rénovation cuisine',
    lignes: [
      { description: 'Démolition et dépose des armoires existantes', quantite: 1,   unite: 'forfait', prix_unitaire: 850  },
      { description: 'Fourniture et pose armoires (MDF peint)',       quantite: 18,  unite: 'pi lin.', prix_unitaire: 210  },
      { description: 'Comptoir quartz Calacatta',                     quantite: 24,  unite: 'pi²',    prix_unitaire: 95   },
      { description: 'Plomberie (déplacement évier)',                  quantite: 1,   unite: 'forfait', prix_unitaire: 1200 },
      { description: 'Électricité (îlot + éclairage encastré)',       quantite: 1,   unite: 'forfait', prix_unitaire: 980  },
      { description: 'Peinture (2 couches, murs + plafond)',          quantite: 280, unite: 'pi²',    prix_unitaire: 2.80 },
    ],
  },
  {
    label: 'Finition sous-sol',
    lignes: [
      { description: 'Pose cloisons sèches (½" standard)',      quantite: 680, unite: 'pi²',    prix_unitaire: 2.10  },
      { description: 'Isolation (R-20, murs extérieurs)',        quantite: 420, unite: 'pi²',    prix_unitaire: 1.85  },
      { description: 'Plancher flottant + sous-plancher',        quantite: 560, unite: 'pi²',    prix_unitaire: 8.50  },
      { description: 'Électricité (10 circuits, 4 prises)',      quantite: 1,   unite: 'forfait', prix_unitaire: 2400  },
      { description: 'Salle de bain complète (3 pièces)',        quantite: 1,   unite: 'forfait', prix_unitaire: 8500  },
      { description: 'Peinture complète (2 couches)',            quantite: 1,   unite: 'forfait', prix_unitaire: 2200  },
    ],
  },
]

function today() { return new Date().toISOString().split('T')[0] }
function addDays(d: string, n: number) {
  const date = new Date(d)
  date.setDate(date.getDate() + n)
  return date.toISOString().split('T')[0]
}
function formatCAD(n: number) {
  return n.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })
}
let _lid = 1
function genId() { return `l${_lid++}` }
function newLigne(): LigneDevis {
  return { id: genId(), description: '', quantite: 1, unite: 'u', prix_unitaire: 0 }
}

// ── Page ───────────────────────────────────────────────────────
export default function NouveauDevisPage() {
  const router = useRouter()

  const [form, setForm] = useState<FormData>({
    client_id: '',
    titre: '',
    numero: '', // Initialisé vide pour éviter les erreurs d'hydratation SSR/Client
    date_emission: today(),
    date_validite: addDays(today(), 30),
    reference_projet: '',
    notes_client: "Ce devis est valide pour 30 jours à compter de la date d'émission. Les travaux seront exécutés selon les règles de l'art et les normes du Code du bâtiment du Québec.",
    notes_internes: '',
    lignes: [newLigne()],
    appliquer_tps: true,
    appliquer_tvq: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Générer le numéro uniquement sur le client après montage
  // + présélectionner le client si on arrive depuis sa fiche (?client=<id>)
  useEffect(() => {
    const clientParam = new URLSearchParams(window.location.search).get('client')
    setForm(prev => ({
      ...prev,
      client_id: prev.client_id || clientParam || '',
      numero: prev.numero || `DEV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`
    }))
  }, [])
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [showModeles, setShowModeles] = useState(false)
  const [clients, setClients] = useState<ClientOption[]>([])

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.from('clients').select('id, nom, ville').order('nom').then(({ data }) => {
      setClients((data ?? []).map((c: any) => ({ id: c.id, nom: c.nom, ville: c.ville ?? null })))
    })
  }, [])

  // ── Lignes helpers ────────────────────────
  const addLigne = () => setForm(f => ({ ...f, lignes: [...f.lignes, newLigne()] }))
  const removeLigne = (id: string) => setForm(f => ({ ...f, lignes: f.lignes.filter(l => l.id !== id) }))
  const updateLigne = (id: string, field: keyof LigneDevis, value: string | number) =>
    setForm(f => ({ ...f, lignes: f.lignes.map(l => l.id === id ? { ...l, [field]: value } : l) }))

  function loadModele(m: typeof MODELES_LIGNES[0]) {
    setForm(f => ({ ...f, titre: f.titre || m.label, lignes: m.lignes.map(l => ({ ...l, id: genId() })) }))
    setShowModeles(false)
  }

  // ── Totaux ────────────────────────────────
  const subtotal = form.lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0)
  const montantTPS = form.appliquer_tps ? subtotal * TPS : 0
  const montantTVQ = form.appliquer_tvq ? subtotal * TVQ : 0
  const total = subtotal + montantTPS + montantTVQ

  // ── Validation ────────────────────────────
  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!form.client_id)                               errs.client_id = 'Sélectionner un client'
    if (!form.titre.trim())                            errs.titre     = 'Titre requis'
    if (form.lignes.every(l => !l.description.trim())) errs.lignes    = 'Au moins un poste requis'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(action: 'brouillon' | 'envoyer') {
    if (!validate()) return
    setStatus('saving')
    try {
      const res = await fetch('/api/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          statut: action === 'envoyer' ? 'envoye' : 'brouillon',
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setStatus('saved')
      await new Promise(r => setTimeout(r, 500))
      router.push('/devis')
    } catch (err) {
      console.error('[handleSubmit devis]', err)
      setStatus('idle')
      alert('Erreur lors de la création — vérifiez votre connexion et réessayez.')
    }
  }

  const clientOk = clients.find(c => c.id === form.client_id)

  // ── Styles réutilisables ──────────────────
  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-2)', border: '0.5px solid var(--line)',
    borderRadius: '7px', padding: '8px 11px', fontSize: '12px',
    color: 'var(--txt-1)', outline: 'none', width: '100%', boxSizing: 'border-box',
  }
  const focusGold = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    (e.target.style.borderColor = 'var(--gold-3)')
  const blurLine = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    (e.target.style.borderColor = 'var(--line)')

  return (
    <div style={{ padding: '24px', maxWidth: '860px' }}>

      {/* ── En-tête ─────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => router.back()} style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '6px 10px', cursor: 'pointer', color: 'var(--txt-2)', display: 'flex', alignItems: 'center' }}>
          <ChevronLeft size={14} />
        </button>
        <FileText size={17} color="var(--gold)" />
        <h1 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>Nouveau devis</h1>
        <span style={{ fontSize: '11px', color: 'var(--txt-3)', background: 'var(--bg-3)', borderRadius: '5px', padding: '2px 8px' }}>
          {form.numero}
        </span>
        {/* Modèles dropdown */}
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <button type="button" onClick={() => setShowModeles(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '7px 12px', fontSize: '11px', color: 'var(--txt-2)', cursor: 'pointer' }}>
            Modèles <ChevronDown size={12} />
          </button>
          {showModeles && (
            <div style={{ position: 'absolute', top: '36px', right: 0, zIndex: 100, background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '9px', padding: '6px', minWidth: '220px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              {MODELES_LIGNES.map(m => (
                <button key={m.label} onClick={() => loadModele(m)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', color: 'var(--txt-1)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  {m.label}
                  <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginTop: '1px' }}>{m.lignes.length} postes préremplis</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ── Identification ───────────────────── */}
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>Identification</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '5px' }}>
                Titre du devis <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <input value={form.titre} onChange={e => { setForm(f => ({ ...f, titre: e.target.value })); setErrors(er => ({ ...er, titre: '' })) }}
                placeholder="Ex: Rénovation cuisine — 245 av. des Pins"
                style={{ ...inputStyle, borderColor: errors.titre ? 'var(--red)' : 'var(--line)' }}
                onFocus={focusGold} onBlur={blurLine} />
              {errors.titre && <div style={{ fontSize: '10px', color: 'var(--red)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={10} />{errors.titre}</div>}
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '5px' }}>Date d'émission</label>
              <input type="date" value={form.date_emission} onChange={e => setForm(f => ({ ...f, date_emission: e.target.value }))}
                style={inputStyle} onFocus={focusGold} onBlur={blurLine} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '5px' }}>Valide jusqu'au</label>
              <input type="date" value={form.date_validite} onChange={e => setForm(f => ({ ...f, date_validite: e.target.value }))}
                style={inputStyle} onFocus={focusGold} onBlur={blurLine} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--txt-3)' }}>Validité rapide :</span>
            {[{ l:'15 jours', d:15 },{ l:'30 jours', d:30 },{ l:'45 jours', d:45 },{ l:'60 jours', d:60 }].map(v => (
              <button key={v.l} type="button" onClick={() => setForm(f => ({ ...f, date_validite: addDays(f.date_emission, v.d) }))}
                style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '5px', padding: '3px 8px', fontSize: '10px', color: 'var(--txt-3)', cursor: 'pointer' }}>
                {v.l}
              </button>
            ))}
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '5px' }}>Référence projet (optionnel)</label>
            <input value={form.reference_projet} onChange={e => setForm(f => ({ ...f, reference_projet: e.target.value }))}
              placeholder="Ex: PROJ-2026-08, Chantier Boivin phase 2…"
              style={inputStyle} onFocus={focusGold} onBlur={blurLine} />
          </div>
        </div>

        {/* ── Client ───────────────────────────── */}
        <div style={{ background: 'var(--bg-1)', border: `0.5px solid ${errors.client_id ? 'var(--red)' : 'var(--line)'}`, borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>Client <span style={{ color: 'var(--red)' }}>*</span></div>
            {errors.client_id && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--red)' }}><AlertCircle size={10} />{errors.client_id}</div>}
          </div>
          <div style={{ position: 'relative' }}>
            <select value={form.client_id}
              onChange={e => { setForm(f => ({ ...f, client_id: e.target.value })); setErrors(er => ({ ...er, client_id: '' })) }}
              style={{ ...inputStyle, padding: '8px 32px 8px 11px', appearance: 'none', cursor: 'pointer', color: form.client_id ? 'var(--txt-1)' : 'var(--txt-3)' }}>
              <option value="">— Sélectionner un client —</option>
              {clients.length === 0 && <option value="" disabled>Chargement…</option>}
              {clients.map(c => <option key={c.id} value={c.id}>{c.nom}{c.ville ? ` — ${c.ville}` : ''}</option>)}
            </select>
            <ChevronDown size={12} color="var(--txt-3)" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
          {clientOk ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--bg-2)', borderRadius: '7px' }}>
              <User size={13} color="var(--gold)" />
              <span style={{ fontSize: '12px', color: 'var(--txt-1)', fontWeight: 500 }}>{clientOk.nom}</span>
              {clientOk.ville && <span style={{ fontSize: '10px', color: 'var(--txt-3)' }}>· {clientOk.ville}</span>}
              <a href="/clients/nouveau" style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--gold-2)', textDecoration: 'none' }}>+ Nouveau client</a>
            </div>
          ) : (
            <a href="/clients/nouveau" style={{ fontSize: '11px', color: 'var(--gold-2)', textDecoration: 'none' }}>+ Créer un nouveau client</a>
          )}
        </div>

        {/* ── Lignes ───────────────────────────── */}
        <div style={{ background: 'var(--bg-1)', border: `0.5px solid ${errors.lignes ? 'var(--red)' : 'var(--line)'}`, borderRadius: '10px', overflow: 'hidden' }}>
          {/* Header tableau */}
          <div className="devis-grid-header" style={{ display: 'grid', gap: '8px', padding: '10px 14px', gridTemplateColumns: '1fr 70px 90px 110px 100px 36px', background: 'var(--bg-2)', borderBottom: '0.5px solid var(--line)', fontSize: '10px', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            <div>Description du poste</div>
            <div style={{ textAlign: 'center' }}>Qté</div>
            <div style={{ textAlign: 'center' }}>Unité</div>
            <div style={{ textAlign: 'right' }}>Prix unit.</div>
            <div style={{ textAlign: 'right' }}>Total</div>
            <div />
          </div>

          {/* Lignes */}
          <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {form.lignes.map((ligne, idx) => (
              <div key={ligne.id} className="devis-grid-row" style={{ display: 'grid', gap: '8px', gridTemplateColumns: '1fr 70px 90px 110px 100px 36px', alignItems: 'center' }}>
                <input value={ligne.description} onChange={e => updateLigne(ligne.id, 'description', e.target.value)}
                  placeholder={`Poste ${idx + 1} — ex: Peinture salon 2 couches`}
                  style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '9px 11px', fontSize: '13px', color: 'var(--txt-1)', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                  onFocus={focusGold} onBlur={blurLine} />
                
                <div className="devis-row-inputs">
                  <input type="number" min={0} step="0.01" value={ligne.quantite === 0 ? '' : ligne.quantite}
                    onChange={e => updateLigne(ligne.id, 'quantite', parseFloat(e.target.value) || 0)}
                    placeholder="Qté"
                    style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '8px 6px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
                    onFocus={focusGold} onBlur={blurLine} />
                  
                  <select value={ligne.unite} onChange={e => updateLigne(ligne.id, 'unite', e.target.value)}
                    style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '8px 4px', fontSize: '11px', color: 'var(--txt-1)', outline: 'none', width: '100%' }}>
                    {UNITES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>

                  <input type="number" min={0} step="0.01" value={ligne.prix_unitaire === 0 ? '' : ligne.prix_unitaire}
                    onChange={e => updateLigne(ligne.id, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                    placeholder="Prix ($)"
                    style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '8px 6px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none', width: '100%', boxSizing: 'border-box', textAlign: 'right' }}
                    onFocus={focusGold} onBlur={blurLine} />

                  <button type="button" onClick={() => removeLigne(ligne.id)} disabled={form.lignes.length === 1}
                    style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', cursor: form.lignes.length === 1 ? 'default' : 'pointer', color: form.lignes.length === 1 ? 'var(--bg-4)' : 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 10px' }}>
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mobile-header-hide" style={{ textAlign: 'right', fontSize: '12px', color: 'var(--txt-1)', fontWeight: 600, paddingRight: '4px' }}>
                  {formatCAD(ligne.quantite * ligne.prix_unitaire)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '8px 14px 14px' }}>
            <button type="button" onClick={addLigne}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--ga)', border: '0.5px dashed var(--gold-3)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--gold-2)', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
              <Plus size={14} /> Ajouter un poste
            </button>
          </div>

          {/* Totaux */}
          <div style={{ borderTop: '0.5px solid var(--line)', padding: '14px 16px', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', maxWidth: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--txt-2)' }}>
                <span>Sous-total</span>
                <span style={{ fontWeight: 500 }}>{formatCAD(subtotal)}</span>
              </div>
              {[
                { label: 'TPS (5 %)', field: 'appliquer_tps' as const, montant: montantTPS },
                { label: 'TVQ (9,975 %)', field: 'appliquer_tvq' as const, montant: montantTVQ },
              ].map(t => (
                <div key={t.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--txt-2)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form[t.field]} onChange={e => setForm(f => ({ ...f, [t.field]: e.target.checked }))} style={{ accentColor: 'var(--gold)', cursor: 'pointer' }} />
                    {t.label}
                  </label>
                  <span style={{ color: form[t.field] ? 'var(--txt-2)' : 'var(--txt-3)' }}>{formatCAD(t.montant)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 700, color: 'var(--txt-1)', borderTop: '0.5px solid var(--line)', paddingTop: '8px', marginTop: '2px' }}>
                <span>Total TTC</span>
                <span style={{ color: 'var(--gold)' }}>{formatCAD(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Notes ────────────────────────────── */}
        <div className="mobile-flex-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { field: 'notes_client' as const, label: 'Conditions & notes client', placeholder: 'Conditions de paiement, exclusions, garanties…' },
            { field: 'notes_internes' as const, label: 'Notes internes', placeholder: "Visible uniquement dans l'ERP…" },
          ].map(n => (
            <div key={n.field} style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', marginBottom: '8px' }}>{n.label}</div>
              <textarea value={form[n.field]} onChange={e => setForm(f => ({ ...f, [n.field]: e.target.value }))} placeholder={n.placeholder} rows={4}
                style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '8px 11px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
                onFocus={focusGold} onBlur={blurLine} />
            </div>
          ))}
        </div>

        {/* ── Actions ──────────────────────────── */}
        <div className="mobile-sticky-bottom" style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '24px' }}>
          <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>
            Total estimé : <strong style={{ color: 'var(--gold)', fontSize: '14px' }}>{formatCAD(total)}</strong>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button type="button" onClick={() => router.back()}
              style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: 'var(--txt-2)', cursor: 'pointer' }}>
              Annuler
            </button>
            <button type="button" onClick={() => handleSubmit('brouillon')} disabled={status !== 'idle'}
              className="mobile-header-hide"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', fontWeight: 500, color: 'var(--txt-1)', cursor: 'pointer' }}>
              <Eye size={13} /> Brouillon
            </button>
            <button type="button" onClick={() => handleSubmit('envoyer')} disabled={status !== 'idle'}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: status === 'saved' ? 'var(--green)' : 'var(--gold)',
                border: 'none', borderRadius: '8px', padding: '10px 18px',
                fontSize: '13px', fontWeight: 700, color: status === 'saved' ? '#fff' : '#0A0A0A',
                cursor: status !== 'idle' ? 'default' : 'pointer', opacity: status !== 'idle' ? 0.85 : 1, transition: 'background 0.2s',
              }}>
              {status === 'saving' && <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />}
              {status === 'saved'  && <Check size={13} />}
              {status === 'idle'   && <Send size={13} />}
              {status === 'saving' ? 'Création…' : status === 'saved' ? 'Créé !' : 'Créer & Envoyer'}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
