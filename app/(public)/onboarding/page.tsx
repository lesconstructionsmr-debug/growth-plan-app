'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, ChevronLeft, Check } from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type Vertical = 'construction' | 'marketing' | 'courtier'
type TeamSize = 'solo' | 'small' | 'medium' | 'large'

interface CompanyData { companyName: string; telephone: string; ville: string }
interface AccountData { prenom: string; nom: string; email: string; password: string }

// ─── Constantes ───────────────────────────────────────────────────────────────

const VERTICALS = [
  {
    id: 'construction' as Vertical,
    label: 'Construction',
    subtitle: 'Entrepreneur général, rénovation, spécialité',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    modules: ['Devis & soumissions', 'Projets & chantiers', 'Facturation', 'Gestion équipe', 'Sous-traitants', 'Matériaux'],
    color: '#C9A84C',
  },
  {
    id: 'marketing' as Vertical,
    label: 'Agence Marketing',
    subtitle: 'Publicité, social media, stratégie de marque',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    modules: ['CRM clients', 'Projets & campagnes', 'Facturation', 'Rapports performance', 'Équipe', 'Pipeline de leads'],
    color: '#7C6AF0',
  },
  {
    id: 'courtier' as Vertical,
    label: 'Courtier Hypothécaire',
    subtitle: 'Financement résidentiel et commercial',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    modules: ['Dossiers clients', 'Pipeline de prêts', 'Prêteurs & produits', 'Commissions', 'Leads', 'Documents'],
    color: '#3B9B6F',
  },
]

const TEAM_SIZES = [
  { id: 'solo' as TeamSize, label: 'Solo', subtitle: 'Je travaille seul' },
  { id: 'small' as TeamSize, label: '2–5 personnes', subtitle: 'Petite équipe' },
  { id: 'medium' as TeamSize, label: '6–15 personnes', subtitle: 'Équipe en croissance' },
  { id: 'large' as TeamSize, label: '15+ personnes', subtitle: 'Grande organisation' },
]

const STEPS = ['Votre secteur', 'Votre équipe', 'Votre entreprise', 'Votre compte']

// ─── Étape 2 : Infos entreprise (composant isolé = pas de perte de focus) ────

function StepCompany({ vertical, onNext, onBack }: {
  vertical: Vertical
  onNext: (data: CompanyData) => void
  onBack: () => void
}) {
  const [companyName, setCompanyName] = useState('')
  const [telephone, setTelephone] = useState('')
  const [ville, setVille] = useState('')

  const selectedVertical = VERTICALS.find(v => v.id === vertical)
  const canContinue = companyName.trim().length > 0

  const placeholder =
    vertical === 'construction' ? 'Construction Dupont Inc.' :
    vertical === 'marketing' ? 'Agence Créative XYZ' :
    'Courtiers Associés Québec'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <Field label="Nom de l'entreprise *">
        <input
          type="text" value={companyName} autoFocus required
          onChange={e => setCompanyName(e.target.value)}
          placeholder={placeholder}
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = 'var(--gold-3)'}
          onBlur={e => e.target.style.borderColor = 'var(--line-2)'}
        />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Téléphone">
          <input
            type="tel" value={telephone}
            onChange={e => setTelephone(e.target.value)}
            placeholder="514-555-0100"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--gold-3)'}
            onBlur={e => e.target.style.borderColor = 'var(--line-2)'}
          />
        </Field>
        <Field label="Ville">
          <input
            type="text" value={ville}
            onChange={e => setVille(e.target.value)}
            placeholder="Montréal"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--gold-3)'}
            onBlur={e => e.target.style.borderColor = 'var(--line-2)'}
          />
        </Field>
      </div>

      {selectedVertical && (
        <div style={{
          background: `${selectedVertical.color}0D`, border: `0.5px solid ${selectedVertical.color}33`,
          borderRadius: '10px', padding: '12px 14px',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: selectedVertical.color, marginBottom: '8px' }}>
            Modules inclus — {selectedVertical.label}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {selectedVertical.modules.map(m => (
              <span key={m} style={{
                fontSize: '11px', color: 'var(--txt-2)',
                background: 'var(--bg-2)', borderRadius: '5px',
                padding: '3px 8px', border: '0.5px solid var(--line)',
              }}>
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      <NavButtons
        onBack={onBack}
        onNext={() => onNext({ companyName, telephone, ville })}
        canNext={canContinue}
        nextLabel="Continuer"
      />
    </div>
  )
}

// ─── Étape 3 : Création de compte (composant isolé = pas de perte de focus) ──

function StepAccount({ vertical, teamSize, companyData, onBack, onSubmit, loading, error }: {
  vertical: Vertical
  teamSize: TeamSize
  companyData: CompanyData
  onBack: () => void
  onSubmit: (data: AccountData) => void
  loading: boolean
  error: string
}) {
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  const canSubmit = prenom.trim() && nom.trim() && email.trim() && password.length >= 8

  const teamLabel = TEAM_SIZES.find(t => t.id === teamSize)?.label ?? '—'
  const verticalLabel = VERTICALS.find(v => v.id === vertical)?.label ?? '—'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Prénom *">
          <input
            type="text" value={prenom} autoFocus required
            onChange={e => setPrenom(e.target.value)}
            placeholder="Jean"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--gold-3)'}
            onBlur={e => e.target.style.borderColor = 'var(--line-2)'}
          />
        </Field>
        <Field label="Nom *">
          <input
            type="text" value={nom} required
            onChange={e => setNom(e.target.value)}
            placeholder="Dupont"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--gold-3)'}
            onBlur={e => e.target.style.borderColor = 'var(--line-2)'}
          />
        </Field>
      </div>
      <Field label="Adresse courriel *">
        <input
          type="email" value={email} required
          onChange={e => setEmail(e.target.value)}
          placeholder="jean@entreprise.com"
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = 'var(--gold-3)'}
          onBlur={e => e.target.style.borderColor = 'var(--line-2)'}
        />
      </Field>
      <Field label="Mot de passe *">
        <div style={{ position: 'relative' }}>
          <input
            type={showPw ? 'text' : 'password'} value={password} required
            onChange={e => setPassword(e.target.value)}
            placeholder="8 caractères minimum"
            style={{ ...inputStyle, paddingRight: '40px' }}
            onFocus={e => e.target.style.borderColor = 'var(--gold-3)'}
            onBlur={e => e.target.style.borderColor = 'var(--line-2)'}
          />
          <button type="button" onClick={() => setShowPw(p => !p)} style={{
            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)',
            display: 'flex', alignItems: 'center',
          }}>
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </Field>

      <div style={{
        background: 'var(--bg-2)', border: '0.5px solid var(--line)',
        borderRadius: '10px', padding: '12px 14px',
      }}>
        <p style={{ fontSize: '11px', color: 'var(--txt-3)', fontWeight: 600, marginBottom: '8px' }}>
          RÉSUMÉ DE VOTRE CONFIGURATION
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <RecapRow label="Secteur" value={verticalLabel} />
          <RecapRow label="Équipe" value={teamLabel} />
          <RecapRow label="Entreprise" value={companyData.companyName || '—'} />
          <RecapRow label="Essai gratuit" value="14 jours inclus" highlight />
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(224,96,96,0.1)', border: '0.5px solid rgba(224,96,96,0.3)',
          borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: 'var(--red)',
        }}>
          {error}
        </div>
      )}

      <p style={{ fontSize: '11px', color: 'var(--txt-3)', textAlign: 'center', lineHeight: 1.5 }}>
        En créant votre compte, vous acceptez nos{' '}
        <Link href="/conditions-utilisation" style={{ color: 'var(--gold-2)' }} target="_blank">Conditions d'utilisation</Link>
        {' '}et notre{' '}
        <Link href="/politique-confidentialite" style={{ color: 'var(--gold-2)' }} target="_blank">Politique de confidentialité</Link>.
      </p>

      <NavButtons
        onBack={onBack}
        onNext={() => onSubmit({ prenom, nom, email, password })}
        canNext={!!canSubmit}
        nextLabel={loading ? 'Création du compte...' : 'Créer mon compte — Essai 14 jours gratuit'}
        loading={loading}
      />
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [vertical, setVertical] = useState<Vertical | null>(null)
  const [teamSize, setTeamSize] = useState<TeamSize | null>(null)
  const [companyData, setCompanyData] = useState<CompanyData>({ companyName: '', telephone: '', ville: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canNextStep01 =
    (step === 0 && !!vertical) ||
    (step === 1 && !!teamSize)

  async function handleSubmit(accountData: AccountData) {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data: authData, error: signUpErr } = await supabase.auth.signUp({
      email: accountData.email,
      password: accountData.password,
      options: {
        data: {
          full_name: `${accountData.prenom} ${accountData.nom}`,
          company_name: companyData.companyName,
          telephone: companyData.telephone || null,
          ville: companyData.ville || null,
          vertical,
          team_size: teamSize,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)

    if (signUpErr || !authData.user) {
      setError(signUpErr?.message ?? 'Erreur lors de la création du compte.')
      return
    }

    if (authData.session) {
      router.push('/dashboard')
    } else {
      router.push('/onboarding/confirmation?email=' + encodeURIComponent(accountData.email))
    }
  }

  const subtitle = [
    'Quel type d\'entreprise gérez-vous ?',
    'Quelle est la taille de votre équipe ?',
    'Informations de votre entreprise',
    'Créez votre compte gratuitement',
  ][step]

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-0)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '1.5rem',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <p style={{ fontSize: '13px', color: 'var(--gold-2)', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '6px' }}>
          GROWTH PLAN
        </p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--txt-1)', marginBottom: '6px' }}>
          Configurez votre ERP
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--txt-3)' }}>{subtitle}</p>
      </div>

      {/* Barre de progression */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '2rem', alignItems: 'center' }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i < step ? 'var(--gold)' : i === step ? 'var(--gold-3)' : 'var(--bg-2)',
              border: i === step ? '1.5px solid var(--gold)' : i < step ? 'none' : '0.5px solid var(--line)',
              fontSize: '11px', fontWeight: 600,
              color: i < step ? '#0A0A0A' : i === step ? 'var(--gold-2)' : 'var(--txt-3)',
              transition: 'all 0.2s', flexShrink: 0,
            }}>
              {i < step ? <Check size={13} strokeWidth={2.5} /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                width: '32px', height: '1px',
                background: i < step ? 'var(--gold)' : 'var(--line)',
                transition: 'background 0.3s',
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: step === 0 ? '760px' : '480px',
        background: 'var(--bg-1)', border: '0.5px solid var(--line)',
        borderTop: '2px solid var(--gold-3)', borderRadius: '14px', padding: '2rem',
        transition: 'max-width 0.3s',
      }}>

        {/* ── Étape 0 : Choix du vertical ── */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
              {VERTICALS.map(v => (
                <button
                  key={v.id}
                  onClick={() => setVertical(v.id)}
                  style={{
                    background: vertical === v.id ? `${v.color}15` : 'var(--bg-2)',
                    border: vertical === v.id ? `2px solid ${v.color}` : '0.5px solid var(--line)',
                    borderRadius: '12px', padding: '1.5rem 1rem',
                    cursor: 'pointer', textAlign: 'left',
                    display: 'flex', flexDirection: 'column', gap: '12px',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ color: vertical === v.id ? v.color : 'var(--txt-2)' }}>{v.icon}</div>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '4px' }}>{v.label}</p>
                    <p style={{ fontSize: '12px', color: 'var(--txt-3)', lineHeight: 1.4 }}>{v.subtitle}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {v.modules.map(m => (
                      <div key={m} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '5px', height: '5px', borderRadius: '50%',
                          background: vertical === v.id ? v.color : 'var(--txt-3)', flexShrink: 0,
                        }} />
                        <span style={{ fontSize: '11px', color: 'var(--txt-3)' }}>{m}</span>
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
            <NavButtons
              onNext={() => setStep(1)}
              canNext={!!vertical}
              nextLabel={vertical ? 'Continuer' : 'Choisissez votre secteur'}
            />
          </div>
        )}

        {/* ── Étape 1 : Taille d'équipe ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {TEAM_SIZES.map(ts => (
              <button
                key={ts.id}
                onClick={() => setTeamSize(ts.id)}
                style={{
                  background: teamSize === ts.id ? 'rgba(201,168,76,0.1)' : 'var(--bg-2)',
                  border: teamSize === ts.id ? '2px solid var(--gold)' : '0.5px solid var(--line)',
                  borderRadius: '10px', padding: '14px 16px',
                  cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.15s',
                }}
              >
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '2px' }}>{ts.label}</p>
                  <p style={{ fontSize: '12px', color: 'var(--txt-3)' }}>{ts.subtitle}</p>
                </div>
                {teamSize === ts.id && (
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={13} color="#0A0A0A" strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
            <NavButtons
              onBack={() => setStep(0)}
              onNext={() => setStep(2)}
              canNext={!!teamSize}
              nextLabel="Continuer"
            />
          </div>
        )}

        {/* ── Étape 2 : Infos entreprise (composant isolé) ── */}
        {step === 2 && (
          <StepCompany
            vertical={vertical!}
            onNext={d => { setCompanyData(d); setStep(3) }}
            onBack={() => setStep(1)}
          />
        )}

        {/* ── Étape 3 : Création de compte (composant isolé) ── */}
        {step === 3 && (
          <StepAccount
            vertical={vertical!}
            teamSize={teamSize!}
            companyData={companyData}
            onBack={() => setStep(2)}
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
          />
        )}
      </div>

      <p style={{ fontSize: '12px', color: 'var(--txt-3)', marginTop: '1rem' }}>
        Déjà un compte ?{' '}
        <Link href="/login" style={{ color: 'var(--gold-2)', textDecoration: 'none' }}>
          Se connecter
        </Link>
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── Helpers partagés (définis EN DEHORS de tout composant) ───────────────────

function NavButtons({ onBack, onNext, canNext, nextLabel, loading }: {
  onBack?: () => void
  onNext: () => void
  canNext: boolean
  nextLabel: string
  loading?: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            background: 'none', border: '0.5px solid var(--line)', borderRadius: '8px',
            padding: '10px 16px', fontSize: '13px', color: 'var(--txt-2)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            flexShrink: 0,
          }}
        >
          <ChevronLeft size={15} /> Retour
        </button>
      )}
      <button
        onClick={onNext}
        disabled={!canNext || loading}
        style={{
          flex: 1, background: canNext ? 'var(--gold)' : 'var(--bg-2)',
          border: `0.5px solid ${canNext ? 'var(--gold)' : 'var(--line)'}`,
          borderRadius: '8px', padding: '11px',
          fontSize: '13px', fontWeight: 600,
          color: canNext ? '#0A0A0A' : 'var(--txt-3)',
          cursor: canNext && !loading ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          transition: 'all 0.15s', opacity: loading ? 0.7 : 1,
        }}
      >
        {loading && <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />}
        {nextLabel}
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px', fontWeight: 500 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function RecapRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
      <span style={{ color: 'var(--txt-3)' }}>{label}</span>
      <span style={{ color: highlight ? 'var(--gold-2)' : 'var(--txt-1)', fontWeight: highlight ? 600 : 400 }}>{value}</span>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg-2)',
  border: '0.5px solid var(--line-2)', borderRadius: '7px',
  padding: '9px 12px', fontSize: '13px', color: 'var(--txt-1)', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.15s',
}
