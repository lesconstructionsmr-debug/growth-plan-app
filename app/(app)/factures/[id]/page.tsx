'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  ArrowLeft, Send, CheckCircle2, Download,
  Plus, Eye, X, CreditCard, Bell,
} from 'lucide-react'

type StatutFacture = 'brouillon' | 'envoyee' | 'vue' | 'partielle' | 'payee' | 'en_retard' | 'annulee'
type TypePaiement = 'virement' | 'cheque' | 'carte_credit' | 'interac' | 'especes' | 'autre'

interface PaiementRow {
  id: string; date_paiement: string; montant: number
  type_paiement: TypePaiement; reference: string | null; notes: string | null
}
interface LigneRow {
  id: string; description: string; quantite: number
  unite: string; prix_unitaire: number; total_ligne: number
}
interface FactureRow {
  id: string; numero: string; titre: string; statut: StatutFacture
  client_nom: string; client_email: string; devis_numero: string | null
  date_emission: string; date_echeance: string
  sous_total: number; taux_tps: number; taux_tvq: number
  montant_tps: number; montant_tvq: number; total_ttc: number
  montant_paye: number; solde_restant: number
  notes_client: string | null
  lignes: LigneRow[]; paiements: PaiementRow[]
}

const STATUT_CFG: Record<StatutFacture,{label:string;color:string;bg:string}> = {
  brouillon: {label:'Brouillon', color:'var(--txt-3)',  bg:'var(--bg-3)'     },
  envoyee:   {label:'Envoyée',   color:'var(--blue)',   bg:'var(--blue)18'   },
  vue:       {label:'Vue',       color:'var(--purple)', bg:'var(--purple)18' },
  partielle: {label:'Partielle', color:'var(--amber)',  bg:'var(--amber)18'  },
  payee:     {label:'Payée',     color:'var(--green)',  bg:'var(--green)18'  },
  en_retard: {label:'En retard', color:'var(--red)',    bg:'var(--red)18'    },
  annulee:   {label:'Annulée',   color:'var(--txt-3)',  bg:'var(--bg-3)'     },
}

const TYPE_LABELS: Record<TypePaiement,string> = {
  virement:'Virement bancaire', cheque:'Chèque', carte_credit:'Carte de crédit',
  interac:'Interac', especes:'Espèces', autre:'Autre',
}

const fmt = (n:number) => n.toLocaleString('fr-CA',{style:'currency',currency:'CAD'})
const fmtDate = (s:string) => new Date(s).toLocaleDateString('fr-CA',{day:'numeric',month:'long',year:'numeric'})

function ModalPaiement({totalRestant,onClose,onSave}:{
  totalRestant:number; onClose:()=>void
  onSave:(p:{montant:number;type:TypePaiement;reference:string;notes:string})=>void
}) {
  const [montant,setMontant] = useState(totalRestant.toFixed(2))
  const [type,setType] = useState<TypePaiement>('interac')
  const [reference,setReference] = useState('')
  const [notes,setNotes] = useState('')

  const inp:React.CSSProperties = {
    background:'var(--bg-2)',border:'0.5px solid var(--line)',borderRadius:'7px',
    padding:'8px 10px',fontSize:'12px',color:'var(--txt-1)',outline:'none',
    width:'100%',fontFamily:'inherit',boxSizing:'border-box',
  }
  const lbl:React.CSSProperties = {fontSize:'10px',color:'var(--txt-3)',fontWeight:600,letterSpacing:'0.05em',marginBottom:'4px',display:'block'}

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'20px'}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:'var(--bg-1)',border:'0.5px solid var(--line)',borderRadius:'12px',width:'100%',maxWidth:'400px',overflow:'hidden'}}>
        <div style={{padding:'16px 20px',borderBottom:'0.5px solid var(--line)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <CreditCard size={15} color="var(--green)" />
            <span style={{fontSize:'13px',fontWeight:600,color:'var(--txt-1)'}}>Enregistrer un paiement</span>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--txt-3)'}}><X size={16}/></button>
        </div>
        <div style={{padding:'20px',display:'flex',flexDirection:'column',gap:'14px'}}>
          <div>
            <label style={lbl}>MONTANT REÇU</label>
            <div style={{position:'relative'}}>
              <span style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',fontSize:'12px',color:'var(--txt-3)'}}>$</span>
              <input type="number" value={montant} onChange={e=>setMontant(e.target.value)} style={{...inp,paddingLeft:'22px'}}/>
            </div>
          </div>
          <div>
            <label style={lbl}>MODE DE PAIEMENT</label>
            <select value={type} onChange={e=>setType(e.target.value as TypePaiement)} style={inp}>
              {(Object.keys(TYPE_LABELS) as TypePaiement[]).map(k=><option key={k} value={k}>{TYPE_LABELS[k]}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>RÉFÉRENCE (optionnel)</label>
            <input type="text" value={reference} onChange={e=>setReference(e.target.value)} placeholder="No. chèque, réf. Interac…" style={inp}/>
          </div>
          <div>
            <label style={lbl}>NOTES (optionnel)</label>
            <input type="text" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Acompte, solde final…" style={inp}/>
          </div>
        </div>
        <div style={{padding:'14px 20px',borderTop:'0.5px solid var(--line)',display:'flex',gap:'8px',justifyContent:'flex-end'}}>
          <button onClick={onClose} style={{background:'none',border:'0.5px solid var(--line)',borderRadius:'8px',padding:'8px 16px',fontSize:'12px',color:'var(--txt-2)',cursor:'pointer'}}>Annuler</button>
          <button onClick={()=>onSave({montant:parseFloat(montant),type,reference,notes})} style={{background:'var(--green)',border:'none',borderRadius:'8px',padding:'8px 18px',fontSize:'12px',fontWeight:700,color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px'}}>
            <CheckCircle2 size={13}/> Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FactureDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [facture, setFacture] = useState<FactureRow | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase
      .from('factures')
      .select('id, numero, titre, statut, montant_ht, tps, tvq, montant_ttc, date_emission, date_echeance, notes, lignes, clients(nom, email), devis(numero)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) { setLoading(false); return }
        const total = Number(data.montant_ttc ?? 0)
        setFacture({
          id: data.id,
          numero: data.numero,
          titre: data.titre ?? '',
          statut: data.statut as StatutFacture,
          client_nom: (data.clients as any)?.nom ?? '—',
          client_email: (data.clients as any)?.email ?? '',
          devis_numero: (data.devis as any)?.numero ?? null,
          date_emission: data.date_emission,
          date_echeance: data.date_echeance ?? new Date().toISOString().split('T')[0],
          sous_total: Number(data.montant_ht ?? 0),
          taux_tps: 5,
          taux_tvq: 9.975,
          montant_tps: Number(data.tps ?? 0),
          montant_tvq: Number(data.tvq ?? 0),
          total_ttc: total,
          montant_paye: data.statut === 'payee' ? total : 0,
          solde_restant: data.statut === 'payee' ? 0 : total,
          notes_client: data.notes ?? null,
          lignes: Array.isArray(data.lignes) ? data.lignes.map((l: any, i: number) => ({
            id: String(i),
            description: l.description ?? '',
            quantite: Number(l.quantite ?? 1),
            unite: l.unite ?? 'u',
            prix_unitaire: Number(l.prix_unitaire ?? 0),
            total_ligne: Number(l.quantite ?? 1) * Number(l.prix_unitaire ?? 0),
          })) : [],
          paiements: [],
        })
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return <div style={{ padding: '24px', color: 'var(--txt-3)', fontSize: '13px' }}>Chargement de la facture…</div>
  }

  if (!facture) {
    return (
      <div style={{ padding: '24px' }}>
        <a href="/factures" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--txt-3)', textDecoration: 'none', marginBottom: '24px' }}>
          <ArrowLeft size={13} /> Factures
        </a>
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '40px', textAlign: 'center' }}>
          <CreditCard size={32} color="var(--bg-4)" strokeWidth={1.2} />
          <p style={{ fontSize: '13px', color: 'var(--txt-3)', marginTop: '12px' }}>Facture introuvable — ID: {id}</p>
        </div>
      </div>
    )
  }

  const cfg = STATUT_CFG[facture.statut]
  const pct = Math.min(100,(facture.montant_paye/Math.max(facture.total_ttc,1))*100)

  async function handleSave(p:{montant:number;type:TypePaiement;reference:string;notes:string}) {
    if (!facture) return
    const paye = facture.montant_paye + p.montant
    const solde = Math.max(0, facture.total_ttc - paye)
    const newStatut: StatutFacture = solde <= 0 ? 'payee' : 'partielle'

    // Mettre à jour dans Supabase
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.from('factures').update({
      statut: newStatut,
      date_paiement: newStatut === 'payee' ? new Date().toISOString().split('T')[0] : null,
    }).eq('id', facture.id)

    setFacture(f=>f?({
      ...f, montant_paye:paye, solde_restant:solde, statut:newStatut,
      paiements:[...f.paiements,{id:`p${Date.now()}`,date_paiement:new Date().toISOString().split('T')[0],montant:p.montant,type_paiement:p.type,reference:p.reference||null,notes:p.notes||null}],
    }):f)
    setShowModal(false)
  }

  const card:React.CSSProperties = {background:'var(--bg-1)',border:'0.5px solid var(--line)',borderRadius:'10px',padding:'16px 18px'}
  const btn2:React.CSSProperties = {display:'flex',alignItems:'center',gap:'6px',background:'none',border:'0.5px solid var(--line)',borderRadius:'8px',padding:'7px 12px',fontSize:'11px',color:'var(--txt-2)',cursor:'pointer',fontFamily:'inherit'}

  return (
    <div style={{padding:'24px',display:'flex',flexDirection:'column',gap:'18px',maxWidth:'1000px'}}>
      {showModal && <ModalPaiement totalRestant={facture.solde_restant} onClose={()=>setShowModal(false)} onSave={handleSave}/>}

      <a href="/factures" style={{display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'12px',color:'var(--txt-3)',textDecoration:'none'}}>
        <ArrowLeft size={13}/> Factures
      </a>

      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',flexWrap:'wrap'}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'4px'}}>
            <h1 style={{fontSize:'20px',fontWeight:700,color:'var(--txt-1)',margin:0}}>{facture.numero}</h1>
            <span style={{padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:600,background:cfg.bg,color:cfg.color}}>{cfg.label}</span>
            {facture.devis_numero&&<span style={{padding:'3px 8px',borderRadius:'20px',fontSize:'10px',background:'var(--bg-3)',color:'var(--txt-3)'}}>← {facture.devis_numero}</span>}
          </div>
          <div style={{fontSize:'13px',color:'var(--txt-2)'}}>{facture.titre}</div>
        </div>
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
          <a href={`/factures/${facture.id}/preview`} style={{...btn2,textDecoration:'none',display:'flex',alignItems:'center',gap:'6px'}}><Eye size={13}/> Aperçu PDF</a>
          <button onClick={()=>{ window.open(`/factures/${facture.id}/preview`,'_blank') }} style={btn2}><Download size={13}/> PDF</button>
          <button style={btn2}><Send size={13}/> Renvoyer</button>
          {facture.statut!=='payee'&&facture.statut!=='annulee'&&(
            <button onClick={()=>setShowModal(true)} style={{display:'flex',alignItems:'center',gap:'6px',background:'var(--green)',border:'none',borderRadius:'8px',padding:'7px 14px',fontSize:'11px',fontWeight:700,color:'#fff',cursor:'pointer'}}>
              <Plus size={13}/> Enregistrer paiement
            </button>
          )}
        </div>
      </div>

      {/* Barre de progression */}
      <div style={card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
          <span style={{fontSize:'12px',color:'var(--txt-2)'}}>{fmt(facture.montant_paye)} payé sur {fmt(facture.total_ttc)}</span>
          <span style={{fontSize:'12px',fontWeight:700,color:facture.solde_restant>0?'var(--red)':'var(--green)'}}>
            {facture.solde_restant>0?`Solde: ${fmt(facture.solde_restant)}`:'✓ Payée intégralement'}
          </span>
        </div>
        <div style={{height:'8px',background:'var(--bg-3)',borderRadius:'4px',overflow:'hidden'}}>
          <div style={{height:'100%',width:`${pct}%`,background:pct>=100?'var(--green)':'var(--gold)',borderRadius:'4px',transition:'width 0.4s ease'}}/>
        </div>
        <div style={{fontSize:'10px',color:'var(--txt-3)',marginTop:'6px'}}>{pct.toFixed(0)}% encaissé</div>
      </div>

      {/* Bannière rappel automatique facture en retard */}
      {(facture.statut === 'en_retard') && (
        <div style={{
          background:'rgba(224,96,96,0.08)', border:'0.5px solid var(--red)',
          borderRadius:'10px', padding:'12px 16px',
          display:'flex', alignItems:'center', gap:'12px',
        }}>
          <Bell size={15} color="var(--red)" style={{flexShrink:0}}/>
          <div style={{flex:1}}>
            <div style={{fontSize:'12px',fontWeight:600,color:'var(--txt-1)',marginBottom:'2px'}}>
              Rappel de paiement automatique actif
            </div>
            <div style={{fontSize:'11px',color:'var(--txt-3)'}}>
              La facture est en retard. Un courriel de rappel est envoyé automatiquement tous les 7 jours à {facture.client_email} jusqu'au paiement complet.
            </div>
          </div>
          <button style={{
            padding:'6px 14px', borderRadius:'8px', fontSize:'11px', fontWeight:600,
            background:'var(--red)', color:'#fff', border:'none', cursor:'pointer', whiteSpace:'nowrap',
          }}>
            Envoyer maintenant
          </button>
        </div>
      )}


      {/* Infos */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px'}}>
        <div style={card}>
          <div style={{fontSize:'10px',color:'var(--txt-3)',fontWeight:600,letterSpacing:'0.05em',marginBottom:'10px'}}>CLIENT</div>
          <div style={{fontSize:'13px',fontWeight:600,color:'var(--txt-1)',marginBottom:'4px'}}>{facture.client_nom}</div>
          <div style={{fontSize:'11px',color:'var(--txt-3)'}}>{facture.client_email}</div>
        </div>
        <div style={card}>
          <div style={{fontSize:'10px',color:'var(--txt-3)',fontWeight:600,letterSpacing:'0.05em',marginBottom:'10px'}}>DATES</div>
          <div style={{fontSize:'11px',color:'var(--txt-2)',marginBottom:'6px'}}><span style={{color:'var(--txt-3)'}}>Émission: </span>{fmtDate(facture.date_emission)}</div>
          <div style={{fontSize:'11px',color:'var(--txt-2)'}}><span style={{color:'var(--txt-3)'}}>Échéance: </span>
            <span style={{color:new Date(facture.date_echeance)<new Date()&&facture.statut!=='payee'?'var(--red)':'inherit'}}>{fmtDate(facture.date_echeance)}</span>
          </div>
        </div>
        <div style={card}>
          <div style={{fontSize:'10px',color:'var(--txt-3)',fontWeight:600,letterSpacing:'0.05em',marginBottom:'10px'}}>RÉSUMÉ</div>
          {[{l:'Total TTC',v:fmt(facture.total_ttc),c:'var(--txt-1)'},{l:'Encaissé',v:fmt(facture.montant_paye),c:'var(--green)'},{l:'Solde dû',v:facture.solde_restant>0?fmt(facture.solde_restant):'✓ 0,00 $',c:facture.solde_restant>0?'var(--red)':'var(--green)'}].map(r=>(
            <div key={r.l} style={{display:'flex',justifyContent:'space-between',fontSize:'11px',marginBottom:'5px'}}>
              <span style={{color:'var(--txt-3)'}}>{r.l}</span><span style={{fontWeight:600,color:r.c}}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lignes */}
      <div style={{...card,padding:0,overflow:'hidden'}}>
        <div style={{padding:'14px 18px',borderBottom:'0.5px solid var(--line)'}}><span style={{fontSize:'13px',fontWeight:600,color:'var(--txt-1)'}}>Lignes de facturation</span></div>
        <div style={{display:'grid',gridTemplateColumns:'2fr 80px 80px 110px 110px',padding:'8px 18px',borderBottom:'0.5px solid var(--line)',background:'var(--bg-2)'}}>
          {['DESCRIPTION','QTÉ','UNITÉ','PRIX UNIT.','TOTAL'].map(h=><div key={h} style={{fontSize:'9px',fontWeight:700,color:'var(--txt-3)',letterSpacing:'0.06em'}}>{h}</div>)}
        </div>
        {facture.lignes.map((l,i)=>(
          <div key={l.id} style={{display:'grid',gridTemplateColumns:'2fr 80px 80px 110px 110px',padding:'11px 18px',borderBottom:i<facture.lignes.length-1?'0.5px solid var(--line)':'none',alignItems:'center'}}>
            <div style={{fontSize:'12px',color:'var(--txt-1)'}}>{l.description}</div>
            <div style={{fontSize:'12px',color:'var(--txt-2)'}}>{l.quantite}</div>
            <div style={{fontSize:'11px',color:'var(--txt-3)'}}>{l.unite}</div>
            <div style={{fontSize:'12px',color:'var(--txt-2)'}}>{fmt(l.prix_unitaire)}</div>
            <div style={{fontSize:'12px',fontWeight:600,color:'var(--txt-1)'}}>{fmt(l.total_ligne)}</div>
          </div>
        ))}
        <div style={{borderTop:'0.5px solid var(--line)',padding:'14px 18px'}}>
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <div style={{minWidth:'240px',display:'flex',flexDirection:'column',gap:'6px'}}>
              {[{l:'Sous-total',v:fmt(facture.sous_total)},{l:`TPS (${facture.taux_tps}%)`,v:fmt(facture.montant_tps)},{l:`TVQ (${facture.taux_tvq}%)`,v:fmt(facture.montant_tvq)}].map(r=>(
                <div key={r.l} style={{display:'flex',justifyContent:'space-between',fontSize:'12px',color:'var(--txt-2)'}}><span>{r.l}</span><span>{r.v}</span></div>
              ))}
              <div style={{borderTop:'0.5px solid var(--line)',paddingTop:'8px',display:'flex',justifyContent:'space-between',fontSize:'15px',fontWeight:700}}>
                <span style={{color:'var(--txt-1)'}}>Total TTC</span><span style={{color:'var(--gold)'}}>{fmt(facture.total_ttc)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historique paiements */}
      <div style={{...card,padding:0,overflow:'hidden'}}>
        <div style={{padding:'14px 18px',borderBottom:'0.5px solid var(--line)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:'13px',fontWeight:600,color:'var(--txt-1)'}}>Historique des paiements</span>
          {facture.statut!=='payee'&&<button onClick={()=>setShowModal(true)} style={{display:'flex',alignItems:'center',gap:'5px',background:'none',border:'0.5px solid var(--green)',borderRadius:'7px',padding:'5px 10px',fontSize:'11px',color:'var(--green)',cursor:'pointer'}}><Plus size={12}/> Ajouter</button>}
        </div>
        {facture.paiements.length===0?(
          <div style={{padding:'32px',textAlign:'center',fontSize:'12px',color:'var(--txt-3)'}}>Aucun paiement enregistré</div>
        ):facture.paiements.map((p,i)=>(
          <div key={p.id} style={{display:'grid',gridTemplateColumns:'110px 1fr 130px 110px',padding:'12px 18px',alignItems:'center',borderBottom:i<facture.paiements.length-1?'0.5px solid var(--line)':'none'}}>
            <div style={{fontSize:'11px',color:'var(--txt-3)'}}>{new Date(p.date_paiement).toLocaleDateString('fr-CA')}</div>
            <div>
              <div style={{fontSize:'12px',color:'var(--txt-1)'}}>{TYPE_LABELS[p.type_paiement]}</div>
              {(p.reference||p.notes)&&<div style={{fontSize:'10px',color:'var(--txt-3)',marginTop:'2px'}}>{[p.reference,p.notes].filter(Boolean).join(' — ')}</div>}
            </div>
            <span style={{padding:'3px 8px',borderRadius:'20px',fontSize:'10px',fontWeight:600,background:'var(--green)18',color:'var(--green)'}}>Complété</span>
            <div style={{fontSize:'13px',fontWeight:700,color:'var(--green)',textAlign:'right'}}>+{fmt(p.montant)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
