import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justify: 'center',
      minHeight: '60vh',
      color: 'var(--gold)',
      gap: '10px',
      fontSize: '13px',
      fontWeight: 600,
    }}>
      <Loader2 size={20} style={{ animation: 'spin 0.8s linear infinite' }} />
      <span>Chargement…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
