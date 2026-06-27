'use client'

import { Calendar, ChevronLeft, ChevronRight, Plus, MapPin, Clock, Building2, User } from 'lucide-react'
import { useState } from 'react'

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

type TypeEvenement = 'chantier' | 'rdv' | 'livraison' | 'inspection'

interface Evenement {
  id: string
  date: string   // YYYY-MM-DD
  titre: string
  type: TypeEvenement
  heure?: string
  lieu?: string
  client?: string
  couleur: string
}

// ── Données mock (Juin 2026) ─────────────────────────────────
const EVENEMENTS: Evenement[] = [
  { id:'1',  date:'2026-06-17', titre:'Maison Tremblay — Cuisine',      type:'chantier',   heure:'07:30', lieu:'245 Av. des Pins, Québec', client:'Jean Tremblay',      couleur:'#B8922A' },
  { id:'2',  date:'2026-06-17', titre:'Maison Tremblay — Cuisine',      type:'chantier',   heure:'07:30', lieu:'245 Av. des Pins, Québec', client:'Jean Tremblay',      couleur:'#B8922A' },
  { id:'3',  date:'2026-06-18', titre:'Livraison armoires IKEA',         type:'livraison',  heure:'09:00', lieu:'245 Av. des Pins, Québec', client:'Jean Tremblay',      couleur:'#4a8fd4' },
  { id:'4',  date:'2026-06-18', titre:'Maison Tremblay — Cuisine',      type:'chantier',   heure:'07:30', lieu:'245 Av. des Pins, Québec', client:'Jean Tremblay',      couleur:'#B8922A' },
  { id:'5',  date:'2026-06-19', titre:'RDV client — Groupe Côté',       type:'rdv',        heure:'10:00', lieu:'Bureau Groupe Côté, Beauport', client:'Groupe Immo Côté', couleur:'#8b5cf6' },
  { id:'6',  date:'2026-06-19', titre:'Maison Tremblay — Cuisine',      type:'chantier',   heure:'07:30', lieu:'245 Av. des Pins, Québec', client:'Jean Tremblay',      couleur:'#B8922A' },
  { id:'7',  date:'2026-06-20', titre:'Inspection finale — Bélanger',   type:'inspection', heure:'14:00', lieu:'88 rue Laurier, Sillery',   client:'Sophie Bélanger',    couleur:'#22c55e' },
  { id:'8',  date:'2026-06-20', titre:'Résidence Boivin — Sous-sol',    type:'chantier',   heure:'08:00', lieu:'34 rue Carrier, Lévis',     client:'Construction Boivin',couleur:'#f59e0b' },
  { id:'9',  date:'2026-06-23', titre:'Résidence Boivin — Sous-sol',    type:'chantier',   heure:'08:00', lieu:'34 rue Carrier, Lévis',     client:'Construction Boivin',couleur:'#f59e0b' },
  { id:'10', date:'2026-06-23', titre:'RDV devis — Denis Roy',          type:'rdv',        heure:'13:30', lieu:'Limoilou',                  client:'Denis Roy',          couleur:'#8b5cf6' },
  { id:'11', date:'2026-06-24', titre:'Résidence Boivin — Sous-sol',    type:'chantier',   heure:'08:00', lieu:'34 rue Carrier, Lévis',     client:'Construction Boivin',couleur:'#f59e0b' },
  { id:'12', date:'2026-06-25', titre:'Livraison comptoir quartz',       type:'livraison',  heure:'11:00', lieu:'245 Av. des Pins, Québec', client:'Jean Tremblay',      couleur:'#4a8fd4' },
  { id:'13', date:'2026-06-26', titre:'Résidence Boivin — Sous-sol',    type:'chantier',   heure:'08:00', lieu:'34 rue Carrier, Lévis',     client:'Construction Boivin',couleur:'#f59e0b' },
  { id:'14', date:'2026-06-27', titre:'Résidence Boivin — Sous-sol',    type:'chantier',   heure:'08:00', lieu:'34 rue Carrier, Lévis',     client:'Construction Boivin',couleur:'#f59e0b' },
  { id:'15', date:'2026-06-30', titre:'RDV signature contrat — Gagné',  type:'rdv',        heure:'10:00', lieu:'Bureau',                    client:'Pierre Gagné',       couleur:'#8b5cf6' },
]

const TYPE_LABEL: Record<TypeEvenement, string> = {
  chantier:   'Chantier',
  rdv:        'Rendez-vous',
  livraison:  'Livraison',
  inspection: 'Inspection',
}

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate() }
function getFirstDayOfMonth(year: number, month: number) { const d = new Date(year, month, 1).getDay(); return d === 0 ? 6 : d - 1 }

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
}

export default function CalendrierPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState<Evenement[] | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  function prev() { if (month===0){setMonth(11);setYear(y=>y-1)} else setMonth(m=>m-1) }
  function next() { if (month===11){setMonth(0);setYear(y=>y+1)} else setMonth(m=>m+1) }

  const cells: (number|null)[] = [...Array(firstDay).fill(null), ...Array.from({length:daysInMonth},(_,i)=>i+1)]
  while (cells.length%7!==0) cells.push(null)

  const isToday = (d: number) => d===today.getDate() && month===today.getMonth() && year===today.getFullYear()

  function eventsForDay(day: number) {
    const key = dateKey(year, month, day)
    return EVENEMENTS.filter(e => e.date === key)
  }

  function handleDayClick(day: number) {
    const key = dateKey(year, month, day)
    const evs = EVENEMENTS.filter(e => e.date === key)
    setSelectedDate(key)
    setSelected(evs.length > 0 ? evs : null)
  }

  // Événements du mois courant
  const monthKey = `${year}-${String(month+1).padStart(2,'0')}`
  const evtsDuMois = EVENEMENTS.filter(e => e.date.startsWith(monthKey))
  const chantiers = evtsDuMois.filter(e=>e.type==='chantier').length
  const rdvs = evtsDuMois.filter(e=>e.type==='rdv').length

  return (
    <div style={{padding:'24px',display:'flex',flexDirection:'column',gap:'20px',maxWidth:'1000px'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <Calendar size={18} color="var(--gold)"/>
          <h1 style={{fontSize:'18px',fontWeight:600,color:'var(--txt-1)',margin:0}}>Calendrier</h1>
          <span style={{fontSize:'11px',color:'var(--txt-3)',background:'var(--bg-3)',borderRadius:'5px',padding:'2px 7px'}}>{evtsDuMois.length} événements</span>
        </div>
        <button style={{display:'flex',alignItems:'center',gap:'6px',background:'var(--gold)',border:'none',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#0A0A0A',cursor:'pointer'}}>
          <Plus size={14}/> Nouvel événement
        </button>
      </div>

      {/* Mini stats */}
      <div style={{display:'flex',gap:'10px'}}>
        {[
          {label:'Jours chantier',val:chantiers,color:'var(--gold)'},
          {label:'Rendez-vous',   val:rdvs,      color:'var(--purple)'},
          {label:'Livraisons',    val:evtsDuMois.filter(e=>e.type==='livraison').length, color:'var(--blue)'},
          {label:'Inspections',   val:evtsDuMois.filter(e=>e.type==='inspection').length,color:'var(--green)'},
        ].map(s=>(
          <div key={s.label} style={{background:'var(--bg-1)',border:'0.5px solid var(--line)',borderRadius:'8px',padding:'10px 14px',display:'flex',alignItems:'center',gap:'8px'}}>
            <span style={{fontSize:'16px',fontWeight:700,color:s.color}}>{s.val}</span>
            <span style={{fontSize:'11px',color:'var(--txt-3)'}}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Nav mois */}
      <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
        <button onClick={prev} style={{background:'var(--bg-2)',border:'0.5px solid var(--line)',borderRadius:'6px',padding:'5px 8px',cursor:'pointer',color:'var(--txt-1)',display:'flex',alignItems:'center'}}>
          <ChevronLeft size={14}/>
        </button>
        <span style={{fontSize:'15px',fontWeight:600,color:'var(--txt-1)',minWidth:'160px',textAlign:'center'}}>{MOIS[month]} {year}</span>
        <button onClick={next} style={{background:'var(--bg-2)',border:'0.5px solid var(--line)',borderRadius:'6px',padding:'5px 8px',cursor:'pointer',color:'var(--txt-1)',display:'flex',alignItems:'center'}}>
          <ChevronRight size={14}/>
        </button>
        <button onClick={()=>{setMonth(today.getMonth());setYear(today.getFullYear())}} style={{background:'none',border:'0.5px solid var(--line)',borderRadius:'6px',padding:'5px 10px',cursor:'pointer',fontSize:'11px',color:'var(--txt-3)'}}>
          Aujourd'hui
        </button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:selected?'1fr 260px':'1fr',gap:'16px',alignItems:'start'}}>
        {/* Grille */}
        <div style={{background:'var(--bg-1)',border:'0.5px solid var(--line)',borderRadius:'10px',overflow:'hidden'}}>
          {/* En-têtes */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'0.5px solid var(--line)'}}>
            {JOURS.map(j=>(
              <div key={j} style={{padding:'10px 0',textAlign:'center',fontSize:'10px',fontWeight:600,color:'var(--txt-3)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{j}</div>
            ))}
          </div>

          {/* Cellules */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
            {cells.map((day,i)=>{
              const evs = day ? eventsForDay(day) : []
              const key = day ? dateKey(year,month,day) : ''
              const isSelected = key === selectedDate
              return (
                <div key={i} onClick={()=>day&&handleDayClick(day)} style={{
                  minHeight:'100px',
                  borderRight:(i+1)%7===0?'none':'0.5px solid var(--line)',
                  borderBottom:i<cells.length-7?'0.5px solid var(--line)':'none',
                  padding:'6px',
                  background:isSelected?'var(--ga)':day&&isToday(day)?'rgba(184,146,42,0.06)':'transparent',
                  cursor:day?'pointer':'default',
                  outline:isSelected?'0.5px solid var(--gold-3)':'none',
                }}>
                  {day&&(
                    <>
                      <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:'22px',height:'22px',borderRadius:'50%',fontSize:'11px',fontWeight:isToday(day)?700:400,color:isToday(day)?'var(--gold)':'var(--txt-2)',background:isToday(day)?'var(--gold-3)':'transparent'}}>
                        {day}
                      </span>
                      <div style={{display:'flex',flexDirection:'column',gap:'3px',marginTop:'4px'}}>
                        {evs.slice(0,2).map(e=>(
                          <div key={e.id} style={{fontSize:'9px',padding:'2px 5px',borderRadius:'3px',background:`${e.couleur}22`,color:e.couleur,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {e.heure&&<span style={{opacity:0.7}}>{e.heure} </span>}{e.titre}
                          </div>
                        ))}
                        {evs.length>2&&<div style={{fontSize:'9px',color:'var(--txt-3)',paddingLeft:'5px'}}>+{evs.length-2} autres</div>}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Panneau détail jour */}
        {selected && (
          <div style={{background:'var(--bg-1)',border:'0.5px solid var(--line)',borderRadius:'10px',overflow:'hidden',position:'sticky',top:'24px'}}>
            <div style={{padding:'12px 14px',borderBottom:'0.5px solid var(--line)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontSize:'12px',fontWeight:600,color:'var(--txt-1)'}}>
                {selectedDate&&new Date(selectedDate+'T12:00:00').toLocaleDateString('fr-CA',{weekday:'long',day:'numeric',month:'long'})}
              </span>
              <button onClick={()=>{setSelected(null);setSelectedDate(null)}} style={{background:'none',border:'none',cursor:'pointer',fontSize:'14px',color:'var(--txt-3)'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'0'}}>
              {selected.map((e,i)=>(
                <div key={e.id} style={{padding:'12px 14px',borderBottom:i<selected.length-1?'0.5px solid var(--line)':'none'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'6px'}}>
                    <div style={{width:'8px',height:'8px',borderRadius:'50%',background:e.couleur,flexShrink:0}}/>
                    <span style={{fontSize:'11px',fontWeight:600,color:e.couleur}}>{TYPE_LABEL[e.type]}</span>
                    {e.heure&&<span style={{fontSize:'10px',color:'var(--txt-3)',display:'flex',alignItems:'center',gap:'3px'}}><Clock size={9}/>{e.heure}</span>}
                  </div>
                  <div style={{fontSize:'12px',fontWeight:600,color:'var(--txt-1)',marginBottom:'4px'}}>{e.titre}</div>
                  {e.client&&<div style={{fontSize:'10px',color:'var(--txt-3)',display:'flex',alignItems:'center',gap:'4px',marginBottom:'3px'}}><User size={9}/>{e.client}</div>}
                  {e.lieu&&<div style={{fontSize:'10px',color:'var(--txt-3)',display:'flex',alignItems:'center',gap:'4px'}}><MapPin size={9}/>{e.lieu}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
