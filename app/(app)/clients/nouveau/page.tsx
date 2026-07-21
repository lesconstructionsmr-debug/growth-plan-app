'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, User, Building2, Mail, Phone, MapPin,
  FileText, ChevronLeft, Check, AlertCircle, Loader2
} from 'lucide-react'
import AddressAutocomplete from '@/components/address-autocomplete'

type TypeClient = 'particulier' | 'entreprise'
type StatutClient = 'prospect' | 'actif'

interface FormData {
  nom: string
  type: TypeClient
  statut: StatutClient
  email: string
  telephone: string
  adresse: string
  ville: string
  province: string
  code_postal: string
  numero_tps: string
  numero_tvq: string
  notes: string
}

const INITIAL: FormData = {
  nom: '', type: 'particulier', statut: 'prospect',
  email: '', telephone: '',
  adresse: '', ville: '', province: 'QC', code_postal: '',
  numero_tps: '', numero_tvq: '',
  notes: '',
}

// ── Utilitaires ────────────────────────────────────────────────
function formatTelephone(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

// ── Composants ─────────────────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '5px' }}>
      {children}
      {required && <span style={{ color: 'var(--red)', marginLeft: '3px' }}>*</span>}
    </label>
  )
}

function Field({ children, error }: { children: React.ReactNode; error?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {children}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--red)' }}>
          <AlertCircle size={10} /> {error}
        </div>
      )}
    </div>
  )
}

function Input({
  value, onChange, placeholder, type = 'text', disabled,
}: {
  value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; disabled?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        background: 'var(--bg-2)', border: '0.5px solid var(--line)',
        borderRadius: '7px', padding: '8px 11px',
        fontSize: '12px', color: 'var(--txt-1)', outline: 'none',
        width: '100%', boxSizing: 'border-box',
        opacity: disabled ? 0.5 : 1,
      }}
      onFocus={e => (e.target.style.borderColor = 'var(--gold-3)')}
      onBlur={e => (e.target.style.borderColor = 'var(--line)')}
    />
  )
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
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
  )
}

// ── Page ───────────────────────────────────────────────────────
export default function NouveauClientPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  function set(field: keyof FormData, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }))
  }

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!form.nom.trim()) errs.nom = 'Le nom est requis'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Courriel invalide'
    if (form.telephone && form.telephone.replace(/\D/g, '').length < 10) errs.telephone = 'Numéro incomplet'
    if (form.code_postal && !/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(form.code_postal)) {
      errs.code_postal = 'Format : A1A 1A1'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setStatus('saving')
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setErrors({ nom: err.error ?? 'Erreur lors de la création' })
        setStatus('idle')
        return
      }
    } catch {
      setErrors({ nom: 'Erreur réseau' })
      setStatus('idle')
      return
    }
    setStatus('saved')
    await new Promise(r => setTimeout(r, 600))
    router.push('/clients')
  }

  const isEntreprise = form.type === 'entreprise'

  return (
    <div style={{ padding: '24px', maxWidth: '700px' }}>

      {/* ── En-tête ─────────────────────────────── */}
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
          <Users size={17} color="var(--gold)" />
          <h1 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>Nouveau client</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── Type de client ───────────────────── */}
        <div style={{
          background: 'var(--bg-1)', border: '0.5px solid var(--line)',
          borderRadius: '10px', padding: '16px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '12px' }}>
            Type de client
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {([
              { value: 'particulier', label: 'Particulier', icon: User,      desc: 'Personne physique' },
              { value: 'entreprise',  label: 'Entreprise',  icon: Building2, desc: 'Inc., ltée, s.e.n.c.' },
            ] as const).map(opt => {
              const Icon = opt.icon
              const active = form.type === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('type', opt.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px', border: `0.5px solid ${active ? 'var(--gold-3)' : 'var(--line)'}`,
                    borderRadius: '8px', cursor: 'pointer',
                    background: active ? 'var(--ga)' : 'var(--bg-2)',
                    textAlign: 'left', transition: 'all 0.12s',
                  }}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '7px', flexShrink: 0,
                    background: active ? 'var(--gold-3)' : 'var(--bg-3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={15} color={active ? 'var(--gold)' : 'var(--txt-3)'} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: active ? 'var(--gold-2)' : 'var(--txt-1)' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginTop: '1px' }}>{opt.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Informations générales ────────────── */}
        <div style={{
          background: 'var(--bg-1)', border: '0.5px solid var(--line)',
          borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>Informations générales</div>

          <Field error={errors.nom}>
            <Label required>{isEntreprise ? 'Raison sociale' : 'Nom complet'}</Label>
            <Input
              value={form.nom}
              onChange={v => set('nom', v)}
              placeholder={isEntreprise ? 'Construction Boivin inc.' : 'Jean Tremblay'}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Field error={errors.email}>
              <Label>Courriel</Label>
              <Input
                type="email"
                value={form.email}
                onChange={v => set('email', v)}
                placeholder="jean@exemple.ca"
              />
            </Field>
            <Field error={errors.telephone}>
              <Label>Téléphone</Label>
              <Input
                value={form.telephone}
                onChange={v => set('telephone', formatTelephone(v))}
                placeholder="(418) 555-0100"
              />
            </Field>
          </div>

          <div>
            <Label>Statut initial</Label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {([
                { value: 'prospect', label: 'Prospect',  color: 'var(--amber)' },
                { value: 'actif',    label: 'Actif',     color: 'var(--green)' },
              ] as const).map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => set('statut', s.value)}
                  style={{
                    padding: '5px 14px', border: `0.5px solid ${form.statut === s.value ? s.color+'66' : 'var(--line)'}`,
                    borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 500,
                    background: form.statut === s.value ? `${s.color}15` : 'var(--bg-2)',
                    color: form.statut === s.value ? s.color : 'var(--txt-3)',
                    transition: 'all 0.12s',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Adresse ──────────────────────────── */}
        <div style={{
          background: 'var(--bg-1)', border: '0.5px solid var(--line)',
          borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>Adresse</div>

          <Field>
            <Label>Rue (Saisie automatique Google Maps)</Label>
            <AddressAutocomplete
              value={form.adresse}
              onChange={v => set('adresse', v)}
              placeholder="Rechercher une adresse avec Google Maps..."
              onAddressSelect={({ adresse, ville, province, code_postal }) => {
                setForm(f => ({
                  ...f,
                  adresse,
                  ville: ville || f.ville,
                  province: province || f.province,
                  code_postal: code_postal || f.code_postal,
                }))
              }}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
            <Field>
              <Label>Ville</Label>
              <Input value={form.ville} onChange={v => set('ville', v)} placeholder="Québec" />
            </Field>
            <Field>
              <Label>Province</Label>
              <select
                value={form.province}
                onChange={e => set('province', e.target.value)}
                style={{
                  background: 'var(--bg-2)', border: '0.5px solid var(--line)',
                  borderRadius: '7px', padding: '8px 11px',
                  fontSize: '12px', color: 'var(--txt-1)', outline: 'none', width: '100%',
                }}
              >
                {['QC','ON','BC','AB','MB','SK','NB','NS','PE','NL','NT','NU','YT'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field error={errors.code_postal}>
              <Label>Code postal</Label>
              <Input
                value={form.code_postal}
                onChange={v => set('code_postal', v.toUpperCase())}
                placeholder="G1R 2B5"
              />
            </Field>
          </div>
        </div>

        {/* ── Numéros de taxes (entreprise) ─────── */}
        {isEntreprise && (
          <div style={{
            background: 'var(--bg-1)', border: '0.5px solid var(--line)',
            borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>
              Numéros de taxes (optionnel)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Field>
                <Label>N° TPS (fédéral)</Label>
                <Input
                  value={form.numero_tps}
                  onChange={v => set('numero_tps', v)}
                  placeholder="123456789RT0001"
                />
              </Field>
              <Field>
                <Label>N° TVQ (provincial)</Label>
                <Input
                  value={form.numero_tvq}
                  onChange={v => set('numero_tvq', v)}
                  placeholder="1234567890TQ0001"
                />
              </Field>
            </div>
          </div>
        )}

        {/* ── Notes ────────────────────────────── */}
        <div style={{
          background: 'var(--bg-1)', border: '0.5px solid var(--line)',
          borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>Notes internes</div>
          <Textarea
            value={form.notes}
            onChange={v => set('notes', v)}
            placeholder="Référé par un ami, préfère les communications par courriel…"
            rows={3}
          />
        </div>

        {/* ── Actions ──────────────────────────── */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingBottom: '24px' }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              background: 'var(--bg-2)', border: '0.5px solid var(--line)',
              borderRadius: '8px', padding: '9px 18px',
              fontSize: '12px', color: 'var(--txt-2)', cursor: 'pointer',
            }}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={status !== 'idle'}
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
            {status === 'saving' ? 'Enregistrement…'
              : status === 'saved' ? 'Enregistré !'
              : 'Créer le client'}
          </button>
        </div>

      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
