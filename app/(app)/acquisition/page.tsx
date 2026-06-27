'use client'

import { useState } from 'react'
import {
  Target, TrendingUp, Users, Zap, Mail, Phone, Calendar,
  CheckCircle2, Clock, AlertCircle, ChevronRight, Plus,
  BarChart3, MessageSquare, Globe, Star, ArrowRight,
  Filter, Bell, Play, Settings, ExternalLink, DollarSign,
  Megaphone, PieChart, Send, Eye, MousePointerClick, RefreshCw
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────
type Score = 'chaud' | 'tiede' | 'froid'

interface EtapeFunnel {
  id: string
  label: string
  description: string
  leads: number
  conversion: number
  color: string
  icon: React.ElementType
}

interface Canal {
  id: string
  nom: string
  actif: boolean
  budget_mensuel: number
  leads_mois: number
  taux_conversion: number
  cout_par_lead: number
  color: string
  icon: string
}

interface Sequence {
  id: string
  nom: string
  declencheur: string
  etapes: number
  actifs: number
  taux_ouverture: number
  statut: 'active' | 'pause' | 'brouillon'
}

// ── Données mock ────────────────────────────────────────────────
const ETAPES_FUNNEL: EtapeFunnel[] = [
  { id:'1', label:'Visiteurs',      description:'Trafic total (SEO, Ads, réseaux)',     leads:1240, conversion:100,  color:'var(--txt-3)', icon:Globe       },
  { id:'2', label:'Clics LP',       description:'Atterrissage sur la landing page',     leads:310,  conversion:25.0, color:'#4a8fd4',     icon:Target      },
  { id:'3', label:'Formulaires',    description:'Formulaire de qualification rempli',   leads:124,  conversion:40.0, color:'#8b5cf6',     icon:Filter      },
  { id:'4', label:'Leads qualifiés',description:'Score ≥ 60 / 100 (chaud + tiède)',     leads:74,   conversion:59.7, color:'var(--amber)', icon:Star        },
  { id:'5', label:'RDV bookés',     description:'Calendly / appel de découverte',       leads:41,   conversion:55.4, color:'var(--gold)',  icon:Calendar    },
  { id:'6', label:'Devis envoyés',  description:'Soumission transmise au client',       leads:28,   conversion:68.3, color:'var(--gold-2)',icon:CheckCircle2},
  { id:'7', label:'Devis approuvés',description:'Client a signé / approuvé',            leads:18,   conversion:64.3, color:'var(--green)', icon:CheckCircle2},
  { id:'8', label:'Projets actifs', description:'Chantier démarré',                     leads:15,   conversion:83.3, color:'var(--green)', icon:TrendingUp  },
]

const CANAUX: Canal[] = [
  { id:'1', nom:'Meta Ads (FB/IG)',  actif:true,  budget_mensuel:1200, leads_mois:38, taux_conversion:3.2, cout_par_lead:31.6, color:'#4a8fd4', icon:'📘' },
  { id:'2', nom:'Google Ads',        actif:true,  budget_mensuel:800,  leads_mois:22, taux_conversion:4.1, cout_par_lead:36.4, color:'#ea4335', icon:'🔍' },
  { id:'3', nom:'SEO / Organique',   actif:true,  budget_mensuel:0,    leads_mois:31, taux_conversion:5.8, cout_par_lead:0,    color:'var(--green)', icon:'🌿' },
  { id:'4', nom:'Référencement',     actif:true,  budget_mensuel:0,    leads_mois:18, taux_conversion:12.4,cout_par_lead:0,    color:'var(--gold)',  icon:'🤝' },
  { id:'5', nom:'Google My Business',actif:false, budget_mensuel:0,    leads_mois:15, taux_conversion:6.2, cout_par_lead:0,    color:'var(--amber)', icon:'📍' },
]

const SEQUENCES: Sequence[] = [
  { id:'1', nom:'Nurturing — Tiède (email)',    declencheur:'Score 40–59 — formulaire soumis', etapes:5, actifs:12, taux_ouverture:41, statut:'active'   },
  { id:'2', nom:'Rappel devis — 48h',           declencheur:'Devis envoyé sans réponse',       etapes:3, actifs:4,  taux_ouverture:68, statut:'active'   },
  { id:'3', nom:'Séquence froid — contenu',     declencheur:'Score <40 — formulaire soumis',   etapes:8, actifs:9,  taux_ouverture:28, statut:'active'   },
  { id:'4', nom:'Onboarding client signé',       declencheur:'Devis approuvé',                  etapes:4, actifs:3,  taux_ouverture:82, statut:'active'   },
  { id:'5', nom:'Réactivation 90 jours',        declencheur:'Lead inactif depuis 90 jours',     etapes:3, actifs:0,  taux_ouverture:22, statut:'brouillon'},
]

// ── Scoring qualification ───────────────────────────────────────
interface Question {
  id: string
  question: string
  options: { label: string; points: number }[]
}

const QUESTIONS: Question[] = [
  {
    id:'type_travaux',
    question:'Type de travaux',
    options:[
      { label:'Rénovation majeure (cuisine, salle de bain, sous-sol)',   points:30 },
      { label:'Construction neuve ou agrandissement',                     points:40 },
      { label:'Rénovation mineure ou entretien',                          points:10 },
      { label:'Travaux commerciaux / multi-logements',                    points:35 },
    ],
  },
  {
    id:'budget',
    question:'Budget estimé',
    options:[
      { label:'Plus de 50 000 $',   points:30 },
      { label:'25 000 – 50 000 $',  points:20 },
      { label:'10 000 – 25 000 $',  points:10 },
      { label:'Moins de 10 000 $',  points:0  },
    ],
  },
  {
    id:'echeance',
    question:'Échéance souhaitée',
    options:[
      { label:'Dès que possible (< 1 mois)',    points:20 },
      { label:'Dans 1 à 3 mois',                points:15 },
      { label:'Dans 3 à 6 mois',                points:8  },
      { label:'Pas de date précise',             points:2  },
    ],
  },
  {
    id:'decideur',
    question:'Rôle dans la décision',
    options:[
      { label:'Je décide seul(e)',                          points:10 },
      { label:'Je décide avec mon/ma conjoint(e)',          points:8  },
      { label:'Je dois consulter (propriétaire, associé)',  points:4  },
      { label:'Je fais des recherches pour quelqu\'un d\'autre', points:2 },
    ],
  },
]

function getScore(reponses: Record<string, number>): number {
  return Object.values(reponses).reduce((s, v) => s + v, 0)
}

function getRouting(score: number): { label: Score; color: string; action: string; description: string } {
  if (score >= 70) return {
    label: 'chaud', color: 'var(--green)',
    action: 'Booking immédiat',
    description: 'Ce lead est prioritaire — proposez un appel de découverte dans les 24h. Routing vers Calendly automatique.',
  }
  if (score >= 40) return {
    label: 'tiede', color: 'var(--amber)',
    action: 'Séquence email 5 étapes',
    description: 'Ce lead a du potentiel. Déclenchement automatique de la séquence nurturing (email J0, J2, J5, J10, J21).',
  }
  return {
    label: 'froid', color: 'var(--blue)',
    action: 'Contenu + preuve sociale',
    description: 'Ce lead n\'est pas prêt. Intégration dans la séquence longue (8 emails sur 60 jours, études de cas, témoignages).',
  }
}

// ── Composants ─────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{
      background: 'var(--bg-1)', border: '0.5px solid var(--line)',
      borderRadius: '10px', padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: '4px',
    }}>
      <div style={{ fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: 700, color: color ?? 'var(--txt-1)' }}>{value}</div>
      {sub && <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>{sub}</div>}
    </div>
  )
}

function EtapeBar({ etape, index, total }: { etape: EtapeFunnel; index: number; total: number }) {
  const largeur = Math.max(20, (etape.leads / ETAPES_FUNNEL[0].leads) * 100)
  const Icon = etape.icon
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 0' }}>
      <div style={{ minWidth: '28px', fontSize: '10px', color: 'var(--txt-3)', textAlign: 'right', fontWeight: 600 }}>
        {index + 1}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon size={12} color={etape.color} />
            <span style={{ fontSize: '12px', color: 'var(--txt-1)', fontWeight: 500 }}>{etape.label}</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--txt-3)' }}>{etape.leads.toLocaleString('fr-CA')}</span>
            {index > 0 && (
              <span style={{
                fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px',
                background: `${etape.color}22`, color: etape.color,
              }}>
                {etape.conversion}%
              </span>
            )}
          </div>
        </div>
        <div style={{ height: '6px', background: 'var(--bg-3)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${largeur}%`,
            background: etape.color, borderRadius: '3px',
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>
    </div>
  )
}

// ── Page principale ────────────────────────────────────────────
// ── Config par défaut ──────────────────────────────────────────
interface AcqConfig {
  seuil_chaud: number
  seuil_tiede: number
  lien_calendly: string
  budget_meta: number
  budget_google: number
  email_expediteur: string
  actif: boolean
}

const CONFIG_DEFAULT: AcqConfig = {
  seuil_chaud:      70,
  seuil_tiede:      40,
  lien_calendly:    'https://calendly.com/construction-nova/30min',
  budget_meta:      1200,
  budget_google:    800,
  email_expediteur: 'info@novastructureai.com',
  actif:            true,
}

export default function AcquisitionPage() {
  const [reponses, setReponses] = useState<Record<string, number>>({})
  const [onglet, setOnglet] = useState<'campagnes' | 'funnel' | 'scoring' | 'canaux' | 'sequences' | 'rapports'>('campagnes')
  const [showConfig, setShowConfig] = useState(false)
  const [config, setConfig] = useState<AcqConfig>(CONFIG_DEFAULT)
  const [configDraft, setConfigDraft] = useState<AcqConfig>(CONFIG_DEFAULT)
  const [configSaved, setConfigSaved] = useState(false)

  function openConfig() { setConfigDraft({ ...config }); setShowConfig(true); setConfigSaved(false) }
  function saveConfig() {
    setConfig({ ...configDraft })
    setConfigSaved(true)
    setTimeout(() => { setShowConfig(false); setConfigSaved(false) }, 900)
    // TODO: supabase.from('acquisition_config').upsert({ organisation_id, ...configDraft })
  }

  const score = getScore(reponses)
  const totalQuestions = QUESTIONS.length
  const questionsRepondues = Object.keys(reponses).length
  const routing = questionsRepondues === totalQuestions ? getRouting(score) : null

  const totalLeadsMois = CANAUX.filter(c => c.actif).reduce((s, c) => s + c.leads_mois, 0)
  const budgetTotal = CANAUX.filter(c => c.actif).reduce((s, c) => s + c.budget_mensuel, 0)
  const tauxConvGlobal = ((ETAPES_FUNNEL[7].leads / ETAPES_FUNNEL[0].leads) * 100).toFixed(1)
  const coutParClient = budgetTotal > 0 ? (budgetTotal / ETAPES_FUNNEL[7].leads).toFixed(0) : '0'

  const ONGLETS = [
    { id: 'campagnes',  label: 'Campagnes' },
    { id: 'funnel',     label: 'Entonnoir' },
    { id: 'scoring',    label: 'Qualification' },
    { id: 'canaux',     label: 'Canaux' },
    { id: 'sequences',  label: 'Automatisations' },
    { id: 'rapports',   label: 'Rapports' },
  ]

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px' }}>

      {/* ── En-tête ─────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Target size={18} color="var(--gold)" />
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>
            Stratégie d'acquisition
          </h1>
          <span style={{
            fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
            background: 'rgba(34,197,94,0.12)', color: 'var(--green)',
            border: '0.5px solid rgba(34,197,94,0.3)',
          }}>
            ACTIF
          </span>
        </div>
        <button
          onClick={openConfig}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--gold)', border: 'none', borderRadius: '8px',
            padding: '8px 14px', fontSize: '12px', fontWeight: 600, color: '#0A0A0A', cursor: 'pointer',
          }}>
          <Settings size={13} /> Configurer
        </button>
      </div>

      {/* ── KPIs ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        <StatCard label="Leads / mois"      value={`${totalLeadsMois}`}      sub="Tous canaux actifs"         color="var(--gold)"   />
        <StatCard label="Taux de conversion" value={`${tauxConvGlobal}%`}    sub="Visiteur → client"          color="var(--green)"  />
        <StatCard label="Budget Ads / mois"  value={`${budgetTotal.toLocaleString('fr-CA')} $`} sub="Meta + Google" color="var(--blue)" />
        <StatCard label="Coût / client"      value={coutParClient === '0' ? '— $' : `${coutParClient} $`} sub="Budget ÷ nouveaux clients" color="var(--amber)" />
      </div>

      {/* ── Onglets ──────────────────────────────── */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-1)', borderRadius: '10px', padding: '4px', border: '0.5px solid var(--line)' }}>
        {ONGLETS.map(o => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id as typeof onglet)}
            style={{
              flex: 1, padding: '7px 12px', border: 'none', borderRadius: '7px', cursor: 'pointer',
              fontSize: '12px', fontWeight: 500,
              background: onglet === o.id ? 'var(--bg-3)' : 'transparent',
              color: onglet === o.id ? 'var(--txt-1)' : 'var(--txt-3)',
              transition: 'all 0.12s',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* ── Contenu ──────────────────────────────── */}

      {/* FUNNEL */}
      {onglet === 'funnel' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px' }}>
          {/* Entonnoir */}
          <div style={{
            background: 'var(--bg-1)', border: '0.5px solid var(--line)',
            borderRadius: '10px', padding: '20px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '16px' }}>
              Entonnoir d'acquisition — Juin 2026
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {ETAPES_FUNNEL.map((e, i) => (
                <EtapeBar key={e.id} etape={e} index={i} total={ETAPES_FUNNEL.length} />
              ))}
            </div>
            <div style={{
              marginTop: '16px', padding: '12px', borderRadius: '8px',
              background: 'rgba(184,146,42,0.08)', border: '0.5px solid var(--gold-3)',
            }}>
              <div style={{ fontSize: '11px', color: 'var(--gold-2)', fontWeight: 600, marginBottom: '4px' }}>
                💡 Opportunité identifiée
              </div>
              <div style={{ fontSize: '11px', color: 'var(--txt-2)', lineHeight: 1.5 }}>
                Votre plus grosse perte se situe entre <strong style={{ color: 'var(--txt-1)' }}>Visiteurs → LP</strong> (75% de perte).
                Tester une nouvelle accroche avec une VSL de 90 secondes pourrait doubler les clics.
              </div>
            </div>
          </div>

          {/* Résumé étapes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { icon:'🎯', titre:'Attirer', desc:'Ads ciblés (réno résidentielle, Québec), SEO local, Google My Business' },
              { icon:'📋', titre:'Filtrer', desc:'Formulaire filtre — 4 questions, score automatique en temps réel' },
              { icon:'🤖', titre:'Qualifier (IA)', desc:'Routing auto : chaud → Calendly, tiède → email seq, froid → nurturing' },
              { icon:'📅', titre:'Booker', desc:'Lien Calendly intégré pour les leads chauds — RDV de 30 min' },
              { icon:'📄', titre:'Envoyer devis', desc:'ERP génère le devis PDF et notifie le client par courriel + chatbot' },
              { icon:'✅', titre:'Closer', desc:'Suivi dans le pipeline CRM jusqu\'à approbation et démarrage chantier' },
            ].map(e => (
              <div key={e.titre} style={{
                background: 'var(--bg-1)', border: '0.5px solid var(--line)',
                borderRadius: '8px', padding: '10px 12px',
                display: 'flex', gap: '10px', alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>{e.icon}</span>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '2px' }}>{e.titre}</div>
                  <div style={{ fontSize: '10px', color: 'var(--txt-3)', lineHeight: 1.4 }}>{e.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SCORING */}
      {onglet === 'scoring' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '16px' }}>
          <div style={{
            background: 'var(--bg-1)', border: '0.5px solid var(--line)',
            borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px',
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '4px' }}>
                Formulaire de qualification
              </div>
              <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>
                Simulez le scoring automatique d'un nouveau lead.
              </div>
            </div>

            {QUESTIONS.map(q => (
              <div key={q.id}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--txt-1)', marginBottom: '8px' }}>
                  {q.question}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {q.options.map(opt => {
                    const selected = reponses[q.id] === opt.points
                    return (
                      <button
                        key={opt.label}
                        onClick={() => setReponses(r => ({ ...r, [q.id]: opt.points }))}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '8px 12px', border: `0.5px solid ${selected ? 'var(--gold-3)' : 'var(--line)'}`,
                          borderRadius: '7px', cursor: 'pointer', textAlign: 'left',
                          background: selected ? 'var(--ga)' : 'var(--bg-2)',
                          transition: 'all 0.12s',
                        }}
                      >
                        <span style={{ fontSize: '11px', color: selected ? 'var(--gold-2)' : 'var(--txt-2)' }}>
                          {opt.label}
                        </span>
                        <span style={{
                          fontSize: '10px', fontWeight: 600,
                          color: selected ? 'var(--gold)' : 'var(--txt-3)',
                          background: selected ? 'var(--gold-3)' : 'var(--bg-3)',
                          padding: '1px 6px', borderRadius: '4px', flexShrink: 0,
                        }}>
                          +{opt.points}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Résultat score */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'sticky', top: '24px' }}>
            {/* Score gauge */}
            <div style={{
              background: 'var(--bg-1)', border: '0.5px solid var(--line)',
              borderRadius: '10px', padding: '16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Score de qualification
              </div>
              <div style={{
                fontSize: '48px', fontWeight: 800, lineHeight: 1,
                color: routing ? routing.color : 'var(--txt-3)',
                transition: 'color 0.3s',
              }}>
                {score}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--txt-3)', marginTop: '4px' }}>/ 100 pts max</div>

              {/* Barre */}
              <div style={{ height: '6px', background: 'var(--bg-3)', borderRadius: '3px', margin: '12px 0', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${Math.min(score, 100)}%`,
                  background: routing ? routing.color : 'var(--bg-4)',
                  borderRadius: '3px', transition: 'width 0.4s ease, background 0.3s',
                }} />
              </div>

              {/* Zones */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--txt-3)' }}>
                <span>Froid</span><span>Tiède</span><span>Chaud</span>
              </div>
              <div style={{ display: 'flex', height: '3px', borderRadius: '2px', overflow: 'hidden', marginTop: '3px' }}>
                <div style={{ flex: 40, background: 'var(--blue)' }} />
                <div style={{ flex: 30, background: 'var(--amber)' }} />
                <div style={{ flex: 30, background: 'var(--green)' }} />
              </div>
            </div>

            {/* Routing résultat */}
            {routing && (
              <div style={{
                background: `${routing.color}10`,
                border: `0.5px solid ${routing.color}44`,
                borderRadius: '10px', padding: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Zap size={14} color={routing.color} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: routing.color, textTransform: 'uppercase' }}>
                    Lead {routing.label}
                  </span>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '6px' }}>
                  → {routing.action}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--txt-2)', lineHeight: 1.5 }}>
                  {routing.description}
                </div>
              </div>
            )}

            {questionsRepondues < totalQuestions && (
              <div style={{ fontSize: '11px', color: 'var(--txt-3)', textAlign: 'center', padding: '8px' }}>
                {questionsRepondues}/{totalQuestions} questions remplies
              </div>
            )}

            {questionsRepondues > 0 && (
              <button
                onClick={() => setReponses({})}
                style={{
                  background: 'none', border: '0.5px solid var(--line)',
                  borderRadius: '7px', padding: '7px', fontSize: '11px',
                  color: 'var(--txt-3)', cursor: 'pointer',
                }}
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      )}

      {/* CANAUX */}
      {onglet === 'canaux' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--txt-3)' }}>
              {CANAUX.filter(c=>c.actif).length} canaux actifs · {budgetTotal.toLocaleString('fr-CA')} $ / mois en Ads
            </div>
            <button style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'var(--ga)', border: '0.5px solid var(--gold-3)',
              borderRadius: '7px', padding: '6px 12px', fontSize: '11px',
              color: 'var(--gold-2)', cursor: 'pointer',
            }}>
              <Plus size={12} /> Ajouter canal
            </button>
          </div>

          {CANAUX.map(canal => (
            <div key={canal.id} style={{
              background: 'var(--bg-1)', border: `0.5px solid ${canal.actif ? 'var(--line)' : 'var(--bg-3)'}`,
              borderRadius: '10px', padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: '16px',
              opacity: canal.actif ? 1 : 0.55,
            }}>
              <span style={{ fontSize: '20px', flexShrink: 0 }}>{canal.icon}</span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--txt-1)' }}>{canal.nom}</span>
                  {canal.actif
                    ? <span style={{ fontSize: '9px', color: 'var(--green)', background: 'rgba(34,197,94,0.1)', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>ACTIF</span>
                    : <span style={{ fontSize: '9px', color: 'var(--txt-3)', background: 'var(--bg-3)', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>PAUSE</span>
                  }
                </div>
                <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>
                  {canal.budget_mensuel > 0 ? `${canal.budget_mensuel.toLocaleString('fr-CA')} $/mois` : 'Gratuit (organique)'}
                </div>
              </div>

              {[
                { label:'Leads / mois', value:`${canal.leads_mois}`, color:'var(--txt-1)' },
                { label:'Taux conv.', value:`${canal.taux_conversion}%`, color:'var(--green)' },
                { label:'Coût / lead', value: canal.cout_par_lead > 0 ? `${canal.cout_par_lead.toFixed(0)} $` : '—', color:'var(--amber)' },
              ].map(m => (
                <div key={m.label} style={{ minWidth: '80px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: '9px', color: 'var(--txt-3)', marginTop: '1px' }}>{m.label}</div>
                </div>
              ))}

              <button style={{
                background: 'var(--bg-2)', border: '0.5px solid var(--line)',
                borderRadius: '6px', padding: '5px 10px',
                fontSize: '11px', color: 'var(--txt-3)', cursor: 'pointer', flexShrink: 0,
              }}>
                Modifier
              </button>
            </div>
          ))}
        </div>
      )}

      {/* CAMPAGNES */}
      {onglet === 'campagnes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Grille KPI campagnes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {[
              { label: 'Impressions / mois', value: '124 800', sub: 'Meta + Google combinés', icon: Eye, color: 'var(--blue)' },
              { label: 'Clics totaux',        value: '3 241',   sub: 'CTR moyen 2.6%',         icon: MousePointerClick, color: 'var(--gold)' },
              { label: 'Leads générés',       value: '124',     sub: 'Formulaires remplis',     icon: Users, color: 'var(--green)' },
              { label: 'Budget dépensé',      value: '2 000 $', sub: 'Juin 2026',               icon: DollarSign, color: 'var(--amber)' },
            ].map(k => (
              <div key={k.label} style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k.label}</div>
                  <k.icon size={14} color={k.color} />
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginTop: '4px' }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Campagnes actives */}
          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Megaphone size={14} color="var(--gold)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>Campagnes actives</span>
              </div>
              <button style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', borderRadius: '7px', padding: '5px 10px', fontSize: '11px', color: 'var(--gold-2)', cursor: 'pointer' }}>
                <Plus size={11} /> Nouvelle campagne
              </button>
            </div>
            {[
              { nom: 'Rénovation cuisine — Québec', plateforme: '📘 Meta Ads', statut: 'active',  budget: 800,  impressions: 68400, clics: 1820, leads: 58, cpl: 13.8, periode: '1 juin – 30 juin' },
              { nom: 'Sous-sol fini — Rive-Sud',    plateforme: '📘 Meta Ads', statut: 'active',  budget: 400,  impressions: 31200, clics: 742,  leads: 22, cpl: 18.2, periode: '1 juin – 30 juin' },
              { nom: 'Entrepreneur général — GMB',   plateforme: '🔍 Google',   statut: 'active',  budget: 500,  impressions: 18900, clics: 510,  leads: 28, cpl: 17.9, periode: '1 juin – 30 juin' },
              { nom: 'Brand awareness réno',         plateforme: '🔍 Google',   statut: 'pause',   budget: 300,  impressions: 6300,  clics: 169,  leads: 16, cpl: 18.8, periode: 'Pause depuis 15 juin' },
            ].map((c, i) => (
              <div key={i} style={{ padding: '12px 16px', borderBottom: i < 3 ? '0.5px solid var(--line)' : 'none', display: 'flex', alignItems: 'center', gap: '16px', opacity: c.statut === 'pause' ? 0.6 : 1 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--txt-1)' }}>{c.nom}</span>
                    <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '3px', fontWeight: 600, background: c.statut === 'active' ? 'rgba(34,197,94,0.1)' : 'var(--bg-3)', color: c.statut === 'active' ? 'var(--green)' : 'var(--txt-3)' }}>
                      {c.statut === 'active' ? 'ACTIF' : 'PAUSE'}
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>{c.plateforme} · {c.periode}</div>
                </div>
                {[
                  { label: 'Budget', val: `${c.budget} $` },
                  { label: 'Impressions', val: c.impressions.toLocaleString('fr-CA') },
                  { label: 'Clics', val: c.clics.toLocaleString('fr-CA') },
                  { label: 'Leads', val: `${c.leads}` },
                  { label: 'CPL', val: `${c.cpl} $` },
                ].map(m => (
                  <div key={m.label} style={{ textAlign: 'center', minWidth: '64px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>{m.val}</div>
                    <div style={{ fontSize: '9px', color: 'var(--txt-3)' }}>{m.label}</div>
                  </div>
                ))}
                <button style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', color: 'var(--txt-3)', cursor: 'pointer', flexShrink: 0 }}>
                  {c.statut === 'active' ? 'Pause' : 'Relancer'}
                </button>
              </div>
            ))}
          </div>

          {/* Transmission leads */}
          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '16px 20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={14} color="var(--gold)" /> Transmission des leads
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { icon: '🔗', label: 'CRM (Supabase)', desc: 'Injection automatique dans l\'ERP à chaque soumission', actif: true },
                { icon: '📊', label: 'Google Sheets', desc: 'Export en temps réel vers une feuille partagée', actif: false },
                { icon: '📧', label: 'Notification email', desc: 'Alerte courriel immédiate au responsable', actif: true },
              ].map(t => (
                <div key={t.label} style={{ background: 'var(--bg-2)', border: `0.5px solid ${t.actif ? 'var(--gold-3)' : 'var(--line)'}`, borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '18px', marginBottom: '6px' }}>{t.icon}</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '4px' }}>{t.label}</div>
                  <div style={{ fontSize: '10px', color: 'var(--txt-3)', lineHeight: 1.4, marginBottom: '8px' }}>{t.desc}</div>
                  <span style={{ fontSize: '9px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px', background: t.actif ? 'rgba(34,197,94,0.1)' : 'var(--bg-3)', color: t.actif ? 'var(--green)' : 'var(--txt-3)' }}>
                    {t.actif ? 'CONNECTÉ' : 'INACTIF'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AUTOMATISATIONS */}
      {onglet === 'sequences' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--txt-3)' }}>
              {SEQUENCES.filter(s => s.statut === 'active').length} séquences actives · {SEQUENCES.reduce((a, s) => a + s.actifs, 0)} contacts en cours
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', borderRadius: '7px', padding: '6px 12px', fontSize: '11px', color: 'var(--gold-2)', cursor: 'pointer' }}>
              <Plus size={12} /> Nouvelle séquence
            </button>
          </div>
          {SEQUENCES.map(seq => (
            <div key={seq.id} style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: seq.statut === 'active' ? 'rgba(34,197,94,0.1)' : seq.statut === 'pause' ? 'rgba(201,168,76,0.1)' : 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {seq.statut === 'active' ? <Play size={13} color="var(--green)" /> : seq.statut === 'pause' ? <Clock size={13} color="var(--amber)" /> : <AlertCircle size={13} color="var(--txt-3)" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--txt-1)' }}>{seq.nom}</span>
                  <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '3px', fontWeight: 600, background: seq.statut === 'active' ? 'rgba(34,197,94,0.1)' : seq.statut === 'pause' ? 'rgba(201,168,76,0.1)' : 'var(--bg-3)', color: seq.statut === 'active' ? 'var(--green)' : seq.statut === 'pause' ? 'var(--amber)' : 'var(--txt-3)' }}>
                    {seq.statut === 'active' ? 'ACTIF' : seq.statut === 'pause' ? 'PAUSE' : 'BROUILLON'}
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>Déclencheur : {seq.declencheur}</div>
              </div>
              <div style={{ display: 'flex', gap: '20px', flexShrink: 0 }}>
                {[
                  { label: 'Étapes', val: `${seq.etapes}` },
                  { label: 'En cours', val: `${seq.actifs}` },
                  { label: 'Ouverture', val: `${seq.taux_ouverture}%` },
                ].map(m => (
                  <div key={m.label} style={{ textAlign: 'center', minWidth: '52px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txt-1)' }}>{m.val}</div>
                    <div style={{ fontSize: '9px', color: 'var(--txt-3)' }}>{m.label}</div>
                  </div>
                ))}
              </div>
              <button style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', color: 'var(--txt-3)', cursor: 'pointer', flexShrink: 0 }}>
                Modifier
              </button>
            </div>
          ))}
        </div>
      )}

      {/* RAPPORTS */}
      {onglet === 'rapports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Sélecteur période */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['30 jours', '90 jours', '6 mois', '12 mois'].map((p, i) => (
              <button key={p} style={{ padding: '6px 14px', borderRadius: '7px', border: '0.5px solid var(--line)', background: i === 0 ? 'var(--bg-3)' : 'var(--bg-1)', color: i === 0 ? 'var(--txt-1)' : 'var(--txt-3)', fontSize: '12px', cursor: 'pointer' }}>
                {p}
              </button>
            ))}
            <button style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '7px', border: '0.5px solid var(--line)', background: 'var(--bg-1)', color: 'var(--txt-3)', fontSize: '11px', cursor: 'pointer' }}>
              <RefreshCw size={12} /> Actualiser
            </button>
          </div>

          {/* ROI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { label: 'ROI global', value: '312%', desc: '6 240 $ générés pour 2 000 $ investis', color: 'var(--green)', icon: TrendingUp },
              { label: 'CPL moyen', value: '16.1 $', desc: 'Coût par lead tous canaux', color: 'var(--gold)', icon: DollarSign },
              { label: 'Coût par client', value: '111 $', desc: '2 000 $ ÷ 18 clients signés', color: 'var(--amber)', icon: Users },
            ].map(k => (
              <div key={k.label} style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--txt-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k.label}</span>
                  <k.icon size={16} color={k.color} />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
                <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginTop: '6px', lineHeight: 1.4 }}>{k.desc}</div>
              </div>
            ))}
          </div>

          {/* Performance par canal */}
          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChart size={14} color="var(--gold)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>Performance par canal — Juin 2026</span>
              </div>
            </div>
            <div style={{ padding: '4px 0' }}>
              {[
                { canal: '📘 Meta Ads',          leads: 80,  budget: 1200, clients: 8,  roi: 420, cpl: 15.0 },
                { canal: '🔍 Google Ads',         leads: 44,  budget: 800,  clients: 6,  roi: 255, cpl: 18.2 },
                { canal: '🌿 SEO / Organique',    leads: 31,  budget: 0,    clients: 4,  roi: '∞', cpl: 0    },
                { canal: '🤝 Référencement',       leads: 18,  budget: 0,    clients: 3,  roi: '∞', cpl: 0    },
              ].map((r, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 80px 80px 80px 80px', gap: '8px', alignItems: 'center', padding: '10px 16px', borderBottom: i < 3 ? '0.5px solid var(--line)' : 'none' }}>
                  <span style={{ fontSize: '12px', color: 'var(--txt-1)', fontWeight: 500 }}>{r.canal}</span>
                  <div style={{ height: '6px', background: 'var(--bg-3)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(r.leads / 80) * 100}%`, background: 'var(--gold-3)', borderRadius: '3px' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>{r.leads}</div>
                    <div style={{ fontSize: '9px', color: 'var(--txt-3)' }}>leads</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>{r.clients}</div>
                    <div style={{ fontSize: '9px', color: 'var(--txt-3)' }}>clients</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--green)' }}>{r.roi}{typeof r.roi === 'number' ? '%' : ''}</div>
                    <div style={{ fontSize: '9px', color: 'var(--txt-3)' }}>ROI</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--amber)' }}>{r.cpl > 0 ? `${r.cpl} $` : '—'}</div>
                    <div style={{ fontSize: '9px', color: 'var(--txt-3)' }}>CPL</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Évolution mensuelle */}
          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '16px 20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={14} color="var(--gold)" /> Évolution mensuelle des leads
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '80px' }}>
              {[
                { mois: 'Jan', leads: 64 }, { mois: 'Fév', leads: 71 }, { mois: 'Mar', leads: 89 },
                { mois: 'Avr', leads: 95 }, { mois: 'Mai', leads: 108 }, { mois: 'Jun', leads: 124 },
              ].map(m => (
                <div key={m.mois} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600 }}>{m.leads}</div>
                  <div style={{ width: '100%', background: 'var(--gold-3)', borderRadius: '4px 4px 0 0', height: `${(m.leads / 124) * 60}px`, minHeight: '4px' }} />
                  <div style={{ fontSize: '9px', color: 'var(--txt-3)' }}>{m.mois}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal configuration ──────────────────── */}
      {showConfig && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowConfig(false) }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
            zIndex: 1000, padding: '24px',
          }}
        >
          <div style={{
            background: 'var(--bg-1)', border: '0.5px solid var(--line)',
            borderRadius: '12px', width: '420px', maxHeight: 'calc(100vh - 48px)',
            overflow: 'auto', display: 'flex', flexDirection: 'column',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-1)', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={14} color="var(--gold)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>Configuration de l'acquisition</span>
              </div>
              <button onClick={() => setShowConfig(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)', fontSize: '18px', lineHeight: 1, padding: '0 2px' }}>×</button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Activation globale */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: configDraft.actif ? 'rgba(34,197,94,0.07)' : 'var(--bg-2)', border: `0.5px solid ${configDraft.actif ? 'rgba(34,197,94,0.25)' : 'var(--line)'}`, borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>Stratégie active</div>
                  <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginTop: '1px' }}>Active le scoring et le routing automatique</div>
                </div>
                <button
                  onClick={() => setConfigDraft(c => ({ ...c, actif: !c.actif }))}
                  style={{
                    width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer',
                    background: configDraft.actif ? 'var(--green)' : 'var(--bg-4)',
                    position: 'relative', transition: 'background 0.2s',
                  }}>
                  <div style={{
                    position: 'absolute', top: '3px', left: configDraft.actif ? '21px' : '3px',
                    width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s',
                  }} />
                </button>
              </div>

              {/* Seuils de scoring */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Seuils de qualification</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { key: 'seuil_chaud' as const, label: '🔥 Seuil chaud (Calendly)', color: 'var(--green)', suffix: 'pts' },
                    { key: 'seuil_tiede' as const, label: '♨️ Seuil tiède (email seq.)', color: 'var(--amber)', suffix: 'pts' },
                  ].map(f => (
                    <div key={f.key}>
                      <div style={{ fontSize: '11px', color: 'var(--txt-2)', marginBottom: '5px' }}>{f.label}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="range" min={0} max={100}
                          value={configDraft[f.key]}
                          onChange={e => setConfigDraft(c => ({ ...c, [f.key]: parseInt(e.target.value) }))}
                          style={{ flex: 1, accentColor: f.color }}
                        />
                        <div style={{ minWidth: '44px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: f.color }}>
                          {configDraft[f.key]}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--txt-3)', lineHeight: 1.5 }}>
                  ❄️ Froid : &lt; {configDraft.seuil_tiede} pts · ♨️ Tiède : {configDraft.seuil_tiede}–{configDraft.seuil_chaud - 1} pts · 🔥 Chaud : ≥ {configDraft.seuil_chaud} pts
                </div>
              </div>

              {/* Lien Calendly */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Booking — leads chauds</div>
                <label style={{ fontSize: '11px', color: 'var(--txt-2)', display: 'block', marginBottom: '5px' }}>Lien Calendly</label>
                <input
                  type="url"
                  value={configDraft.lien_calendly}
                  onChange={e => setConfigDraft(c => ({ ...c, lien_calendly: e.target.value }))}
                  placeholder="https://calendly.com/..."
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '7px 10px', fontSize: '11px', color: 'var(--txt-1)', outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--gold-3)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--line)')}
                />
              </div>

              {/* Budgets Ads */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Budgets publicitaires</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { key: 'budget_meta' as const, label: '📘 Meta Ads ($/mois)' },
                    { key: 'budget_google' as const, label: '🔍 Google Ads ($/mois)' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: '10px', color: 'var(--txt-3)', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                      <input
                        type="number" min={0} step={50}
                        value={configDraft[f.key]}
                        onChange={e => setConfigDraft(c => ({ ...c, [f.key]: parseInt(e.target.value) || 0 }))}
                        style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '7px 10px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none', fontFamily: 'inherit' }}
                        onFocus={e => (e.target.style.borderColor = 'var(--gold-3)')}
                        onBlur={e => (e.target.style.borderColor = 'var(--line)')}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '6px', fontSize: '10px', color: 'var(--txt-3)' }}>
                  Total : {(configDraft.budget_meta + configDraft.budget_google).toLocaleString('fr-CA')} $/mois
                </div>
              </div>

              {/* Email expéditeur */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Automatisations email</div>
                <label style={{ fontSize: '11px', color: 'var(--txt-2)', display: 'block', marginBottom: '5px' }}>Adresse expéditeur</label>
                <input
                  type="email"
                  value={configDraft.email_expediteur}
                  onChange={e => setConfigDraft(c => ({ ...c, email_expediteur: e.target.value }))}
                  placeholder="info@votreentreprise.com"
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '7px 10px', fontSize: '11px', color: 'var(--txt-1)', outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--gold-3)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--line)')}
                />
                <div style={{ marginTop: '5px', fontSize: '10px', color: 'var(--txt-3)' }}>
                  Utilisé pour les séquences nurturing automatiques.
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 20px', borderTop: '0.5px solid var(--line)', display: 'flex', gap: '8px', position: 'sticky', bottom: 0, background: 'var(--bg-1)' }}>
              <button onClick={() => setShowConfig(false)} style={{ flex: 1, padding: '9px', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--txt-2)' }}>
                Annuler
              </button>
              <button onClick={saveConfig} style={{ flex: 2, padding: '9px', background: configSaved ? 'var(--green)' : 'var(--gold)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: configSaved ? '#fff' : '#0A0A0A', transition: 'background 0.2s' }}>
                {configSaved ? '✓ Enregistré' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUTOMATISATIONS */}
      {onglet === 'sequences' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--txt-3)' }}>
              {SEQUENCES.filter(s=>s.statut==='active').length} séquences actives ·{' '}
              {SEQUENCES.filter(s=>s.statut==='active').reduce((s,seq)=>s+seq.actifs,0)} leads en nurturing
            </div>
            <button style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'var(--ga)', border: '0.5px solid var(--gold-3)',
              borderRadius: '7px', padding: '6px 12px', fontSize: '11px',
              color: 'var(--gold-2)', cursor: 'pointer',
            }}>
              <Plus size={12} /> Nouvelle séquence
            </button>
          </div>

          {SEQUENCES.map(seq => (
            <div key={seq.id} style={{
              background: 'var(--bg-1)', border: '0.5px solid var(--line)',
              borderRadius: '10px', padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: '14px',
            }}>
              {/* Statut icon */}
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                background: seq.statut === 'active' ? 'rgba(34,197,94,0.1)' : seq.statut === 'pause' ? 'rgba(245,158,11,0.1)' : 'var(--bg-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {seq.statut === 'active'
                  ? <Play size={14} color="var(--green)" />
                  : seq.statut === 'pause'
                  ? <Clock size={14} color="var(--amber)" />
                  : <Settings size={14} color="var(--txt-3)" />
                }
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '2px' }}>
                  {seq.nom}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--txt-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={9} /> Déclencheur : {seq.declencheur}
                </div>
              </div>

              {[
                { label:'Étapes',    value:`${seq.etapes}`,       color:'var(--txt-1)'  },
                { label:'En cours',  value:`${seq.actifs}`,       color:'var(--blue)'   },
                { label:'Taux ouv.', value:`${seq.taux_ouverture}%`, color:'var(--green)' },
              ].map(m => (
                <div key={m.label} style={{ minWidth: '70px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: '9px', color: 'var(--txt-3)', marginTop: '1px' }}>{m.label}</div>
                </div>
              ))}

              <span style={{
                fontSize: '9px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px', flexShrink: 0,
                background: seq.statut === 'active'
                  ? 'rgba(34,197,94,0.1)' : seq.statut === 'pause'
                  ? 'rgba(245,158,11,0.1)' : 'var(--bg-3)',
                color: seq.statut === 'active' ? 'var(--green)' : seq.statut === 'pause' ? 'var(--amber)' : 'var(--txt-3)',
              }}>
                {seq.statut === 'active' ? 'ACTIF' : seq.statut === 'pause' ? 'PAUSE' : 'BROUILLON'}
              </span>
            </div>
          ))}

          {/* Routing automatique */}
          <div style={{
            marginTop: '8px', background: 'var(--bg-1)', border: '0.5px solid var(--line)',
            borderRadius: '10px', padding: '16px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={13} color="var(--gold)" /> Routing automatique par score
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { score:'≥ 70 pts', label:'🔥 Chaud', action:'Calendly (RDV 30 min)', color:'var(--green)', seq:'Immédiat' },
                { score:'40–69 pts', label:'♨️ Tiède', action:'Séquence email 5 étapes', color:'var(--amber)', seq:'J0, J2, J5, J10, J21' },
                { score:'< 40 pts',  label:'❄️ Froid', action:'Nurturing 60 jours', color:'var(--blue)', seq:'8 emails + études de cas' },
              ].map(r => (
                <div key={r.score} style={{
                  background: 'var(--bg-2)', borderRadius: '8px', padding: '12px',
                  border: '0.5px solid var(--line)',
                }}>
                  <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginBottom: '4px' }}>{r.score}</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: r.color, marginBottom: '6px' }}>{r.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--txt-1)', marginBottom: '4px' }}>{r.action}</div>
                  <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>{r.seq}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
