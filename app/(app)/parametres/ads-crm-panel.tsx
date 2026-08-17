'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Megaphone, Copy, CheckCircle2, Search, Instagram } from 'lucide-react'
import { SETUP_FEE_CAD } from '@/lib/stripe/pricing'

export default function AdsCrmPanel({ canManage }: { canManage: boolean }) {
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [copied, setCopied] = useState<'url' | 'key' | ''>('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!canManage) return
    fetch('/api/company/leads-connect')
      .then(async r => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'Erreur')
        setUrl(data.url || '')
        setKey(data.token || '')
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Erreur'))
  }, [canManage])

  async function copy(kind: 'url' | 'key', value: string) {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(kind)
    setTimeout(() => setCopied(''), 2000)
  }

  const box: React.CSSProperties = {
    background: 'var(--bg-2)', border: '0.5px solid var(--line)',
    borderRadius: '10px', padding: '16px',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', paddingBottom: '12px', borderBottom: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Megaphone size={14} color="var(--gold)" /> Comment les pubs envoient les demandes dans Leads
      </div>

      <div style={{ ...box, background: 'var(--ga)', borderColor: 'var(--gold-3)' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--txt-1)', marginBottom: '8px' }}>
          Inclus dans les {SETUP_FEE_CAD} $ d&apos;adhésion
        </div>
        <p style={{ fontSize: '13px', color: 'var(--txt-2)', margin: 0, lineHeight: 1.65 }}>
          Google Ads : tu colles l&apos;adresse et la clé dans le formulaire de prospect (ci-dessous).
          Meta / Instagram : la pub ouvre la page Contact du site. Formulaire dans la pub = on le fait dans Business Manager à l&apos;adhésion.
        </p>
      </div>

      <div style={box}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Search size={14} color="var(--gold)" />
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--txt-1)' }}>Google Ads — clics exacts</div>
        </div>
        <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--txt-2)', lineHeight: 1.7 }}>
          <li>Ouvre <strong>Google Ads</strong></li>
          <li>Outils et paramètres → Assets → <strong>Formulaire de prospect</strong></li>
          <li>Crayon sur le formulaire → <strong>Intégration webhook</strong></li>
          <li>Colle l&apos;adresse, colle la clé</li>
          <li>« Envoyer des données de test »</li>
          <li>Ici : <Link href="/leads" style={{ color: 'var(--gold-2)' }}>Leads / CRM</Link> — ligne « Google Ads (test) »</li>
        </ol>
        {canManage && (
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {error && <div style={{ fontSize: '12px', color: 'var(--red)' }}>{error}</div>}
            <CopyRow label="Adresse webhook" value={url} copied={copied === 'url'} onCopy={() => copy('url', url)} />
            <CopyRow label="Clé webhook" value={key} copied={copied === 'key'} onCopy={() => copy('key', key)} />
          </div>
        )}
      </div>

      <div style={box}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Instagram size={14} color="var(--gold)" />
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--txt-1)' }}>Meta &amp; Instagram — clics exacts</div>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--txt-2)', margin: '0 0 10px', lineHeight: 1.65 }}>
          Instagram passe par Meta. Un seul compte.
        </p>
        <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--txt-2)', lineHeight: 1.7 }}>
          <li>Ads Manager → nouvelle pub (trafic ou messages)</li>
          <li>Destination : <strong>site web</strong> (pas « formulaire instantané »)</li>
          <li>URL : la page Contact déjà branchée (Paramètres → Site web → CRM)</li>
          <li>Quelqu&apos;un clique la pub, remplit Contact → Leads</li>
        </ol>
        <p style={{ fontSize: '12px', color: 'var(--txt-3)', margin: '12px 0 0', lineHeight: 1.55 }}>
          Si tu veux le formulaire <em>dans</em> Facebook/Instagram (Lead Ads) : Meta n&apos;accepte pas cette adresse.
          C&apos;est le travail d&apos;adhésion — on le fait dans leur Business Manager.
        </p>
      </div>
    </div>
  )
}

function CopyRow({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: 'var(--txt-3)', marginBottom: '6px' }}>{label}</div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          readOnly
          value={value}
          onFocus={e => e.target.select()}
          style={{
            flex: 1, background: 'var(--bg-1)', border: '0.5px solid var(--line)',
            borderRadius: '8px', padding: '9px 12px', fontSize: '11px', color: 'var(--txt-1)',
            fontFamily: 'ui-monospace, monospace',
          }}
        />
        <button type="button" onClick={onCopy} disabled={!value} style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'var(--bg-1)', border: '0.5px solid var(--line)',
          borderRadius: '8px', padding: '8px 12px', fontSize: '11px', fontWeight: 600,
          color: 'var(--txt-1)', cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
          {copied ? 'Copié' : 'Copier'}
        </button>
      </div>
    </div>
  )
}
