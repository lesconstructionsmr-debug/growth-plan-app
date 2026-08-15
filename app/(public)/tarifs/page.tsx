'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Building2, Check, Zap, Shield, FileText,
  MessageSquare, Bell, Sparkles, ChevronRight,
  Tag, CheckCircle2, X, Loader2, Plug, BarChart3,
} from 'lucide-react'
import {
  SETUP_FEE_CAD,
  SETUP_FEE_LABEL,
  PRICING_BASE_MONTHLY_CAD,
  PRICING_TIERS,
  TIER_FEATURE_BULLETS,
  formatPriceCad,
  type PricingTierId,
} from '@/lib/stripe/pricing'

const FAQ = [
  {
    q: 'Est-ce que je peux essayer gratuitement ?',
    a: '14 jours d\'essai gratuit sur l\'abonnement. Les frais d\'adhésion (500$) pour la configuration des intégrations sont facturés une seule fois à l\'inscription.',
  },
  {
    q: 'Comment choisir mon forfait ?',
    a: 'Comptez vos utilisateurs actifs (propriétaire, admins, employés avec accès). AUTONOME : 1-2 · ÉQUIPE : 3-10 · CROISSANCE : 11-20 · ENTREPRISE : 21+.',
  },
  {
    q: 'Puis-je annuler en tout temps ?',
    a: 'Les forfaits sont sur abonnement annuel avec engagement de 12 mois. Contactez le support pour toute question de renouvellement ou changement de palier.',
  },
  {
    q: 'Y a-t-il des frais d\'installation ?',
    a: `Oui — frais d'adhésion unique de ${SETUP_FEE_CAD}$ pour la configuration API, QuickBooks et vos intégrations tierces.`,
  },
]

type PromoState = { status: 'idle' | 'checking' | 'valid' | 'invalid'; label?: string; days?: number }

export default function TarifsPage() {
  const [loadingTier, setLoadingTier] = useState<PricingTierId | null>(null)
  const [promoInput, setPromoInput] = useState('')
  const [promo, setPromo] = useState<PromoState>({ status: 'idle' })

  async function validatePromo() {
    const code = promoInput.trim().toUpperCase()
    if (!code) return
    setPromo({ status: 'checking' })
    try {
      const res = await fetch(`/api/stripe/checkout?code=${encodeURIComponent(code)}`)
      const data = await res.json()
      if (data.valid) {
        setPromo({ status: 'valid', label: data.label, days: data.trialDays })
      } else {
        setPromo({ status: 'invalid' })
      }
    } catch {
      setPromo({ status: 'invalid' })
    }
  }

  function clearPromo() {
    setPromoInput('')
    setPromo({ status: 'idle' })
  }

  const trialDays = promo.status === 'valid' ? (promo.days ?? 14) : 14
  const appliedCode = promo.status === 'valid' ? promoInput.trim().toUpperCase() : undefined

  async function handleCheckout(tierId: PricingTierId) {
    const tier = PRICING_TIERS.find(t => t.id === tierId)
    if (!tier || tier.contactOnly) return

    setLoadingTier(tierId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tierId, promoCode: appliedCode }),
      })
      const { url, error } = await res.json()
      if (error) { alert(error); setLoadingTier(null); return }
      window.location.href = url
    } catch {
      alert('Erreur réseau. Réessayez.')
      setLoadingTier(null)
    }
  }

  return (
    <div style={{ background: 'var(--bg-0)', minHeight: '100vh', fontFamily: 'inherit' }}>

      <nav style={{
        borderBottom: '0.5px solid var(--line)', padding: '14px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={16} color="var(--gold)" />
          </div>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txt-1)' }}>Plan Growth</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/login" style={{ fontSize: '12px', color: 'var(--txt-3)', textDecoration: 'none' }}>Se connecter</Link>
          <Link href="/register" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gold-2)', textDecoration: 'none', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', borderRadius: '7px', padding: '6px 14px' }}>
            Essai gratuit 14j
          </Link>
        </div>
      </nav>

      <div style={{ textAlign: 'center', padding: '64px 20px 24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: 600, color: 'var(--gold-2)', marginBottom: '20px' }}>
          <Zap size={11} /> Essai gratuit {trialDays} jours · À partir de {formatPriceCad(PRICING_BASE_MONTHLY_CAD)} $ / mois
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--txt-1)', lineHeight: 1.2, marginBottom: '14px', maxWidth: '640px', margin: '0 auto 14px' }}>
          Des tarifs clairs pour chaque niveau d&apos;entreprise
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--txt-3)', maxWidth: '560px', margin: '0 auto 16px', lineHeight: 1.6 }}>
          Abonnement annuel · engagement de 12 mois · + {SETUP_FEE_CAD} $ frais d&apos;adhésion (API & intégrations)
        </p>
      </div>

      {/* Grille forfaits */}
      <div style={{
        maxWidth: '1120px', margin: '0 auto', padding: '0 20px 48px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'stretch',
      }}>
        {PRICING_TIERS.map(tier => {
          const isPopular = tier.popular
          const isLoading = loadingTier === tier.id

          return (
            <div
              key={tier.id}
              style={{
                background: 'var(--bg-1)',
                border: isPopular ? '1.5px solid #E85D4C' : '0.5px solid var(--line)',
                borderRadius: '16px',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: isPopular ? '0 8px 32px rgba(232,93,76,0.12)' : 'none',
                position: 'relative',
              }}
            >
              {isPopular && (
                <div style={{
                  position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(90deg, #F5D061, #E85D4C)', color: '#0A0A0A',
                  fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em',
                  padding: '4px 12px', borderRadius: '20px', whiteSpace: 'nowrap',
                }}>
                  LE PLUS POPULAIRE
                </div>
              )}

              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--txt-3)', letterSpacing: '0.12em', marginBottom: '8px' }}>
                {tier.name}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--txt-2)', marginBottom: '20px', minHeight: '36px' }}>
                {tier.subtitle}
              </div>

              {tier.contactOnly ? (
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--txt-1)', marginBottom: '8px', letterSpacing: '0.04em' }}>
                  NOUS<br />CONTACTER
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '36px', fontWeight: 800, color: 'var(--txt-1)', lineHeight: 1 }}>
                      {formatPriceCad(tier.monthlyDisplayCad)} $
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--txt-3)', paddingBottom: '6px' }}>/ mois</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--txt-3)', lineHeight: 1.5, marginBottom: '20px' }}>
                    Abonnement annuel · engagement de 12 mois.<br />
                    Paiement unique de {formatPriceCad(tier.annualTotalCad)} $ / an
                  </div>
                </>
              )}

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', flex: 1 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--txt-2)', marginBottom: '10px' }}>
                  <Check size={14} color="var(--green)" strokeWidth={2.5} />
                  {tier.usersLabel}
                </li>
                {TIER_FEATURE_BULLETS.map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--txt-2)', marginBottom: '10px' }}>
                    <Check size={14} color="var(--green)" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>

              {tier.contactOnly ? (
                <Link
                  href="/support"
                  style={{
                    display: 'block', textAlign: 'center', textDecoration: 'none',
                    padding: '12px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                    border: '0.5px solid var(--line)', color: 'var(--txt-1)', background: 'transparent',
                  }}
                >
                  Nous contacter
                </Link>
              ) : (
                <button
                  onClick={() => handleCheckout(tier.id)}
                  disabled={isLoading}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                    border: isPopular ? 'none' : '0.5px solid var(--line)',
                    background: isPopular ? 'linear-gradient(90deg, #F5D061, #E85D4C)' : 'transparent',
                    color: isPopular ? '#0A0A0A' : 'var(--txt-1)',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  }}
                >
                  {isLoading
                    ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Redirection…</>
                    : <>Commencer · essai {trialDays}j <ChevronRight size={14} /></>
                  }
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Adhésion + promo */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 20px 48px' }}>
        <div style={{
          background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px',
          padding: '16px 18px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start',
        }}>
          <Plug size={16} color="var(--gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '4px' }}>
              + {SETUP_FEE_CAD} $ frais d&apos;adhésion (unique)
            </div>
            <div style={{ fontSize: '12px', color: 'var(--txt-3)', lineHeight: 1.5 }}>{SETUP_FEE_LABEL}</div>
          </div>
        </div>

        {promo.status !== 'valid' ? (
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-1)', border: `0.5px solid ${promo.status === 'invalid' ? 'var(--red)' : 'var(--line)'}`, borderRadius: '8px', padding: '10px 12px' }}>
              <Tag size={12} color="var(--txt-3)" />
              <input
                value={promoInput}
                onChange={e => { setPromoInput(e.target.value); if (promo.status === 'invalid') setPromo({ status: 'idle' }) }}
                onKeyDown={e => e.key === 'Enter' && validatePromo()}
                placeholder="Code promo (ex: PLANG45)"
                style={{ background: 'none', border: 'none', outline: 'none', fontSize: '12px', color: 'var(--txt-1)', flex: 1, fontFamily: 'inherit' }}
              />
            </div>
            <button
              onClick={validatePromo}
              disabled={!promoInput.trim() || promo.status === 'checking'}
              style={{
                background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '8px',
                padding: '10px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-2)', cursor: 'pointer',
              }}
            >
              {promo.status === 'checking' ? <Loader2 size={12} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Appliquer'}
            </button>
          </div>
        ) : (
          <div style={{
            background: 'var(--green)12', border: '0.5px solid var(--green)', borderRadius: '8px',
            padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={14} color="var(--green)" />
              <span style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 600 }}>
                Code {promoInput.trim().toUpperCase()} — {promo.label}
              </span>
            </div>
            <button onClick={clearPromo} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)' }}>
              <X size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Features */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 20px 48px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: 700, color: 'var(--txt-1)', marginBottom: '28px' }}>
          Tout inclus dans chaque forfait
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          {[
            { titre: 'Devis & Facturation', desc: 'Devis professionnels, TPS/TVQ, PDF prêt à envoyer.', icon: FileText },
            { titre: 'Portail client', desc: 'Approbation de devis en ligne et facturation automatique.', icon: Shield },
            { titre: 'Rappels automatiques', desc: 'Relances devis et factures sans effort.', icon: Bell },
            { titre: 'Chat intégré', desc: 'Échanges clients centralisés dans l\'ERP.', icon: MessageSquare },
            { titre: 'IA Social Media', desc: 'Contenu Instagram, LinkedIn et TikTok.', icon: Sparkles },
            { titre: 'Pipeline de leads', desc: 'Du prospect à la signature.', icon: BarChart3 },
          ].map(f => {
            const Icon = f.icon
            return (
              <div key={f.titre} style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <Icon size={16} color="var(--gold)" />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '6px' }}>{f.titre}</div>
                <div style={{ fontSize: '12px', color: 'var(--txt-3)', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 20px 64px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: 700, color: 'var(--txt-1)', marginBottom: '28px' }}>
          Questions fréquentes
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {FAQ.map(f => (
            <div key={f.q} style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '16px 18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '6px' }}>{f.q}</div>
              <div style={{ fontSize: '12px', color: 'var(--txt-3)', lineHeight: 1.6 }}>{f.a}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ background: 'var(--ga)', borderTop: '0.5px solid var(--gold-3)', padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: 'var(--txt-3)' }}>
          Conçu au Québec 🍁 · Conforme Loi 25 ·{' '}
          <Link href="/support" style={{ color: 'var(--gold-2)', textDecoration: 'underline' }}>Support</Link>
        </p>
      </div>
    </div>
  )
}
