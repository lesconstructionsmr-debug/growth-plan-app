'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  ArrowLeft, Building2, MapPin, Calendar, Clock,
  Edit3, FileText, Receipt, CheckCircle2, XCircle,
  Navigation, Users, DollarSign, TrendingUp, AlertCircle,
} from 'lucide-react'

type StatutProjet = 'brouillon' | 'en_attente' | 'en_cours' | 'en_pause' | 'termine' | 'annule'

interface PointageRow {
  id: string; employe_nom: string; date: string
  heure_debut: string; heure_fin: string; duree_minutes: number
  dans_rayon_debut: boolean; dans_rayon_fin: boolean
  notes: string | null; approuve: boolean
}

const MOCK_PROJET = {
  id: '1', titre: 'Maison Tremblay — Cuisine', statut: 'en_cours' as StatutProjet,
  client_nom: 'Jean Tremblay', client_email: 'jean.tremblay@example.com',
  adresse_chantier: '245 Avenue des Pins', ville_chantier: 'Québec, QC',
  date_debut: '2026-06-20', date_fin_prevue: '2026-07-15',
  budget_estime: 21270.38, budget_final: null,
  rayon_pointage_metres: 200, couleur: '#B8922A',
  responsable_nom: 'Marc Gagnon',
  description: 'Rénovation complète de la cuisine incluant démolition, armoires, comptoir quartz et finitions.',
}

const MOCK_POINTAGES: PointageRow[] = [
  { id:'1', employe_nom:'Marc Gagnon', date:'2026-06-20', heure_debut:'07:30', heure_fin:'16:00', duree_minutes:510, dans_rayon_debut:true,  dans_rayon_fin:true,  notes:null, approuve:true  },
  { id:'2', employe_nom:'Luc Fortin',  date:'2026-06-20', heure_debut:'07:45', heure_fin:'15:30', duree_minutes:465, dans_rayon_debut:true,  dans_rayon_fin:true,  notes:null, approuve:true  },
  { id:'3', employe_nom:'Marc Gagnon', date:'2026-06-21', heure_debut:'08:00', heure_fin:'16:30', duree_minutes:510, dans_rayon_debut:true,  dans_rayon_fin:false, notes:'Parti chercher matériaux', approuve:false },
  { id:'4', employe_nom:'Luc Fortin',  date:'2026-06-21', heure_debut:'08:00', heure_fin:'16:00', duree_minutes:480, dans_rayon_debut:false, dans_rayon_fin:true,  notes:'Retard trafic', approuve:false },
]

const STATUT_CFG: Record<StatutProjet,{label:string;color:string;bg:string}> = {
  brouillon:   {label:'Brouillon',  color:'var(--txt-3)',  bg:'var(--bg-3)'     },
  en_attente:  {label:'En attente', color:'var(--amber)',  bg:'var(--amber)18'  },
  en_cours:    {label:'En cours',   color:'var(--gold-2)', bg:'var(--gold-3)'   },
  en_pause:    {label:'En pause',   color:'var(--purple)', bg:'var(--purple)18' },
  termine:     {label:'Terminé',    color:'var(--green)',  bg:'var(--green)18'  },
  annule:      {label:'Annulé',     color:'var(--red)',    bg:'var(--red)18'    },
}

const TABS = [
  {id:'apercu',   label:'Aperçu'},
  {id:'pointage', label:'Pointage'},
  {id:'devis',    label:'Devis'},
  {id:'factures', label:'Factures'},
]

const fmt = (n:number) => n.toLocaleString('fr-CA',{style:'currency',currency:'CAD'})
const fmtDate = (s:string) => new Date(s).toLocaleDateString('fr-CA',{day:'numeric',month:'short',year:'numeric'})
const fmtDuree = (min:number) => `${Math.floor(min/60)}h${(min%60).toString().padStart(2,'0')}`

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState('apercu')
  const [pointages, setPointages] = useState(MOCK_POINTAGES)
  const [projet, setProjet] = useState(MOCK_PROJET)

  useEffect(() => {
    if (!id) return
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase
      .from('jobs')
      .select('id, titre, statut, description, adresse_chantier, ville_chantier, date_debut, date_fin_prevue, budget, couleur, rayon_pointage_metres, clients(nom, email)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) return
        const cli = data.clients as any ?? {}
        setProjet({
          id: data.id,
          titre: data.titre ?? '',
          statut: (data.statut as StatutProjet) ?? 'en_attente',
          client_nom: cli.nom ?? '—',
          client_email: cli.email ?? '',
          adresse_chantier: data.adresse_chantier ?? '',
          ville_chantier: data.ville_chantier ?? '',
          date_debut: data.date_debut ?? '',
          date_fin_prevue: data.date_fin_prevue ?? '',
          budget_estime: Number(data.budget ?? 0),
          budget_final: null,
          rayon_pointage_metres: data.rayon_pointage_metres ?? 200,
          couleur: data.couleur ?? '#B8922A',
          responsable_nom: '',
          description: data.description ?? '',
        })
      })
  }, [id])

  const cfg = STATUT_CFG[projet.statut]

  const totalHeures = pointages.reduce((s,p)=>s+p.duree_minutes,0)
  const heuresApprouvees = pointages.filter(p=>p.approuve).reduce((s,p)=>s+p.duree_minutes,0)

  function toggleApprouver(pid: string) {
    setPointages(ps => ps.map(p => p.id===pid ? {...p, approuve:!p.approuve} : p))
  }

  const card: React.CSSProperties = {background:'var(--bg-1)',border:'0.5px solid var(--line)',borderRadius:'10px',padding:'16px 18px'}
  const btn2: React.CSSProperties = {display:'flex',alignItems:'center',gap:'6px',background:'none',border:'0.5px solid var(--line)',borderRadius:'8px',padding:'7px 12px',fontSize:'11px',color:'var(--txt-2)',cursor:'pointer',fontFamily:'inherit'}

  return (
    <div style={{padding:'24px',display:'flex',flexDirection:'column',gap:'18px',maxWidth:'1000px'}}>

      <a href="/jobs" style={{display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'12px',color:'var(--txt-3)',textDecoration:'none'}}>
        <ArrowLeft size={13}/> Jobs / Projets
      </a>

      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:'12px'}}>
          <div style={{width:'12px',height:'12px',borderRadius:'50%',background:projet.couleur,marginTop:'6px',flexShrink:0}}/>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'4px'}}>
              <h1 style={{fontSize:'20px',fontWeight:700,color:'var(--txt-1)',margin:0}}>{projet.titre}</h1>
              <span style={{padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:600,background:cfg.bg,color:cfg.color}}>{cfg.label}</span>
            </div>
            <div style={{fontSize:'12px',color:'var(--txt-3)',display:'flex',alignItems:'center',gap:'12px'}}>
              <span style={{display:'flex',alignItems:'center',gap:'4px'}}><Users size={11}/>{projet.client_nom}</span>
              <span style={{display:'flex',alignItems:'center',gap:'4px'}}><MapPin size={11}/>{projet.ville_chantier}</span>
            </div>
          </div>
        </div>
        <div style={{display:'flex',gap:'8px'}}>
          <button style={btn2}><Edit3 size={13}/> Modifier</button>
          {projet.statut==='en_cours'&&<button style={{...btn2,border:'0.5px solid var(--green)',color:'var(--green)'}}><CheckCircle2 size={13}/> Terminer</button>}
        </div>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px'}}>
        {[
          {icon:DollarSign,  label:'Budget estimé',  val:fmt(projet.budget_estime), color:'var(--gold)'},
          {icon:DollarSign,  label:'Budget final',    val:projet.budget_final?fmt(projet.budget_final):'—', color:'var(--txt-1)'},
          {icon:Clock,       label:'Heures totales',  val:fmtDuree(totalHeures), color:'var(--blue)'},
          {icon:CheckCircle2,label:'Heures approuvées',val:fmtDuree(heuresApprouvees), color:'var(--green)'},
        ].map(s=>{
          const Icon = s.icon
          return (
            <div key={s.label} style={card}>
              <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'8px'}}>
                <Icon size={13} color={s.color}/>
                <span style={{fontSize:'10px',color:'var(--txt-3)',fontWeight:600,letterSpacing:'0.04em'}}>{s.label.toUpperCase()}</span>
              </div>
              <div style={{fontSize:'17px',fontWeight:700,color:s.color}}>{s.val}</div>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:'2px',borderBottom:'0.5px solid var(--line)'}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            background:'none',border:'none',cursor:'pointer',padding:'8px 14px',fontSize:'12px',
            color:tab===t.id?'var(--gold-2)':'var(--txt-3)',
            borderBottom:tab===t.id?'2px solid var(--gold)':'2px solid transparent',
            fontWeight:tab===t.id?600:400,
          }}>{t.label}</button>
        ))}
      </div>

      {/* Onglet Aperçu */}
      {tab==='apercu'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
          <div style={card}>
            <div style={{fontSize:'10px',color:'var(--txt-3)',fontWeight:600,letterSpacing:'0.05em',marginBottom:'12px'}}>CHANTIER</div>
            <div style={{display:'flex',alignItems:'flex-start',gap:'8px',marginBottom:'10px'}}>
              <MapPin size={14} color="var(--txt-3)" style={{marginTop:'1px',flexShrink:0}}/>
              <div>
                <div style={{fontSize:'12px',color:'var(--txt-1)',fontWeight:600}}>{projet.adresse_chantier}</div>
                <div style={{fontSize:'11px',color:'var(--txt-3)'}}>{projet.ville_chantier}</div>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <Navigation size={12} color="var(--txt-3)"/>
              <span style={{fontSize:'11px',color:'var(--txt-3)'}}>Rayon de pointage: {projet.rayon_pointage_metres}m</span>
            </div>
          </div>
          <div style={card}>
            <div style={{fontSize:'10px',color:'var(--txt-3)',fontWeight:600,letterSpacing:'0.05em',marginBottom:'12px'}}>CALENDRIER</div>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
              <Calendar size={13} color="var(--txt-3)"/>
              <div>
                <div style={{fontSize:'10px',color:'var(--txt-3)'}}>Début</div>
                <div style={{fontSize:'12px',color:'var(--txt-1)'}}>{fmtDate(projet.date_debut)}</div>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <Calendar size={13} color="var(--txt-3)"/>
              <div>
                <div style={{fontSize:'10px',color:'var(--txt-3)'}}>Fin prévue</div>
                <div style={{fontSize:'12px',color:'var(--txt-1)'}}>{fmtDate(projet.date_fin_prevue)}</div>
              </div>
            </div>
          </div>
          <div style={{...card,gridColumn:'1 / -1'}}>
            <div style={{fontSize:'10px',color:'var(--txt-3)',fontWeight:600,letterSpacing:'0.05em',marginBottom:'8px'}}>DESCRIPTION</div>
            <p style={{fontSize:'12px',color:'var(--txt-2)',margin:0,lineHeight:1.6}}>{projet.description}</p>
          </div>
        </div>
      )}

      {/* Onglet Pointage */}
      {tab==='pointage'&&(
        <div style={{...card,padding:0,overflow:'hidden'}}>
          <div style={{padding:'14px 18px',borderBottom:'0.5px solid var(--line)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontSize:'13px',fontWeight:600,color:'var(--txt-1)'}}>Pointages du chantier</span>
            <div style={{fontSize:'11px',color:'var(--txt-3)'}}>
              {pointages.filter(p=>p.approuve).length}/{pointages.length} approuvés
            </div>
          </div>

          {/* En-tête */}
          <div style={{display:'grid',gridTemplateColumns:'130px 100px 100px 80px 80px 1fr 100px',padding:'8px 18px',borderBottom:'0.5px solid var(--line)',background:'var(--bg-2)'}}>
            {['EMPLOYÉ','DATE','DÉBUT','FIN','DURÉE','NOTES','STATUT'].map(h=>(
              <div key={h} style={{fontSize:'9px',fontWeight:700,color:'var(--txt-3)',letterSpacing:'0.06em'}}>{h}</div>
            ))}
          </div>

          {pointages.map((p,i)=>(
            <div key={p.id} style={{
              display:'grid',gridTemplateColumns:'130px 100px 100px 80px 80px 1fr 100px',
              padding:'11px 18px',alignItems:'center',
              borderBottom:i<pointages.length-1?'0.5px solid var(--line)':'none',
              background:p.approuve?'transparent':'var(--amber)06',
            }}>
              <div style={{fontSize:'12px',color:'var(--txt-1)',fontWeight:600}}>{p.employe_nom}</div>
              <div style={{fontSize:'11px',color:'var(--txt-2)'}}>{new Date(p.date).toLocaleDateString('fr-CA',{day:'numeric',month:'short'})}</div>
              <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                <span style={{fontSize:'12px',color:'var(--txt-1)'}}>{p.heure_debut}</span>
                <span style={{width:'6px',height:'6px',borderRadius:'50%',background:p.dans_rayon_debut?'var(--green)':'var(--red)',flexShrink:0}} title={p.dans_rayon_debut?'Dans le rayon':'Hors rayon'}/>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                <span style={{fontSize:'12px',color:'var(--txt-1)'}}>{p.heure_fin}</span>
                <span style={{width:'6px',height:'6px',borderRadius:'50%',background:p.dans_rayon_fin?'var(--green)':'var(--red)',flexShrink:0}} title={p.dans_rayon_fin?'Dans le rayon':'Hors rayon'}/>
              </div>
              <div style={{fontSize:'12px',color:'var(--txt-2)',fontWeight:600}}>{fmtDuree(p.duree_minutes)}</div>
              <div style={{fontSize:'11px',color:'var(--txt-3)'}}>{p.notes??'—'}</div>
              <button
                onClick={()=>toggleApprouver(p.id)}
                style={{
                  display:'flex',alignItems:'center',gap:'5px',
                  background:'none',
                  border:`0.5px solid ${p.approuve?'var(--green)':'var(--amber)'}`,
                  borderRadius:'7px',padding:'4px 8px',
                  fontSize:'10px',fontWeight:600,
                  color:p.approuve?'var(--green)':'var(--amber)',
                  cursor:'pointer',
                }}
              >
                {p.approuve?<><CheckCircle2 size={11}/> Approuvé</>:<><AlertCircle size={11}/> Approuver</>}
              </button>
            </div>
          ))}

          <div style={{padding:'12px 18px',borderTop:'0.5px solid var(--line)',background:'var(--bg-2)',display:'flex',gap:'24px'}}>
            <div style={{fontSize:'11px',color:'var(--txt-3)'}}>Total: <strong style={{color:'var(--txt-1)'}}>{fmtDuree(totalHeures)}</strong></div>
            <div style={{fontSize:'11px',color:'var(--txt-3)'}}>Approuvé: <strong style={{color:'var(--green)'}}>{fmtDuree(heuresApprouvees)}</strong></div>
            <div style={{fontSize:'11px',color:'var(--txt-3)'}}>GPS vert = dans le rayon du chantier</div>
          </div>
        </div>
      )}

      {/* Onglets Devis / Factures — placeholder */}
      {(tab==='devis'||tab==='factures')&&(
        <div style={{...card,textAlign:'center',padding:'48px'}}>
          <FileText size={28} color="var(--txt-3)" strokeWidth={1} style={{marginBottom:'10px'}}/>
          <div style={{fontSize:'12px',color:'var(--txt-3)'}}>
            {tab==='devis'?'Aucun devis lié à ce projet.':'Aucune facture liée à ce projet.'}
          </div>
          <a href={tab==='devis'?'/devis/nouveau':'/factures/nouvelle'} style={{
            display:'inline-flex',alignItems:'center',gap:'5px',marginTop:'12px',
            fontSize:'12px',color:'var(--gold)',fontWeight:600,textDecoration:'none',
          }}>
            + {tab==='devis'?'Créer un devis':'Créer une facture'}
          </a>
        </div>
      )}
    </div>
  )
}
