'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  TrendingUp, FileText, Building2, Receipt,
  Clock, ChevronRight, Plus, AlertCircle,
  CheckCircle2, Circle, ArrowUpRight
} from 'lucide-react'

interface KpiData {
  ca30j: number
  devisEnAttente: number
  jobsActifs: number
  facturesImpayees: number
}

interface RecentItem {
  id: string
  nom: string
  montant: string
  statut: string
  statutColor: string
  date: string
  href: string
}

function formatCAD(n: number) {
  return n.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })
}

function KpiBlock({ label, value, sub, icon: Icon, color, loading }: {
  label: string; value: string; sub: string
  icon: React.ElementType; color: string; loading: boolean
}) {
  return (
    <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '160px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: 'var(--txt-3)', fontWeight: 500 }}>{label}</span>
        <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={color} strokeWidth={1.8} />
        </div>
      </div>
      <div style={{ fontSize: '22px', fontWeight: 600, color: 'var(--txt-1)', lineHeight: 1 }}>
        {loading ? <span style={{ color: 'var(--txt-3)', fontSize: '14px' }}>…</span> : value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '10px', color: 'var(--txt-3)' }}>{sub}</span>
      </div>
    </div>
  )
}

function SectionCard({ title, href, icon: Icon, items, emptyLabel, addHref, loading }: {
  title: string; href: string; icon: React.ElementType
  items: RecentItem[]; emptyLabel: string; addHref: string; loading: boolean
}) {
  return (
    <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', overflow: 'hidden', flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '0.5px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon size={14} color="var(--gold)" strokeWidth={1.8} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a href={addHref} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', borderRadius: '6px', padding: '4px 8px', fontSize: '10px', color: 'var(--gold-2)', textDecoration: 'none' }}>
            <Plus size={10} /> Nouveau
          </a>
          <a href={href} style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '10px', color: 'var(--txt-3)', textDecoration: 'none' }}>
            Voir tout <ChevronRight size={10} />
          </a>
        </div>
      </div>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: 'var(--txt-3)', fontSize: '12px' }}>Chargement…</div>
      ) : items.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: '8px' }}>
          <Circle size={24} color="var(--bg-4)" strokeWidth={1.5} />
          <span style={{ fontSize: '11px', color: 'var(--txt-3)' }}>{emptyLabel}</span>
          <a href={addHref} style={{ fontSize: '11px', color: 'var(--gold-2)', textDecoration: 'none', marginTop: '4px' }}>+ Créer le premier</a>
        </div>
      ) : (
        <div>
          {items.map((item) => (
            <a key={item.id} href={item.href} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '0.5px solid var(--line)', textDecoration: 'none', gap: '10px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', color: 'var(--txt-1)', fontWeight: 500 }}>{item.nom}</div>
                <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>{item.date}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: `${item.statutColor}18`, color: item.statutColor, fontWeight: 500 }}>
                  {item.statut}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>{item.montant}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

function QuickActions() {
  const actions = [
    { label: 'Nouveau devis',    href: '/devis/nouveau',    icon: FileText,   color: 'var(--gold)'  },
    { label: 'Nouveau job',      href: '/jobs/nouveau',     icon: Building2,  color: 'var(--blue)'  },
    { label: 'Nouveau client',   href: '/clients/nouveau',  icon: TrendingUp, color: 'var(--green)' },
    { label: 'Nouvelle facture', href: '/factures/nouvelle',icon: Receipt,    color: 'var(--amber)' },
  ]
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {actions.map((a) => {
        const Icon = a.icon
        return (
          <a key={a.href} href={a.href} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', color: 'var(--txt-2)', textDecoration: 'none', transition: 'all 0.12s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--txt-1)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLElement).style.color = 'var(--txt-2)' }}
          >
            <Icon size={13} color={a.color} strokeWidth={1.8} />{a.label}
          </a>
        )
      })}
    </div>
  )
}

export default function DashboardPage() {
  const now = new Date()
  const heure = now.getHours()
  const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir'

  const [kpi, setKpi] = useState<KpiData>({ ca30j: 0, devisEnAttente: 0, jobsActifs: 0, facturesImpayees: 0 })
  const [recentDevis, setRecentDevis] = useState<RecentItem[]>([])
  const [recentJobs, setRecentJobs] = useState<RecentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activite, setActivite] = useState<{ id: string; label: string; date: string; color: string; href: string }[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [seeding, setSeeding] = useState(false)

  async function handleSeedDemo() {
    if (seeding) return
    if (!confirm("Voulez-vous peupler votre compte de démonstration ?\n\nCela va générer :\n- 35 clients\n- 20 devis\n- 15 factures\n- 5 chantiers\n- 10 leads/CRM\n\n(Vos données existantes hors-démo ne seront pas touchées)")) return
    
    setSeeding(true)
    try {
      const res = await fetch('/api/admin/seed-demo', { method: 'POST' })
      const result = await res.json()
      if (res.ok) {
        alert("Données de démonstration générées avec succès ! Rechargement...")
        window.location.reload()
      } else {
        alert(result.error ?? "Erreur lors de la génération")
      }
    } catch {
      alert("Erreur de réseau lors de la génération")
    } finally {
      setSeeding(false)
    }
  }

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setIsAdmin(user.email === 'peinture.jtl@gmail.com' || user.email === 'max@growth-plan.ca')
        supabase.from('profiles').select('role').eq('id', user.id).single().then(({ data: prof }) => {
          if (prof?.role === 'propriétaire' || prof?.role === 'administrateur') {
            setIsAdmin(true)
          }
        })
      }
    })

    const il30j = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0]

    const STATUT_COLOR: Record<string, string> = {
      brouillon: 'var(--txt-3)', envoye: 'var(--blue)', vu: 'var(--purple)',
      approuve: 'var(--green)', refuse: 'var(--red)', expire: 'var(--amber)', converti: 'var(--gold)',
      en_cours: 'var(--blue)', planifie: 'var(--amber)', termine: 'var(--green)', annule: 'var(--red)',
    }
    const STATUT_LABEL: Record<string, string> = {
      brouillon: 'Brouillon', envoye: 'Envoyé', vu: 'Vu', approuve: 'Approuvé',
      refuse: 'Refusé', expire: 'Expiré', converti: 'Facturé',
      en_cours: 'En cours', planifie: 'Planifié', termine: 'Terminé', annule: 'Annulé',
    }

    Promise.all([
      supabase.from('factures').select('montant_ttc').eq('statut', 'payee').gte('date_paiement', il30j),
      supabase.from('devis').select('id', { count: 'exact', head: true }).in('statut', ['envoye', 'vu']),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('statut', 'en_cours'),
      supabase.from('factures').select('montant_ttc').in('statut', ['envoyee', 'vue', 'partielle', 'en_retard']),
      supabase.from('devis').select('id, numero, titre, statut, montant_ttc, date_emission, clients(nom)').order('created_at', { ascending: false }).limit(5),
      supabase.from('jobs').select('id, titre, statut, budget, date_debut, clients(nom)').order('created_at', { ascending: false }).limit(5),
      supabase.from('devis').select('id, numero, titre, statut, created_at, clients(nom)').order('created_at', { ascending: false }).limit(4),
      supabase.from('factures').select('id, numero, statut, created_at, clients(nom)').order('created_at', { ascending: false }).limit(4),
    ]).then(([facPay, devisAtt, jobsAct, facImp, devisRec, jobsRec, devisAct, facAct]) => {
      setKpi({
        ca30j: (facPay.data ?? []).reduce((s: number, f: any) => s + Number(f.montant_ttc ?? 0), 0),
        devisEnAttente: devisAtt.count ?? 0,
        jobsActifs: jobsAct.count ?? 0,
        facturesImpayees: (facImp.data ?? []).reduce((s: number, f: any) => s + Number(f.montant_ttc ?? 0), 0),
      })
      setRecentDevis((devisRec.data ?? []).map((d: any) => ({
        id: d.id,
        nom: `${d.clients?.nom ?? '—'} — ${d.titre ?? d.numero}`,
        montant: Number(d.montant_ttc ?? 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }),
        statut: STATUT_LABEL[d.statut] ?? d.statut,
        statutColor: STATUT_COLOR[d.statut] ?? 'var(--txt-3)',
        date: new Date(d.date_emission).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' }),
        href: `/devis/${d.id}`,
      })))
      setRecentJobs((jobsRec.data ?? []).map((j: any) => ({
        id: j.id,
        nom: `${j.titre} — ${j.clients?.nom ?? '—'}`,
        montant: j.budget ? Number(j.budget).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }) : '—',
        statut: STATUT_LABEL[j.statut] ?? j.statut,
        statutColor: STATUT_COLOR[j.statut] ?? 'var(--txt-3)',
        date: j.date_debut ? new Date(j.date_debut).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' }) : '—',
        href: `/jobs/${j.id}`,
      })))
      const COULEUR: Record<string, string> = {
        brouillon: 'var(--txt-3)', envoye: 'var(--blue)', vu: 'var(--purple)',
        approuve: 'var(--green)', refuse: 'var(--red)', converti: 'var(--gold)',
        envoyee: 'var(--blue)', payee: 'var(--green)', en_retard: 'var(--red)',
      }
      const LABEL_STATUT: Record<string, string> = {
        brouillon: 'Brouillon', envoye: 'Envoyé', vu: 'Vu', approuve: 'Approuvé',
        refuse: 'Refusé', converti: 'Facturé', envoyee: 'Envoyée', payee: 'Payée', en_retard: 'En retard',
      }
      const feed = [
        ...(devisAct.data ?? []).map((d: any) => ({
          id: 'dv-' + d.id,
          label: `Devis ${d.numero} — ${(d.clients as any)?.nom ?? '—'} · ${LABEL_STATUT[d.statut] ?? d.statut}`,
          date: d.created_at,
          color: COULEUR[d.statut] ?? 'var(--txt-3)',
          href: `/devis/${d.id}`,
        })),
        ...(facAct.data ?? []).map((f: any) => ({
          id: 'fc-' + f.id,
          label: `Facture ${f.numero} — ${(f.clients as any)?.nom ?? '—'} · ${LABEL_STATUT[f.statut] ?? f.statut}`,
          date: f.created_at,
          color: COULEUR[f.statut] ?? 'var(--txt-3)',
          href: `/factures/${f.id}`,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6)
      setActivite(feed)
      setLoading(false)
    })
  }, [])

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px' }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--txt-1)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {salutation} 👋
              {isAdmin && (
                <button
                  onClick={handleSeedDemo}
                  disabled={seeding}
                  title="Générer les données de démonstration"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--amber)',
                    transition: 'all 0.15s',
                    animation: seeding ? 'spin 1s linear infinite' : 'none'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </button>
              )}
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--txt-3)', margin: '2px 0 0' }}>
              {now.toLocaleDateString('fr-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', color: 'var(--gold-2)' }}>
          <Clock size={12} />Aujourd'hui
        </div>
      </div>

      <QuickActions />

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <KpiBlock label="Chiffre d'affaires (30j)" value={formatCAD(kpi.ca30j)} sub="Factures payées" icon={TrendingUp} color="var(--green)" loading={loading} />
        <KpiBlock label="Devis en attente" value={String(kpi.devisEnAttente)} sub="Approbation client" icon={FileText} color="var(--amber)" loading={loading} />
        <KpiBlock label="Jobs actifs" value={String(kpi.jobsActifs)} sub="En cours" icon={Building2} color="var(--blue)" loading={loading} />
        <KpiBlock label="Factures impayées" value={formatCAD(kpi.facturesImpayees)} sub="À collecter" icon={Receipt} color="var(--red)" loading={loading} />
      </div>

      {!loading && kpi.ca30j === 0 && kpi.devisEnAttente === 0 && kpi.jobsActifs === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(212,150,12,0.08)', border: '0.5px solid rgba(212,150,12,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: 'var(--amber)' }}>
          <AlertCircle size={14} />
          <span>Aucune activité pour l'instant — commence par créer un client ou un devis.</span>
          <a href="/clients/nouveau" style={{ marginLeft: 'auto', color: 'var(--gold-2)', textDecoration: 'none', fontWeight: 500, fontSize: '12px' }}>Démarrer →</a>
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <SectionCard title="Devis récents" href="/devis" icon={FileText} items={recentDevis} emptyLabel="Aucun devis pour l'instant" addHref="/devis/nouveau" loading={loading} />
        <SectionCard title="Jobs actifs" href="/jobs" icon={Building2} items={recentJobs} emptyLabel="Aucun job actif" addHref="/jobs/nouveau" loading={loading} />
      </div>

      <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={14} color="var(--purple)" strokeWidth={1.8} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>Activité récente</span>
        </div>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', color: 'var(--txt-3)', fontSize: '12px' }}>Chargement…</div>
        ) : activite.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', gap: '6px' }}>
            <Circle size={24} color="var(--bg-4)" strokeWidth={1.5} />
            <span style={{ fontSize: '11px', color: 'var(--txt-3)' }}>Aucune activité récente</span>
          </div>
        ) : (
          <div>
            {activite.map(a => (
              <a key={a.id} href={a.href} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderBottom: '0.5px solid var(--line)', textDecoration: 'none' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: a.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '12px', color: 'var(--txt-1)' }}>{a.label}</span>
                <span style={{ fontSize: '10px', color: 'var(--txt-3)', whiteSpace: 'nowrap' }}>
                  {new Date(a.date).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' })}
                </span>
                <ArrowUpRight size={12} color="var(--txt-3)" />
              </a>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
