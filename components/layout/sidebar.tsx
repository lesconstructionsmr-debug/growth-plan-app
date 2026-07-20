'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Building2, Calendar,
  FileText, Receipt, BarChart3, Settings,
  HardHat, LogOut, TrendingUp, Wallet, Target, Sparkles, Crown,
  FolderKanban, Landmark, PieChart, Home, Sun, Moon, ArrowLeftRight, Menu, X
} from 'lucide-react'
import { useTheme } from './theme-provider'
import { useLanguage } from './language-provider'

// ── Nav construction ───────────────────────────────────────────────
const NAV_CONSTRUCTION = [
  {
    section: "Vue d'ensemble",
    items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    section: 'Opérations',
    items: [
      { href: '/acquisition', label: 'Acquisition',  icon: Target     },
      { href: '/contenu',     label: 'Contenu IA',  icon: Sparkles   },
      { href: '/leads',       label: 'Leads / CRM', icon: TrendingUp },
      { href: '/jobs',        label: 'Chantiers',   icon: Building2  },
      { href: '/calendrier',  label: 'Calendrier',  icon: Calendar   },
      { href: '/clients',         label: 'Clients',         icon: Users      },
      { href: '/employes',        label: 'Employés',        icon: HardHat    },
      { href: '/sous-traitants',   label: 'Sous-traitants', icon: HardHat    },
    ],
  },
  {
    section: 'Facturation',
    items: [
      { href: '/devis',    label: 'Devis',    icon: FileText },
      { href: '/factures', label: 'Factures', icon: Receipt  },
      { href: '/depenses', label: 'Dépenses', icon: Wallet   },
    ],
  },
  {
    section: 'Rapports',
    items: [
      { href: '/rapports',   label: 'Rapports',   icon: BarChart3 },
      { href: '/marche',     label: 'Marché',     icon: TrendingUp },
      { href: '/parametres', label: 'Paramètres', icon: Settings  },
    ],
  },
  {
    section: 'Admin SaaS',
    items: [{ href: '/admin/abonnes', label: 'Abonnés', icon: Crown }],
  },
]

// ── Nav agence (courtier hypothécaire & immobilier) ────────────────────────────
const NAV_AGENCE = [
  {
    section: "Vue d'ensemble",
    items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    section: 'Opérations',
    items: [
      { href: '/acquisition',  label: 'Acquisition',  icon: Target        },
      { href: '/contenu',      label: 'Contenu IA',   icon: Sparkles      },
      { href: '/dossiers',     label: 'Dossiers Prêts', icon: FolderKanban  },
      { href: '/preteurs',     label: 'Prêteurs',     icon: Landmark      },
      { href: '/calendrier',   label: 'Calendrier',   icon: Calendar      },
      { href: '/clients',      label: 'Emprunteurs',  icon: Users         },
      { href: '/commissions',  label: 'Commissions',  icon: PieChart      },
    ],
  },
  {
    section: 'Facturation',
    items: [
      { href: '/devis',    label: 'Offres',    icon: FileText },
      { href: '/factures', label: 'Factures',  icon: Receipt  },
      { href: '/depenses', label: 'Dépenses',  icon: Wallet   },
    ],
  },
  {
    section: 'Rapports',
    items: [
      { href: '/rapports',   label: 'Rapports',   icon: BarChart3 },
      { href: '/marche',     label: 'Marché',     icon: TrendingUp },
      { href: '/parametres', label: 'Paramètres', icon: Settings  },
    ],
  },
  {
    section: 'Admin SaaS',
    items: [{ href: '/admin/abonnes', label: 'Abonnés', icon: Crown }],
  },
]

type Vertical = 'construction' | 'agence' | 'courtier'

export default function Sidebar() {
  const pathname = usePathname()
  const [vertical, setVertical]   = useState<Vertical>('construction')
  const [compName, setCompName]   = useState('Mon Entreprise')
  const [initials, setInitials]   = useState('GP')
  const [isAdmin, setIsAdmin]     = useState(false)
  const [switching, setSwitching] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(d => {
        if (d.vertical) setVertical(d.vertical as Vertical)
        if (d.name)     setCompName(d.name)
        if (d.email && d.email.toLowerCase() === 'max@growth-plan.ca') {
          setIsAdmin(true)
        }
        if (d.full_name) {
          const parts = (d.full_name as string).trim().split(' ')
          setInitials(((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).toUpperCase())
        }
      })
      .catch(() => {})
  }, [])

  const { theme, toggle } = useTheme()
  const { lang, toggleLang, t } = useLanguage()
  const router = useRouter()
  const isCourtier = vertical === 'agence' || vertical === 'courtier'
  const rawNav = isCourtier ? NAV_AGENCE : NAV_CONSTRUCTION
  const NAV = rawNav.filter(group => group.section !== 'Admin SaaS' || isAdmin)

  async function handleLogout() {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  async function toggleVertical() {
    if (switching) return
    const nextVertical = isCourtier ? 'construction' : 'agence'
    setSwitching(true)
    try {
      await fetch('/api/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vertical: nextVertical }),
      })
      window.location.reload()
    } catch {
      setSwitching(false)
    }
  }

  const logoIcon = isCourtier
    ? <Home size={15} color="var(--gold)" />
    : <Building2 size={15} color="var(--gold)" />

  const logoLabel = isCourtier ? 'ERP Courtier' : 'ERP Construction'

  return (
    <>
      {/* ── BARRE MOBILE TOP (Smartphone < 768px) ────────────────────── */}
      <div className="mobile-top-bar" style={{
        display: 'none',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '52px', background: 'var(--bg-1)',
        borderBottom: '0.5px solid var(--line)',
        padding: '0 16px', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setMobileOpen(v => !v)}
            style={{
              background: 'var(--bg-2)', border: '0.5px solid var(--line)',
              borderRadius: '7px', padding: '6px', color: 'var(--txt-1)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold-2)' }}>
            Plangrowth ERP
          </div>
        </div>

        <button
          onClick={toggleVertical}
          disabled={switching}
          style={{
            background: 'var(--ga)', border: '0.5px solid var(--gold-3)',
            borderRadius: '6px', padding: '4px 8px', fontSize: '10px', fontWeight: 600,
            color: 'var(--gold-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
          }}
        >
          <ArrowLeftRight size={12} /> {isCourtier ? 'Courtier' : 'Chantiers'}
        </button>
      </div>

      {/* Backdrop sombre sur mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 105,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)'
          }}
        />
      )}

      {/* ── ASIDE NAV (Desktop fixe & Mobile Drawer) ───────────────── */}
      <aside className={`sidebar-aside ${mobileOpen ? 'mobile-open' : ''}`} style={{
        width: '220px', minWidth: '220px', height: '100vh',
        background: 'var(--bg-1)',
        borderRight: '0.5px solid var(--line)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 110,
        transition: 'transform 0.25s ease-out'
      }}>
        <style>{`
          @media (max-width: 768px) {
            .mobile-top-bar { display: flex !important; }
            .sidebar-aside {
              position: fixed !important;
              top: 0 !important; bottom: 0 !important; left: 0 !important;
              transform: translateX(-100%);
            }
            .sidebar-aside.mobile-open {
              transform: translateX(0) !important;
              box-shadow: 8px 0 32px rgba(0,0,0,0.6) !important;
            }
          }
        `}</style>

      {/* ── Logo + Selector Switch ─────────────────────────────────── */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '0.5px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '7px',
            background: 'var(--ga)', border: '0.5px solid var(--gold-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {logoIcon}
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)', lineHeight: 1.2 }}>
              {logoLabel}
            </div>
            <div style={{ fontSize: '9px', color: 'var(--gold-3)', letterSpacing: '0.08em' }}>
              {isCourtier ? t('MODE IMMOBILIER') : t('MODE CHANTIERS')}
            </div>
          </div>
        </div>

        {/* Bouton Switch Mode (Construction <-> Courtier) */}
        <button
          onClick={toggleVertical}
          disabled={switching}
          title={isCourtier ? 'Passer en Mode Construction 🏗️' : 'Passer en Mode Courtier Immobilier 🏡'}
          style={{
            background: 'var(--ga)',
            border: '0.5px solid var(--gold-3)',
            borderRadius: '6px',
            padding: '4px 6px',
            cursor: 'pointer',
            color: 'var(--gold-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
            opacity: switching ? 0.5 : 1
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <ArrowLeftRight size={13} />
        </button>
      </div>

      {/* ── Navigation ───────────────────────────── */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV.map((group) => (
          <div
            key={group.section}
            style={{ borderBottom: '0.5px solid var(--line)', padding: '4px 0' }}
          >
            <div style={{
              fontSize: '8px', fontWeight: 600, color: 'var(--txt-3)',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              padding: '6px 14px 2px',
            }}>
              {t(group.section)}
            </div>

            {group.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 14px',
                    fontSize: '12px', textDecoration: 'none',
                    color: active ? 'var(--gold-2)' : 'var(--txt-2)',
                    background: active ? 'var(--ga)' : 'transparent',
                    borderLeft: active ? '2px solid var(--gold)' : '2px solid transparent',
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = 'var(--txt-1)'
                      ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-2)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = 'var(--txt-2)'
                      ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                    }
                  }}
                >
                  <Icon size={14} strokeWidth={1.7} />
                  {t(item.label)}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── Utilisateur & Langue ──────────────────────────── */}
      <div style={{
        padding: '10px 14px',
        borderTop: '0.5px solid var(--line)',
        display: 'flex', alignItems: 'center', gap: '8px',
        flexShrink: 0,
      }}>
        <div style={{
          width: '26px', height: '26px', borderRadius: '50%',
          background: 'var(--ga)', border: '0.5px solid var(--gold-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', fontWeight: 500, color: 'var(--gold-2)', flexShrink: 0,
        }}>
          {initials || 'GP'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', color: 'var(--txt-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {compName}
          </div>
          <div style={{ fontSize: '9px', color: 'var(--txt-3)' }}>
            {isCourtier ? 'Courtier Immobilier' : 'Entrepreneur BTP'}
          </div>
        </div>

        {/* Bouton Toggle Langue (FR / EN) */}
        <button
          onClick={toggleLang}
          title={lang === 'fr' ? 'Switch to English' : 'Passer en Français'}
          style={{
            background: 'var(--ga)',
            border: '0.5px solid var(--gold-3)',
            borderRadius: '6px',
            padding: '3px 6px',
            fontSize: '9px',
            fontWeight: 700,
            color: 'var(--gold-2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <span>🌐</span> {lang.toUpperCase()}
        </button>

        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--txt-3)', padding: '2px', flexShrink: 0,
            display: 'flex', alignItems: 'center',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--txt-3)')}
        >
          {theme === 'dark' ? <Sun size={13} strokeWidth={1.7} /> : <Moon size={13} strokeWidth={1.7} />}
        </button>
        <button
          onClick={handleLogout}
          title={t('Déconnexion')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--txt-3)', padding: '2px', flexShrink: 0,
            display: 'flex', alignItems: 'center',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--txt-3)')}
        >
          <LogOut size={13} strokeWidth={1.7} />
        </button>
      </div>
    </aside>
    </>
  )
}
