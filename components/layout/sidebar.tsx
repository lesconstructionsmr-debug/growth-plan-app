'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Building2, Calendar,
  FileText, Receipt, BarChart3, Settings,
  HardHat, LogOut, TrendingUp, Wallet, Target, Sparkles, Crown,
  Crosshair, Sun, Moon,
  Menu, X, Shield
} from 'lucide-react'
import { useTheme } from './theme-provider'
import { useLanguage } from './language-provider'
import { isCompanyAdmin, employeeNavHrefs } from '@/lib/auth/permissions'
import { canAccessControlCenter } from '@/lib/platform-admin'

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
      { href: '/conformite',      label: 'Conformité QC',  icon: Shield     },
    ],
  },
  {
    section: 'Facturation',
    items: [
      { href: '/studio',   label: 'Studio Devis & Chat', icon: Sparkles },
      { href: '/devis',    label: 'Devis',    icon: FileText },
      { href: '/factures', label: 'Factures', icon: Receipt  },
      { href: '/depenses', label: 'Dépenses', icon: Wallet   },
      { href: '/tarifs',   label: 'Mon Abonnement', icon: Crown },
    ],
  },
  {
    section: 'Rapports',
    items: [
      { href: '/ventes',     label: 'Ventes',     icon: BarChart3 },
      { href: '/rapports',   label: 'Rapports',   icon: BarChart3 },
      { href: '/marche',     label: 'Marché',     icon: TrendingUp },
      { href: '/parametres', label: 'Paramètres', icon: Settings  },
    ],
  },
  {
    section: 'Admin SaaS',
    items: [
      { href: '/admin/centre',  label: 'Centre de contrôle', icon: Crosshair },
      { href: '/admin/abonnes', label: 'Abonnés',            icon: Crown },
    ],
  },
]

interface SidebarProps {
  role?: string
}

export default function Sidebar({ role: roleProp = 'owner' }: SidebarProps) {
  const pathname = usePathname()
  const [compName, setCompName]   = useState('Mon Entreprise')
  const [initials, setInitials]   = useState('GP')
  const [isAdmin, setIsAdmin]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(d => {
        if (d.name) setCompName(d.name)
        const userEmail = (d.email || '').toLowerCase().trim()
        if (d.is_admin === true || d.is_platform_admin === true || d.agence_enabled === true || canAccessControlCenter(userEmail)) {
          setIsAdmin(true)
        }
        if (d.full_name) {
          const parts = (d.full_name as string).trim().split(' ')
          setInitials(((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).toUpperCase())
        }
      })
      .catch(() => {})
  }, [])

  // Fermer le menu mobile lors du changement de page
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const { theme, toggle } = useTheme()
  const { lang, toggleLang, t } = useLanguage()
  const router = useRouter()
  const isAdminUser = isCompanyAdmin(roleProp) || isAdmin
  const allowedHrefs = isAdminUser ? null : new Set(employeeNavHrefs('construction'))
  const NAV = NAV_CONSTRUCTION
    .filter(group => group.section !== 'Admin SaaS' || isAdmin)
    .map(group => ({
      ...group,
      items: (isAdminUser || group.section === 'Admin SaaS')
        ? group.items
        : group.items.filter(item => allowedHrefs!.has(item.href)),
    }))
    .filter(group => group.items.length > 0)

  async function handleLogout() {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const logoIcon = <Building2 size={15} color="var(--gold)" />
  const logoLabel = 'Plan Growth'

  return (
    <>
      {/* ── BARRE MOBILE SOURIS & SMARTPHONE (Seulement affichée sur mobile via CSS) ── */}
      <div className="mobile-header-bar" style={{
        display: 'none',
        height: '50px',
        background: 'var(--bg-1)',
        borderBottom: '0.5px solid var(--line)',
        padding: '0 16px',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '6px',
            background: 'var(--ga)', border: '0.5px solid var(--gold-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {logoIcon}
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--txt-1)' }}>
            {logoLabel}
          </span>
        </div>

        <button
          onClick={() => setMobileOpen(v => !v)}
          aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          style={{
            background: 'var(--ga)',
            border: '0.5px solid var(--gold-3)',
            borderRadius: '6px',
            padding: '6px',
            color: 'var(--gold-2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* OVERLAY SOMBRE MOBILE */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(3px)', zIndex: 998
          }}
        />
      )}

      {/* ── ASIDE NAVIGATION ── */}
      <aside className={`sidebar-container ${mobileOpen ? 'mobile-open' : ''}`} style={{
        width: '220px', minWidth: '220px', height: '100vh',
        background: 'var(--bg-1)',
        borderRight: '0.5px solid var(--line)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 999
      }}>

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
              {t('MODE CHANTIERS')}
            </div>
          </div>
        </div>
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
            Entrepreneur BTP
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
          aria-label="Changer le thème"
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
          aria-label="Déconnexion"
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

    <style jsx global>{`
      @media (max-width: 768px) {
        .mobile-header-bar {
          display: flex !important;
        }
        .sidebar-container {
          position: fixed !important;
          top: 50px !important;
          bottom: 0 !important;
          left: 0 !important;
          transform: translateX(-100%) !important;
          transition: transform 0.25s ease-in-out !important;
          height: calc(100vh - 50px) !important;
          box-shadow: 4px 0 20px rgba(0,0,0,0.5) !important;
        }
        .sidebar-container.mobile-open {
          transform: translateX(0) !important;
        }
        main {
          margin-top: 50px !important;
        }
      }
    `}</style>
    </>
  )
}
