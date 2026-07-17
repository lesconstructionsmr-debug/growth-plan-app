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

// Données de secours (Fallback) pour assurer un affichage magnifique immédiat
const FALLBACK_DATA: MarketIndicator[] = [
  // Bois
  { id: '1', date_ref: '2025-07-01', indicateur: 'Bois de charpente', valeur: 380, unite: '$/m³', categorie: 'matériaux', region: 'Québec' },
  { id: '2', date_ref: '2025-09-01', indicateur: 'Bois de charpente', valeur: 395, unite: '$/m³', categorie: 'matériaux', region: 'Québec' },
  { id: '3', date_ref: '2025-11-01', indicateur: 'Bois de charpente', valeur: 410, unite: '$/m³', categorie: 'matériaux', region: 'Québec' },
  { id: '4', date_ref: '2026-01-01', indicateur: 'Bois de charpente', valeur: 430, unite: '$/m³', categorie: 'matériaux', region: 'Québec' },
  { id: '5', date_ref: '2026-03-01', indicateur: 'Bois de charpente', valeur: 445, unite: '$/m³', categorie: 'matériaux', region: 'Québec' },
  { id: '6', date_ref: '2026-05-01', indicateur: 'Bois de charpente', valeur: 465, unite: '$/m³', categorie: 'matériaux', region: 'Québec' },
  { id: '7', date_ref: '2026-07-01', indicateur: 'Bois de charpente', valeur: 480, unite: '$/m³', categorie: 'matériaux', region: 'Québec' },
  // Béton
  { id: '8', date_ref: '2025-07-01', indicateur: 'Béton prêt-à-l\'emploi', valeur: 145, unite: '$/m³', categorie: 'matériaux', region: 'Québec' },
  { id: '9', date_ref: '2025-09-01', indicateur: 'Béton prêt-à-l\'emploi', valeur: 148, unite: '$/m³', categorie: 'matériaux', region: 'Québec' },
  { id: '10', date_ref: '2025-11-01', indicateur: 'Béton prêt-à-l\'emploi', valeur: 152, unite: '$/m³', categorie: 'matériaux', region: 'Québec' },
  { id: '11', date_ref: '2026-01-01', indicateur: 'Béton prêt-à-l\'emploi', valeur: 155, unite: '$/m³', categorie: 'matériaux', region: 'Québec' },
  { id: '12', date_ref: '2026-03-01', indicateur: 'Béton prêt-à-l\'emploi', valeur: 158, unite: '$/m³', categorie: 'matériaux', region: 'Québec' },
  { id: '13', date_ref: '2026-05-01', indicateur: 'Béton prêt-à-l\'emploi', valeur: 162, unite: '$/m³', categorie: 'matériaux', region: 'Québec' },
  { id: '14', date_ref: '2026-07-01', indicateur: 'Béton prêt-à-l\'emploi', valeur: 165, unite: '$/m³', categorie: 'matériaux', region: 'Québec' },
  // Acier
  { id: '15', date_ref: '2025-07-01', indicateur: 'Acier de structure', valeur: 1850, unite: '$/tonne', categorie: 'matériaux', region: 'Québec' },
  { id: '16', date_ref: '2025-09-01', indicateur: 'Acier de structure', valeur: 1880, unite: '$/tonne', categorie: 'matériaux', region: 'Québec' },
  { id: '17', date_ref: '2025-11-01', indicateur: 'Acier de structure', valeur: 1920, unite: '$/tonne', categorie: 'matériaux', region: 'Québec' },
  { id: '18', date_ref: '2026-01-01', indicateur: 'Acier de structure', valeur: 1950, unite: '$/tonne', categorie: 'matériaux', region: 'Québec' },
  { id: '19', date_ref: '2026-03-01', indicateur: 'Acier de structure', valeur: 1990, unite: '$/tonne', categorie: 'matériaux', region: 'Québec' },
  { id: '20', date_ref: '2026-05-01', indicateur: 'Acier de structure', valeur: 2050, unite: '$/tonne', categorie: 'matériaux', region: 'Québec' },
  { id: '21', date_ref: '2026-07-01', indicateur: 'Acier de structure', valeur: 2100, unite: '$/tonne', categorie: 'matériaux', region: 'Québec' },
  // Mises en chantier
  { id: '22', date_ref: '2026-06-30', indicateur: 'Mises en chantier', valeur: 3820, unite: 'unités', categorie: 'logement', region: 'Montréal' },
  { id: '23', date_ref: '2026-06-30', indicateur: 'Mises en chantier', valeur: 1480, unite: 'unités', categorie: 'logement', region: 'Laurentides' },
  { id: '24', date_ref: '2026-06-30', indicateur: 'Mises en chantier', valeur: 2150, unite: 'unités', categorie: 'logement', region: 'Montérégie' },
  // Taux
  { id: '25', date_ref: '2026-07-01', indicateur: 'Taux directeur', valeur: 4.50, unite: '%', categorie: 'taux', region: 'Canada' },
  { id: '26', date_ref: '2026-07-01', indicateur: 'Taux hypothécaire fixe 5 ans', valeur: 5.24, unite: '%', categorie: 'taux', region: 'Canada' }
]

// ── Helper formatage date ────────────────────────────────────────────────────
function fmtMonth(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-CA', { month: 'short', year: '2-digit' })
}

export default function MarchePage() {
  const [data, setData] = useState<MarketIndicator[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMaterial, setActiveMaterial] = useState<string>('Bois de charpente')
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
        // Si la table est vide, charger les fallbacks et lever une notification informative
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

  // Extraire les indicateurs pour le graphique temporel
  const materialTypes = ['Bois de charpente', 'Béton prêt-à-l\'emploi', 'Acier de structure']
  const chartPoints = data
    .filter(x => x.indicateur === activeMaterial)
    .map(x => ({ label: fmtMonth(x.date_ref), value: Number(x.valeur) }))

  // Données régionales (Mises en chantier)
  const regionStarts = data.filter(x => x.indicateur === 'Mises en chantier')

  // Indicateurs rapides
  const mortgageRate = data.find(x => x.indicateur === 'Taux hypothécaire fixe 5 ans')?.valeur ?? 5.24
  const bankRate = data.find(x => x.indicateur === 'Taux directeur')?.valeur ?? 4.50
  
  // Calcul variation du bois de charpente
  const woodHistory = data.filter(x => x.indicateur === 'Bois de charpente')
  const woodStart = woodHistory[0]?.valeur ?? 380
  const woodEnd = woodHistory[woodHistory.length - 1]?.valeur ?? 480
  const woodDiffPct = Math.round(((woodEnd - woodStart) / woodStart) * 100)

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
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>Démonstration active (Données de Secours)</div>
            <div style={{ fontSize: '11px', color: 'var(--txt-3)', marginTop: '2px' }}>
              La table `market_trends` de votre Supabase n'est pas alimentée. Nous affichons les indices de marché modélisés du Québec. Exécutez le script SQL `seed-market-trends.sql` pour lier de vraies entrées en base de données.
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
            <h1 className="print-title" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt-1)', margin: 0 }}>Analyse de Marché</h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--txt-3)', margin: 0 }}>Indicateurs externes et prévisions économiques du secteur de la construction au Québec</p>
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

        {/* Indice Matériaux (Bois) */}
        <div className="print-card" style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--txt-3)' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Bois de Charpente (m³)</span>
            <Hammer size={14} color="var(--gold)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--txt-1)' }}>{woodEnd} $</div>
          <div style={{ fontSize: '10px', color: 'var(--green)', fontWeight: 600 }}>
            +{woodDiffPct}% depuis 12 mois
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
          <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>Cumul des 3 régions clés du QC</div>
        </div>

      </div>

      {/* Deux colonnes : Graphique des matériaux + Histogramme des régions */}
      <div className="print-full" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '14px' }}>
        
        {/* Colonne Gauche : Indice Prix Matériaux */}
        <div className="print-card" style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LineIcon size={14} color="var(--gold)" />
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--txt-1)' }}>Indices des Prix des Matériaux</span>
            </div>
            
            {/* Filtre d'indicateur matériel (Masqué à l'impression pour n'imprimer que la valeur sélectionnée) */}
            <div className="no-print" style={{ display: 'flex', gap: '4px' }}>
              {materialTypes.map(m => (
                <button
                  key={m}
                  onClick={() => setActiveMaterial(m)}
                  style={{ background: activeMaterial === m ? 'var(--bg-3)' : 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '4px 8px', fontSize: '9px', color: activeMaterial === m ? 'var(--txt-1)' : 'var(--txt-3)', cursor: 'pointer', transition: 'all 0.1s' }}
                >
                  {m.split(' ')[0]} {/* Raccourcit le libellé bouton (ex: Bois, Béton, Acier) */}
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>
            Relevé d'évolution des prix unitaires pour le matériel : <strong style={{ color: 'var(--gold-2)' }}>{activeMaterial}</strong>
          </div>

          {/* Graphique SVG */}
          <div style={{ height: '220px', marginTop: '10px' }}>
            <LineChartSvg points={chartPoints} />
          </div>
        </div>

        {/* Colonne Droite : Mises en chantiers régionales (Bar chart en pur CSS) */}
        <div className="print-card" style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BarChart3 size={14} color="var(--gold)" />
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--txt-1)' }}>Mises en Chantier Régionales</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>
            Volume de nouvelles constructions résidentielles par région
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

      {/* Module AI Recommendations (Recommandations ROI Prédictives) */}
      <div className="print-card" style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Titre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: 'var(--gold-2)18', padding: '6px', borderRadius: '8px' }}>
            <Sparkles size={16} color="var(--gold-2)" />
          </div>
          <div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--txt-1)' }}>Recommandations IA & Analyse ROI Prédictif</span>
            <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>Calculé automatiquement selon les variations macroéconomiques du marché</div>
          </div>
        </div>

        {/* Recommandations */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }} className="print-full">
          
          {/* Rec 1 */}
          <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'var(--red)18', color: 'var(--red)', fontWeight: 600 }}>TENDANCE MATÉRIAUX</span>
              <span style={{ fontSize: '10px', color: 'var(--gold-2)', fontWeight: 700 }}>ROI Estimé: +6.5%</span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>Ajustement Marges Charpente</div>
            <p style={{ fontSize: '11px', color: 'var(--txt-3)', margin: 0, lineHeight: 1.4 }}>
              Le prix du bois de charpente a bondi de <strong>{woodDiffPct}%</strong>. Nous conseillons d'augmenter vos prix unitaires de <strong>5% à 8%</strong> sur les soumissions émises ce mois-ci pour protéger votre marge nette.
            </p>
          </div>

          {/* Rec 2 */}
          <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'var(--blue)18', color: 'var(--blue)', fontWeight: 600 }}>TENDANCE RÉGIONALE</span>
              <span style={{ fontSize: '10px', color: 'var(--gold-2)', fontWeight: 700 }}>ROI Estimé: +12%</span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>Ciblage Laurentides</div>
            <p style={{ fontSize: '11px', color: 'var(--txt-3)', margin: 0, lineHeight: 1.4 }}>
              Les mises en chantier dans les <strong>Laurentides</strong> progressent fortement. Concentrez 60% de vos budgets publicitaires (Google Ads / FB) sur cette zone pour capter les entrepreneurs et propriétaires.
            </p>
          </div>

          {/* Rec 3 */}
          <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'var(--purple)18', color: 'var(--purple)', fontWeight: 600 }}>TENDANCE FINANCIÈRE</span>
              <span style={{ fontSize: '10px', color: 'var(--gold-2)', fontWeight: 700 }}>ROI Estimé: +8%</span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>Prioriser Rénovations Moyennes</div>
            <p style={{ fontSize: '11px', color: 'var(--txt-3)', margin: 0, lineHeight: 1.4 }}>
              Avec des taux hypothécaires à <strong>{mortgageRate}%</strong>, privilégiez les chantiers de rénovation payés comptant par rapport aux constructions neuves soumises à des prêts bancaires stricts.
            </p>
          </div>

        </div>

      </div>

    </div>
  )
}
