'use client'

import { useState, useRef, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  Settings, Building2, Hash, CreditCard, FileText, Palette,
  Upload, Save, Loader2, CheckCircle2, Shield, Trash2, Download, Mail, Lock,
  Users, UserPlus, Crown, User as UserIcon, XCircle, Send,
} from 'lucide-react'

interface OrgProfile {
  nom: string; nom_legal: string; email: string; telephone: string; site_web: string
  rue: string; ville: string; province: string; code_postal: string
  numero_tps: string; numero_tvq: string; numero_rbq: string
  mode_paiement_defaut: 'virement' | 'cheque' | 'carte' | 'comptant' | 'autre'
  delai_paiement: 15 | 30 | 45 | 60
  notes_pied_devis: string; notes_pied_facture: string; couleur_accent: string
}

const PROVINCES = ['QC','ON','BC','AB','MB','SK','NS','NB','NL','PE','YT','NT','NU']

const DEFAULT: OrgProfile = {
  nom: 'Construction Nova', nom_legal: 'Nova Structure AI inc.',
  email: 'info@novastructureai.com', telephone: '(418) 555-0200',
  site_web: 'https://novastructureai.com',
  rue: '1200 boul. Lebourgneuf', ville: 'Québec', province: 'QC', code_postal: 'G2K 2G4',
  numero_tps: '123456789 RT 0001', numero_tvq: '1234567890 TQ 0001', numero_rbq: '8264-1234-01',
  mode_paiement_defaut: 'virement', delai_paiement: 30,
  notes_pied_devis: "Ce devis est valide pour 30 jours. Un acompte de 30% est requis au démarrage des travaux. Les travaux sont exécutés selon les normes du Code du bâtiment du Québec.",
  notes_pied_facture: "Paiement dû dans le délai indiqué. Des intérêts de 1,5%/mois s'appliquent sur les soldes en retard. Merci de votre confiance.",
  couleur_accent: '#C9A84C',
}

const ONGLETS = [
  { id: 'organisation',    label: 'Organisation',    icon: Building2 },
  { id: 'fiscal',          label: 'Fiscal & RBQ',    icon: Hash      },
  { id: 'facturation',     label: 'Facturation',     icon: CreditCard},
  { id: 'documents',       label: 'Documents',       icon: FileText  },
  { id: 'apparence',       label: 'Apparence',       icon: Palette   },
  { id: 'confidentialite', label: 'Confidentialité', icon: Shield    },
  { id: 'equipe',          label: 'Équipe',           icon: Users     },
]

const inp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--bg-2)', border: '0.5px solid var(--line)',
  borderRadius: '8px', padding: '9px 12px',
  fontSize: '13px', color: 'var(--txt-1)', outline: 'none', fontFamily: 'inherit',
}

function Inp({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={inp}
      onFocus={e => (e.target.style.borderColor = 'var(--gold-3)')}
      onBlur={e => (e.target.style.borderColor = 'var(--line)')} />
  )
}

function F({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '5px' }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginTop: '4px' }}>{hint}</div>}
    </div>
  )
}

// ── TeamPanel ──────────────────────────────────────────────────
interface TeamMember {
  id: string
  email: string
  role: 'owner' | 'admin' | 'collaborateur'
  accepted: boolean
  created_at: string
}

function TeamPanel() {
  const [members,   setMembers]   = useState<TeamMember[]>([])
  const [loading,   setLoading]   = useState(true)
  const [email,     setEmail]     = useState('')
  const [role,      setRole]      = useState<'admin' | 'collaborateur'>('collaborateur')
  const [inviting,  setInviting]  = useState(false)
  const [invited,   setInvited]   = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    fetch('/api/invitations')
      .then(r => r.json())
      .then(data => { setMembers(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function invite() {
    if (!email.trim() || inviting) return
    setInviting(true); setError('')
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      setMembers(m => [...m, data])
      setEmail(''); setInvited(true)
      setTimeout(() => setInvited(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setInviting(false)
    }
  }

  async function revoke(id: string) {
    if (!confirm('Révoquer cette invitation ?')) return
    await fetch(`/api/invitations?id=${id}`, { method: 'DELETE' })
    setMembers(m => m.filter(x => x.id !== id))
  }

  const roleColor = (r: string) =>
    r === 'owner' ? 'var(--gold)' : r === 'admin' ? '#60A5FA' : 'var(--txt-3)'
  const roleBg = (r: string) =>
    r === 'owner' ? 'var(--ga)' : r === 'admin' ? 'rgba(96,165,250,0.12)' : 'var(--bg-3)'
  const roleLabel = (r: string) =>
    r === 'owner' ? 'Propriétaire' : r === 'admin' ? 'Admin' : 'Collaborateur'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', paddingBottom: '12px', borderBottom: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Users size={14} color="var(--gold)" /> Gestion de l'équipe
      </div>

      {/* Membres actuels */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--txt-3)', letterSpacing: '0.05em', marginBottom: '10px' }}>MEMBRES &amp; INVITATIONS</div>
        {loading && <div style={{ fontSize: '12px', color: 'var(--txt-3)', padding: '16px 0' }}>Chargement…</div>}
        {!loading && members.length === 0 && (
          <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '9px', padding: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--txt-3)' }}>
            Aucun membre invité pour le moment.
          </div>
        )}
        {members.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '9px', marginBottom: '6px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: roleBg(m.role), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {m.role === 'owner' ? <Crown size={14} color="var(--gold)" /> : <UserIcon size={14} color={roleColor(m.role)} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</div>
              <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginTop: '1px' }}>
                {m.accepted ? '✓ Compte actif' : '⏳ Invitation envoyée'}
              </div>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', color: roleColor(m.role), background: roleBg(m.role), flexShrink: 0 }}>
              {roleLabel(m.role)}
            </span>
            {m.role !== 'owner' && (
              <button onClick={() => revoke(m.id)} title="Révoquer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)', padding: '2px' }}>
                <XCircle size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Formulaire invitation */}
      <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={13} color="var(--gold)" /> Inviter un membre
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="email@compagnie.com"
            onKeyDown={e => e.key === 'Enter' && invite()}
            style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: 'var(--txt-1)', outline: 'none', fontFamily: 'inherit' }}
            onFocus={e => (e.target.style.borderColor = 'var(--gold-3)')}
            onBlur={e => (e.target.style.borderColor = 'var(--line)')}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={role}
              onChange={e => setRole(e.target.value as 'admin' | 'collaborateur')}
              style={{ flex: 1, background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '9px 12px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none', cursor: 'pointer' }}
            >
              <option value="collaborateur">Collaborateur — lecture + ajout de notes</option>
              <option value="admin">Admin — accès complet sauf facturation</option>
            </select>
            <button
              onClick={invite}
              disabled={!email.trim() || inviting}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: invited ? 'var(--green)' : 'var(--gold)', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '12px', fontWeight: 600, color: invited ? '#fff' : '#0A0A0A', cursor: inviting ? 'default' : 'pointer', flexShrink: 0, transition: 'background 0.2s' }}
            >
              {inviting ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : invited ? <CheckCircle2 size={13} /> : <Send size={13} />}
              {inviting ? 'Envoi…' : invited ? 'Envoyé !' : 'Inviter'}
            </button>
          </div>
          {error && <div style={{ fontSize: '11px', color: 'var(--red)', background: 'var(--red)12', border: '0.5px solid var(--red)', borderRadius: '7px', padding: '8px 12px' }}>{error}</div>}
        </div>
        <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginTop: '10px', lineHeight: 1.6 }}>
          Un email avec un lien d'activation sera envoyé. L'invitation expire après 7 jours.
          Le nouveau membre accède automatiquement aux mêmes clients, devis et factures que votre compagnie.
        </div>
      </div>
    </div>
  )
}

export default function ParametresPage() {
  const [onglet, setOnglet] = useState('organisation')
  const [form, setForm]     = useState<OrgProfile>(DEFAULT)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('company_id').eq('id', user.id).single().then(({ data: profile }) => {
        if (!profile?.company_id) return
        setCompanyId(profile.company_id)
        supabase.from('companies').select('*').eq('id', profile.company_id).single().then(({ data: co }) => {
          if (!co) return
          setForm(f => ({
            ...f,
            nom:         co.name ?? f.nom,
            email:       co.email ?? f.email,
            telephone:   co.telephone ?? f.telephone,
            rue:         co.adresse ?? f.rue,
            ville:       co.ville ?? f.ville,
            province:    co.province ?? f.province,
            code_postal: co.code_postal ?? f.code_postal,
            numero_tps:  co.tps_no ?? f.numero_tps,
            numero_tvq:  co.tvq_no ?? f.numero_tvq,
          }))
        })
      })
    })
  }, [])

  function set<K extends keyof OrgProfile>(k: K, v: OrgProfile[K]) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    setSaving(true)
    if (companyId) {
      await supabase.from('companies').update({
        name:        form.nom,
        email:       form.email,
        telephone:   form.telephone,
        adresse:     form.rue,
        ville:       form.ville,
        province:    form.province,
        code_postal: form.code_postal,
        tps_no:      form.numero_tps,
        tvq_no:      form.numero_tvq,
        updated_at:  new Date().toISOString(),
      }).eq('id', companyId)
    }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    // TODO: supabase.storage.from('logos').upload(...)
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '860px' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={18} color="var(--gold)" />
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>Paramètres</h1>
        </div>
        <button onClick={save} disabled={saving} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: saved ? 'var(--green)' : 'var(--gold)', border: 'none', borderRadius: '8px',
          padding: '8px 16px', fontSize: '12px', fontWeight: 600,
          color: saved ? '#fff' : '#0A0A0A', cursor: saving ? 'default' : 'pointer', transition: 'background 0.2s',
        }}>
          {saving ? <><Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Enregistrement…</>
           : saved ? <><CheckCircle2 size={13} /> Enregistré</>
           : <><Save size={13} /> Enregistrer</>}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '16px', alignItems: 'start' }}>

        {/* Sidebar */}
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>
          {ONGLETS.map(o => {
            const Icon = o.icon; const active = onglet === o.id
            return (
              <button key={o.id} onClick={() => setOnglet(o.id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 14px', background: active ? 'var(--ga)' : 'transparent',
                border: 'none', borderLeft: `2px solid ${active ? 'var(--gold)' : 'transparent'}`,
                borderBottom: '0.5px solid var(--line)',
                cursor: 'pointer', fontSize: '12px', textAlign: 'left',
                color: active ? 'var(--gold-2)' : 'var(--txt-2)', fontWeight: active ? 600 : 400,
              }}>
                <Icon size={13} /> {o.label}
              </button>
            )
          })}
        </div>

        {/* Contenu */}
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* ── ORGANISATION ── */}
          {onglet === 'organisation' && (<>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', paddingBottom: '12px', borderBottom: '0.5px solid var(--line)' }}>Profil de l'organisation</div>

            <F label="Logo">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '10px', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {logoPreview ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Building2 size={22} color="var(--gold-3)" />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button onClick={() => logoRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '7px 12px', fontSize: '11px', color: 'var(--txt-2)', cursor: 'pointer' }}>
                    <Upload size={12} /> Choisir un fichier
                  </button>
                  <span style={{ fontSize: '10px', color: 'var(--txt-3)' }}>PNG, JPG — max 2 Mo · 200×200 px recommandé</span>
                </div>
                <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogo} />
              </div>
            </F>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <F label="Nom affiché (devis/factures)"><Inp value={form.nom} onChange={v => set('nom', v)} placeholder="Construction Nova" /></F>
              <F label="Raison sociale légale"><Inp value={form.nom_legal} onChange={v => set('nom_legal', v)} placeholder="Nova Structure AI inc." /></F>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <F label="Courriel"><Inp value={form.email} onChange={v => set('email', v)} type="email" placeholder="info@..." /></F>
              <F label="Téléphone"><Inp value={form.telephone} onChange={v => set('telephone', v)} placeholder="(418) 555-0000" /></F>
            </div>
            <F label="Site web"><Inp value={form.site_web} onChange={v => set('site_web', v)} type="url" placeholder="https://..." /></F>

            <div style={{ paddingTop: '12px', borderTop: '0.5px solid var(--line)', fontSize: '12px', fontWeight: 600, color: 'var(--txt-2)' }}>Adresse</div>
            <F label="Rue"><Inp value={form.rue} onChange={v => set('rue', v)} placeholder="1200 boul. Lebourgneuf" /></F>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px', gap: '10px' }}>
              <F label="Ville"><Inp value={form.ville} onChange={v => set('ville', v)} placeholder="Québec" /></F>
              <F label="Province">
                <select value={form.province} onChange={e => set('province', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                  {PROVINCES.map(p => <option key={p}>{p}</option>)}
                </select>
              </F>
              <F label="Code postal"><Inp value={form.code_postal} onChange={v => set('code_postal', v)} placeholder="G2K 2G4" /></F>
            </div>
          </>)}

          {/* ── FISCAL ── */}
          {onglet === 'fiscal' && (<>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', paddingBottom: '12px', borderBottom: '0.5px solid var(--line)' }}>Numéros fiscaux et licences</div>
            <F label="Numéro TPS (Gouvernement fédéral)" hint="Format : 123456789 RT 0001"><Inp value={form.numero_tps} onChange={v => set('numero_tps', v)} placeholder="123456789 RT 0001" /></F>
            <F label="Numéro TVQ (Revenu Québec)" hint="Format : 1234567890 TQ 0001"><Inp value={form.numero_tvq} onChange={v => set('numero_tvq', v)} placeholder="1234567890 TQ 0001" /></F>
            <F label="Numéro RBQ (Régie du bâtiment du Québec)" hint="Requis pour les entrepreneurs généraux et sous-traitants en construction au Québec."><Inp value={form.numero_rbq} onChange={v => set('numero_rbq', v)} placeholder="8264-1234-01" /></F>
            <div style={{ padding: '12px 14px', background: 'rgba(184,146,42,0.06)', border: '0.5px solid var(--gold-3)', borderRadius: '8px', fontSize: '11px', color: 'var(--txt-2)', lineHeight: 1.6 }}>
              💡 Ces numéros apparaissent automatiquement dans le bas de page de tous vos devis et factures, conformément aux exigences de Revenu Québec.
            </div>
          </>)}

          {/* ── FACTURATION ── */}
          {onglet === 'facturation' && (<>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', paddingBottom: '12px', borderBottom: '0.5px solid var(--line)' }}>Paramètres de facturation</div>
            <F label="Mode de paiement par défaut">
              <select value={form.mode_paiement_defaut} onChange={e => set('mode_paiement_defaut', e.target.value as OrgProfile['mode_paiement_defaut'])} style={{ ...inp, cursor: 'pointer' }}>
                <option value="virement">Virement bancaire (recommandé)</option>
                <option value="cheque">Chèque</option>
                <option value="carte">Carte de crédit</option>
                <option value="comptant">Comptant</option>
                <option value="autre">Autre</option>
              </select>
            </F>
            <F label="Délai de paiement par défaut" hint="Préfixé « Net » sur les factures">
              <div style={{ display: 'flex', gap: '8px' }}>
                {([15, 30, 45, 60] as const).map(d => (
                  <button key={d} onClick={() => set('delai_paiement', d)} style={{
                    flex: 1, padding: '9px 0',
                    background: form.delai_paiement === d ? 'var(--ga)' : 'var(--bg-2)',
                    border: `0.5px solid ${form.delai_paiement === d ? 'var(--gold-3)' : 'var(--line)'}`,
                    borderRadius: '7px', cursor: 'pointer', fontSize: '12px',
                    fontWeight: form.delai_paiement === d ? 600 : 400,
                    color: form.delai_paiement === d ? 'var(--gold-2)' : 'var(--txt-2)',
                  }}>{d} j</button>
                ))}
              </div>
            </F>
            <div style={{ padding: '12px 14px', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px', fontSize: '11px', color: 'var(--txt-3)', lineHeight: 1.5 }}>
              Aperçu : Paiement par <strong style={{ color: 'var(--txt-2)' }}>{form.mode_paiement_defaut === 'virement' ? 'virement bancaire' : form.mode_paiement_defaut}</strong> · Net {form.delai_paiement} jours
            </div>
          </>)}

          {/* ── DOCUMENTS ── */}
          {onglet === 'documents' && (<>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', paddingBottom: '12px', borderBottom: '0.5px solid var(--line)' }}>Textes par défaut dans les documents</div>
            <F label="Notes de bas de page — Devis" hint="Conditions générales qui s'affichent sur tous les devis.">
              <textarea value={form.notes_pied_devis} onChange={e => set('notes_pied_devis', e.target.value)} rows={4} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
                onFocus={e => (e.target.style.borderColor = 'var(--gold-3)')} onBlur={e => (e.target.style.borderColor = 'var(--line)')} />
            </F>
            <F label="Notes de bas de page — Factures" hint="Conditions de paiement affichées sur toutes les factures.">
              <textarea value={form.notes_pied_facture} onChange={e => set('notes_pied_facture', e.target.value)} rows={4} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
                onFocus={e => (e.target.style.borderColor = 'var(--gold-3)')} onBlur={e => (e.target.style.borderColor = 'var(--line)')} />
            </F>
          </>)}

          {/* ── APPARENCE ── */}
          {onglet === 'apparence' && (<>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', paddingBottom: '12px', borderBottom: '0.5px solid var(--line)' }}>Identité visuelle des documents</div>
            <F label="Couleur d'accent (devis & factures PDF)" hint="Utilisée pour les en-têtes, numéros et totaux dans les documents envoyés au client.">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="color" value={form.couleur_accent} onChange={e => set('couleur_accent', e.target.value)}
                  style={{ width: '42px', height: '42px', borderRadius: '8px', border: '0.5px solid var(--line)', background: 'none', cursor: 'pointer', padding: '2px' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: form.couleur_accent }}>{form.couleur_accent.toUpperCase()}</div>
                  <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>Cliquez pour changer</div>
                </div>
              </div>
            </F>
            <F label="Palettes suggérées">
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Or',       hex: '#C9A84C' }, { label: 'Ardoise',   hex: '#3B82F6' },
                  { label: 'Forêt',    hex: '#16A34A' }, { label: 'Bordeaux',  hex: '#9F1239' },
                  { label: 'Graphite', hex: '#4B5563' }, { label: 'Terracotta',hex: '#C2410C' },
                ].map(p => (
                  <button key={p.hex} onClick={() => set('couleur_accent', p.hex)} title={p.label}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: p.hex, border: form.couleur_accent === p.hex ? '2px solid var(--txt-1)' : '2px solid transparent', transition: 'border 0.1s' }} />
                    <span style={{ fontSize: '9px', color: 'var(--txt-3)' }}>{p.label}</span>
                  </button>
                ))}
              </div>
            </F>
            <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ background: form.couleur_accent, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>{form.nom || 'Votre entreprise'}</div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.75)' }}>{form.ville || 'Québec, QC'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.75)' }}>DEVIS</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>DEV-2026-001</div>
                </div>
              </div>
              <div style={{ padding: '10px 14px', fontSize: '10px', color: 'var(--txt-3)' }}>Aperçu de l'en-tête de vos documents clients</div>
            </div>
          </>)}

          {/* ── CONFIDENTIALITÉ (Loi 25) ── */}
          {onglet === 'confidentialite' && (<>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', paddingBottom: '12px', borderBottom: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={14} color="var(--gold)" /> Confidentialité & Protection des données (Loi 25)
            </div>

            {/* Statut conformité */}
            <div style={{ background: 'var(--green)10', border: '0.5px solid var(--green)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <CheckCircle2 size={16} color="var(--green)" style={{ marginTop: '1px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '4px' }}>Conformité Loi 25 — Active</div>
                <div style={{ fontSize: '11px', color: 'var(--txt-3)', lineHeight: 1.6 }}>
                  Vos données sont chiffrées AES-256 au repos et TLS en transit. Row Level Security activé — chaque utilisateur n'accède qu'à ses propres données. Infrastructure AWS / Supabase (SOC 2 Type II).
                </div>
              </div>
            </div>

            {/* RPRP */}
            <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--txt-3)', letterSpacing: '0.05em', marginBottom: '10px' }}>RESPONSABLE DE LA PROTECTION (RPRP)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Mail size={13} color="var(--txt-3)" />
                <span style={{ fontSize: '13px', color: 'var(--txt-1)', fontWeight: 600 }}>Max</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--txt-3)' }}>info@novastructureai.com</div>
              <div style={{ fontSize: '11px', color: 'var(--txt-3)', marginTop: '8px', lineHeight: 1.5 }}>
                Toute demande d'accès, de rectification ou de suppression de données personnelles doit être adressée au RPRP. Délai de réponse : 30 jours maximum (Loi 25, art. 30).
              </div>
            </div>

            {/* Rétention des données */}
            <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--txt-3)', letterSpacing: '0.05em', marginBottom: '10px' }}>POLITIQUE DE RÉTENTION</div>
              {[
                { type: 'Données de compte actif',     duree: 'Tant que le compte est actif' },
                { type: 'Compte inactif',               duree: '2 ans puis suppression auto' },
                { type: 'Factures & devis',             duree: '7 ans (obligation fiscale QC)' },
                { type: 'Journaux de connexion',        duree: '90 jours' },
                { type: 'Données supprimées à la demande', duree: '30 jours' },
              ].map(r => (
                <div key={r.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '0.5px solid var(--line)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--txt-2)' }}>{r.type}</span>
                  <span style={{ fontSize: '11px', color: 'var(--txt-3)', background: 'var(--bg-3)', padding: '2px 8px', borderRadius: '5px' }}>{r.duree}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--txt-3)', letterSpacing: '0.05em', marginBottom: '12px' }}>ACTIONS DISPONIBLES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-1)', borderRadius: '8px', border: '0.5px solid var(--line)' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>Exporter mes données</div>
                    <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>Télécharger toutes vos données en format JSON (droit à la portabilité)</div>
                  </div>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--blue)18', border: '0.5px solid var(--blue)', borderRadius: '7px', padding: '7px 12px', fontSize: '11px', fontWeight: 600, color: 'var(--blue)', cursor: 'pointer' }}>
                    <Download size={12} /> Exporter
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-1)', borderRadius: '8px', border: '0.5px solid var(--line)' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>Demande de suppression</div>
                    <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>Envoyer une demande d'effacement au RPRP (traitement sous 30 jours)</div>
                  </div>
                  <a href="mailto:info@novastructureai.com?subject=Demande%20de%20suppression%20de%20données%20(Loi%2025)&body=Bonjour%2C%0A%0AJe%20souhaite%20exercer%20mon%20droit%20à%20l'effacement%20de%20mes%20données%20personnelles%20conformément%20à%20la%20Loi%2025.%0A%0AEmail%20du%20compte%20%3A%20%5Bvotre-email%5D%0A%0ACordialement" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--red)12', border: '0.5px solid var(--red)', borderRadius: '7px', padding: '7px 12px', fontSize: '11px', fontWeight: 600, color: 'var(--red)', cursor: 'pointer', textDecoration: 'none' }}>
                    <Trash2 size={12} /> Demander
                  </a>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-1)', borderRadius: '8px', border: '0.5px solid var(--line)' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>Politique de confidentialité</div>
                    <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>Consulter la politique complète conforme à la Loi 25</div>
                  </div>
                  <a href="/politique-confidentialite" target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-3)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '7px 12px', fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', cursor: 'pointer', textDecoration: 'none' }}>
                    <Shield size={12} /> Consulter →
                  </a>
                </div>
              </div>
            </div>

            {/* Déclaration d'incident */}
            <div style={{ background: 'var(--amber)10', border: '0.5px solid var(--amber)', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={13} color="var(--amber)" /> Incident de confidentialité
              </div>
              <div style={{ fontSize: '11px', color: 'var(--txt-3)', lineHeight: 1.6 }}>
                En cas de violation de la sécurité susceptible de causer un préjudice sérieux, vous devez le déclarer à la <strong>Commission d'accès à l'information (CAI)</strong> dans les 72 heures et aviser les personnes concernées.
              </div>
              <a href="https://www.cai.gouv.qc.ca/incidents-confidentialite/" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '11px', color: 'var(--amber)', textDecoration: 'underline' }}>
                Formulaire de déclaration CAI →
              </a>
            </div>
          </>)}

          {/* ── ÉQUIPE ── */}
          {onglet === 'equipe' && (
            <TeamPanel />
          )}

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
