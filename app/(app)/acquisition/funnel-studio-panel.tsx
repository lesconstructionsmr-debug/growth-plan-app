'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Copy, CheckCircle2, Globe, Search, Instagram, ArrowRight } from 'lucide-react'

export default function FunnelStudioPanel() {
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [copied, setCopied] = useState<'url' | 'key' | ''>('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/company/leads-connect')
      .then(async r => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'Erreur')
        setUrl(data.url || '')
        setKey(data.token || '')
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Erreur'))
  }, [])

  async function copy(kind: 'url' | 'key', value: string) {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(kind)
    setTimeout(() => setCopied(''), 2000)
  }

  const box: React.CSSProperties = {
    background: 'var(--bg-1)', border: '0.5px solid var(--line)',
    borderRadius: '10px', padding: '16px',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ ...box, background: 'var(--ga)', borderColor: 'var(--gold-3)' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--txt-1)', marginBottom: '8px' }}>
          Tout aboutit ici : Leads / CRM
        </div>
        <p style={{ fontSize: '13px', color: 'var(--txt-2)', margin: 0, lineHeight: 1.65 }}>
          Site, Google Ads, Facebook et Instagram poussent vers Leads.
          Le tableau calcule ensuite tes coûts et ton entonnoir avec les vrais chiffres.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
        <div style={box}>
          <Globe size={16} color="var(--gold)" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--txt-1)', marginBottom: '8px' }}>1. Site web</div>
          <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--txt-2)', lineHeight: 1.7 }}>
            <li>Va dans Paramètres → Site web → CRM</li>
            <li>On colle le formulaire sur la page Contact (ou « Oui, faites-le pour moi »)</li>
            <li>Un visiteur envoie → ça tombe dans Leads</li>
          </ol>
          <Link href="/parametres" style={linkBtn()}>
            Ouvrir Site web → CRM <ArrowRight size={12} />
          </Link>
        </div>

        <div style={box}>
          <Search size={16} color="var(--gold)" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--txt-1)', marginBottom: '8px' }}>2. Google Ads</div>
          <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--txt-2)', lineHeight: 1.7 }}>
            <li>Google Ads → Outils → Assets → Formulaire de prospect</li>
            <li>Ouvre le formulaire (crayon) → Intégration webhook</li>
            <li>Colle l&apos;adresse, colle la clé (ci-dessous)</li>
            <li>Clique « Envoyer des données de test »</li>
            <li>Dans Plan Growth : Leads — tu dois voir « Google Ads (test) »</li>
          </ol>
        </div>

        <div style={box}>
          <Instagram size={16} color="var(--gold)" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--txt-1)', marginBottom: '8px' }}>3. Meta &amp; Instagram</div>
          <p style={{ fontSize: '12px', color: 'var(--txt-2)', margin: '0 0 8px', lineHeight: 1.65 }}>
            Instagram = Facebook (même compte Meta).
          </p>
          <p style={{ fontSize: '12px', color: 'var(--txt-2)', margin: '0 0 8px', lineHeight: 1.65 }}>
            <strong>Ça marche aujourd&apos;hui :</strong> la pub ouvre la page Contact du site (étape 1). Même tuyau.
          </p>
          <p style={{ fontSize: '12px', color: 'var(--txt-2)', margin: 0, lineHeight: 1.65 }}>
            <strong>Formulaire dans la pub</strong> (Lead Ads, sans quitter Insta) : Meta n&apos;envoie pas les noms comme Google.
            On le branche à l&apos;adhésion dans leur Business Manager — ce n&apos;est pas la case « Connecté » de Budgets.
          </p>
        </div>
      </div>

      <div style={box}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--txt-1)', marginBottom: '6px' }}>
          À coller dans Google Ads (webhook)
        </div>
        <p style={{ fontSize: '12px', color: 'var(--txt-3)', margin: '0 0 12px', lineHeight: 1.5 }}>
          Adresse + clé. Les deux. Sinon Google refuse d&apos;envoyer.
        </p>
        {error && (
          <div style={{ fontSize: '12px', color: 'var(--txt-3)', marginBottom: '10px' }}>
            {error.includes('propriétaires') || error.includes('administrateurs')
              ? 'Seul le propriétaire / admin peut copier l\'adresse. Demande-lui, ou ouvre Paramètres.'
              : error}
          </div>
        )}
        <Field label="Adresse webhook (URL)" value={url} copied={copied === 'url'} onCopy={() => copy('url', url)} />
        <div style={{ height: '10px' }} />
        <Field label="Clé webhook" value={key} copied={copied === 'key'} onCopy={() => copy('key', key)} />
      </div>
    </div>
  )
}

function Field({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: 'var(--txt-3)', marginBottom: '6px' }}>{label}</div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          readOnly
          value={value}
          onFocus={e => e.target.select()}
          style={{
            flex: 1, background: 'var(--bg-2)', border: '0.5px solid var(--line)',
            borderRadius: '8px', padding: '9px 12px', fontSize: '11px', color: 'var(--txt-1)',
            fontFamily: 'ui-monospace, monospace',
          }}
        />
        <button type="button" onClick={onCopy} disabled={!value} style={copyBtn()}>
          {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
          {copied ? 'Copié' : 'Copier'}
        </button>
      </div>
    </div>
  )
}

function copyBtn(): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: 'var(--bg-2)', border: '0.5px solid var(--line)',
    borderRadius: '8px', padding: '8px 12px', fontSize: '11px', fontWeight: 600,
    color: 'var(--txt-1)', cursor: 'pointer', whiteSpace: 'nowrap',
  }
}

function linkBtn(): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px',
    fontSize: '12px', fontWeight: 600, color: 'var(--gold-2)', textDecoration: 'none',
  }
}
