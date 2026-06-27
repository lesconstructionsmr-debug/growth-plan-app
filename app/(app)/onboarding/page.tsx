'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, User, FileText, Mail, Users,
  Check, ChevronRight, ChevronLeft, Loader2,
  Sparkles, ArrowRight, HardHat, Home,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────
type Vertical = 'construction' | 'agence'

interface StepInfo {
  id: number
  icon: React.ReactNode
  titre: string
  sous_titre: string
}

const STEPS: StepInfo[] = [
  { id: 1, icon: <Sparkles size={20} />,  titre: 'Type',             sous_titre: 'Compagnie de service ou agence' },
  { id: 2, icon: <Building2 size={20} />, titre: 'Votre entreprise', sous_titre: 'Configurez les infos de base' },
  { id: 3, icon: <User size={20} />,      titre: 'Premier contact',  sous_titre: 'Client ou emprunteur' },
  { id: 4, icon: <FileText size={20} />,  titre: 'Premier devis',    sous_titre: 'Créez votre premier devis' },
  { id: 5, icon: <Mail size={20} />,      titre: 'Emails',           sous_titre: 'Configurez vos notifications' },
  { id: 6, icon: <Users size={20} />,     titre: 'Équipe',           sous_titre: 'Invitez vos collaborateurs' },
]

interface CompagnieData  { nom: string; telephone: string; adresse: string; ville: string; tps_no: string; tvq_no: string }
interface ClientData     { nom: string; email: string; telephone: string; type: 'particulier' | 'entreprise' }
interface DevisData      { titre: string; montant_estime: string }
interface EmailData      { email_notification: string; rappels_actifs: boolean }
interface EquipeData     { invitations: string }

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep]         = useState(1)
  const [saving, setSaving]     = useState(false)
  const [complete, setComplete] = useState(false)

  // Vertical (étape 1)
  const [vertical, setVertical] = useState<Vertical | null>(null)

  // Données par étape
  const [compagnie, setCompagnie] = useState<CompagnieData>({
    nom: '', telephone: '', adresse: '', ville: '', tps_no: '', tvq_no: '',
  })
  const [client, setClient] = useState<ClientData>({
    nom: '', email: '', telephone: '', type: 'particulier',
  })
  const [devis, setDevis]   = useState<DevisData>({ titre: '', montant_estime: '' })
  const [email, setEmail]   = useState<EmailData>({ email_notification: '', rappels_actifs: true })
  const [equipe, setEquipe] = useState<EquipeData>({ invitations: '' })
  const [tpsError, setTpsError] = useState('')
  const [tvqError, setTvqError] = useState('')

  const pct = ((step - 1) / (STEPS.length - 1)) * 100

  function validateTPS(v: string) {
    if (!v) { setTpsError(''); return true }
    const ok = /^\d{9}\s?RT\s?\d{4}$/.test(v.trim().toUpperCase())
    setTpsError(ok ? '' : 'Format invalide — ex: 123456789 RT 0001')
    return ok
  }
  function validateTVQ(v: string) {
    if (!v) { setTvqError(''); return true }
    const ok = /^\d{10}\s?TQ\s?\d{4}$/.test(v.trim().toUpperCase())
    setTvqError(ok ? '' : 'Format invalide — ex: 1234567890 TQ 0001')
    return ok
  }

  // ── Styles helpers ─────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-2)', border: '0.5px solid var(--line)',
    borderRadius: '8px', padding: '10px 13px', fontSize: '13px',
    color: 'var(--txt-1)', outline: 'none', width: '100%', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)',
    display: 'block', marginBottom: '6px',
  }
  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = 'var(--gold-3)')
  const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = 'var(--line)')

  // ── Step renderers ──────────────────────────────────────────────────

  function StepVertical() {
    const cards: { key: Vertical; icon: React.ReactNode; titre: string; sous_titre: string; exemples: string[] }[] = [
      {
        key: 'construction',
        icon: <HardHat size={28} color="var(--gold)" />,
        titre: 'Compagnie de service',
        sous_titre: 'Construction, rénovation, entrepreneur général',
        exemples: ['Chantiers & Jobs', 'Leads / CRM', 'Employés', 'Devis & Factures'],
      },
      {
        key: 'agence',
        icon: <Home size={28} color="var(--gold)" />,
        titre: 'Agence',
        sous_titre: 'Courtier hypothécaire, immobilier, finance',
        exemples: ['Dossiers (pipeline)', 'Prêteurs', 'Emprunteurs', 'Commissions'],
      },
    ]

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontSize: '12px', color: 'var(--txt-2)', margin: '0 0 4px', lineHeight: 1.6 }}>
          Choisissez votre type d'entreprise. L'interface et les modules s'adapteront automatiquement.
        </p>
        {cards.map(card => (
          <button
            key={card.key}
            type="button"
            onClick={() => setVertical(card.key)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: '16px',
              padding: '16px 18px',
              background: vertical === card.key ? 'var(--ga)' : 'var(--bg-2)',
              border: `${vertical === card.key ? '1.5px solid var(--gold)' : '0.5px solid var(--line)'}`,
              borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.15s',
            }}
          >
            <div style={{
              width: '48px', height: '48px', borderRadius: '10px',
              background: vertical === card.key ? 'var(--ga)' : 'var(--bg-1)',
              border: '0.5px solid var(--gold-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {card.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txt-1)' }}>{card.titre}</span>
                {vertical === card.key && (
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--gold)', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', padding: '1px 7px', borderRadius: '99px' }}>
                    Sélectionné
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--txt-3)', marginBottom: '8px' }}>{card.sous_titre}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {card.exemples.map(ex => (
                  <span key={ex} style={{ fontSize: '10px', color: 'var(--txt-2)', background: 'var(--bg-1)', border: '0.5px solid var(--line)', padding: '2px 8px', borderRadius: '6px' }}>
                    {ex}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
    )
  }

  function StepCompagnie() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={labelStyle}>Nom de l'entreprise <span style={{ color: 'var(--red)' }}>*</span></label>
          <input value={compagnie.nom} onChange={e => setCompagnie(p => ({ ...p, nom: e.target.value }))}
            placeholder={vertical === 'agence' ? 'Ex : Hypothèques Tremblay inc.' : 'Ex : Construction Lapointe inc.'}
            style={inputStyle} onFocus={focus} onBlur={blur} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Téléphone</label>
            <input value={compagnie.telephone} onChange={e => setCompagnie(p => ({ ...p, telephone: e.target.value }))}
              placeholder="418 555-0000" style={inputStyle} onFocus={focus} onBlur={blur} />
          </div>
          <div>
            <label style={labelStyle}>Ville</label>
            <input value={compagnie.ville} onChange={e => setCompagnie(p => ({ ...p, ville: e.target.value }))}
              placeholder="Québec" style={inputStyle} onFocus={focus} onBlur={blur} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Adresse</label>
          <input value={compagnie.adresse} onChange={e => setCompagnie(p => ({ ...p, adresse: e.target.value }))}
            placeholder="245 av. des Pins, Québec QC G1S 1Z0" style={inputStyle} onFocus={focus} onBlur={blur} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>No. TPS (optionnel)</label>
            <input value={compagnie.tps_no}
              onChange={e => { setCompagnie(p => ({ ...p, tps_no: e.target.value })); validateTPS(e.target.value) }}
              placeholder="123456789 RT0001" style={{ ...inputStyle, borderColor: tpsError ? 'var(--red)' : undefined }}
              onFocus={focus} onBlur={blur} />
            {tpsError && <span style={{ fontSize: '10px', color: 'var(--red)', marginTop: '3px', display: 'block' }}>{tpsError}</span>}
          </div>
          <div>
            <label style={labelStyle}>No. TVQ (optionnel)</label>
            <input value={compagnie.tvq_no}
              onChange={e => { setCompagnie(p => ({ ...p, tvq_no: e.target.value })); validateTVQ(e.target.value) }}
              placeholder="1234567890 TQ0001" style={{ ...inputStyle, borderColor: tvqError ? 'var(--red)' : undefined }}
              onFocus={focus} onBlur={blur} />
            {tvqError && <span style={{ fontSize: '10px', color: 'var(--red)', marginTop: '3px', display: 'block' }}>{tvqError}</span>}
          </div>
        </div>
        <div style={{ background: 'var(--ga)', border: '0.5px solid var(--gold-3)', borderRadius: '8px', padding: '10px 13px', fontSize: '11px', color: 'var(--gold-2)', lineHeight: 1.6 }}>
          Ces infos apparaîtront automatiquement sur tous vos devis et factures.
        </div>
      </div>
    )
  }

  function StepClient() {
    const label = vertical === 'agence' ? 'Premier emprunteur' : 'Premier client'
    const placeholder = vertical === 'agence' ? 'Marie Tremblay' : 'Jean Tremblay'

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
          {(['particulier', 'entreprise'] as const).map(t => (
            <button key={t} type="button" onClick={() => setClient(p => ({ ...p, type: t }))}
              style={{
                flex: 1, padding: '9px', border: `0.5px solid ${client.type === t ? 'var(--gold-3)' : 'var(--line)'}`,
                borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                background: client.type === t ? 'var(--ga)' : 'var(--bg-2)',
                color: client.type === t ? 'var(--gold-2)' : 'var(--txt-3)',
              }}>
              {t === 'particulier' ? '👤 Particulier' : '🏢 Entreprise'}
            </button>
          ))}
        </div>
        <div>
          <label style={labelStyle}>{client.type === 'entreprise' ? "Nom de l'entreprise" : label} <span style={{ color: 'var(--red)' }}>*</span></label>
          <input value={client.nom} onChange={e => setClient(p => ({ ...p, nom: e.target.value }))}
            placeholder={client.type === 'entreprise' ? 'Construction Boivin inc.' : placeholder}
            style={inputStyle} onFocus={focus} onBlur={blur} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={client.email} onChange={e => setClient(p => ({ ...p, email: e.target.value }))}
              placeholder="client@email.com" style={inputStyle} onFocus={focus} onBlur={blur} />
          </div>
          <div>
            <label style={labelStyle}>Téléphone</label>
            <input value={client.telephone} onChange={e => setClient(p => ({ ...p, telephone: e.target.value }))}
              placeholder="418 555-0000" style={inputStyle} onFocus={focus} onBlur={blur} />
          </div>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--txt-3)', marginTop: '4px' }}>
          Vous pourrez ajouter l'adresse complète et les notes dans la fiche {vertical === 'agence' ? 'emprunteur' : 'client'}.
        </p>
      </div>
    )
  }

  function StepDevis() {
    const label    = vertical === 'agence' ? 'Premier dossier' : 'Premier devis'
    const ph       = vertical === 'agence' ? 'Ex : Achat — 100 000$ — Marie Tremblay' : 'Ex : Rénovation cuisine — 245 av. des Pins'
    const montantL = vertical === 'agence' ? 'Montant du prêt ($ CAD)' : 'Montant estimé ($ CAD)'
    const tip      = vertical === 'agence'
      ? 'Après l\'onboarding, allez dans Dossiers → Nouveau dossier pour configurer le pipeline complet.'
      : 'Après l\'onboarding, allez dans Devis → Nouveau devis pour ajouter les lignes détaillées, TPS/TVQ et les conditions.'

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '14px', fontSize: '12px', color: 'var(--txt-2)', lineHeight: 1.7 }}>
          {vertical === 'agence'
            ? 'Un dossier regroupe toutes les informations d\'un mandat hypothécaire, de la prise en charge jusqu\'à la commission.'
            : 'Un devis vous permet d\'envoyer une soumission détaillée à votre client. Il peut l\'approuver en ligne.'}
        </div>
        <div>
          <label style={labelStyle}>{vertical === 'agence' ? 'Description du dossier' : 'Titre du projet'} <span style={{ color: 'var(--red)' }}>*</span></label>
          <input value={devis.titre} onChange={e => setDevis(p => ({ ...p, titre: e.target.value }))}
            placeholder={ph} style={inputStyle} onFocus={focus} onBlur={blur} />
        </div>
        <div>
          <label style={labelStyle}>{montantL}</label>
          <input type="number" value={devis.montant_estime} onChange={e => setDevis(p => ({ ...p, montant_estime: e.target.value }))}
            placeholder={vertical === 'agence' ? '350000' : '25000'} style={{ ...inputStyle }} onFocus={focus} onBlur={blur} />
        </div>
        <div style={{ background: 'var(--ga)', border: '0.5px solid var(--gold-3)', borderRadius: '8px', padding: '10px 13px', fontSize: '11px', color: 'var(--gold-2)', lineHeight: 1.6 }}>
          {tip}
        </div>
      </div>
    )
  }

  function StepEmail() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Email de notification <span style={{ color: 'var(--red)' }}>*</span></label>
          <input type="email" value={email.email_notification}
            onChange={e => setEmail(p => ({ ...p, email_notification: e.target.value }))}
            placeholder="vous@votreentreprise.com" style={inputStyle} onFocus={focus} onBlur={blur} />
          <p style={{ fontSize: '10px', color: 'var(--txt-3)', marginTop: '4px' }}>
            Vous recevrez les confirmations, alertes et résumés à cette adresse.
          </p>
        </div>
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>
          {[{ key: 'rappels_actifs' as const, label: 'Rappels automatiques', desc: 'Rappel 24h avant échéance de devis et de factures' }].map(item => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}>
                <input type="checkbox" checked={email[item.key]}
                  onChange={e => setEmail(p => ({ ...p, [item.key]: e.target.checked }))}
                  style={{ accentColor: 'var(--gold)', width: '15px', height: '15px', cursor: 'pointer' }} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--txt-1)' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>{item.desc}</div>
                </div>
              </label>
            </div>
          ))}
          <div style={{ padding: '12px 14px', fontSize: '11px', color: 'var(--txt-3)', lineHeight: 1.6, borderTop: '0.5px solid var(--line)' }}>
            Pour activer l'envoi réel des emails, configurez <code style={{ background: 'var(--bg-3)', padding: '1px 5px', borderRadius: '4px' }}>RESEND_API_KEY</code> dans vos variables d'environnement.
          </div>
        </div>
      </div>
    )
  }

  function StepEquipe() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '14px', fontSize: '12px', color: 'var(--txt-2)', lineHeight: 1.7 }}>
          {vertical === 'agence'
            ? 'Invitez vos collègues courtiers ou assistants pour collaborer sur les dossiers.'
            : 'Invitez votre équipe pour qu\'ils puissent accéder aux chantiers, pointer leurs heures et voir les devis.'}
        </div>
        <div>
          <label style={labelStyle}>Emails à inviter (un par ligne, optionnel)</label>
          <textarea value={equipe.invitations}
            onChange={e => setEquipe(p => ({ ...p, invitations: e.target.value }))}
            placeholder={vertical === 'agence' ? 'courtier2@agence.com\nassistante@agence.com' : 'employe1@email.com\ncontremaitre@email.com'}
            rows={5}
            style={{
              background: 'var(--bg-2)', border: '0.5px solid var(--line)',
              borderRadius: '8px', padding: '10px 13px', fontSize: '12px',
              color: 'var(--txt-1)', outline: 'none', width: '100%', boxSizing: 'border-box',
              resize: 'vertical', fontFamily: 'inherit',
            }}
            onFocus={focus} onBlur={blur} />
        </div>
        <p style={{ fontSize: '11px', color: 'var(--txt-3)' }}>
          Vous pouvez sauter cette étape — les invitations sont aussi disponibles dans <strong>Paramètres → Équipe</strong>.
        </p>
      </div>
    )
  }

  // ── Navigation ─────────────────────────────────────────────────────
  function canNext(): boolean {
    if (step === 1) return vertical !== null
    if (step === 2) return compagnie.nom.trim().length > 0
    if (step === 3) return client.nom.trim().length > 0
    if (step === 4) return devis.titre.trim().length > 0
    return true
  }

  async function handleFinish() {
    if (!validateTPS(compagnie.tps_no) || !validateTVQ(compagnie.tvq_no)) {
      setStep(2); return
    }
    setSaving(true)
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vertical, compagnie, client, devis, email }),
      })
    } catch (err) {
      console.error('[onboarding]', err)
    }
    setSaving(false)
    setComplete(true)
    await new Promise(r => setTimeout(r, 1500))
    router.push('/dashboard')
  }

  // ── Complete screen ─────────────────────────────────────────────────
  if (complete) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-0)', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--ga)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid var(--gold-3)' }}>
            <Check size={28} color="var(--gold)" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--txt-1)', margin: '0 0 8px' }}>Plan Growth est prêt !</h2>
          <p style={{ fontSize: '13px', color: 'var(--txt-2)', marginBottom: '24px' }}>
            Votre compte est configuré. Redirection vers le tableau de bord…
          </p>
          <div style={{ width: '48px', height: '3px', background: 'var(--line)', borderRadius: '2px', margin: '0 auto', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: 'var(--gold)', animation: 'progress 1.5s linear forwards' }} />
          </div>
        </div>
        <style>{`@keyframes progress { from { width: 0 } to { width: 100% } }`}</style>
      </div>
    )
  }

  const currentStep = STEPS[step - 1]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '540px' }}>

        {/* Logo / titre */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={18} color="var(--gold)" />
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt-1)' }}>Plan Growth</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--txt-2)' }}>Configuration initiale — ça prend moins de 3 minutes</p>
        </div>

        {/* Barre de progression */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            {STEPS.map(s => (
              <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', opacity: s.id > step ? 0.35 : 1, transition: 'opacity 0.2s' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: s.id < step ? 'var(--green)' : s.id === step ? 'var(--gold)' : 'var(--bg-2)',
                  border: `0.5px solid ${s.id === step ? 'var(--gold)' : 'var(--line)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: s.id <= step ? (s.id < step ? '#fff' : '#0A0A0A') : 'var(--txt-3)',
                  transition: 'background 0.2s', fontSize: '14px',
                }}>
                  {s.id < step ? <Check size={14} /> : s.id}
                </div>
                <span style={{ fontSize: '9px', color: s.id === step ? 'var(--gold-2)' : 'var(--txt-3)', fontWeight: s.id === step ? 600 : 400, textAlign: 'center', maxWidth: '58px' }}>
                  {s.titre}
                </span>
              </div>
            ))}
          </div>
          <div style={{ height: '3px', background: 'var(--line)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--gold)', borderRadius: '2px', transition: 'width 0.3s ease' }} />
          </div>
        </div>

        {/* Carte étape */}
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '14px', padding: '28px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
              {currentStep.icon}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--txt-1)' }}>{currentStep.titre}</div>
              <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>{currentStep.sous_titre}</div>
            </div>
          </div>

          {step === 1 && <StepVertical />}
          {step === 2 && <StepCompagnie />}
          {step === 3 && <StepClient />}
          {step === 4 && <StepDevis />}
          {step === 5 && <StepEmail />}
          {step === 6 && <StepEquipe />}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '9px', padding: '11px 18px', fontSize: '12px', color: 'var(--txt-2)', cursor: 'pointer' }}>
              <ChevronLeft size={14} /> Précédent
            </button>
          ) : <div />}

          {step < STEPS.length ? (
            <button onClick={() => canNext() && setStep(s => s + 1)} disabled={!canNext()}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: canNext() ? 'var(--gold)' : 'var(--bg-3)',
                border: 'none', borderRadius: '9px', padding: '11px 22px',
                fontSize: '12px', fontWeight: 600,
                color: canNext() ? '#0A0A0A' : 'var(--txt-3)',
                cursor: canNext() ? 'pointer' : 'not-allowed', transition: 'background 0.15s',
              }}>
              Suivant <ChevronRight size={14} />
            </button>
          ) : (
            <button onClick={handleFinish} disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'var(--gold)', border: 'none', borderRadius: '9px',
                padding: '11px 22px', fontSize: '12px', fontWeight: 600,
                color: '#0A0A0A', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.85 : 1,
              }}>
              {saving ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <ArrowRight size={14} />}
              {saving ? 'Configuration…' : 'Accéder au tableau de bord'}
            </button>
          )}
        </div>

        {/* Skip */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button onClick={() => router.push('/dashboard')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--txt-3)', textDecoration: 'underline' }}>
            Passer l'onboarding et configurer plus tard
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
