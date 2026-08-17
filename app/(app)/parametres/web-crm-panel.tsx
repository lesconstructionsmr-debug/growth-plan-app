'use client'

import { useEffect, useState } from 'react'
import { Plug, Copy, CheckCircle2, Loader2, RefreshCw, Send, Globe } from 'lucide-react'
import { SETUP_FEE_CAD } from '@/lib/stripe/pricing'

export default function WebCrmPanel({ canManage }: { canManage: boolean }) {
  const [url, setUrl] = useState('')
  const [snippet, setSnippet] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<'url' | 'snippet' | null>(null)
  const [testing, setTesting] = useState(false)
  const [testOk, setTestOk] = useState('')

  useEffect(() => {
    if (!canManage) { setLoading(false); return }
    fetch('/api/company/leads-connect')
      .then(async r => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'Erreur')
        setUrl(data.url)
        setSnippet(data.snippet)
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Erreur'))
      .finally(() => setLoading(false))
  }, [canManage])

  async function copy(kind: 'url' | 'snippet') {
    await navigator.clipboard.writeText(kind === 'url' ? url : snippet)
    setCopied(kind)
    setTimeout(() => setCopied(null), 2000)
  }

  async function regenerate() {
    if (!confirm('Créer un nouveau code ? L\'ancien formulaire sur votre site cessera d\'envoyer les demandes.')) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/company/leads-connect', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setUrl(data.url)
      setSnippet(data.snippet)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  async function sendTest() {
    if (!url) return
    setTesting(true)
    setTestOk('')
    setError('')
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          nom: 'Test site web',
          email: 'test-site@example.com',
          telephone: '5145550100',
          source: 'Test connexion site',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Échec du test')
      setTestOk('Lead test envoyé. Ouvrez Leads & CRM (F5) — vous devez le voir.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur test')
    } finally {
      setTesting(false)
    }
  }

  const box: React.CSSProperties = {
    background: 'var(--bg-2)', border: '0.5px solid var(--line)',
    borderRadius: '10px', padding: '16px',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', paddingBottom: '12px', borderBottom: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Plug size={14} color="var(--gold)" /> Brancher votre site web au CRM
      </div>

      <div style={{ ...box, background: 'var(--ga)', borderColor: 'var(--gold-3)' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--txt-1)', marginBottom: '6px' }}>
          Inclus dans vos {SETUP_FEE_CAD} $ de frais d&apos;adhésion
        </div>
        <p style={{ fontSize: '12px', color: 'var(--txt-2)', margin: 0, lineHeight: 1.6 }}>
          Un visiteur remplit le formulaire Contact sur <strong>votre</strong> site → la demande arrive ici, dans <strong>Leads &amp; CRM</strong>.
          L&apos;équipe Plan Growth le branche à l&apos;onboarding. Vous pouvez aussi coller le code ci-dessous tout de suite.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        {['1. Copiez le code', '2. Collez-le sur votre page Contact', '3. Testez — le lead apparaît dans Leads'].map((t, i) => (
          <div key={t} style={{ ...box, padding: '12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--gold-2)', marginBottom: '4px' }}>ÉTAPE {i + 1}</div>
            <div style={{ fontSize: '12px', color: 'var(--txt-1)', lineHeight: 1.4 }}>{t.replace(/^\d+\.\s/, '')}</div>
          </div>
        ))}
      </div>

      {!canManage && (
        <div style={{ fontSize: '11px', color: 'var(--txt-3)', padding: '12px', ...box }}>
          Seuls le propriétaire et les administrateurs peuvent brancher le site.
        </div>
      )}

      {canManage && loading && (
        <div style={{ fontSize: '12px', color: 'var(--txt-3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Préparation du branchement…
        </div>
      )}

      {canManage && !loading && (
        <>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', marginBottom: '6px' }}>Code à coller sur votre site</div>
            <textarea
              readOnly
              value={snippet}
              rows={9}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--bg-2)', border: '0.5px solid var(--line)',
                borderRadius: '8px', padding: '10px 12px', fontSize: '11px',
                color: 'var(--txt-1)', fontFamily: 'ui-monospace, monospace',
                lineHeight: 1.5, resize: 'vertical',
              }}
              onFocus={e => e.target.select()}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => copy('snippet')} style={btn()}>
                {copied === 'snippet' ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                {copied === 'snippet' ? 'Code copié' : 'Copier le code'}
              </button>
              <button type="button" onClick={() => copy('url')} style={btn()}>
                {copied === 'url' ? <CheckCircle2 size={12} /> : <Globe size={12} />}
                {copied === 'url' ? 'Lien copié' : 'Copier le lien'}
              </button>
              <button type="button" onClick={sendTest} disabled={testing} style={btn()}>
                {testing ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={12} />}
                {testing ? 'Test…' : 'Envoyer un lead test'}
              </button>
              <button type="button" onClick={regenerate} style={btn()}>
                <RefreshCw size={12} /> Nouveau code (si l&apos;ancien a fuité)
              </button>
            </div>
          </div>

          {testOk && (
            <div style={{ fontSize: '12px', color: 'var(--green)', background: 'var(--green)12', border: '0.5px solid var(--green)', borderRadius: '8px', padding: '10px 12px' }}>
              {testOk}
            </div>
          )}
          {error && (
            <div style={{ fontSize: '12px', color: 'var(--red)', background: 'var(--red)12', border: '0.5px solid var(--red)', borderRadius: '8px', padding: '10px 12px' }}>
              {error}
            </div>
          )}

          <p style={{ fontSize: '11px', color: 'var(--txt-3)', margin: 0, lineHeight: 1.5 }}>
            Vous n&apos;avez rien à configurer dans Make ou Zapier. Collez ce formulaire sur votre page Contact
            (ou envoyez-le à votre webmestre). Chaque demande arrive dans Leads &amp; CRM.
          </p>
        </>
      )}
    </div>
  )
}

function btn(): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: 'var(--bg-2)', border: '0.5px solid var(--line)',
    borderRadius: '8px', padding: '8px 12px', fontSize: '11px', fontWeight: 600,
    color: 'var(--txt-2)', cursor: 'pointer',
  }
}
