'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  CheckCircle2, XCircle, FileText, Building2,
  MapPin, Phone, Mail, Calendar, Clock,
  ChevronDown, AlertCircle, Loader2
} from 'lucide-react'

interface DevisPortal {
  id: string
  numero: string
  titre: string
  statut: 'brouillon' | 'envoye' | 'vu' | 'approuve' | 'refuse' | 'expire' | 'converti'
  date_emission: string
  valide_jusqu_au: string | null
  lignes: { description: string; quantite: number; unite: string; prix_unitaire: number }[]
  notes: string | null
  portal_token: string
  clients: { nom: string; email: string | null; telephone: string | null; adresse: string | null } | null
  companies: { name: string; telephone: string | null; adresse: string | null; tps_no: string | null; tvq_no: string | null } | null
}

function formatCAD(n: number) {
  return n.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })
}

const TPS_RATE = 0.05
const TVQ_RATE = 0.09975

// ── Page ───────────────────────────────────────────────────────
export default function PortailDevisPage() {
  const params = useParams()
  const token = params?.token as string

  const [devis, setDevis] = useState<DevisPortal | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [decision, setDecision] = useState<'idle' | 'approuver' | 'refuser'>('idle')
  const [motifRefus, setMotifRefus] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState<'approuve' | 'refuse' | null>(null)
  const [showLignes, setShowLignes] = useState(true)

  useEffect(() => {
    if (!token) return
    fetch(`/api/portal/devis/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setLoadError(d.error)
        else setDevis(d)
      })
      .catch(() => setLoadError('Erreur de connexion'))
  }, [token])

  async function confirm(action: 'approuve' | 'refuse') {
    if (!devis) return
    setConfirming(true)
    try {
      const res = await fetch(`/api/portal/devis/${devis.portal_token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, motif: motifRefus }),
      })
      if (!res.ok) throw new Error(await res.text())
      setDone(action)
    } catch (err) {
      alert('Erreur lors de l\'enregistrement — veuillez réessayer.')
    } finally {
      setConfirming(false)
    }
  }

  if (!devis && !loadError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-0)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--txt-3)', fontSize: '13px' }}>
          <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />Chargement du devis…
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (loadError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-0)' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <AlertCircle size={40} color="var(--red)" style={{ marginBottom: '12px' }} />
          <h2 style={{ color: 'var(--txt-1)', margin: '0 0 8px' }}>Devis introuvable</h2>
          <p style={{ color: 'var(--txt-3)', fontSize: '13px' }}>{loadError}</p>
        </div>
      </div>
    )
  }

  const lignes = Array.isArray(devis!.lignes) ? devis!.lignes : []
  const subtotal = lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0)
  const tps      = subtotal * TPS_RATE
  const tvq      = subtotal * TVQ_RATE
  const total    = subtotal + tps + tvq
  const expire   = devis!.valide_jusqu_au ? new Date(devis!.valide_jusqu_au) < new Date() : false

  const clientInfo = {
    nom:       devis!.clients?.nom ?? '—',
    email:     devis!.clients?.email ?? '',
    telephone: devis!.clients?.telephone ?? '',
    adresse:   devis!.clients?.adresse ?? '',
  }
  const orgInfo = {
    nom:         devis!.companies?.name ?? '—',
    telephone:   devis!.companies?.telephone ?? '',
    email:       '',
    adresse:     devis!.companies?.adresse ?? '',
    numero_tps:  devis!.companies?.tps_no ?? '',
    numero_tvq:  devis!.companies?.tvq_no ?? '',
  }
  const mockDevis = {
    ...devis!,
    date_validite: devis!.valide_jusqu_au ?? '',
    notes_client: devis!.notes ?? '',
    conditions: '',
    client: clientInfo,
    organisation: orgInfo,
    lignes: lignes.map((l, i) => ({ ...l, id: String(i) })),
  }

  // ── Écran de confirmation finale ─────────
  if (done === 'approuve') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg-0)' }}>
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '0.5px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={36} color="var(--green)" />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--txt-1)', margin: '0 0 8px' }}>Devis approuvé ✓</h1>
            <p style={{ fontSize: '13px', color: 'var(--txt-2)', margin: 0, lineHeight: 1.6 }}>
              Merci, {mockDevis.client.nom.split(' ')[0]} ! Votre approbation du devis <strong>{mockDevis.numero}</strong> a bien été enregistrée.
            </p>
          </div>
          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '16px 20px', width: '100%' }}>
            <p style={{ fontSize: '12px', color: 'var(--txt-2)', margin: 0, lineHeight: 1.6 }}>
              L'équipe de <strong>{mockDevis.organisation.nom}</strong> va vous contacter très prochainement pour planifier le démarrage des travaux.
              Un courriel de confirmation a été envoyé à <strong>{mockDevis.client.email}</strong>.
            </p>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--txt-3)' }}>
            Vous pouvez fermer cette fenêtre.
          </div>
        </div>
      </div>
    )
  }

  if (done === 'refuse') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg-0)' }}>
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(224,96,96,0.1)', border: '0.5px solid rgba(224,96,96,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XCircle size={36} color="var(--red)" />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--txt-1)', margin: '0 0 8px' }}>Devis refusé</h1>
            <p style={{ fontSize: '13px', color: 'var(--txt-2)', margin: 0, lineHeight: 1.6 }}>
              Votre réponse concernant le devis <strong>{mockDevis.numero}</strong> a été transmise à l'équipe de {mockDevis.organisation.nom}.
            </p>
          </div>
          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '16px 20px', width: '100%' }}>
            <p style={{ fontSize: '12px', color: 'var(--txt-2)', margin: 0, lineHeight: 1.6 }}>
              Nous espérons avoir l'occasion de vous soumettre une nouvelle proposition adaptée à vos besoins. N'hésitez pas à nous contacter au <strong>{mockDevis.organisation.telephone}</strong>.
            </p>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--txt-3)' }}>
            Vous pouvez fermer cette fenêtre.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)', paddingBottom: '60px' }}>

      {/* ── Bandeau organisation ──────────────── */}
      <div style={{ background: 'var(--bg-1)', borderBottom: '0.5px solid var(--line)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={16} color="var(--gold)" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>{mockDevis.organisation.nom}</div>
            <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>{mockDevis.organisation.telephone} · {mockDevis.organisation.email}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: expire ? 'rgba(224,96,96,0.1)' : 'rgba(184,146,42,0.1)', color: expire ? 'var(--red)' : 'var(--gold-2)', border: `0.5px solid ${expire ? 'rgba(224,96,96,0.3)' : 'var(--gold-3)'}` }}>
            {expire ? 'EXPIRÉ' : 'EN ATTENTE DE DÉCISION'}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── Salutation ───────────────────────── */}
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--txt-1)', margin: '0 0 6px' }}>
            Bonjour {mockDevis.client.nom.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--txt-2)', margin: 0, lineHeight: 1.6 }}>
            {mockDevis.organisation.nom} vous a transmis le devis <strong style={{ color: 'var(--gold-2)' }}>{mockDevis.numero}</strong> pour votre projet. Veuillez en prendre connaissance et nous faire part de votre décision en bas de page.
          </p>
        </div>

        {expire && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(224,96,96,0.08)', border: '0.5px solid rgba(224,96,96,0.3)', borderRadius: '8px' }}>
            <AlertCircle size={16} color="var(--red)" />
            <div style={{ fontSize: '12px', color: 'var(--red)' }}>
              Ce devis est expiré depuis le {new Date(mockDevis.date_validite).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}. Contactez {mockDevis.organisation.nom} pour un renouvellement.
            </div>
          </div>
        )}

        {/* ── Entête du devis ──────────────────── */}
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ background: 'var(--ga)', borderBottom: '0.5px solid var(--gold-3)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--gold-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Devis</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gold)' }}>{mockDevis.numero}</div>
              <div style={{ fontSize: '13px', color: 'var(--txt-1)', marginTop: '4px' }}>{mockDevis.titre}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', gap: '20px' }}>
                {[
                  { label: 'Date d\'émission', value: new Date(mockDevis.date_emission).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' }) },
                  { label: 'Valide jusqu\'au', value: new Date(mockDevis.date_validite).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' }) },
                ].map(f => (
                  <div key={f.label} style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: 'var(--gold-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{f.label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--txt-1)', marginTop: '2px' }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Infos client / organisation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '0.5px solid var(--line)' }}>
            {[
              { titre: 'Préparé par', data: mockDevis.organisation, fields: ['adresse', 'telephone', 'email'] },
              { titre: 'Préparé pour', data: mockDevis.client,      fields: ['adresse', 'telephone', 'email'] },
            ].map((col, i) => (
              <div key={col.titre} style={{ padding: '14px 20px', borderRight: i === 0 ? '0.5px solid var(--line)' : 'none' }}>
                <div style={{ fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{col.titre}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '6px' }}>{col.data.nom}</div>
                {col.fields.map(f => {
                  const val = (col.data as any)[f]
                  if (!val) return null
                  const Icon = f === 'telephone' ? Phone : f === 'email' ? Mail : MapPin
                  return (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', fontSize: '11px', color: 'var(--txt-3)', marginBottom: '3px' }}>
                      <Icon size={10} style={{ marginTop: '2px', flexShrink: 0 }} /> {val}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Lignes */}
          <div>
            <button onClick={() => setShowLignes(v => !v)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: showLignes ? '0.5px solid var(--line)' : 'none' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Détail des travaux ({mockDevis.lignes.length} postes)</span>
              <ChevronDown size={14} color="var(--txt-3)" style={{ transform: showLignes ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {showLignes && (
              <>
                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 70px 100px 100px', gap: '8px', padding: '8px 20px', background: 'var(--bg-2)', fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  <div>Description</div>
                  <div style={{ textAlign: 'center' }}>Qté</div>
                  <div style={{ textAlign: 'center' }}>Unité</div>
                  <div style={{ textAlign: 'right' }}>Prix unit.</div>
                  <div style={{ textAlign: 'right' }}>Total</div>
                </div>

                {mockDevis.lignes.map((l, i) => (
                  <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 70px 100px 100px', gap: '8px', padding: '10px 20px', borderTop: '0.5px solid var(--line)', background: i % 2 === 1 ? 'var(--bg-2)' : 'transparent' }}>
                    <span style={{ fontSize: '12px', color: 'var(--txt-1)' }}>{l.description}</span>
                    <span style={{ fontSize: '12px', color: 'var(--txt-2)', textAlign: 'center' }}>{l.quantite}</span>
                    <span style={{ fontSize: '12px', color: 'var(--txt-3)', textAlign: 'center' }}>{l.unite}</span>
                    <span style={{ fontSize: '12px', color: 'var(--txt-2)', textAlign: 'right' }}>{formatCAD(l.prix_unitaire)}</span>
                    <span style={{ fontSize: '12px', color: 'var(--txt-1)', fontWeight: 500, textAlign: 'right' }}>{formatCAD(l.quantite * l.prix_unitaire)}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Totaux */}
          <div style={{ borderTop: '0.5px solid var(--line)', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '240px' }}>
              {[
                { label: 'Sous-total', value: formatCAD(subtotal), bold: false },
                { label: `TPS (5 %) — ${mockDevis.organisation.numero_tps}`, value: formatCAD(tps), bold: false },
                { label: `TVQ (9,975 %) — ${mockDevis.organisation.numero_tvq}`, value: formatCAD(tvq), bold: false },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--txt-2)' }}>
                  <span>{r.label}</span><span>{r.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: 'var(--txt-1)', borderTop: '0.5px solid var(--line)', paddingTop: '8px', marginTop: '2px' }}>
                <span>Total TTC</span>
                <span style={{ color: 'var(--gold)' }}>{formatCAD(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(mockDevis.notes_client || mockDevis.conditions) && (
            <div style={{ borderTop: '0.5px solid var(--line)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
              {[
                { titre: 'Notes', contenu: mockDevis.notes_client },
                { titre: 'Conditions', contenu: mockDevis.conditions },
              ].filter(n => n.contenu).map((n, i) => (
                <div key={n.titre} style={{ padding: '14px 20px', borderRight: i === 0 ? '0.5px solid var(--line)' : 'none' }}>
                  <div style={{ fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{n.titre}</div>
                  <p style={{ fontSize: '11px', color: 'var(--txt-2)', margin: 0, lineHeight: 1.6 }}>{n.contenu}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Zone de décision ─────────────────── */}
        {!expire && (
          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '4px' }}>Votre décision</div>
              <div style={{ fontSize: '12px', color: 'var(--txt-3)' }}>
                Ce devis représente un total de <strong style={{ color: 'var(--gold-2)' }}>{formatCAD(total)}</strong> (taxes incluses).
              </div>
            </div>

            {decision === 'idle' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button onClick={() => setDecision('approuver')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', background: 'rgba(34,197,94,0.08)', border: '0.5px solid rgba(34,197,94,0.3)', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--green)', transition: 'all 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.14)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.08)')}>
                  <CheckCircle2 size={18} /> J'approuve ce devis
                </button>
                <button onClick={() => setDecision('refuser')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', background: 'rgba(224,96,96,0.06)', border: '0.5px solid rgba(224,96,96,0.25)', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--red)', transition: 'all 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(224,96,96,0.12)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(224,96,96,0.06)')}>
                  <XCircle size={18} /> Refuser
                </button>
              </div>
            )}

            {/* ── Confirmation approbation ──────── */}
            {decision === 'approuver' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'rgba(34,197,94,0.08)', border: '0.5px solid rgba(34,197,94,0.25)', borderRadius: '8px' }}>
                  <CheckCircle2 size={16} color="var(--green)" />
                  <div style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 500 }}>
                    Vous êtes sur le point d'approuver le devis {mockDevis.numero} pour un total de {formatCAD(total)}.
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button onClick={() => setDecision('idle')}
                    style={{ padding: '10px', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--txt-2)' }}>
                    Annuler
                  </button>
                  <button onClick={() => confirm('approuve')} disabled={confirming}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: 'var(--green)', border: 'none', borderRadius: '8px', cursor: confirming ? 'default' : 'pointer', fontSize: '12px', fontWeight: 600, color: '#fff', opacity: confirming ? 0.8 : 1 }}>
                    {confirming ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <CheckCircle2 size={14} />}
                    {confirming ? 'Enregistrement…' : 'Confirmer l\'approbation'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Confirmation refus ────────────── */}
            {decision === 'refuser' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '6px' }}>
                    Motif du refus (optionnel)
                  </label>
                  <textarea
                    value={motifRefus}
                    onChange={e => setMotifRefus(e.target.value)}
                    placeholder="Ex: Le budget dépasse nos attentes, nous avons un autre soumissionnaire…"
                    rows={3}
                    style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '8px 11px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--red)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--line)')}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button onClick={() => setDecision('idle')}
                    style={{ padding: '10px', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--txt-2)' }}>
                    Annuler
                  </button>
                  <button onClick={() => confirm('refuse')} disabled={confirming}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: 'var(--red)', border: 'none', borderRadius: '8px', cursor: confirming ? 'default' : 'pointer', fontSize: '12px', fontWeight: 600, color: '#fff', opacity: confirming ? 0.8 : 1 }}>
                    {confirming ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <XCircle size={14} />}
                    {confirming ? 'Envoi…' : 'Confirmer le refus'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--txt-3)', lineHeight: 1.6 }}>
          Des questions ? Contactez {mockDevis.organisation.nom} au{' '}
          <a href={`tel:${mockDevis.organisation.telephone}`} style={{ color: 'var(--gold-2)', textDecoration: 'none' }}>{mockDevis.organisation.telephone}</a>
          {' '}ou par courriel :{' '}
          <a href={`mailto:${mockDevis.organisation.email}`} style={{ color: 'var(--gold-2)', textDecoration: 'none' }}>{mockDevis.organisation.email}</a>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
