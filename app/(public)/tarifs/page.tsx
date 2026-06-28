'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Building2, Check, Zap, Shield, Users, FileText,
  Receipt, BarChart3, MessageSquare, Bell, Sparkles, ChevronRight,
  Tag, CheckCircle2, X, Loader2,
} from 'lucide-react'

const FEATURES = [
  { icon: BarChart3,    text: 'Dashboard & KPIs en temps réel' },
  { icon: Users,        text: 'Gestion clients & CRM intégré' },
  { icon: FileText,     text: 'Devis professionnels illimités' },
  { icon: Receipt,      text: 'Facturation avec TPS/TVQ automatique' },
  { icon: Building2,    text: 'Gestion des chantiers & jobs' },
  { icon: Bell,         text: 'Rappels automatiques 24h (devis & factures)' },
  { icon: MessageSquare,text: 'Chat intégré avec vos clients' },
  { icon: Sparkles,     text: 'IA Social Media Manager inclus' },
  { icon: Shield,       text: 'Portail client sécurisé (approbation en ligne)' },
  { icon: Zap,          text: 'Génération automatique de factures' },
  { icon: Users,        text: 'Gestion employés & pointage' },
  { icon: BarChart3,    text: 'Rapports financiers & acquisition' },
]

const PLANS = {
  mensuel: {
    prix: 165,
    unite: '/ mois',
    label: 'Mensuel',
    economie: null,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY ?? 'price_mensuel',
    periode: 'month',
  },
  annuel: {
    prix: 129,       // 1550 / 12 = 129.16 ≈ 129
    total: 1550,
    unite: '/ mois',
    label: 'Annuel',
    economie: '— économisez 100$ / an',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL ?? 'price_annuel',
    periode: 'year',
  },
}

const FAQ = [
  {
    q: 'Est-ce que je peux essayer gratuitement ?',
    a: '14 jours d\'essai gratuit sans carte de crédit. Accès complet à toutes les fonctionnalités.',
  },
  {
    q: 'Puis-je annuler en tout temps ?',
    a: 'Oui. Aucun engagement. Vous pouvez annuler depuis votre portail d\'abonnement en un clic. Aucun frais d\'annulation.',
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Chiffrement AES-256 au repos, TLS en transit. Hébergé sur AWS, conforme à la Loi 25 du Québec.',
  },
  {
    q: 'Combien d\'utilisateurs par compte ?',
    a: 'Utilisateurs illimités inclus dans l\'abonnement. Idéal pour les équipes de toutes tailles.',
  },
  {
    q: 'Puis-je passer du mensuel à l\'annuel ?',
    a: 'Oui, depuis votre portail client à tout moment. Le crédit restant est automatiquement appliqué.',
  },
  {
    q: 'Y a-t-il des frais d\'installation ?',
    a: 'Aucun. Votre compte est actif en moins de 2 minutes après l\'inscription.',
  },
]

type PromoState = { status: 'idle' | 'checking' | 'valid' | 'invalid'; label?: string; days?: number }

export default function TarifsPage() {
  const [plan, setPlan]             = useState<'mensuel' | 'annuel'>('annuel')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [promoInput, setPromoInput] = useState('')
  const [promo, setPromo]           = useState<PromoState>({ status: 'idle' })

  async function validatePromo() {
    const code = promoInput.trim().toUpperCase()
    if (!code) return
    setPromo({ status: 'checking' })
    try {
      const res  = await fetch(`/api/stripe/checkout?code=${encodeURIComponent(code)}`)
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

  async function handleCheckout(periode: string) {
    setLoadingPlan(periode)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periode, promoCode: appliedCode }),
      })
      const { url, error } = await res.json()
      if (error) { alert(error); setLoadingPlan(null); return }
      window.location.href = url
    } catch {
      alert('Erreur réseau. Réessayez.')
      setLoadingPlan(null)
    }
  }

  const current = PLANS[plan]

  return (
    <div style={{ background: 'var(--bg-0)', minHeight: '100vh', fontFamily: 'inherit' }}>

      {/* Nav */}
      <nav style={{
        borderBottom: '0.5px solid var(--line)', padding: '14px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={16} color="var(--gold)" />
          </div>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txt-1)' }}>ERP Construction</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/login" style={{ fontSize: '12px', color: 'var(--txt-3)', textDecoration: 'none' }}>Se connecter</Link>
          <Link href="/register" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gold-2)', textDecoration: 'none', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', borderRadius: '7px', padding: '6px 14px' }}>
            Essai gratuit 14j
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '64px 20px 48px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: 600, color: 'var(--gold-2)', marginBottom: '20px' }}>
          <Zap size={11} /> Essai gratuit {trialDays} jours — sans carte de crédit
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--txt-1)', lineHeight: 1.2, marginBottom: '14px', maxWidth: '600px', margin: '0 auto 14px' }}>
          L'ERP pensé pour les entrepreneurs en construction
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--txt-3)', maxWidth: '520px', margin: '0 auto 40px', lineHeight: 1.6 }}>
          Devis, facturation, clients, chantiers, IA — tout en un. Aucune formation requise.
        </p>

        {/* Toggle mensuel / annuel */}
        <div style={{ display: 'inline-flex', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '4px', marginBottom: '40px' }}>
          {(['mensuel', 'annuel'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPlan(p)}
              style={{
                padding: '8px 20px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: 600,
                background: plan === p ? 'var(--gold)' : 'transparent',
                color: plan === p ? '#0A0A0A' : 'var(--txt-3)',
                transition: 'all 0.15s',
              }}
            >
              {p === 'mensuel' ? 'Mensuel' : 'Annuel'}
              {p === 'annuel' && (
                <span style={{ marginLeft: '6px', fontSize: '10px', background: 'rgba(0,0,0,0.15)', borderRadius: '4px', padding: '1px 5px' }}>
                  -5%
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Carte prix */}
        <div style={{
          maxWidth: '420px', margin: '0 auto', background: 'var(--bg-1)',
          border: '1.5px solid var(--gold)', borderRadius: '16px',
          padding: '32px', boxShadow: '0 8px 40px rgba(201,168,76,0.15)',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gold-2)', letterSpacing: '0.1em', marginBottom: '12px' }}>
            PLAN {current.label.toUpperCase()}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', marginBottom: '4px', justifyContent: 'center' }}>
            <span style={{ fontSize: '48px', fontWeight: 800, color: 'var(--txt-1)', lineHeight: 1 }}>
              {plan === 'annuel' ? '129' : '165'}
            </span>
            <div style={{ paddingBottom: '8px' }}>
              <div style={{ fontSize: '16px', color: 'var(--txt-3)' }}>$CAD</div>
              <div style={{ fontSize: '12px', color: 'var(--txt-3)' }}>/ mois</div>
            </div>
          </div>

          {plan === 'annuel' && (
            <div style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 600, marginBottom: '20px' }}>
              Facturé 2 000$ / an — économisez 100$
            </div>
          )}
          {plan === 'mensuel' && (
            <div style={{ fontSize: '12px', color: 'var(--txt-3)', marginBottom: '20px' }}>
              Facturé 165$ / mois
            </div>
          )}

          <button
            onClick={() => handleCheckout(plan)}
            disabled={loadingPlan !== null}
            style={{
              width: '100%', background: 'var(--gold)', border: 'none', borderRadius: '10px',
              padding: '14px', fontSize: '14px', fontWeight: 700, color: '#0A0A0A',
              cursor: loadingPlan ? 'not-allowed' : 'pointer', marginBottom: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              opacity: loadingPlan ? 0.7 : 1,
            }}
          >
            {loadingPlan === plan
              ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Redirection…</>
              : <>{`Commencer l'essai gratuit ${trialDays} jours`} <ChevronRight size={16} /></>
            }
          </button>

          {/* Champ code promo */}
          {promo.status !== 'valid' ? (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-2)', border: `0.5px solid ${promo.status === 'invalid' ? 'var(--red)' : 'var(--line)'}`, borderRadius: '7px', padding: '8px 12px' }}>
                  <Tag size={12} color="var(--txt-3)" />
                  <input
                    value={promoInput}
                    onChange={e => { setPromoInput(e.target.value); if (promo.status === 'invalid') setPromo({ status: 'idle' }) }}
                    onKeyDown={e => e.key === 'Enter' && validatePromo()}
                    placeholder="Code promo (ex: PLANG45)"
                    style={{ background: 'none', border: 'none', outline: 'none', fontSize: '12px', color: 'var(--txt-1)', flex: 1, fontFamily: 'inherit', letterSpacing: '0.05em' }}
                  />
                </div>
                <button
                  onClick={validatePromo}
                  disabled={!promoInput.trim() || promo.status === 'checking'}
                  style={{
                    background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px',
                    padding: '8px 14px', fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)',
                    cursor: promoInput.trim() ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap',
                  }}
                >
                  {promo.status === 'checking' ? <Loader2 size={12} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Appliquer'}
                </button>
              </div>
              {promo.status === 'invalid' && (
                <div style={{ fontSize: '11px', color: 'var(--red)', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <X size={11} /> Code invalide ou expiré
                </div>
              )}
            </div>
          ) : (
            <div style={{
              marginBottom: '16px', background: 'var(--green)12', border: '0.5px solid var(--green)',
              borderRadius: '8px', padding: '10px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={14} color="var(--green)" />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green)' }}>
                    Code <strong>{promoInput.trim().toUpperCase()}</strong> appliqué !
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>{promo.label} offerts</div>
                </div>
              </div>
              <button onClick={clearPromo} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)' }}>
                <X size={13} />
              </button>
            </div>
          )}

          <div style={{ fontSize: '11px', color: 'var(--txt-3)', marginBottom: '24px' }}>
            Sans carte de crédit · Annulation en 1 clic · Accès immédiat
          </div>

          <div style={{ borderTop: '0.5px solid var(--line)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--green)18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={11} color="var(--green)" strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--txt-2)' }}>{f.text}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Social proof */}
        <div style={{ marginTop: '32px', fontSize: '12px', color: 'var(--txt-3)' }}>
          Conçu au Québec 🍁 · Conforme Loi 25 · Support en français
        </div>
      </div>

      {/* Features grid */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 20px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: 700, color: 'var(--txt-1)', marginBottom: '32px' }}>
          Tout ce dont vous avez besoin, rien de superflu
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          {[
            { titre: 'Devis & Facturation', desc: 'Créez des devis professionnels en 2 minutes. TPS/TVQ automatique. PDF prêt à envoyer.', icon: FileText },
            { titre: 'Portail client', desc: 'Vos clients approuvent les devis en ligne. Les factures arrivent automatiquement à l\'approbation.', icon: Shield },
            { titre: 'Rappels automatiques', desc: 'Rappel 24h si devis sans réponse. Relances automatiques pour factures en retard.', icon: Bell },
            { titre: 'Chat intégré', desc: 'Échangez avec vos clients directement depuis leur fiche. Les réponses courriel arrivent dans le chat.', icon: MessageSquare },
            { titre: 'IA Social Media', desc: 'Générateur de contenu Instagram/LinkedIn/TikTok propulsé par l\'IA pour développer votre marque.', icon: Sparkles },
            { titre: 'Pipeline de leads', desc: 'Gérez vos prospects du premier contact jusqu\'à la signature du contrat.', icon: BarChart3 },
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

      {/* CTA final */}
      <div style={{ background: 'var(--ga)', borderTop: '0.5px solid var(--gold-3)', padding: '48px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--txt-1)', marginBottom: '12px' }}>
          Prêt à moderniser votre entreprise ?
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--txt-3)', marginBottom: '24px' }}>
          14 jours gratuits. Aucune carte de crédit requise.
        </p>
        <button
          onClick={() => handleCheckout(plan)}
          style={{
            background: 'var(--gold)', border: 'none', borderRadius: '10px',
            padding: '14px 32px', fontSize: '14px', fontWeight: 700, color: '#0A0A0A',
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
          }}
        >
          Commencer gratuitement <ChevronRight size={16} />
        </button>
        <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--txt-3)' }}>
          <Link href="/politique-confidentialite" style={{ color: 'var(--txt-3)', textDecoration: 'underline' }}>Politique de confidentialité</Link>
          {' · '}Conforme Loi 25 · Québec, Canada
        </div>
      </div>

    </div>
  )
}
