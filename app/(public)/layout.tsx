import ConsentBanner from '@/components/consent-banner'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-0)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {children}
      <ConsentBanner />
    </div>
  )
}
