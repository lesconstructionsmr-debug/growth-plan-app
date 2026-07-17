'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  TrendingUp, BarChart3, LineChart as LineIcon,
  Download, Sparkles, Building2, Landmark, Hammer,
  Calendar, RefreshCw, AlertCircle, CheckCircle2, DollarSign
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────
interface MarketIndicator {
  id: string
  date_ref: string
  indicateur: string
  valeur: number
  unite: string
  categorie: 'matériaux' | 'logement' | 'taux'
  region: string
}

// Données de secours (Fallback) enrichies pour le métier de peintre (résidentiel & commercial)
const FALLBACK_DATA: MarketIndicator[] = [
  // Peinture latex (gal)
  { id: 'p1', date_ref: '2025-07-01', indicateur: 'Peinture latex', valeur: 68.00, unite: '$/gal', categorie: 'matériaux', region: 'Québec' },
  { id: 'p2', date_ref: '2025-09-01', indicateur: 'Peinture latex', valeur: 70.00, unite: '$/gal', categorie: 'matériaux', region: 'Québec' },
  { id: 'p3', date_ref: '2025-11-01', indicateur: 'Peinture latex', valeur: 71.50, unite: '$/gal', categorie: 'matériaux', region: 'Québec' },
  { id: 'p4', date_ref: '2026-01-01', indicateur: 'Peinture latex', valeur: 73.00, unite: '$/gal', categorie: 'matériaux', region: 'Québec' },
  { id: 'p5', date_ref: '2026-03-01', indicateur: 'Peinture latex', valeur: 74.50, unite: '$/gal', categorie: 'matériaux', region: 'Québec' },
  { id: 'p6', date_ref: '2026-05-01', indicateur: 'Peinture latex', valeur: 76.50, unite: '$/gal', categorie: 'matériaux', region: 'Québec' },
  { id: 'p7', date_ref: '2026-07-01', indicateur: 'Peinture latex', valeur: 78.00, unite: '$/gal', categorie: 'matériaux', region: 'Québec' },
  
  // Revêtement époxy commercial (kit)
  { id: 'e1', date_ref: '2025-07-01', indicateur: 'Revêtement époxy', valeur: 210.00, unite: '$/kit', categorie: 'matériaux', region: 'Québec' },
  { id: 'e2', date_ref: '2025-09-01', indicateur: 'Revêtement époxy', valeur: 215.00, unite: '$/kit', categorie: 'matériaux', region: 'Québec' },
  { id: 'e3', date_ref: '2025-11-01', indicateur: 'Revêtement époxy', valeur: 222.00, unite: '$/kit', categorie: 'matériaux', region: 'Québec' },
  { id: 'e4', date_ref: '2026-01-01', indicateur: 'Revêtement époxy', valeur: 225.00, unite: '$/kit', categorie: 'matériaux', region: 'Québec' },
  { id: 'e5', date_ref: '2026-03-01', indicateur: 'Revêtement époxy', valeur: 230.00, unite: '$/kit', categorie: 'matériaux', region: 'Québec' },
  { id: 'e6', date_ref: '2026-05-01', indicateur: 'Revêtement époxy', valeur: 238.00, unite: '$/kit', categorie: 'matériaux', region: 'Québec' },
  { id: 'e7', date_ref: '2026-07-01', indicateur: 'Revêtement époxy', valeur: 245.00, unite: '$/kit', categorie: 'matériaux', region: 'Québec' },

  // Apprêt scellant (gal)
  { id: 'a1', date_ref: '2025-07-01', indicateur: 'Apprêt scellant', valeur: 42.00, unite: '$/gal', categorie: 'matériaux', region: 'Québec' },
  { id: 'a2', date_ref: '2025-09-01', indicateur: 'Apprêt scellant', valeur: 43.50, unite: '$/gal', categorie: 'matériaux', region: 'Québec' },
  { id: 'a3', date_ref: '2025-11-01', indicateur: 'Apprêt scellant', valeur: 44.00, unite: '$/gal', categorie: 'matériaux', region: 'Québec' },
  { id: 'a4', date_ref: '2026-01-01', indicateur: 'Apprêt scellant', valeur: 45.50, unite: '$/gal', categorie: 'matériaux', region: 'Québec' },
  { id: 'a5', date_ref: '2026-03-01', indicateur: 'Apprêt scellant', valeur: 47.00, unite: '$/gal', categorie: 'matériaux', region: 'Québec' },
  { id: 'a6', date_ref: '2026-05-01', indicateur: 'Apprêt scellant', valeur: 48.00, unite: '$/gal', categorie: 'matériaux', region: 'Québec' },
  { id: 'a7', date_ref: '2026-07-01', indicateur: 'Apprêt scellant', valeur: 49.50, unite: '$/gal', categorie: 'matériaux', region: 'Québec' },

  // Bois de charpente
  { id: '1', date_ref: '2025-07-01', indicateur: 'Bois de charpente', valeur: 380, unite: '$/m³', categorie: 'matériaux', region: 'Québec' },
  { id: '7', date_ref: '2026-07-01', indicateur: 'Bois de charpente', valeur: 480, unite: '$/m³', categorie: 'matériaux', region: 'Québec' },
  // Béton
  { id: '8', date_ref: '2025-07-01', indicateur: 'Béton prêt-à-l\'emploi', valeur: 145, unite: '$/m³', categorie: 'matériaux', region: 'Québec' },
  { id: '14', date_ref: '2026-07-01', indicateur: 'Béton prêt-à-l\'emploi', valeur: 165, unite: '$/m³', categorie: 'matériaux', region: 'Québec' },

  // Mises en chantier
  { id: '22', date_ref: '2026-06-30', indicateur: 'Mises en chantier', valeur: 3820, unite: 'unités', categorie: 'logement', region: 'Montréal' },
  { id: '23', date_ref: '2026-06-30', indicateur: 'Mises en chantier', valeur: 1480, unite: 'unités', categorie: 'logement', region: 'Laurentides' },
  { id: '24', date_ref: '2026-06-30', indicateur: 'Mises en chantier', valeur: 2150, unite: 'unités', categorie: 'logement', region: 'Montérégie' },
  
  // Taux
  { id: '25', date_ref: '2026-07-01', indicateur: 'Taux directeur', valeur: 4.50, unite: '%', categorie: 'taux', region: 'Canada' },
  { id: '26', date_ref: '2026-07-01', indicateur: 'Taux hypothécaire fixe 5 ans', valeur: 5.24, unite: '%', categorie: 'taux', region: 'Canada' }
]

const FRIENDLY_NAMES: Record<string, string> = {
  'Peinture latex': 'Peinture latex',
  'Revêtement époxy': 'Époxy',
  'Apprêt scellant': 'Apprêt scellant',
  'Bois de charpente': 'Bois',
  'Béton prêt-à-l\'emploi': 'Béton'
}

// ── Helper formatage date ────────────────────────────────────────────────────
function fmtMonth(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-CA', { month: 'short', year: '2-digit' })
}

export default function MarchePage() {
  const [data, setData] = useState<MarketIndicator[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMaterial, setActiveMaterial] = useState<string>('Peinture latex')
  const [dbNotice, setDbNotice] = useState(false)

  // Initialisation Supabase Browser Client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadMarketData = async () => {
    setLoading(true)
    try {
      const { data: res, error } = await supabase
        .from('market_trends')
        .select('*')
        .order('date_ref', { ascending: true })

      if (error) throw error

      if (!res || res.length === 0) {
        setData(FALLBACK_DATA)
        setDbNotice(true)
      } else {
        setData(res as MarketIndicator[])
        setDbNotice(false)
      }
    } catch (err) {
      console.warn('[MarchePage] Chargement Supabase échoué, utilisation des données de secours locales.', err)
      setData(FALLBACK_DATA)
      setDbNotice(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMarketData()
  }, [])

  // Liste des filtres de matériaux orientés PEINTRE (Latex, Époxy, Apprêt) + Gros oeuvre
  const materialTypes = ['Peinture latex', 'Revêtement époxy', 'Apprêt scellant', 'Bois de charpente', 'Béton prêt-à-l\'emploi']
  
  const chartPoints = data
    .filter(x => x.indicateur === activeMaterial)
    .map(x => ({ label: fmtMonth(x.date_ref), value: Number(x.valeur) }))

  // Données régionales (Mises en chantier)
  const regionStarts = data.filter(x => x.indicateur === 'Mises en chantier')

  // Indicateurs rapides
  const mortgageRate = data.find(x => x.indicateur === 'Taux hypothécaire fixe 5 ans')?.valeur ?? 5.24
  const bankRate = data.find(x => x.indicateur === 'Taux directeur')?.valeur ?? 4.50
  
  // Calcul variation de la peinture latex (indicateur principal peintre)
  const paintHistory = data.filter(x => x.indicateur === 'Peinture latex')
  const paintStart = paintHistory[0]?.valeur ?? 68.00
  const paintEnd = paintHistory[paintHistory.length - 1]?.valeur ?? 78.00
  const paintDiffPct = Math.round(((paintEnd - paintStart) / paintStart) * 100)

  // Composant SVG de graphique linéaire (robuste pour PDF et SSR)
  function LineChartSvg({ points }: { points: { label: string; value: number }[] }) {
    if (points.length === 0) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--txt-3)', fontSize: '12px' }}>Aucun point de données</div>
    
    const minVal = Math.min(...points.map(p => p.value)) * 0.98
    const maxVal = Math.max(...points.map(p => p.value)) * 1.02
    const range = maxVal - minVal
    
    const width = 600
    const height = 220
    
    const coords = points.map((p, idx) => {
      const x = (idx / (points.length - 1)) * (width - 60) + 30
      const y = height - ((p.value - minVal) / range) * (height - 60) - 30
      return { x, y, label: p.label, value: p.value }
    })

    const pathD = coords.reduce((acc, c, idx) => idx === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`, '')
    const areaD = `${pathD} L ${coords[coords.length - 1].x} ${height - 20} L ${coords[0].x} ${height - 20} Z`

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        {/* Grille horizontale */}
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
          const y = height - r * (height - 60) - 30
          const val = Math.round(minVal + r * range)
          return (
            <g key={i}>
              <line x1={30} y1={y} x2={width - 30} y2={y} stroke="var(--line)" strokeWidth={0.5} strokeDasharray="3 3" />
              <text x={10} y={y + 3} fontSize={8} fill="var(--txt-3)" textAnchor="start">{val}</text>
            </g>
          )
        })}

        {/* Remplissage de zone dégradé CSS */}
        <path d={areaD} fill="var(--gold-2)15" />
        {/* Ligne principale */}
        <path d={pathD} fill="none" stroke="var(--gold)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Points interactifs */}
        {coords.map((c, idx) => (
          <g key={idx}>
            <circle cx={c.x} cy={c.y} r={4.5} fill="var(--bg-1)" stroke="var(--gold)" strokeWidth={2} />
            <text x={c.x} y={c.y - 10} fontSize={8.5} fill="var(--txt-1)" fontWeight={600} textAnchor="middle">
              {c.value.toLocaleString('fr-CA')}
            </text>
            {/* Étiquette d'axe X */}
            <text x={c.x} y={height - 5} fontSize={8} fill="var(--txt-3)" textAnchor="middle">
              {c.label}
            </text>
          </g>
        ))}
      </svg>
    )
  }

  if (loading && data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '10px', color: 'var(--txt-3)' }}>
        <RefreshCw size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: '13px' }}>Analyse du marché en cours…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1020px' }}>
      
      {/* CSS d'impression pour PDF parfait */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-full { width: 100% !important; grid-template-columns: 1fr !important; }
          .print-card { border: 1px solid #ddd !important; box-shadow: none !important; background: white !important; page-break-inside: avoid; }
          .print-title { font-size: 24px !important; color: black !important; }
        }
      `}</style>

      {/* Bannière d'avertissement de données de secours locale (Masquée en impression) */}
      {dbNotice && (
        <div className="no-print" style={{ background: 'var(--gold-2)10', border: '0.5px solid var(--gold-3)', borderRadius: '10px', padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <AlertCircle size={18} color="var(--gold-2)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>Démonstration active (Données de Secours Peintre)</div>
            <div style={{ fontSize: '11px', color: 'var(--txt-3)', marginTop: '2px' }}>
              La table `market_trends` de votre Supabase n'est pas alimentée. Nous affichons les indices de marché de peinture et de construction modélisés. Exécutez le script SQL `seed-market-trends.sql` pour lier vos vraies données.
            </div>
          </div>
          <button onClick={loadMarketData} style={{ background: 'none', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '5px 10px', fontSize: '10px', color: 'var(--txt-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={10} /> Actualiser
          </button>
        </div>
      )}

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <TrendingUp size={20} color="var(--gold)" />
            <h1 className="print-title" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt-1)', margin: 0 }}>Analyse de Marché Peintre</h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--txt-3)', margin: 0 }}>Indicateurs de peinture (latex, époxy) et prévisions économiques résidentielles / commerciales au Québec</p>
        </div>
        <div className="no-print" style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', borderRadius: '8px', padding: '7px 14px', fontSize: '11px', color: 'var(--gold-2)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.15s' }}
          >
            <Download size={13} /> Exporter le rapport (PDF)
          </button>
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="print-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        
        {/* Taux fixe hypothécaire */}
        <div className="print-card" style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--txt-3)' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Taux Fixe 5 Ans (Moyen)</span>
            <Landmark size={14} color="var(--purple)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--txt-1)' }}>{mortgageRate} %</div>
          <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>Financement résidentiel moyen</div>
        </div>

        {/* Taux Directeur */}
        <div className="print-card" style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--txt-3)' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Taux Directeur BdC</span>
            <DollarSign size={14} color="var(--green)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--txt-1)' }}>{bankRate} %</div>
          <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>Banque du Canada stable</div>
        </div>

        {/* Indice Peinture (Latex) */}
        <div className="print-card" style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--txt-3)' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Peinture Latex (gal)</span>
            <Hammer size={14} color="var(--gold)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--txt-1)' }}>{paintEnd} $</div>
          <div style={{ fontSize: '10px', color: 'var(--green)', fontWeight: 600 }}>
            +{paintDiffPct}% depuis 12 mois
          </div>
        </div>

        {/* Mises en chantier cumulées */}
        <div className="print-card" style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--txt-3)' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Mises en Chantier Trimestre</span>
            <Building2 size={14} color="var(--blue)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--txt-1)' }}>
            {regionStarts.reduce((s, x) => s + x.valeur, 0).toLocaleString('fr-CA')}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>Projets de peinture résidentielle potentiels</div>
        </div>

      </div>

      {/* Deux colonnes : Graphique des matériaux + Histogramme des régions */}
      <div className="print-full" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '14px' }}>
        
        {/* Colonne Gauche : Indice Prix Matériaux Peinture */}
        <div className="print-card" style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LineIcon size={14} color="var(--gold)" />
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--txt-1)' }}>Indices des Prix Matériaux de Peinture</span>
            </div>
            
            {/* Filtre de matériel (Masqué à l'impression) */}
            <div className="no-print" style={{ display: 'flex', gap: '4px' }}>
              {materialTypes.map(m => (
                <button
                  key={m}
                  onClick={() => setActiveMaterial(m)}
                  style={{ background: activeMaterial === m ? 'var(--bg-3)' : 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '4px 8px', fontSize: '9px', color: activeMaterial === m ? 'var(--txt-1)' : 'var(--txt-3)', cursor: 'pointer', transition: 'all 0.1s' }}
                >
                  {FRIENDLY_NAMES[m] || m}
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>
            Relevé d'évolution des prix unitaires pour l'indicateur : <strong style={{ color: 'var(--gold-2)' }}>{activeMaterial}</strong>
          </div>

          {/* Graphique SVG */}
          <div style={{ height: '220px', marginTop: '10px' }}>
            <LineChartSvg points={chartPoints} />
          </div>
        </div>

        {/* Colonne Droite : Mises en chantiers régionales */}
        <div className="print-card" style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BarChart3 size={14} color="var(--gold)" />
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--txt-1)' }}>Activité Régionale Réelle</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>
            Opportunités de chantiers de peinture (mises en chantier)
          </div>

          {/* Bar Chart CSS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, justifyContent: 'center', marginTop: '10px' }}>
            {regionStarts.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--txt-3)', fontSize: '11px' }}>Données régionales indisponibles</div>
            ) : (
              regionStarts.map((r, i) => {
                const maxVal = Math.max(...regionStarts.map(x => x.valeur))
                const widthPct = Math.round((r.valeur / maxVal) * 100)
                const barColor = i === 0 ? 'var(--gold)' : i === 1 ? 'var(--purple)' : 'var(--blue)'
                return (
                  <div key={r.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--txt-2)', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{r.region}</span>
                      <span style={{ color: 'var(--txt-1)' }}>{r.valeur.toLocaleString('fr-CA')} unités</span>
                    </div>
                    <div style={{ height: '14px', background: 'var(--bg-3)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${widthPct}%`, background: barColor, borderRadius: '4px', transition: 'width 0.4s ease-out' }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>

      {/* Module AI Recommendations Peintre */}
      <div className="print-card" style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Titre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: 'var(--gold-2)18', padding: '6px', borderRadius: '8px' }}>
            <Sparkles size={16} color="var(--gold-2)" />
          </div>
          <div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--txt-1)' }}>Conseils Stratégiques & ROI — Spécifique Peintre en Bâtiment</span>
            <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>Analyses générées pour les contrats de peinture résidentielle et commerciale</div>
          </div>
        </div>

        {/* Recommandations */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }} className="print-full">
          
          {/* Rec 1 - Peinture Latex */}
          <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'var(--red)18', color: 'var(--red)', fontWeight: 600 }}>PRIX LATEX LATEX</span>
              <span style={{ fontSize: '10px', color: 'var(--gold-2)', fontWeight: 700 }}>ROI: +5% à +7%</span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>Indexation des Devis Résidentiels</div>
            <p style={{ fontSize: '11px', color: 'var(--txt-3)', margin: 0, lineHeight: 1.4 }}>
              La peinture latex est en hausse de <strong>{paintDiffPct}%</strong>. Vos coûts de fournitures augmentent. Majorez vos prochains devis de peinture intérieure/extérieure résidentielle de <strong>4% à 5.5%</strong> pour préserver vos bénéfices.
            </p>
          </div>

          {/* Rec 2 - Epoxy Commercial */}
          <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'var(--blue)18', color: 'var(--blue)', fontWeight: 600 }}>ÉPOXY COMMERCIAL</span>
              <span style={{ fontSize: '10px', color: 'var(--gold-2)', fontWeight: 700 }}>ROI: +15%</span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>Cibler Planchers Industriels</div>
            <p style={{ fontSize: '11px', color: 'var(--txt-3)', margin: 0, lineHeight: 1.4 }}>
              Forte accélération de la demande en revêtements époxy pour entrepôts et condos à Montréal. Mettez de l'avant vos services de peinture époxy commerciale et formulez des offres agressives pour capter ces marchés à forte marge.
            </p>
          </div>

          {/* Rec 3 - Financement et Rénos */}
          <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'var(--purple)18', color: 'var(--purple)', fontWeight: 600 }}>FINANCIER / CCQ</span>
              <span style={{ fontSize: '10px', color: 'var(--gold-2)', fontWeight: 700 }}>ROI: +8.5%</span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>Focus Rafraîchissements Rapides</div>
            <p style={{ fontSize: '11px', color: 'var(--txt-3)', margin: 0, lineHeight: 1.4 }}>
              Avec des taux hypothécaires à <strong>{mortgageRate}%</strong>, les propriétaires reportent les agrandissements mais investissent dans les travaux esthétiques. Priorisez les services de rafraîchissement peinture rapides payés sans financement complexe.
            </p>
          </div>

        </div>

      </div>

    </div>
  )
}
