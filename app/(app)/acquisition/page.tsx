'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  Target, Globe, Star, Calendar, CheckCircle2, TrendingUp,
  Settings, Loader2, Save, Sparkles, AlertCircle, RefreshCw,
  Facebook, Search, ShieldCheck, Mail, Info
} from 'lucide-react'

interface Integration {
  id: string
  nom: string
  active: boolean
  budget: number
  leadsSimules: number
}

export default function AcquisitionPage() {
  const [onglet, setOnglet] = useState<'funnel_studio' | 'integrations' | 'funnel' | 'scoring'>('funnel_studio')
  const [loading, setLoading] = useState(true)

  // Real DB counts
  const [stats, setStats] = useState({
    leadsTotal: 0,
    leadsQualifies: 0,
    devisTotal: 0,
    devisApprouves: 0,
    jobsActifs: 0
  })

  // Marketing Integrations state (persisted in localStorage for preview)
  const [integrations, setIntegrations] = useState<Integration[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('erp_marketing_integrations')
      if (saved) return JSON.parse(saved)
    }
    return [
      { id: 'meta', nom: 'Meta Ads (Facebook & Instagram)', active: false, budget: 0, leadsSimules: 0 },
      { id: 'google', nom: 'Google Ads', active: false, budget: 0, leadsSimules: 0 },
      { id: 'seo', nom: 'SEO / Référencement Naturel', active: true, budget: 0, leadsSimules: 0 },
      { id: 'gmb', nom: 'Google Business Profile (Local)', active: true, budget: 0, leadsSimules: 0 }
    ]
  })

  // Lead scoring questionnaire simulation state
  const [scoringForm, setScoringForm] = useState({
    typeProjet: 'reno',
    budget: 'tiede',
    delai: 'urgent'
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadRealStats = useCallback(async () => {
    setLoading(true)
    try {
      const [
        { data: leads },
        { data: devis },
        { data: jobs }
      ] = await Promise.all([
        supabase.from('leads').select('statut'),
        supabase.from('devis').select('statut'),
        supabase.from('jobs').select('statut')
      ])

      const l = leads || []
      const d = devis || []
      const j = jobs || []

      setStats({
        leadsTotal: l.length,
        leadsQualifies: l.filter(x => x.statut === 'qualifié' || x.statut === 'proposition' || x.statut === 'gagné').length,
        devisTotal: d.length,
        devisApprouves: d.filter(x => x.statut === 'converti' || x.statut === 'approuvé').length,
        jobsActifs: j.filter(x => x.statut === 'en_cours').length
      })
    } catch (err) {
      console.error('[loadRealStats]', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadRealStats()
  }, [loadRealStats])

  const saveIntegrations = (newInt: Integration[]) => {
    setIntegrations(newInt)
    localStorage.setItem('erp_marketing_integrations', JSON.stringify(newInt))
  }

  const handleToggle = (id: string) => {
    const updated = integrations.map(item => {
      if (item.id === id) {
        const nextActive = !item.active
        return {
          ...item,
          active: nextActive,
          budget: nextActive ? item.budget || 200 : 0
        }
      }
      return item
    })
    saveIntegrations(updated)
  }

  const handleBudgetChange = (id: string, value: string) => {
    const parsed = parseFloat(value) || 0
    const updated = integrations.map(item => {
      if (item.id === id) {
        return { ...item, budget: parsed }
      }
      return item
    })
    saveIntegrations(updated)
  }

  // Scoring logic
  const calculateScore = () => {
    let pts = 0
    if (scoringForm.typeProjet === 'construction') pts += 40
    if (scoringForm.typeProjet === 'reno') pts += 25
    if (scoringForm.typeProjet === 'commercial') pts += 35

    if (scoringForm.budget === 'chaud') pts += 40
    if (scoringForm.budget === 'tiede') pts += 20

    if (scoringForm.delai === 'urgent') pts += 20
    if (scoringForm.delai === 'moyen') pts += 10

    return pts
  }

  const scoreResult = calculateScore()
  const scoreClass = scoreResult >= 70 ? 'Chaud 🔥' : scoreResult >= 45 ? 'Tiède ⚡' : 'Froid ❄️'
  const scoreColor = scoreResult >= 70 ? 'var(--red)' : scoreResult >= 45 ? 'var(--amber)' : 'var(--txt-3)'

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px' }}>
      
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Target size={18} color="var(--gold)" />
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>
            Acquisition & Marketing
          </h1>
        </div>
        <button
          onClick={loadRealStats}
          style={{
            background: 'none', border: '0.5px solid var(--line)', borderRadius: '6px',
            padding: '6px 12px', fontSize: '11px', color: 'var(--txt-2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <RefreshCw size={11} /> Rafraîchir
        </button>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '0.5px solid var(--line)', paddingBottom: '1px', flexWrap: 'wrap' }}>
        {[
          { id: 'funnel_studio', label: '🔥 Master Funnel Studio (Trio Stratégique)' },
          { id: 'integrations', label: 'Intégrations & Budgets' },
          { id: 'funnel', label: 'Entonnoir (Données Réelles)' },
          { id: 'scoring', label: 'Simulateur de Scoring' }
        ].map(o => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id as any)}
            style={{
              background: 'none', border: 'none',
              borderBottom: onglet === o.id ? '2px solid var(--gold)' : '2px solid transparent',
              color: onglet === o.id ? 'var(--gold-2)' : 'var(--txt-3)',
              padding: '8px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.12s'
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* ── CONTENU : INTEGRATIONS ── */}
      {onglet === 'integrations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          <div style={{
            background: 'var(--ga)', border: '0.5px solid var(--gold-3)',
            borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px'
          }}>
            <Info size={16} color="var(--gold-2)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gold-2)', marginBottom: '4px' }}>
                Mode Sandbox & Simulation Marketing
              </div>
              <div style={{ fontSize: '11px', color: 'var(--txt-2)', lineHeight: 1.5 }}>
                Configurez vos campagnes actives pour simuler votre coût d'acquisition. Ces budgets locaux sont combinés avec vos vrais prospects CRM pour générer vos rapports d'entonnoir.
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {integrations.map(item => (
              <div key={item.id} style={{
                background: 'var(--bg-1)', border: '0.5px solid var(--line)',
                borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>{item.nom}</span>
                  <input
                    type="checkbox"
                    checked={item.active}
                    onChange={() => handleToggle(item.id)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: item.active ? 1 : 0.4, transition: 'opacity 0.2s' }}>
                  <span style={{ fontSize: '11px', color: 'var(--txt-3)' }}>Statut :</span>
                  <span style={{
                    fontSize: '10px', padding: '2px 7px', borderRadius: '4px',
                    background: item.active ? 'rgba(34,197,94,0.1)' : 'var(--bg-3)',
                    color: item.active ? 'var(--green)' : 'var(--txt-3)'
                  }}>
                    {item.active ? 'Connecté' : 'Désactivé'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', opacity: item.active ? 1 : 0.4, transition: 'opacity 0.2s' }}>
                  <label style={{ fontSize: '11px', color: 'var(--txt-3)' }}>Budget mensuel ($ CAD)</label>
                  <input
                    type="number"
                    disabled={!item.active}
                    value={item.budget || ''}
                    onChange={(e) => handleBudgetChange(item.id, e.target.value)}
                    placeholder="0"
                    style={{
                      width: '100%', background: 'var(--bg-2)', border: '0.5px solid var(--line)',
                      borderRadius: '7px', padding: '8px 12px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{
            background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px',
            padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-2)' }}>Budget publicitaire total configuré :</span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gold-2)' }}>
              {integrations.reduce((sum, item) => sum + item.budget, 0).toLocaleString('fr-CA')} $ / mois
            </span>
          </div>

        </div>
      )}

      {/* ── CONTENU : FUNNEL ── */}
      {onglet === 'funnel' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', color: 'var(--txt-3)' }}>
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--txt-3)', textTransform: 'uppercase', marginBottom: '4px' }}>Prospects (CRM)</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt-1)' }}>{stats.leadsTotal}</div>
                </div>
                <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--txt-3)', textTransform: 'uppercase', marginBottom: '4px' }}>Prospects Qualifiés</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--amber)' }}>{stats.leadsQualifies}</div>
                </div>
                <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--txt-3)', textTransform: 'uppercase', marginBottom: '4px' }}>Devis Créés</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--gold-2)' }}>{stats.devisTotal}</div>
                </div>
                <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--txt-3)', textTransform: 'uppercase', marginBottom: '4px' }}>Ventes (Signées)</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--green)' }}>{stats.devisApprouves}</div>
                </div>
              </div>

              {/* Conversion chart */}
              <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '20px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', margin: '0 0 16px 0' }}>Entonnoir de Conversion Réel</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { label: 'Prospects Entrants (CRM)', val: stats.leadsTotal, pct: 100, color: 'var(--txt-3)' },
                    { label: 'Qualifiés / Proposition', val: stats.leadsQualifies, pct: stats.leadsTotal ? Math.round((stats.leadsQualifies / stats.leadsTotal) * 100) : 0, color: 'var(--blue)' },
                    { label: 'Soumissions Envoyées', val: stats.devisTotal, pct: stats.leadsQualifies ? Math.round((stats.devisTotal / stats.leadsQualifies) * 100) : 0, color: 'var(--gold)' },
                    { label: 'Soumissions Approuvées', val: stats.devisApprouves, pct: stats.devisTotal ? Math.round((stats.devisApprouves / stats.devisTotal) * 100) : 0, color: 'var(--green)' },
                    { label: 'Chantiers en cours', val: stats.jobsActifs, pct: stats.devisApprouves ? Math.round((stats.jobsActifs / stats.devisApprouves) * 100) : 0, color: 'var(--green)' }
                  ].map((item, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '150px', fontSize: '11px', color: 'var(--txt-2)' }}>{item.label}</div>
                      <div style={{ flex: 1, height: '8px', background: 'var(--bg-3)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.max(2, item.val ? (item.val / Math.max(1, stats.leadsTotal)) * 100 : 0)}%`,
                          background: item.color, height: '100%', borderRadius: '4px'
                        }} />
                      </div>
                      <div style={{ width: '80px', display: 'flex', gap: '8px', justifyContent: 'flex-end', fontSize: '11px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--txt-1)' }}>{item.val}</span>
                        <span style={{ color: 'var(--txt-3)' }}>({item.pct}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ── CONTENU : SCORING ── */}
      {onglet === 'scoring' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', margin: '0 0 16px 0' }}>Simulateur de qualification (Lead Scoring)</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px' }}>Type de travaux</label>
                <select
                  value={scoringForm.typeProjet}
                  onChange={(e) => setScoringForm(prev => ({ ...prev, typeProjet: e.target.value }))}
                  style={{ width: '100%', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '9px 12px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
                >
                  <option value="reno">Rénovation Mineure (25 pts)</option>
                  <option value="commercial">Commercial / Sous-traitance (35 pts)</option>
                  <option value="construction">Maison neuve / Agrandissement (40 pts)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px' }}>Budget estimé</label>
                <select
                  value={scoringForm.budget}
                  onChange={(e) => setScoringForm(prev => ({ ...prev, budget: e.target.value }))}
                  style={{ width: '100%', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '9px 12px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
                >
                  <option value="froid">Moins de 10 000 $ (0 pts)</option>
                  <option value="tiede">10 000 – 40 000 $ (20 pts)</option>
                  <option value="chaud">Plus de 40 000 $ (40 pts)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px' }}>Délai des travaux</label>
                <select
                  value={scoringForm.delai}
                  onChange={(e) => setScoringForm(prev => ({ ...prev, delai: e.target.value }))}
                  style={{ width: '100%', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '9px 12px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
                >
                  <option value="flexible">Plus de 3 mois (0 pts)</option>
                  <option value="moyen">Dans les 1-3 mois (10 pts)</option>
                  <option value="urgent">Immédiatement (20 pts)</option>
                </select>
              </div>
            </div>

            {/* Score Result Card */}
            <div style={{
              marginTop: '20px', padding: '16px', background: 'var(--bg-2)',
              border: '0.5px solid var(--line)', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--txt-3)', textTransform: 'uppercase' }}>Indice de chaleur du lead</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: scoreColor, marginTop: '2px' }}>{scoreClass} ({scoreResult} pts)</div>
              </div>
              
              <div style={{
                fontSize: '11px', padding: '6px 12px', borderRadius: '6px',
                background: scoreResult >= 70 ? 'rgba(239,68,68,0.1)' : 'var(--bg-3)',
                color: scoreResult >= 70 ? 'var(--red)' : 'var(--txt-2)'
              }}>
                {scoreResult >= 70 ? 'Auto-assigner au Devis Rapide' : 'Nourrir par Courriels Automatiques'}
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  )
}
