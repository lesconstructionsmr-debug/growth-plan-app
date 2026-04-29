import { useState, useEffect, useRef } from "react";

const GOLD="#C9A84C",GL="#E8C96A",DK="#0D0D0D",DK2="#141414",DK3="#1C1C1C",DK4="#242424",MU="#555",TX="#E5E5E5",TX2="#999";
const gg=(d=135)=>`linear-gradient(${d}deg,#C9A84C,#E8C96A,#C9A84C)`;

const PRIOS=["Haute","Moyenne","Basse"];
const STATS=["À faire","En cours","Terminé"];
const CATS=["Prospection","Automatisation","Contenu","Client","Admin","Stratégie","Projet"];
const PSUBS=["Audit","Plan en construction","Client récurrent","Contrat ponctuel"];
const PCOLS={"Audit":"#2980B9","Plan en construction":"#8E44AD","Client récurrent":"#C9A84C","Contrat ponctuel":"#27AE60"};
const SPROJS=["Actif","En pause","Terminé"];
const CETIQ=["Lead","Actif","VIP","En pause","Inactif","Perdu"];
const ECOLS={Lead:"#2980B9",Actif:"#27AE60",VIP:"#C9A84C","En pause":"#E67E22",Inactif:"#555",Perdu:"#C0392B"};
const PRCOLS={Prospection:"#2980B9",Audit:"#8E44AD",Automatisation:"#16A085",Contenu:"#E67E22",Client:"#C9A84C",Stratégie:"#C0392B",Admin:"#555"};
const PRCATS=["Prospection","Automatisation","Contenu","Client","Stratégie","Audit","Admin"];
const SFACS=["Brouillon","Envoyée","Payée","En retard","Annulée"];
const SFCOLS={Brouillon:"#555",Envoyée:"#2980B9",Payée:"#27AE60","En retard":"#C0392B",Annulée:"#444"};
const SSOUS=["Brouillon","En attente d'approbation","Acceptée","Refusée","Expirée"];
const SSCOLS={"Brouillon":"#555","En attente d'approbation":"#E67E22","Acceptée":"#27AE60","Refusée":"#C0392B","Expirée":"#777"};
const TAXES=[{label:"TPS (5%)",taux:0.05},{label:"TVQ (9.975%)",taux:0.09975}];
const DAYS=["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
const MONTHS=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const IT=[
  {id:1,title:"Préparer deck audit Growth Plan",priority:"Haute",status:"En cours",category:"Projet",projectSub:"Audit",due:"2026-04-21"},
  {id:2,title:"Relancer 3 prospects dormants",priority:"Haute",status:"À faire",category:"Prospection",projectSub:"",due:"2026-04-22"},
  {id:3,title:"Mettre à jour le script d'appel",priority:"Moyenne",status:"À faire",category:"Contenu",projectSub:"",due:"2026-04-25"},
  {id:4,title:"Configurer workflow Make.com",priority:"Haute",status:"En cours",category:"Projet",projectSub:"Plan en construction",due:"2026-04-23"},
  {id:5,title:"Publier post LinkedIn stratégie IA",priority:"Moyenne",status:"Terminé",category:"Contenu",projectSub:"",due:"2026-04-18"},
];
const IP=[
  {id:1,name:"Audit Growth – Juliette Moreau",sub:"Audit",status:"Actif",client:"Juliette Moreau",start:"2026-04-10",end:"2026-04-30",notes:"Score évaluation faible."},
  {id:2,name:"Automatisation onboarding client",sub:"Plan en construction",status:"Actif",client:"Interne",start:"2026-04-01",end:"2026-05-15",notes:"Make.com + Google Forms + Gmail."},
  {id:3,name:"Suivi mensuel – Agence XYZ",sub:"Client récurrent",status:"Actif",client:"Agence XYZ",start:"2026-01-01",end:"",notes:"Rapport mensuel + appel stratégique."},
];
const IC=[
  {id:1,contact:"Juliette Moreau",entreprise:"JM Conseil",telephone:"514-555-0101",courriel:"juliette@jmconseil.ca",etiquette:"Lead",adhesion:"2026-04-10",note:"Évaluation faible — plan d'action en cours."},
  {id:2,contact:"Marc-Antoine Blais",entreprise:"Agence XYZ",telephone:"450-555-0234",courriel:"mab@agencexyz.ca",etiquette:"VIP",adhesion:"2026-01-01",note:"Client récurrent."},
  {id:3,contact:"Sophie Lavoie",entreprise:"Interne",telephone:"",courriel:"sophie@growthplan.ca",etiquette:"Actif",adhesion:"2026-03-15",note:"Onboarding en cours."},
];
const IPR=[
  {id:1,titre:"Script d'appel – premier contact",categorie:"Prospection",tags:["appel","cold"],favori:true,utilisation:12,contenu:"Tu es un consultant en automatisation IA. Rédige un script d'appel pour un prospect dans le secteur [SECTEUR]. Objectif: qualifier le besoin et fixer un appel découverte."},
  {id:2,titre:"Rapport d'audit Growth Plan",categorie:"Audit",tags:["audit","rapport"],favori:true,utilisation:8,contenu:"Génère un rapport d'audit complet pour [NOM_CLIENT]. Inclure: sommaire exécutif, diagnostic des processus, opportunités d'automatisation, recommandations priorisées."},
  {id:3,titre:"Séquence email follow-up",categorie:"Client",tags:["email","relance"],favori:false,utilisation:6,contenu:"Rédige une séquence de 3 emails de follow-up après une réunion avec [NOM_CLIENT]. J+1: récap. J+4: valeur ajoutée. J+10: relance douce."},
  {id:4,titre:"Post LinkedIn stratégie IA",categorie:"Contenu",tags:["linkedin","ia"],favori:true,utilisation:15,contenu:"Rédige un post LinkedIn percutant sur [SUJET_IA]. Accroche forte, problème relatable, solution, CTA. Max 300 mots."},
];
const IF=[
  {id:"GP-001",client:"Juliette Moreau",entreprise:"JM Conseil",date:"2026-04-01",echeance:"2026-04-15",statut:"Payée",note:"Audit Phase 1",lignes:[{desc:"Audit stratégique IA",qte:1,prix:1500},{desc:"Rapport PDF",qte:1,prix:300}]},
  {id:"GP-002",client:"Marc-Antoine Blais",entreprise:"Agence XYZ",date:"2026-04-10",echeance:"2026-04-25",statut:"Envoyée",note:"Retainer avril",lignes:[{desc:"Consultation mensuelle",qte:4,prix:450},{desc:"Automatisation Make.com",qte:2,prix:375}]},
  {id:"GP-003",client:"Sophie Lavoie",entreprise:"Interne",date:"2026-03-20",echeance:"2026-04-05",statut:"En retard",note:"Onboarding",lignes:[{desc:"Setup workflow n8n",qte:1,prix:900}]},
];
const IS=[
  {id:"SOU-0042",contact:"Maxime Rochon",entreprise:"Growth Plan",date:"2026-04-20",expiration:"2026-05-05",statut:"En attente d'approbation",envoyee:false,lue:false,imprimee:true,note:"Retainer 6 mois",lignes:[{desc:"Stratégie IA",qte:6,prix:2200},{desc:"Rapport mensuel",qte:6,prix:400}]},
  {id:"SOU-0041",contact:"Marissa Vincelli",entreprise:"MV Solutions",date:"2026-04-18",expiration:"2026-05-02",statut:"En attente d'approbation",envoyee:true,lue:false,imprimee:false,note:"Audit + plan",lignes:[{desc:"Audit numérique",qte:1,prix:1800},{desc:"Plan 90 jours",qte:1,prix:600}]},
  {id:"SOU-0040",contact:"Micaël Gratton",entreprise:"Gratton & Associés",date:"2026-04-15",expiration:"2026-04-30",statut:"Acceptée",envoyee:true,lue:true,imprimee:false,note:"CRM + Gmail",lignes:[{desc:"Setup Make.com",qte:1,prix:1200},{desc:"Formation",qte:2,prix:450}]},
  {id:"SOU-0039",contact:"David Irons",entreprise:"Irons Media",date:"2026-03-28",expiration:"2026-04-15",statut:"Acceptée",envoyee:true,lue:true,imprimee:false,note:"Retainer contenu",lignes:[{desc:"LinkedIn posts",qte:8,prix:175},{desc:"Stratégie édito",qte:1,prix:500}]},
];

const cL=l=>l.qte*l.prix;
const cST=ls=>ls.reduce((s,l)=>s+cL(l),0);
const cTX=st=>TAXES.map(t=>({...t,m:st*t.taux}));
const cTot=ls=>{const st=cST(ls);return st+cTX(st).reduce((s,t)=>s+t.m,0);};
const fmt=n=>n.toLocaleString("fr-CA",{style:"currency",currency:"CAD"});

function Bdg({label}){
  const M={Haute:"#C0392B",Moyenne:"#E67E22",Basse:"#27AE60","À faire":"#444","En cours":"#C9A84C",Terminé:"#27AE60",Prospection:"#2980B9",Automatisation:"#8E44AD",Contenu:"#16A085",Client:"#C9A84C",Admin:"#555",Stratégie:"#C0392B",Projet:"#1A6B4A",Audit:"#2980B9","Plan en construction":"#8E44AD","Client récurrent":"#C9A84C","Contrat ponctuel":"#27AE60"};
  return <span style={{background:M[label]||"#333",color:"#fff",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,whiteSpace:"nowrap"}}>{label}</span>;
}
function SC({label,value,sub,color,accent}){
  const c=color||(accent?GL:TX);
  return <div style={{background:DK3,border:`1px solid ${accent?GOLD:color?color+"44":"#2a2a2a"}`,borderRadius:12,padding:"16px 20px",flex:1,minWidth:120}}><div style={{fontSize:22,fontWeight:800,color:c}}>{value}</div><div style={{fontSize:12,color:TX2,marginTop:4}}>{label}</div>{sub&&<div style={{fontSize:11,color:MU,marginTop:2}}>{sub}</div>}</div>;
}

function LignesBlock({data,setData}){
  const inp={background:DK4,border:"1px solid #333",borderRadius:8,color:TX,padding:"8px 12px",fontSize:13,outline:"none",width:"100%",boxSizing:"border-box"};
  const upd=(i,k,v)=>setData(p=>({...p,lignes:p.lignes.map((l,j)=>j===i?{...l,[k]:k==="qte"||k==="prix"?parseFloat(v)||0:v}:l)}));
  const add=()=>setData(p=>({...p,lignes:[...p.lignes,{desc:"",qte:1,prix:0}]}));
  const rem=i=>setData(p=>({...p,lignes:p.lignes.filter((_,j)=>j!==i)}));
  const st=cST(data.lignes),tx=cTX(st),tot=cTot(data.lignes);
  return(
    <div style={{background:DK3,border:`1px solid ${GOLD}33`,borderRadius:12,padding:20,marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:700,color:GL}}>Lignes de facturation</div>
        <button onClick={add} style={{background:gg(),color:"#000",fontWeight:800,border:"none",borderRadius:8,padding:"5px 14px",cursor:"pointer",fontSize:12}}>+ Ligne</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 70px 100px 90px 32px",gap:8,marginBottom:8}}>
        {["Description","Qté","Prix","Total",""].map(h=><div key={h} style={{fontSize:11,color:TX2,fontWeight:700}}>{h}</div>)}
      </div>
      {data.lignes.map((l,i)=>(
        <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 70px 100px 90px 32px",gap:8,marginBottom:8,alignItems:"center"}}>
          <input value={l.desc} onChange={e=>upd(i,"desc",e.target.value)} placeholder="Service..." style={inp}/>
          <input type="number" value={l.qte} onChange={e=>upd(i,"qte",e.target.value)} style={{...inp,textAlign:"center"}}/>
          <input type="number" value={l.prix} onChange={e=>upd(i,"prix",e.target.value)} step="0.01" style={{...inp,textAlign:"right"}}/>
          <div style={{fontSize:13,fontWeight:700,color:GL,textAlign:"right"}}>{fmt(cL(l))}</div>
          <button onClick={()=>rem(i)} style={{background:"transparent",border:"1px solid #C0392B44",color:"#C0392B",borderRadius:6,width:28,height:28,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
      ))}
      <div style={{borderTop:"1px solid #2a2a2a",marginTop:12,paddingTop:12,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
        <div style={{display:"flex",gap:24,fontSize:13,color:TX2}}><span>Sous-total</span><span style={{minWidth:100,textAlign:"right"}}>{fmt(st)}</span></div>
        {tx.map(t=><div key={t.label} style={{display:"flex",gap:24,fontSize:13,color:TX2}}><span>{t.label}</span><span style={{minWidth:100,textAlign:"right"}}>{fmt(t.m)}</span></div>)}
        <div style={{display:"flex",gap:24,fontSize:16,fontWeight:800,color:GL,borderTop:"1px solid #333",paddingTop:8,marginTop:4}}><span>Total TTC</span><span style={{minWidth:100,textAlign:"right"}}>{fmt(tot)}</span></div>
      </div>
    </div>
  );
}

function CalPmt({tot}){
  const p1=Math.round(tot*0.30*100)/100,p2=Math.round(tot*0.40*100)/100,p3=Math.round((tot-p1-p2)*100)/100;
  const pmts=[{label:"Sur approbation",m:p1},{label:"À planifier",m:p2},{label:"À planifier",m:p3}];
  return(
    <div style={{background:DK3,border:`1px solid ${GOLD}33`,borderRadius:12,padding:"18px 20px",marginBottom:16}}>
      <div style={{fontSize:13,fontWeight:700,color:GL,marginBottom:14}}>Calendrier de paiements</div>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:TX2}}><span>Nombre de factures</span><select defaultValue={3} style={{background:DK4,border:"1px solid #333",borderRadius:6,color:TX,padding:"4px 10px",fontSize:12,outline:"none",width:"auto"}}>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></div>
        <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:TX2}}><span>Rabais</span><input defaultValue="0.00" style={{background:DK4,border:"none",borderBottom:"1px dashed #555",color:TX,fontSize:13,width:55,outline:"none",textAlign:"center",padding:"2px 4px"}}/><span>%</span></div>
      </div>
      <div style={{background:DK4,borderRadius:10,overflow:"hidden",marginBottom:10}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 130px",padding:"10px 16px",borderBottom:`1px solid ${GOLD}22`}}>
          <div style={{fontSize:11,color:TX2,fontWeight:700}}>Date / Description</div>
          <div style={{fontSize:11,color:TX2,fontWeight:700,textAlign:"right"}}>Montant</div>
        </div>
        {pmts.map((p,i)=>(
          <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 130px",padding:"12px 16px",borderBottom:"1px solid #1e1e1e",alignItems:"center"}}>
            <div style={{fontSize:13}}>{p.label}</div>
            <div style={{textAlign:"right",fontSize:13,fontWeight:700,color:GL}}>{fmt(p.m)}</div>
          </div>
        ))}
      </div>
      <button style={{background:"transparent",border:"none",color:GL,cursor:"pointer",fontSize:13,padding:0}}>＋ Ajouter un paiement</button>
    </div>
  );
}

export default function App(){
  const inp={background:DK4,border:"1px solid #333",borderRadius:8,color:TX,padding:"8px 12px",fontSize:13,outline:"none",width:"100%",boxSizing:"border-box"};
  const [tab,setTab]=useState("dashboard");
  const [loaded,setLoaded]=useState(false);

  // ── STATE ──────────────────────────────────────────────────────────────────
  const [tasks,setTasks]=useState(IT);
  const [showAddTask,setShowAddTask]=useState(false);
  const [newTask,setNewTask]=useState({title:"",priority:"Haute",status:"À faire",category:"Prospection",projectSub:"",due:""});
  const [fStatus,setFStatus]=useState("Tous");
  const [fCat,setFCat]=useState("Tous");
  const nTId=useRef(IT.length+1);

  const [projects,setProjects]=useState(IP);
  const [showAddProj,setShowAddProj]=useState(false);
  const [selProj,setSelProj]=useState(null);
  const [newProj,setNewProj]=useState({name:"",sub:"Audit",status:"Actif",client:"",start:"",end:"",notes:""});
  const [projFilter,setProjFilter]=useState("Tous");
  const nPId=useRef(IP.length+1);

  const [clients,setClients]=useState(IC);
  const [showAddCli,setShowAddCli]=useState(false);
  const [editCli,setEditCli]=useState(null);
  const [newCli,setNewCli]=useState({contact:"",entreprise:"",telephone:"",courriel:"",etiquette:"Lead",adhesion:"",note:""});
  const [cliFilter,setCliFilter]=useState("Tous");
  const [cliSearch,setCliSearch]=useState("");
  const nCId=useRef(IC.length+1);

  const [prompts,setPrompts]=useState(IPR);
  const [showAddPro,setShowAddPro]=useState(false);
  const [editPro,setEditPro]=useState(null);
  const [newPro,setNewPro]=useState({titre:"",categorie:"Prospection",tags:"",contenu:"",favori:false});
  const [proFilter,setProFilter]=useState("Tous");
  const [proSearch,setProSearch]=useState("");
  const [copiedId,setCopiedId]=useState(null);
  const [expandedId,setExpandedId]=useState(null);
  const nProId=useRef(IPR.length+1);

  const EF={id:"",client:"",entreprise:"",date:"",echeance:"",statut:"Brouillon",note:"",lignes:[{desc:"",qte:1,prix:0}]};
  const [factures,setFactures]=useState(IF);
  const [facVue,setFacVue]=useState("liste");
  const [selFac,setSelFac]=useState(null);
  const [formFac,setFormFac]=useState(EF);
  const [isEditFac,setIsEditFac]=useState(false);
  const [facFilter,setFacFilter]=useState("Tous");
  const [facSearch,setFacSearch]=useState("");
  const nFId=useRef(IF.length+1);

  const ES={id:"",contact:"",entreprise:"",date:"",expiration:"",statut:"Brouillon",envoyee:false,lue:false,imprimee:false,note:"",lignes:[{desc:"",qte:1,prix:0}]};
  const [soumissions,setSoumissions]=useState(IS);
  const [souVue,setSouVue]=useState("liste");
  const [selSou,setSelSou]=useState(null);
  const [formSou,setFormSou]=useState(ES);
  const [isEditSou,setIsEditSou]=useState(false);
  const [souFilter,setSouFilter]=useState("Tous");
  const [souSearch,setSouSearch]=useState("");
  const nSId=useRef(IS.length+1);

  const [aiMsgs,setAiMsgs]=useState([{role:"assistant",content:"Bonjour Max 👋 Je suis ton assistant Growth Plan. Planification, priorités, messages clients — demande-moi n'importe quoi."}]);
  const [aiInput,setAiInput]=useState("");
  const [aiLoading,setAiLoading]=useState(false);
  const chatRef=useRef(null);
  const [calDate,setCalDate]=useState(new Date(2026,3,1));

  // ── STORAGE LOAD ──────────────────────────────────────────────────────────
  useEffect(()=>{
    (async()=>{
      try{
        const keys=["gp_tasks","gp_projects","gp_clients","gp_prompts","gp_factures","gp_soumissions"];
        const [t,p,c,pr,f,s]=await Promise.all(keys.map(k=>window.storage.get(k).catch(()=>null)));
        if(t?.value) setTasks(JSON.parse(t.value));
        if(p?.value) setProjects(JSON.parse(p.value));
        if(c?.value) setClients(JSON.parse(c.value));
        if(pr?.value) setPrompts(JSON.parse(pr.value));
        if(f?.value) setFactures(JSON.parse(f.value));
        if(s?.value) setSoumissions(JSON.parse(s.value));
      }catch(e){console.log("load err",e);}
      setLoaded(true);
    })();
  },[]);

  // ── STORAGE SAVE ──────────────────────────────────────────────────────────
  useEffect(()=>{if(loaded)window.storage.set("gp_tasks",JSON.stringify(tasks)).catch(()=>{});},[tasks,loaded]);
  useEffect(()=>{if(loaded)window.storage.set("gp_projects",JSON.stringify(projects)).catch(()=>{});},[projects,loaded]);
  useEffect(()=>{if(loaded)window.storage.set("gp_clients",JSON.stringify(clients)).catch(()=>{});},[clients,loaded]);
  useEffect(()=>{if(loaded)window.storage.set("gp_prompts",JSON.stringify(prompts)).catch(()=>{});},[prompts,loaded]);
  useEffect(()=>{if(loaded)window.storage.set("gp_factures",JSON.stringify(factures)).catch(()=>{});},[factures,loaded]);
  useEffect(()=>{if(loaded)window.storage.set("gp_soumissions",JSON.stringify(soumissions)).catch(()=>{});},[soumissions,loaded]);

  useEffect(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},[aiMsgs,aiLoading]);

  // ── HANDLERS ──────────────────────────────────────────────────────────────
  const addTask=()=>{if(!newTask.title.trim())return;setTasks(p=>[...p,{...newTask,id:nTId.current++}]);setNewTask({title:"",priority:"Haute",status:"À faire",category:"Prospection",projectSub:"",due:""});setShowAddTask(false);};
  const updTS=(id,s)=>setTasks(p=>p.map(t=>t.id===id?{...t,status:s}:t));
  const delT=id=>setTasks(p=>p.filter(t=>t.id!==id));

  const addProj=()=>{if(!newProj.name.trim())return;setProjects(p=>[...p,{...newProj,id:nPId.current++}]);setNewProj({name:"",sub:"Audit",status:"Actif",client:"",start:"",end:"",notes:""});setShowAddProj(false);};
  const updPS=(id,s)=>setProjects(p=>p.map(x=>x.id===id?{...x,status:s}:x));
  const delP=id=>{setProjects(p=>p.filter(x=>x.id!==id));setSelProj(null);};

  const addCli=()=>{if(!newCli.contact.trim())return;if(editCli){setClients(p=>p.map(c=>c.id===editCli.id?{...newCli,id:editCli.id}:c));setEditCli(null);}else setClients(p=>[...p,{...newCli,id:nCId.current++}]);setNewCli({contact:"",entreprise:"",telephone:"",courriel:"",etiquette:"Lead",adhesion:"",note:""});setShowAddCli(false);};
  const startEC=c=>{setNewCli({...c});setEditCli(c);setShowAddCli(true);};
  const delC=id=>setClients(p=>p.filter(c=>c.id!==id));

  const addPro=()=>{if(!newPro.titre.trim()||!newPro.contenu.trim())return;const tags=newPro.tags.split(",").map(t=>t.trim()).filter(Boolean);if(editPro){setPrompts(p=>p.map(x=>x.id===editPro.id?{...x,...newPro,tags}:x));setEditPro(null);}else setPrompts(p=>[...p,{...newPro,tags,id:nProId.current++,utilisation:0}]);setNewPro({titre:"",categorie:"Prospection",tags:"",contenu:"",favori:false});setShowAddPro(false);};
  const cpPro=p=>{navigator.clipboard.writeText(p.contenu).catch(()=>{});setPrompts(prev=>prev.map(x=>x.id===p.id?{...x,utilisation:x.utilisation+1}:x));setCopiedId(p.id);setTimeout(()=>setCopiedId(null),2000);};
  const togFav=id=>setPrompts(p=>p.map(x=>x.id===id?{...x,favori:!x.favori}:x));
  const delPro=id=>setPrompts(p=>p.filter(x=>x.id!==id));
  const startEP=p=>{setNewPro({...p,tags:p.tags.join(", ")});setEditPro(p);setShowAddPro(true);};

  const oNF=()=>{setFormFac({...EF,id:`GP-00${nFId.current}`});setIsEditFac(false);setFacVue("form");};
  const oEF=f=>{setFormFac(JSON.parse(JSON.stringify(f)));setIsEditFac(true);setFacVue("form");};
  const oDF=f=>{setSelFac(f);setFacVue("detail");};
  const svF=()=>{if(!formFac.client.trim())return;if(isEditFac)setFactures(p=>p.map(f=>f.id===formFac.id?{...formFac}:f));else{setFactures(p=>[...p,{...formFac}]);nFId.current++;}setFacVue("liste");};
  const dlF=id=>{setFactures(p=>p.filter(f=>f.id!==id));setFacVue("liste");};
  const udFS=(id,s)=>{setFactures(p=>p.map(f=>f.id===id?{...f,statut:s}:f));setSelFac(prev=>prev?{...prev,statut:s}:prev);};

  const oNS=()=>{setFormSou({...ES,id:`SOU-00${43+nSId.current}`});setIsEditSou(false);setSouVue("form");};
  const oES=s=>{setFormSou(JSON.parse(JSON.stringify(s)));setIsEditSou(true);setSouVue("form");};
  const oDS=s=>{setSelSou(s);setSouVue("detail");};
  const svS=()=>{if(!formSou.contact.trim())return;if(isEditSou)setSoumissions(p=>p.map(s=>s.id===formSou.id?{...formSou}:s));else{setSoumissions(p=>[...p,{...formSou}]);nSId.current++;}setSouVue("liste");};
  const dlS=id=>{setSoumissions(p=>p.filter(s=>s.id!==id));setSouVue("liste");};
  const udSS=(id,s)=>{setSoumissions(p=>p.map(x=>x.id===id?{...x,statut:s}:x));setSelSou(prev=>prev?{...prev,statut:s}:prev);};
  const togSF=(id,f)=>setSoumissions(p=>p.map(x=>x.id===id?{...x,[f]:!x[f]}:x));

  const sendAI=async()=>{
    if(!aiInput.trim()||aiLoading)return;
    const ts=tasks.map(t=>`- [${t.status}] ${t.title} (${t.priority})`).join("\n");
    const msg=aiInput.trim();
    setAiMsgs(p=>[...p,{role:"user",content:msg}]);setAiInput("");setAiLoading(true);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:`Tu es l'assistant IA de Max Rochon chez Growth Plan. Direct, concis, québécois informel.\nTâches:\n${ts}`,messages:[...aiMsgs,{role:"user",content:msg}]})});
      const data=await res.json();
      setAiMsgs(p=>[...p,{role:"assistant",content:data.content?.find(b=>b.type==="text")?.text||"Erreur."}]);
    }catch{setAiMsgs(p=>[...p,{role:"assistant",content:"Erreur de connexion."}]);}
    setAiLoading(false);
  };

  const yr=calDate.getFullYear(),mo=calDate.getMonth();
  const fd=new Date(yr,mo,1).getDay(),dm=new Date(yr,mo+1,0).getDate();
  const tbd={};tasks.forEach(t=>{if(t.due){if(!tbd[t.due])tbd[t.due]=[];tbd[t.due].push(t);}});

  const done=tasks.filter(t=>t.status==="Terminé").length;
  const inP=tasks.filter(t=>t.status==="En cours").length;
  const td=tasks.filter(t=>t.status==="À faire").length;
  const hp=tasks.filter(t=>t.priority==="Haute"&&t.status!=="Terminé").length;
  const filt=tasks.filter(t=>(fStatus==="Tous"||t.status===fStatus)&&(fCat==="Tous"||t.category===fCat));
  const tPaye=factures.filter(f=>f.statut==="Payée").reduce((s,f)=>s+cTot(f.lignes),0);
  const tAtt=factures.filter(f=>f.statut==="Envoyée").reduce((s,f)=>s+cTot(f.lignes),0);
  const tRet=factures.filter(f=>f.statut==="En retard").reduce((s,f)=>s+cTot(f.lignes),0);
  const tSAll=soumissions.reduce((s,x)=>s+cTot(x.lignes),0);
  const tSAtt=soumissions.filter(s=>s.statut==="En attente d'approbation").reduce((s,x)=>s+cTot(x.lignes),0);
  const tSAcc=soumissions.filter(s=>s.statut==="Acceptée").reduce((s,x)=>s+cTot(x.lignes),0);
  const filtF=factures.filter(f=>(facFilter==="Tous"||f.statut===facFilter)&&(facSearch===""||f.client.toLowerCase().includes(facSearch.toLowerCase())||f.id.toLowerCase().includes(facSearch.toLowerCase())));
  const filtS=soumissions.filter(s=>(souFilter==="Tous"||s.statut===souFilter)&&(souSearch===""||s.contact.toLowerCase().includes(souSearch.toLowerCase())||s.id.toLowerCase().includes(souSearch.toLowerCase())));
  const filtC=clients.filter(c=>(cliFilter==="Tous"||c.etiquette===cliFilter)&&(cliSearch===""||c.contact.toLowerCase().includes(cliSearch.toLowerCase())||c.entreprise.toLowerCase().includes(cliSearch.toLowerCase())));
  const filtPr=prompts.filter(p=>(proFilter==="Tous"||(proFilter==="⭐ Favoris"?p.favori:p.categorie===proFilter))&&(proSearch===""||p.titre.toLowerCase().includes(proSearch.toLowerCase()))).sort((a,b)=>b.favori-a.favori);

  const TABS=[
    {id:"dashboard",label:"Dashboard"},{id:"tasks",label:"Tâches"},{id:"projects",label:"Projets"},
    {id:"clients",label:"Clients"},{id:"soumissions",label:"📄 Soumissions"},{id:"factures",label:"💰 Factures"},
    {id:"prompts",label:"📋 Prompts"},{id:"calendar",label:"Agenda"},{id:"ai",label:"✦ Assistant IA"},
  ];

  if(!loaded) return <div style={{background:DK,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:GOLD,fontSize:16,fontFamily:"'Segoe UI',sans-serif"}}>⏳ Chargement des données...</div>;

  return(
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:DK,minHeight:"100vh",color:TX}}>
      {/* HEADER */}
      <div style={{position:"relative",background:DK2,borderBottom:"1px solid #2a2a2a",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",overflow:"hidden"}}>
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.18}} viewBox="0 0 900 60" preserveAspectRatio="none">
          <line x1="0" y1="50" x2="900" y2="50" stroke="#C9A84C" strokeWidth="0.4"/>
          <line x1="0" y1="35" x2="900" y2="35" stroke="#C9A84C" strokeWidth="0.3" strokeDasharray="4 6"/>
          {[30,60,100,140,180,220,260,300,340,380,420,460,500,540,580,620,660,700,740,780,820,860,900].map((x,i)=>{const hs=[8,12,7,18,10,22,14,28,16,32,20,38,24,42,30,46,34,50,38,44,42,48,52];return <rect key={x} x={x-8} y={50-(hs[i]||10)} width="10" height={hs[i]||10} fill="#C9A84C" rx="1"/>;})}
          <polyline points="0,50 40,46 80,44 130,40 180,38 230,32 280,30 330,26 380,22 430,20 480,16 530,18 580,13 630,10 680,8 730,11 780,7 830,5 880,3 900,2" fill="none" stroke="#E8C96A" strokeWidth="1.2" strokeLinejoin="round"/>
          <circle cx="880" cy="3" r="2.5" fill="#E8C96A"/>
        </svg>
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:60,background:`linear-gradient(to right,${DK2},transparent)`,zIndex:1}}/>
        <div style={{position:"absolute",right:0,top:0,bottom:0,width:60,background:`linear-gradient(to left,${DK2},transparent)`,zIndex:1}}/>
        <div style={{display:"flex",alignItems:"center",gap:12,position:"relative",zIndex:2}}>
          <div style={{width:32,height:32,background:gg(),borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>▲</div>
          <div>
            <div style={{fontSize:15,fontWeight:800,background:gg(),WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>GROWTH PLAN</div>
            <div style={{fontSize:10,color:TX2,marginTop:-2}}>Command Center</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,position:"relative",zIndex:2}}>
          <div style={{fontSize:10,color:TX2,background:DK3,border:"1px solid #333",borderRadius:20,padding:"3px 10px"}}>💾 Sauvegarde auto</div>
          <div style={{fontSize:12,color:TX2}}>Bonjour, Max 👋</div>
        </div>
      </div>

      {/* TABS */}
      <div style={{display:"flex",gap:2,padding:"12px 24px 0",borderBottom:"1px solid #1e1e1e",overflowX:"auto"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>{setTab(t.id);setSelProj(null);setFacVue("liste");setSouVue("liste");}} style={{background:tab===t.id?DK3:"transparent",border:tab===t.id?`1px solid ${GOLD}`:"1px solid transparent",borderBottom:"none",borderRadius:"8px 8px 0 0",color:tab===t.id?GL:TX2,padding:"7px 14px",fontSize:12,fontWeight:tab===t.id?700:400,cursor:"pointer",whiteSpace:"nowrap"}}>{t.label}</button>
        ))}
      </div>

      <div style={{padding:"24px",maxWidth:1000,margin:"0 auto"}}>

        {/* ══ DASHBOARD ══ */}
        {tab==="dashboard"&&(
          <div>
            <div style={{fontSize:18,fontWeight:800,marginBottom:20}}>Vue d'ensemble</div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:14}}>
              <SC label="Tâches actives" value={td+inP} sub={`${td} à faire · ${inP} en cours`} accent/>
              <SC label="Terminées" value={done} sub="ce mois-ci"/>
              <SC label="Priorité haute" value={hp} sub="en attente"/>
              <SC label="Projets actifs" value={projects.filter(p=>p.status==="Actif").length}/>
            </div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:14}}>
              <SC label="Soumissions" value={soumissions.length} sub={fmt(tSAll)} color={GOLD}/>
              <SC label="En attente d'appro." value={fmt(tSAtt)} color="#E67E22" sub={`${soumissions.filter(s=>s.statut==="En attente d'approbation").length} dossiers`}/>
              <SC label="Acceptées" value={fmt(tSAcc)} color="#27AE60" sub={`${soumissions.filter(s=>s.statut==="Acceptée").length} dossiers`}/>
            </div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}>
              <SC label="Revenus encaissés" value={fmt(tPaye)} color="#27AE60"/>
              <SC label="Factures en attente" value={fmt(tAtt)} color={GOLD}/>
              <SC label="En retard" value={fmt(tRet)} color="#C0392B"/>
            </div>
            <div style={{background:DK3,border:"1px solid #222",borderRadius:12,padding:20,marginBottom:20}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:13,fontWeight:700}}>Progression globale</span><span style={{fontSize:13,color:GL,fontWeight:700}}>{tasks.length?Math.round((done/tasks.length)*100):0}%</span></div>
              <div style={{background:DK4,borderRadius:8,height:8,overflow:"hidden"}}><div style={{width:`${tasks.length?(done/tasks.length)*100:0}%`,height:"100%",background:gg(90),borderRadius:8,transition:"width .5s"}}/></div>
            </div>
            <div style={{background:DK3,border:"1px solid #2a2a2a",borderRadius:12,padding:20}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:14,color:GL}}>⚡ Priorités hautes actives</div>
              {tasks.filter(t=>t.priority==="Haute"&&t.status!=="Terminé").length===0?<div style={{color:TX2,fontSize:13}}>Aucune priorité haute 🎉</div>:tasks.filter(t=>t.priority==="Haute"&&t.status!=="Terminé").map(t=>(
                <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #222"}}>
                  <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{t.title}</div><div style={{fontSize:11,color:TX2,marginTop:3}}>{t.category}{t.projectSub?` · ${t.projectSub}`:""} · {t.due||"sans échéance"}</div></div>
                  <Bdg label={t.status}/>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ TÂCHES ══ */}
        {tab==="tasks"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontSize:18,fontWeight:800}}>Gestionnaire de tâches</div>
              <button onClick={()=>setShowAddTask(!showAddTask)} style={{background:gg(),color:"#000",fontWeight:800,fontSize:13,border:"none",borderRadius:8,padding:"8px 18px",cursor:"pointer"}}>+ Ajouter</button>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
              {["Tous",...STATS].map(s=><button key={s} onClick={()=>setFStatus(s)} style={{background:fStatus===s?GOLD:DK3,color:fStatus===s?"#000":TX2,border:"1px solid #333",borderRadius:20,padding:"4px 14px",fontSize:12,fontWeight:fStatus===s?700:400,cursor:"pointer"}}>{s}</button>)}
              <div style={{width:1,background:"#333",margin:"0 4px"}}/>
              {["Tous",...CATS].map(c=><button key={c} onClick={()=>setFCat(c)} style={{background:fCat===c?"#333":"transparent",color:fCat===c?TX:TX2,border:"1px solid #2a2a2a",borderRadius:20,padding:"4px 12px",fontSize:11,cursor:"pointer"}}>{c}</button>)}
            </div>
            {showAddTask&&(
              <div style={{background:DK3,border:`1px solid ${GOLD}33`,borderRadius:12,padding:18,marginBottom:16}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:12,color:GL}}>Nouvelle tâche</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <input value={newTask.title} onChange={e=>setNewTask(p=>({...p,title:e.target.value}))} placeholder="Titre..." style={{...inp,gridColumn:"1 / -1"}}/>
                  <select value={newTask.priority} onChange={e=>setNewTask(p=>({...p,priority:e.target.value}))} style={inp}>{PRIOS.map(p=><option key={p}>{p}</option>)}</select>
                  <select value={newTask.category} onChange={e=>setNewTask(p=>({...p,category:e.target.value,projectSub:""}))} style={inp}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
                  {newTask.category==="Projet"&&<select value={newTask.projectSub} onChange={e=>setNewTask(p=>({...p,projectSub:e.target.value}))} style={{...inp,gridColumn:"1 / -1"}}><option value="">— Sous-catégorie —</option>{PSUBS.map(s=><option key={s}>{s}</option>)}</select>}
                  <select value={newTask.status} onChange={e=>setNewTask(p=>({...p,status:e.target.value}))} style={inp}>{STATS.map(s=><option key={s}>{s}</option>)}</select>
                  <input type="date" value={newTask.due} onChange={e=>setNewTask(p=>({...p,due:e.target.value}))} style={inp}/>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={addTask} style={{background:gg(),color:"#000",fontWeight:800,border:"none",borderRadius:8,padding:"8px 20px",cursor:"pointer",fontSize:13}}>Ajouter</button>
                  <button onClick={()=>setShowAddTask(false)} style={{background:"transparent",color:TX2,border:"1px solid #333",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:13}}>Annuler</button>
                </div>
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {filt.length===0&&<div style={{color:TX2,fontSize:13,padding:20,textAlign:"center"}}>Aucune tâche.</div>}
              {filt.map(t=>(
                <div key={t.id} style={{background:DK3,border:`1px solid ${t.status==="Terminé"?"#2a2a2a":t.priority==="Haute"?`${GOLD}33`:"#222"}`,borderRadius:10,padding:"14px 16px",opacity:t.status==="Terminé"?.6:1,display:"flex",alignItems:"center",gap:12}}>
                  <div onClick={()=>updTS(t.id,t.status==="Terminé"?"À faire":"Terminé")} style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${t.status==="Terminé"?GOLD:MU}`,background:t.status==="Terminé"?GOLD:"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>{t.status==="Terminé"?"✓":""}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,textDecoration:t.status==="Terminé"?"line-through":"none"}}>{t.title}</div>
                    <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap",alignItems:"center"}}><Bdg label={t.priority}/><Bdg label={t.category}/>{t.category==="Projet"&&t.projectSub&&<Bdg label={t.projectSub}/>}{t.due&&<span style={{fontSize:11,color:TX2}}>📅 {t.due}</span>}</div>
                  </div>
                  <select value={t.status} onChange={e=>updTS(t.id,e.target.value)} style={{...inp,width:"auto",fontSize:11,padding:"4px 8px"}}>{STATS.map(s=><option key={s}>{s}</option>)}</select>
                  <button onClick={()=>delT(t.id)} style={{background:"transparent",border:"none",color:MU,cursor:"pointer",fontSize:16}}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ PROJETS ══ */}
        {tab==="projects"&&!selProj&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontSize:18,fontWeight:800}}>Gestionnaire de projets</div>
              <button onClick={()=>setShowAddProj(!showAddProj)} style={{background:gg(),color:"#000",fontWeight:800,fontSize:13,border:"none",borderRadius:8,padding:"8px 18px",cursor:"pointer"}}>+ Nouveau projet</button>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
              {["Tous",...PSUBS].map(s=><button key={s} onClick={()=>setProjFilter(s)} style={{background:projFilter===s?(PCOLS[s]||GOLD):DK3,color:projFilter===s?"#fff":TX2,border:`1px solid ${projFilter===s?(PCOLS[s]||GOLD):"#333"}`,borderRadius:20,padding:"4px 14px",fontSize:12,cursor:"pointer"}}>{s}</button>)}
            </div>
            {showAddProj&&(
              <div style={{background:DK3,border:`1px solid ${GOLD}44`,borderRadius:12,padding:18,marginBottom:16}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:12,color:GL}}>Nouveau projet</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <input value={newProj.name} onChange={e=>setNewProj(p=>({...p,name:e.target.value}))} placeholder="Nom *" style={{...inp,gridColumn:"1 / -1"}}/>
                  <select value={newProj.sub} onChange={e=>setNewProj(p=>({...p,sub:e.target.value}))} style={inp}>{PSUBS.map(s=><option key={s}>{s}</option>)}</select>
                  <select value={newProj.status} onChange={e=>setNewProj(p=>({...p,status:e.target.value}))} style={inp}>{SPROJS.map(s=><option key={s}>{s}</option>)}</select>
                  <input value={newProj.client} onChange={e=>setNewProj(p=>({...p,client:e.target.value}))} placeholder="Client" style={inp}/>
                  <div/>
                  <input type="date" value={newProj.start} onChange={e=>setNewProj(p=>({...p,start:e.target.value}))} style={inp}/>
                  <input type="date" value={newProj.end} onChange={e=>setNewProj(p=>({...p,end:e.target.value}))} style={inp}/>
                  <textarea value={newProj.notes} onChange={e=>setNewProj(p=>({...p,notes:e.target.value}))} rows={2} style={{...inp,gridColumn:"1 / -1",resize:"vertical"}}/>
                </div>
                <div style={{display:"flex",gap:8}}><button onClick={addProj} style={{background:gg(),color:"#000",fontWeight:800,border:"none",borderRadius:8,padding:"8px 20px",cursor:"pointer",fontSize:13}}>Créer</button><button onClick={()=>setShowAddProj(false)} style={{background:"transparent",color:TX2,border:"1px solid #333",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:13}}>Annuler</button></div>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
              {projects.filter(p=>projFilter==="Tous"||p.sub===projFilter).map(p=>(
                <div key={p.id} onClick={()=>setSelProj(p)} style={{background:DK3,border:`1px solid ${PCOLS[p.sub]}44`,borderRadius:12,padding:18,cursor:"pointer",opacity:p.status==="Terminé"?.6:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{background:PCOLS[p.sub],color:"#fff",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20}}>{p.sub}</span><span style={{fontSize:11,color:p.status==="Actif"?"#27AE60":p.status==="En pause"?GOLD:TX2}}>● {p.status}</span></div>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:6}}>{p.name}</div>
                  {p.client&&<div style={{fontSize:12,color:TX2}}>👤 {p.client}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
        {tab==="projects"&&selProj&&(
          <div>
            <button onClick={()=>setSelProj(null)} style={{background:"transparent",border:"none",color:GL,cursor:"pointer",fontSize:13,marginBottom:16,padding:0}}>← Retour aux projets</button>
            <div style={{background:DK3,border:`1px solid ${PCOLS[selProj.sub]}55`,borderRadius:14,padding:24,marginBottom:20}}>
              <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                <div><span style={{background:PCOLS[selProj.sub],color:"#fff",fontSize:10,fontWeight:700,padding:"2px 10px",borderRadius:20}}>{selProj.sub}</span><div style={{fontSize:20,fontWeight:800,marginTop:10}}>{selProj.name}</div>{selProj.client&&<div style={{fontSize:13,color:TX2,marginTop:4}}>👤 {selProj.client}</div>}</div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <select value={projects.find(p=>p.id===selProj.id)?.status||selProj.status} onChange={e=>{updPS(selProj.id,e.target.value);setSelProj(p=>({...p,status:e.target.value}));}} style={{...inp,width:"auto",fontSize:12}}>{SPROJS.map(s=><option key={s}>{s}</option>)}</select>
                  <button onClick={()=>delP(selProj.id)} style={{background:"#C0392B22",border:"1px solid #C0392B44",color:"#C0392B",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Supprimer</button>
                </div>
              </div>
              {selProj.notes&&<div style={{marginTop:14,fontSize:13,color:TX2,background:DK4,borderRadius:8,padding:12}}>{selProj.notes}</div>}
            </div>
          </div>
        )}

        {/* ══ CLIENTS ══ */}
        {tab==="clients"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontSize:18,fontWeight:800}}>Gestionnaire de clients</div>
              <button onClick={()=>{setShowAddCli(!showAddCli);setEditCli(null);setNewCli({contact:"",entreprise:"",telephone:"",courriel:"",etiquette:"Lead",adhesion:"",note:""});}} style={{background:gg(),color:"#000",fontWeight:800,fontSize:13,border:"none",borderRadius:8,padding:"8px 18px",cursor:"pointer"}}>+ Nouveau client</button>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
              <input value={cliSearch} onChange={e=>setCliSearch(e.target.value)} placeholder="🔍 Rechercher..." style={{...inp,width:200,padding:"6px 12px",fontSize:12}}/>
              {["Tous",...CETIQ].map(e=><button key={e} onClick={()=>setCliFilter(e)} style={{background:cliFilter===e?(ECOLS[e]||GOLD):DK3,color:cliFilter===e?"#fff":TX2,border:`1px solid ${cliFilter===e?(ECOLS[e]||GOLD):"#333"}`,borderRadius:20,padding:"4px 14px",fontSize:12,cursor:"pointer"}}>{e}</button>)}
            </div>
            {showAddCli&&(
              <div style={{background:DK3,border:`1px solid ${GOLD}44`,borderRadius:12,padding:18,marginBottom:16}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:12,color:GL}}>{editCli?"Modifier":"Nouveau client"}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <input value={newCli.contact} onChange={e=>setNewCli(p=>({...p,contact:e.target.value}))} placeholder="Nom *" style={inp}/>
                  <input value={newCli.entreprise} onChange={e=>setNewCli(p=>({...p,entreprise:e.target.value}))} placeholder="Entreprise" style={inp}/>
                  <input value={newCli.telephone} onChange={e=>setNewCli(p=>({...p,telephone:e.target.value}))} placeholder="Téléphone" style={inp}/>
                  <input value={newCli.courriel} onChange={e=>setNewCli(p=>({...p,courriel:e.target.value}))} placeholder="Courriel" style={inp}/>
                  <select value={newCli.etiquette} onChange={e=>setNewCli(p=>({...p,etiquette:e.target.value}))} style={inp}>{CETIQ.map(e=><option key={e}>{e}</option>)}</select>
                  <input type="date" value={newCli.adhesion} onChange={e=>setNewCli(p=>({...p,adhesion:e.target.value}))} style={inp}/>
                  <textarea value={newCli.note} onChange={e=>setNewCli(p=>({...p,note:e.target.value}))} rows={2} style={{...inp,gridColumn:"1 / -1",resize:"vertical"}}/>
                </div>
                <div style={{display:"flex",gap:8}}><button onClick={addCli} style={{background:gg(),color:"#000",fontWeight:800,border:"none",borderRadius:8,padding:"8px 20px",cursor:"pointer",fontSize:13}}>{editCli?"Sauvegarder":"Ajouter"}</button><button onClick={()=>{setShowAddCli(false);setEditCli(null);}} style={{background:"transparent",color:TX2,border:"1px solid #333",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:13}}>Annuler</button></div>
              </div>
            )}
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr style={{borderBottom:`2px solid ${GOLD}55`}}>{["Contact","Entreprise","Étiquette","Adhésion","Téléphone","Courriel","Note",""].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:11,fontWeight:700,color:GL,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtC.length===0&&<tr><td colSpan={8} style={{padding:24,textAlign:"center",color:TX2}}>Aucun client.</td></tr>}
                  {filtC.map((c,i)=>(
                    <tr key={c.id} style={{borderBottom:"1px solid #1e1e1e",background:i%2===0?"transparent":`${DK3}88`}}>
                      <td style={{padding:"12px",fontWeight:700}}>{c.contact}</td>
                      <td style={{padding:"12px",color:TX2}}>{c.entreprise||"—"}</td>
                      <td style={{padding:"12px"}}><span style={{background:ECOLS[c.etiquette]||"#333",color:"#fff",fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20}}>{c.etiquette}</span></td>
                      <td style={{padding:"12px",color:TX2,whiteSpace:"nowrap"}}>{c.adhesion||"—"}</td>
                      <td style={{padding:"12px"}}>{c.telephone?<a href={`tel:${c.telephone}`} style={{color:GL,textDecoration:"none"}}>{c.telephone}</a>:<span style={{color:MU}}>—</span>}</td>
                      <td style={{padding:"12px"}}>{c.courriel?<a href={`mailto:${c.courriel}`} style={{color:GL,textDecoration:"none"}}>{c.courriel}</a>:<span style={{color:MU}}>—</span>}</td>
                      <td style={{padding:"12px",color:TX2,maxWidth:180}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:12}}>{c.note||"—"}</div></td>
                      <td style={{padding:"12px",whiteSpace:"nowrap"}}>
                        <button onClick={()=>startEC(c)} style={{background:"transparent",border:"1px solid #333",color:TX2,borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,marginRight:6}}>✏️</button>
                        <button onClick={()=>delC(c.id)} style={{background:"transparent",border:"1px solid #C0392B44",color:"#C0392B",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11}}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ SOUMISSIONS liste ══ */}
        {tab==="soumissions"&&souVue==="liste"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontSize:18,fontWeight:800}}>Gestionnaire de soumissions</div>
              <button onClick={oNS} style={{background:gg(),color:"#000",fontWeight:800,fontSize:13,border:"none",borderRadius:8,padding:"8px 18px",cursor:"pointer"}}>+ Soumission</button>
            </div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}>
              <SC label="Total soumissions" value={soumissions.length} sub={fmt(tSAll)} color={GOLD}/>
              <SC label="En attente" value={fmt(tSAtt)} color="#E67E22" sub={`${soumissions.filter(s=>s.statut==="En attente d'approbation").length} dossiers`}/>
              <SC label="Acceptées" value={fmt(tSAcc)} color="#27AE60" sub={`${soumissions.filter(s=>s.statut==="Acceptée").length} dossiers`}/>
              <SC label="Refusées" value={soumissions.filter(s=>s.statut==="Refusée").length} color="#C0392B"/>
            </div>
            {/* Barre revenus */}
            <div style={{background:DK3,border:"1px solid #222",borderRadius:12,padding:16,marginBottom:20}}>
              <div style={{fontSize:12,color:TX2,marginBottom:10,fontWeight:700}}>Revenus par statut</div>
              <div style={{display:"flex",borderRadius:8,overflow:"hidden",height:28}}>
                {[{s:"En attente d'approbation",c:"#E67E2288"},{s:"Acceptée",c:"#27AE6088"},{s:"Brouillon",c:"#55555588"}].map(({s,c})=>{
                  const v=soumissions.filter(x=>x.statut===s).reduce((a,x)=>a+cTot(x.lignes),0);
                  const pct=tSAll?Math.round((v/tSAll)*100):0;
                  return pct>0?<div key={s} title={`${s}: ${fmt(v)}`} style={{background:c,width:`${pct}%`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",minWidth:40}}>{fmt(v)}</div>:null;
                })}
              </div>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
              <input value={souSearch} onChange={e=>setSouSearch(e.target.value)} placeholder="🔍 Contact, #, entreprise..." style={{...inp,width:220,padding:"6px 12px",fontSize:12}}/>
              {["Tous",...SSOUS].map(s=><button key={s} onClick={()=>setSouFilter(s)} style={{background:souFilter===s?(SSCOLS[s]||GOLD):DK3,color:souFilter===s?"#fff":TX2,border:`1px solid ${souFilter===s?(SSCOLS[s]||GOLD):"#333"}`,borderRadius:20,padding:"4px 12px",fontSize:11,cursor:"pointer"}}>{s}</button>)}
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr style={{borderBottom:`2px solid ${GOLD}55`}}>{["N° Soumission","Contact","Entreprise","Statut","Date","Expiration","Montant TTC","Envoyée","Lue","Imprimée",""].map(h=><th key={h} style={{padding:"10px 10px",textAlign:"left",fontSize:11,fontWeight:700,color:GL,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtS.length===0&&<tr><td colSpan={11} style={{padding:24,textAlign:"center",color:TX2}}>Aucune soumission.</td></tr>}
                  {filtS.map((s,i)=>(
                    <tr key={s.id} style={{borderBottom:"1px solid #1e1e1e",background:i%2===0?"transparent":`${DK3}88`,cursor:"pointer"}} onClick={()=>oDS(s)}>
                      <td style={{padding:"12px 10px",fontWeight:700,color:GL,whiteSpace:"nowrap"}}>{s.id}</td>
                      <td style={{padding:"12px 10px",fontWeight:600}}>{s.contact}</td>
                      <td style={{padding:"12px 10px",color:TX2}}>{s.entreprise||"—"}</td>
                      <td style={{padding:"12px 10px"}} onClick={e=>e.stopPropagation()}><select value={s.statut} onChange={e=>udSS(s.id,e.target.value)} style={{background:SSCOLS[s.statut]+"22",border:`1px solid ${SSCOLS[s.statut]}55`,color:SSCOLS[s.statut],borderRadius:20,padding:"3px 8px",fontSize:11,fontWeight:700,cursor:"pointer",outline:"none"}}>{SSOUS.map(x=><option key={x} style={{background:DK4,color:TX}}>{x}</option>)}</select></td>
                      <td style={{padding:"12px 10px",color:TX2,whiteSpace:"nowrap"}}>{s.date}</td>
                      <td style={{padding:"12px 10px",color:TX2,whiteSpace:"nowrap"}}>{s.expiration}</td>
                      <td style={{padding:"12px 10px",fontWeight:700,whiteSpace:"nowrap"}}>{fmt(cTot(s.lignes))}</td>
                      <td style={{padding:"12px 10px",textAlign:"center"}} onClick={e=>e.stopPropagation()}><span onClick={()=>togSF(s.id,"envoyee")} style={{cursor:"pointer",color:s.envoyee?"#27AE60":MU,fontSize:16}}>{s.envoyee?"✓":"—"}</span></td>
                      <td style={{padding:"12px 10px",textAlign:"center"}} onClick={e=>e.stopPropagation()}><span onClick={()=>togSF(s.id,"lue")} style={{cursor:"pointer",color:s.lue?"#27AE60":MU,fontSize:16}}>{s.lue?"✓":"—"}</span></td>
                      <td style={{padding:"12px 10px",textAlign:"center"}} onClick={e=>e.stopPropagation()}><span onClick={()=>togSF(s.id,"imprimee")} style={{cursor:"pointer",color:s.imprimee?"#27AE60":MU,fontSize:16}}>{s.imprimee?"✓":"—"}</span></td>
                      <td style={{padding:"12px 10px",whiteSpace:"nowrap"}} onClick={e=>e.stopPropagation()}>
                        <button onClick={()=>oES(s)} style={{background:"transparent",border:"1px solid #333",color:TX2,borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,marginRight:6}}>✏️</button>
                        <button onClick={()=>dlS(s.id)} style={{background:"transparent",border:"1px solid #C0392B44",color:"#C0392B",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11}}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ SOUMISSIONS form ══ */}
        {tab==="soumissions"&&souVue==="form"&&(
          <div style={{maxWidth:700,margin:"0 auto"}}>
            <button onClick={()=>setSouVue("liste")} style={{background:"transparent",border:"none",color:GL,cursor:"pointer",fontSize:13,marginBottom:16,padding:0}}>← Retour</button>
            <div style={{fontSize:18,fontWeight:800,marginBottom:20}}>{isEditSou?"Modifier la soumission":"Nouvelle soumission"}</div>
            <div style={{background:DK3,border:"1px solid #2a2a2a",borderRadius:12,padding:20,marginBottom:16}}>
              <div style={{fontSize:13,fontWeight:700,color:GL,marginBottom:14}}>Informations générales</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div><label style={{fontSize:11,color:TX2,display:"block",marginBottom:4}}>N° Soumission</label><input value={formSou.id} onChange={e=>setFormSou(p=>({...p,id:e.target.value}))} style={inp}/></div>
                <div><label style={{fontSize:11,color:TX2,display:"block",marginBottom:4}}>Statut</label><select value={formSou.statut} onChange={e=>setFormSou(p=>({...p,statut:e.target.value}))} style={inp}>{SSOUS.map(s=><option key={s}>{s}</option>)}</select></div>
                <div><label style={{fontSize:11,color:TX2,display:"block",marginBottom:4}}>Contact *</label><input value={formSou.contact} onChange={e=>setFormSou(p=>({...p,contact:e.target.value}))} style={inp}/></div>
                <div><label style={{fontSize:11,color:TX2,display:"block",marginBottom:4}}>Entreprise</label><input value={formSou.entreprise} onChange={e=>setFormSou(p=>({...p,entreprise:e.target.value}))} style={inp}/></div>
                <div><label style={{fontSize:11,color:TX2,display:"block",marginBottom:4}}>Date</label><input type="date" value={formSou.date} onChange={e=>setFormSou(p=>({...p,date:e.target.value}))} style={inp}/></div>
                <div><label style={{fontSize:11,color:TX2,display:"block",marginBottom:4}}>Expiration</label><input type="date" value={formSou.expiration} onChange={e=>setFormSou(p=>({...p,expiration:e.target.value}))} style={inp}/></div>
                <div style={{gridColumn:"1 / -1"}}><label style={{fontSize:11,color:TX2,display:"block",marginBottom:4}}>Note</label><input value={formSou.note} onChange={e=>setFormSou(p=>({...p,note:e.target.value}))} style={inp}/></div>
                <div style={{gridColumn:"1 / -1",display:"flex",gap:20}}>{[["envoyee","Envoyée"],["lue","Lue"],["imprimee","Imprimée"]].map(([k,l])=><label key={k} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,cursor:"pointer",color:TX2}}><input type="checkbox" checked={formSou[k]} onChange={e=>setFormSou(p=>({...p,[k]:e.target.checked}))}/>{l}</label>)}</div>
              </div>
            </div>
            <LignesBlock data={formSou} setData={setFormSou}/>
            <CalPmt tot={cTot(formSou.lignes)}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={svS} style={{background:gg(),color:"#000",fontWeight:800,border:"none",borderRadius:8,padding:"10px 24px",cursor:"pointer",fontSize:14}}>{isEditSou?"Sauvegarder":"Créer la soumission"}</button>
              <button onClick={()=>setSouVue("liste")} style={{background:"transparent",color:TX2,border:"1px solid #333",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontSize:13}}>Annuler</button>
            </div>
          </div>
        )}

        {/* ══ SOUMISSIONS détail ══ */}
        {tab==="soumissions"&&souVue==="detail"&&selSou&&(()=>{
          const s=soumissions.find(x=>x.id===selSou.id)||selSou;
          const st=cST(s.lignes),tx=cTX(st),tot=cTot(s.lignes);
          const p1=Math.round(tot*0.30*100)/100,p2=Math.round(tot*0.40*100)/100,p3=Math.round((tot-p1-p2)*100)/100;
          const pmts=[{label:"Sur approbation",m:p1},{label:"À planifier",m:p2},{label:"À planifier",m:p3}];
          return(
            <div style={{maxWidth:800,margin:"0 auto"}}>
              <button onClick={()=>setSouVue("liste")} style={{background:"transparent",border:"none",color:GL,cursor:"pointer",fontSize:13,marginBottom:16,padding:0}}>← Liste de soumissions</button>
              {/* Header */}
              <div style={{background:DK3,border:`1px solid ${GOLD}33`,borderRadius:14,padding:"20px 24px",marginBottom:4}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12,marginBottom:20}}>
                  <div style={{fontSize:22,fontWeight:800}}>📋 Soumission</div>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    {s.statut==="En attente d'approbation"&&<button onClick={()=>udSS(s.id,"Acceptée")} style={{background:"#27AE6022",border:"1px solid #27AE6055",color:"#27AE60",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight:700}}>✓ Accepter</button>}
                    {s.statut==="En attente d'approbation"&&<button onClick={()=>udSS(s.id,"Refusée")} style={{background:"#C0392B22",border:"1px solid #C0392B44",color:"#C0392B",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13}}>✗ Refuser</button>}
                    <button onClick={()=>oES(s)} style={{background:DK4,border:"1px solid #333",color:TX2,borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:13}}>Actions ▾</button>
                    <button style={{background:gg(),color:"#000",fontWeight:800,border:"none",borderRadius:8,padding:"8px 18px",cursor:"pointer",fontSize:13}}>➤ Envoyer</button>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:16,flexWrap:"wrap"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:12,color:TX2}}>Statut</span><select value={s.statut} onChange={e=>udSS(s.id,e.target.value)} style={{background:SSCOLS[s.statut]+"22",border:`1px solid ${SSCOLS[s.statut]}`,color:SSCOLS[s.statut],borderRadius:20,padding:"4px 14px",fontSize:12,fontWeight:700,cursor:"pointer",outline:"none"}}>{SSOUS.map(x=><option key={x} style={{background:DK4,color:TX}}>{x}</option>)}</select></div>
                  {[["envoyee","📤 Envoyée"],["lue","👁 Lue"],["imprimee","🖨 Imprimée"]].map(([k,l])=>(
                    <div key={k} onClick={()=>togSF(s.id,k)} style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:s[k]?GL:MU,cursor:"pointer",userSelect:"none"}}>
                      <span style={{width:16,height:16,border:`1.5px solid ${s[k]?GOLD:MU}`,borderRadius:4,background:s[k]?GOLD:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#000"}}>{s[k]?"✓":""}</span>{l}
                    </div>
                  ))}
                </div>
                <div><div style={{fontSize:11,color:TX2,marginBottom:4,fontWeight:700}}>NUMÉRO DE SOUMISSION</div><div style={{fontSize:18,fontWeight:800,color:GL}}>{s.id}</div></div>
              </div>
              {/* Section 1 */}
              <div style={{background:DK3,border:"1px solid #222",borderRadius:14,padding:"20px 24px",marginBottom:4,marginTop:4}}>
                <div style={{fontSize:16,fontWeight:800,marginBottom:18,borderBottom:"1px solid #2a2a2a",paddingBottom:10}}>1. Information</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
                  <div><div style={{fontSize:12,fontWeight:700,color:TX2,marginBottom:10}}>Contact de soumission</div><div style={{background:DK4,border:"1px solid #2a2a2a",borderRadius:10,padding:14}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><span style={{fontWeight:700,fontSize:14}}>{s.contact}</span><span style={{background:`${GOLD}33`,color:GL,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20}}>Soumission</span></div>{s.entreprise&&<div style={{fontSize:12,color:TX2}}>🏢 {s.entreprise}</div>}</div></div>
                  <div><div style={{fontSize:12,fontWeight:700,color:TX2,marginBottom:10}}>Contact d'intervention</div><div style={{background:DK4,border:"1px solid #2a2a2a",borderRadius:10,padding:14}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontWeight:700,fontSize:14}}>{s.contact}</span><span style={{background:"#27AE6033",color:"#27AE60",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20}}>Intervention</span></div></div></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,borderTop:"1px solid #2a2a2a",paddingTop:16}}>
                  <div><div style={{fontSize:11,color:TX2,marginBottom:4}}>Date de soumission</div><div style={{fontSize:14,fontWeight:600}}>{s.date||"—"}</div></div>
                  <div><div style={{fontSize:11,color:TX2,marginBottom:4}}>Date d'échéance</div><div style={{fontSize:14,fontWeight:600}}>{s.expiration||"—"}</div></div>
                </div>
                {s.note&&<div style={{marginTop:14,background:DK4,borderRadius:8,padding:12,fontSize:13,color:TX2}}>📝 {s.note}</div>}
              </div>
              {/* Section 2 */}
              <div style={{background:DK3,border:"1px solid #222",borderRadius:14,padding:"20px 24px",marginBottom:4,marginTop:4}}>
                <div style={{fontSize:16,fontWeight:800,marginBottom:18,borderBottom:"1px solid #2a2a2a",paddingBottom:10}}>2. Items ({s.lignes.length})</div>
                <div style={{background:DK4,borderRadius:10,overflow:"hidden",marginBottom:16}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 80px 120px 120px",padding:"10px 16px",borderBottom:`1px solid ${GOLD}33`}}>{["Description","Qté","Prix","Sous-total"].map(h=><div key={h} style={{fontSize:11,color:TX2,fontWeight:700,textAlign:h==="Description"?"left":"right"}}>{h}</div>)}</div>
                  {s.lignes.map((l,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"1fr 80px 120px 120px",padding:"14px 16px",borderBottom:"1px solid #1e1e1e"}}><div style={{fontWeight:600,fontSize:13}}>{l.desc||"—"}</div><div style={{textAlign:"right",fontSize:13,color:TX2}}>{l.qte}</div><div style={{textAlign:"right",fontSize:13,color:TX2}}>{fmt(l.prix)}</div><div style={{textAlign:"right",fontSize:13,fontWeight:700}}>{fmt(cL(l))}</div></div>)}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
                  <div style={{background:DK4,border:"1px solid #2a2a2a",borderRadius:10,padding:14}}><div style={{fontSize:12,color:TX2,marginBottom:6}}>Prix de vente</div><div style={{fontSize:18,fontWeight:800}}>{fmt(st)}</div></div>
                  <div style={{background:DK4,border:"1px solid #2a2a2a",borderRadius:10,padding:14}}><div style={{fontSize:12,color:TX2,marginBottom:6}}>Prix coûtant</div><div style={{fontSize:18,fontWeight:800}}>{fmt(0)}</div></div>
                  <div style={{background:DK4,border:"1px solid #2a2a2a",borderRadius:10,padding:14}}><div style={{fontSize:12,color:TX2,marginBottom:6}}>Profit</div><div style={{fontSize:18,fontWeight:800,color:"#27AE60"}}>{fmt(st)} <span style={{fontSize:13}}>(100%)</span></div></div>
                </div>
                <div style={{borderTop:"1px solid #2a2a2a",paddingTop:16,maxWidth:400,marginLeft:"auto"}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:14,color:TX2,marginBottom:10}}><span>Sous-total</span><span style={{fontWeight:600}}>{fmt(st)}</span></div>
                  {tx.map(t=><div key={t.label} style={{display:"flex",justifyContent:"space-between",fontSize:13,color:TX2,marginBottom:8}}><span>{t.label}</span><span>{fmt(t.m)}</span></div>)}
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:17,fontWeight:800,background:DK2,borderRadius:8,padding:"12px 16px",marginTop:8}}><span>Total</span><span style={{color:GL}}>{fmt(tot)}</span></div>
                </div>
              </div>
              {/* Section 3 */}
              <div style={{background:DK3,border:"1px solid #222",borderRadius:14,padding:"20px 24px",marginBottom:16,marginTop:4}}>
                <div style={{fontSize:16,fontWeight:800,marginBottom:18,borderBottom:"1px solid #2a2a2a",paddingBottom:10}}>3. Calendrier de paiements</div>
                <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14,flexWrap:"wrap"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:TX2}}><span>Nombre de factures</span><select defaultValue={3} style={{background:DK4,border:"1px solid #333",borderRadius:6,color:TX,padding:"4px 10px",fontSize:12,outline:"none",width:"auto"}}>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></div>
                  <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:TX2}}><span>Rabais</span><input defaultValue="0.00" style={{background:DK4,border:"none",borderBottom:"1px dashed #555",color:TX,fontSize:13,width:55,outline:"none",textAlign:"center",padding:"2px 4px"}}/><span>%</span></div>
                </div>
                <div style={{background:DK4,borderRadius:10,overflow:"hidden",marginBottom:10}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 130px",padding:"10px 16px",borderBottom:`1px solid ${GOLD}22`}}><div style={{fontSize:11,color:TX2,fontWeight:700}}>Date</div><div style={{fontSize:11,color:TX2,fontWeight:700,textAlign:"right"}}>Montant</div></div>
                  {pmts.map((p,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"1fr 130px",padding:"12px 16px",borderBottom:"1px solid #1e1e1e",alignItems:"center"}}><div style={{fontSize:13}}>{p.label}</div><div style={{textAlign:"right",fontSize:13,fontWeight:700,color:GL}}>{fmt(p.m)}</div></div>)}
                </div>
                <button style={{background:"transparent",border:"none",color:GL,cursor:"pointer",fontSize:13,padding:0}}>＋ Ajouter un paiement</button>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button onClick={()=>oES(s)} style={{background:gg(),color:"#000",fontWeight:800,border:"none",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontSize:13}}>✏️ Modifier</button>
                <button onClick={()=>dlS(s.id)} style={{background:"#55555522",border:"1px solid #55555544",color:MU,borderRadius:8,padding:"10px 18px",cursor:"pointer",fontSize:13}}>Supprimer</button>
              </div>
            </div>
          );
        })()}

        {/* ══ FACTURES liste ══ */}
        {tab==="factures"&&facVue==="liste"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontSize:18,fontWeight:800}}>Gestionnaire de factures</div>
              <button onClick={oNF} style={{background:gg(),color:"#000",fontWeight:800,fontSize:13,border:"none",borderRadius:8,padding:"8px 18px",cursor:"pointer"}}>+ Nouvelle facture</button>
            </div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}>
              <SC label="Revenus encaissés" value={fmt(tPaye)} color="#27AE60" sub={`${factures.filter(f=>f.statut==="Payée").length} factures`}/>
              <SC label="En attente" value={fmt(tAtt)} color={GOLD}/>
              <SC label="En retard" value={fmt(tRet)} color="#C0392B"/>
              <SC label="Total" value={factures.length} sub="factures"/>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
              <input value={facSearch} onChange={e=>setFacSearch(e.target.value)} placeholder="🔍 Client ou #..." style={{...inp,width:200,padding:"6px 12px",fontSize:12}}/>
              {["Tous",...SFACS].map(s=><button key={s} onClick={()=>setFacFilter(s)} style={{background:facFilter===s?(SFCOLS[s]||GOLD):DK3,color:facFilter===s?"#fff":TX2,border:`1px solid ${facFilter===s?(SFCOLS[s]||GOLD):"#333"}`,borderRadius:20,padding:"4px 14px",fontSize:12,cursor:"pointer"}}>{s}</button>)}
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr style={{borderBottom:`2px solid ${GOLD}55`}}>{["#","Client","Entreprise","Date","Échéance","Montant TTC","Statut",""].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:11,fontWeight:700,color:GL,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtF.length===0&&<tr><td colSpan={8} style={{padding:24,textAlign:"center",color:TX2}}>Aucune facture.</td></tr>}
                  {filtF.map((f,i)=>(
                    <tr key={f.id} style={{borderBottom:"1px solid #1e1e1e",background:i%2===0?"transparent":`${DK3}88`,cursor:"pointer"}} onClick={()=>oDF(f)}>
                      <td style={{padding:"12px",fontWeight:700,color:GL}}>{f.id}</td>
                      <td style={{padding:"12px",fontWeight:600}}>{f.client}</td>
                      <td style={{padding:"12px",color:TX2}}>{f.entreprise||"—"}</td>
                      <td style={{padding:"12px",color:TX2,whiteSpace:"nowrap"}}>{f.date}</td>
                      <td style={{padding:"12px",color:f.statut==="En retard"?"#C0392B":TX2,whiteSpace:"nowrap"}}>{f.echeance}</td>
                      <td style={{padding:"12px",fontWeight:700,whiteSpace:"nowrap"}}>{fmt(cTot(f.lignes))}</td>
                      <td style={{padding:"12px"}} onClick={e=>e.stopPropagation()}><select value={f.statut} onChange={e=>udFS(f.id,e.target.value)} style={{background:SFCOLS[f.statut]+"22",border:`1px solid ${SFCOLS[f.statut]}55`,color:SFCOLS[f.statut],borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,cursor:"pointer",outline:"none"}}>{SFACS.map(s=><option key={s} style={{background:DK4,color:TX}}>{s}</option>)}</select></td>
                      <td style={{padding:"12px",whiteSpace:"nowrap"}} onClick={e=>e.stopPropagation()}>
                        <button onClick={()=>oEF(f)} style={{background:"transparent",border:"1px solid #333",color:TX2,borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,marginRight:6}}>✏️</button>
                        <button onClick={()=>dlF(f.id)} style={{background:"transparent",border:"1px solid #C0392B44",color:"#C0392B",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11}}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ FACTURES form ══ */}
        {tab==="factures"&&facVue==="form"&&(
          <div style={{maxWidth:700,margin:"0 auto"}}>
            <button onClick={()=>setFacVue("liste")} style={{background:"transparent",border:"none",color:GL,cursor:"pointer",fontSize:13,marginBottom:16,padding:0}}>← Retour</button>
            <div style={{fontSize:18,fontWeight:800,marginBottom:20}}>{isEditFac?"Modifier la facture":"Nouvelle facture"}</div>
            <div style={{background:DK3,border:"1px solid #2a2a2a",borderRadius:12,padding:20,marginBottom:16}}>
              <div style={{fontSize:13,fontWeight:700,color:GL,marginBottom:14}}>Informations générales</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div><label style={{fontSize:11,color:TX2,display:"block",marginBottom:4}}>N° Facture</label><input value={formFac.id} onChange={e=>setFormFac(p=>({...p,id:e.target.value}))} style={inp}/></div>
                <div><label style={{fontSize:11,color:TX2,display:"block",marginBottom:4}}>Statut</label><select value={formFac.statut} onChange={e=>setFormFac(p=>({...p,statut:e.target.value}))} style={inp}>{SFACS.map(s=><option key={s}>{s}</option>)}</select></div>
                <div><label style={{fontSize:11,color:TX2,display:"block",marginBottom:4}}>Client *</label><input value={formFac.client} onChange={e=>setFormFac(p=>({...p,client:e.target.value}))} style={inp}/></div>
                <div><label style={{fontSize:11,color:TX2,display:"block",marginBottom:4}}>Entreprise</label><input value={formFac.entreprise} onChange={e=>setFormFac(p=>({...p,entreprise:e.target.value}))} style={inp}/></div>
                <div><label style={{fontSize:11,color:TX2,display:"block",marginBottom:4}}>Date</label><input type="date" value={formFac.date} onChange={e=>setFormFac(p=>({...p,date:e.target.value}))} style={inp}/></div>
                <div><label style={{fontSize:11,color:TX2,display:"block",marginBottom:4}}>Échéance</label><input type="date" value={formFac.echeance} onChange={e=>setFormFac(p=>({...p,echeance:e.target.value}))} style={inp}/></div>
                <div style={{gridColumn:"1 / -1"}}><label style={{fontSize:11,color:TX2,display:"block",marginBottom:4}}>Note</label><input value={formFac.note} onChange={e=>setFormFac(p=>({...p,note:e.target.value}))} style={inp}/></div>
              </div>
            </div>
            <LignesBlock data={formFac} setData={setFormFac}/>
            <CalPmt tot={cTot(formFac.lignes)}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={svF} style={{background:gg(),color:"#000",fontWeight:800,border:"none",borderRadius:8,padding:"10px 24px",cursor:"pointer",fontSize:14}}>{isEditFac?"Sauvegarder":"Créer la facture"}</button>
              <button onClick={()=>setFacVue("liste")} style={{background:"transparent",color:TX2,border:"1px solid #333",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontSize:13}}>Annuler</button>
            </div>
          </div>
        )}

        {/* ══ FACTURES détail ══ */}
        {tab==="factures"&&facVue==="detail"&&selFac&&(()=>{
          const f=factures.find(x=>x.id===selFac.id)||selFac;
          const st=cST(f.lignes),tx=cTX(st),tot=cTot(f.lignes);
          const p1=Math.round(tot*0.30*100)/100,p2=Math.round(tot*0.40*100)/100,p3=Math.round((tot-p1-p2)*100)/100;
          const pmts=[{label:"Sur approbation",m:p1},{label:"À planifier",m:p2},{label:"À planifier",m:p3}];
          return(
            <div style={{maxWidth:700,margin:"0 auto"}}>
              <button onClick={()=>setFacVue("liste")} style={{background:"transparent",border:"none",color:GL,cursor:"pointer",fontSize:13,marginBottom:16,padding:0}}>← Retour</button>
              <div style={{background:DK3,border:`1px solid ${GOLD}33`,borderRadius:14,padding:28,marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:16,marginBottom:24}}>
                  <div><div style={{fontSize:22,fontWeight:800,background:gg(),WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>FACTURE</div><div style={{fontSize:28,fontWeight:800,marginTop:4}}>{f.id}</div></div>
                  <div style={{textAlign:"right"}}><select value={f.statut} onChange={e=>udFS(f.id,e.target.value)} style={{background:SFCOLS[f.statut]+"22",border:`1px solid ${SFCOLS[f.statut]}`,color:SFCOLS[f.statut],borderRadius:20,padding:"5px 14px",fontSize:13,fontWeight:700,cursor:"pointer",outline:"none"}}>{SFACS.map(s=><option key={s} style={{background:DK4,color:TX}}>{s}</option>)}</select><div style={{fontSize:12,color:TX2,marginTop:8}}>Émise le {f.date}</div><div style={{fontSize:12,color:f.statut==="En retard"?"#C0392B":TX2}}>Échéance: {f.echeance}</div></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                  <div style={{background:DK4,borderRadius:10,padding:14}}><div style={{fontSize:11,color:TX2,fontWeight:700,marginBottom:6}}>FACTURER À</div><div style={{fontSize:14,fontWeight:700}}>{f.client}</div>{f.entreprise&&<div style={{fontSize:13,color:TX2,marginTop:2}}>{f.entreprise}</div>}</div>
                  <div style={{background:DK4,borderRadius:10,padding:14}}><div style={{fontSize:11,color:TX2,fontWeight:700,marginBottom:6}}>DE LA PART DE</div><div style={{fontSize:14,fontWeight:700,background:gg(),WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Growth Plan</div></div>
                </div>
                {f.note&&<div style={{marginTop:14,fontSize:13,color:TX2,background:DK4,borderRadius:8,padding:10}}>📝 {f.note}</div>}
              </div>
              <div style={{background:DK3,border:"1px solid #2a2a2a",borderRadius:12,padding:20,marginBottom:16}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead><tr style={{borderBottom:`1px solid ${GOLD}44`}}>{["Description","Qté","Prix unit.","Total"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:h==="Description"?"left":"right",fontSize:11,fontWeight:700,color:GL}}>{h}</th>)}</tr></thead>
                  <tbody>{f.lignes.map((l,i)=><tr key={i} style={{borderBottom:"1px solid #1e1e1e"}}><td style={{padding:"12px 10px"}}>{l.desc}</td><td style={{padding:"12px 10px",textAlign:"right",color:TX2}}>{l.qte}</td><td style={{padding:"12px 10px",textAlign:"right",color:TX2}}>{fmt(l.prix)}</td><td style={{padding:"12px 10px",textAlign:"right",fontWeight:600}}>{fmt(cL(l))}</td></tr>)}</tbody>
                </table>
                <div style={{borderTop:`1px solid ${GOLD}33`,marginTop:12,paddingTop:14,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                  <div style={{display:"flex",gap:48,fontSize:13,color:TX2}}><span>Sous-total</span><span style={{minWidth:110,textAlign:"right"}}>{fmt(st)}</span></div>
                  {tx.map(t=><div key={t.label} style={{display:"flex",gap:48,fontSize:13,color:TX2}}><span>{t.label}</span><span style={{minWidth:110,textAlign:"right"}}>{fmt(t.m)}</span></div>)}
                  <div style={{display:"flex",gap:48,fontSize:18,fontWeight:800,color:GL,borderTop:"1px solid #333",paddingTop:10,marginTop:6}}><span>Total TTC</span><span style={{minWidth:110,textAlign:"right"}}>{fmt(tot)}</span></div>
                </div>
              </div>
              {/* Calendrier paiements */}
              <div style={{background:DK3,border:"1px solid #222",borderRadius:12,padding:"20px 24px",marginBottom:16}}>
                <div style={{fontSize:15,fontWeight:800,marginBottom:16,borderBottom:"1px solid #2a2a2a",paddingBottom:10}}>Calendrier de paiements</div>
                <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14,flexWrap:"wrap"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:TX2}}><span>Nombre de factures</span><select defaultValue={3} style={{background:DK4,border:"1px solid #333",borderRadius:6,color:TX,padding:"4px 10px",fontSize:12,outline:"none",width:"auto"}}>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></div>
                  <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:TX2}}><span>Rabais</span><input defaultValue="0.00" style={{background:DK4,border:"none",borderBottom:"1px dashed #555",color:TX,fontSize:13,width:55,outline:"none",textAlign:"center",padding:"2px 4px"}}/><span>%</span></div>
                </div>
                <div style={{background:DK4,borderRadius:10,overflow:"hidden",marginBottom:10}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 130px",padding:"10px 16px",borderBottom:`1px solid ${GOLD}22`}}><div style={{fontSize:11,color:TX2,fontWeight:700}}>Date</div><div style={{fontSize:11,color:TX2,fontWeight:700,textAlign:"right"}}>Montant</div></div>
                  {pmts.map((p,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"1fr 130px",padding:"12px 16px",borderBottom:"1px solid #1e1e1e"}}><div style={{fontSize:13}}>{p.label}</div><div style={{textAlign:"right",fontSize:13,fontWeight:700,color:GL}}>{fmt(p.m)}</div></div>)}
                </div>
                <button style={{background:"transparent",border:"none",color:GL,cursor:"pointer",fontSize:13,padding:0}}>＋ Ajouter un paiement</button>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button onClick={()=>oEF(f)} style={{background:gg(),color:"#000",fontWeight:800,border:"none",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontSize:13}}>✏️ Modifier</button>
                {f.statut==="Envoyée"&&<button onClick={()=>udFS(f.id,"Payée")} style={{background:"#27AE6022",border:"1px solid #27AE6055",color:"#27AE60",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontSize:13,fontWeight:700}}>✓ Marquer payée</button>}
                <button onClick={()=>dlF(f.id)} style={{background:"#C0392B22",border:"1px solid #C0392B44",color:"#C0392B",borderRadius:8,padding:"10px 18px",cursor:"pointer",fontSize:13}}>Supprimer</button>
              </div>
            </div>
          );
        })()}

        {/* ══ PROMPTS ══ */}
        {tab==="prompts"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div><div style={{fontSize:18,fontWeight:800}}>Bibliothèque de prompts</div><div style={{fontSize:12,color:TX2,marginTop:2}}>{prompts.length} prompts · {prompts.filter(p=>p.favori).length} favoris</div></div>
              <button onClick={()=>{setShowAddPro(!showAddPro);setEditPro(null);setNewPro({titre:"",categorie:"Prospection",tags:"",contenu:"",favori:false});}} style={{background:gg(),color:"#000",fontWeight:800,fontSize:13,border:"none",borderRadius:8,padding:"8px 18px",cursor:"pointer"}}>+ Nouveau prompt</button>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
              <input value={proSearch} onChange={e=>setProSearch(e.target.value)} placeholder="🔍 Titre ou tag..." style={{...inp,width:200,padding:"6px 12px",fontSize:12}}/>
              {["Tous","⭐ Favoris",...PRCATS].map(c=><button key={c} onClick={()=>setProFilter(c)} style={{background:proFilter===c?(c==="⭐ Favoris"?"#B8860B":PRCOLS[c]||GOLD):DK3,color:proFilter===c?"#fff":TX2,border:`1px solid ${proFilter===c?(PRCOLS[c]||GOLD):"#333"}`,borderRadius:20,padding:"4px 12px",fontSize:11,cursor:"pointer"}}>{c}</button>)}
            </div>
            {showAddPro&&(
              <div style={{background:DK3,border:`1px solid ${GOLD}44`,borderRadius:12,padding:18,marginBottom:16}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:12,color:GL}}>{editPro?"Modifier":"Nouveau prompt"}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <input value={newPro.titre} onChange={e=>setNewPro(p=>({...p,titre:e.target.value}))} placeholder="Titre *" style={{...inp,gridColumn:"1 / -1"}}/>
                  <select value={newPro.categorie} onChange={e=>setNewPro(p=>({...p,categorie:e.target.value}))} style={inp}>{PRCATS.map(c=><option key={c}>{c}</option>)}</select>
                  <input value={newPro.tags} onChange={e=>setNewPro(p=>({...p,tags:e.target.value}))} placeholder="Tags séparés par virgule" style={inp}/>
                  <textarea value={newPro.contenu} onChange={e=>setNewPro(p=>({...p,contenu:e.target.value}))} placeholder="Contenu... Utilise [VARIABLE]" rows={5} style={{...inp,gridColumn:"1 / -1",resize:"vertical",fontFamily:"monospace",fontSize:12,lineHeight:1.7}}/>
                  <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,cursor:"pointer",color:TX2}}><input type="checkbox" checked={newPro.favori} onChange={e=>setNewPro(p=>({...p,favori:e.target.checked}))}/> Favori ⭐</label>
                </div>
                <div style={{display:"flex",gap:8}}><button onClick={addPro} style={{background:gg(),color:"#000",fontWeight:800,border:"none",borderRadius:8,padding:"8px 20px",cursor:"pointer",fontSize:13}}>{editPro?"Sauvegarder":"Ajouter"}</button><button onClick={()=>{setShowAddPro(false);setEditPro(null);}} style={{background:"transparent",color:TX2,border:"1px solid #333",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:13}}>Annuler</button></div>
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {filtPr.length===0&&<div style={{color:TX2,fontSize:13,padding:24,textAlign:"center"}}>Aucun prompt.</div>}
              {filtPr.map(p=>(
                <div key={p.id} style={{background:DK3,border:`1px solid ${p.favori?`${GOLD}55`:"#222"}`,borderRadius:12,overflow:"hidden"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px",cursor:"pointer"}} onClick={()=>setExpandedId(expandedId===p.id?null:p.id)}>
                    <button onClick={e=>{e.stopPropagation();togFav(p.id);}} style={{background:"transparent",border:"none",fontSize:16,cursor:"pointer",padding:0}}>{p.favori?"⭐":"☆"}</button>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:14}}>{p.titre}</div>
                      <div style={{display:"flex",gap:6,marginTop:5,flexWrap:"wrap",alignItems:"center"}}>
                        <span style={{background:PRCOLS[p.categorie]||"#333",color:"#fff",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20}}>{p.categorie}</span>
                        {p.tags.map(t=><span key={t} style={{background:DK4,border:"1px solid #333",color:TX2,fontSize:10,padding:"2px 7px",borderRadius:20}}>#{t}</span>)}
                        <span style={{fontSize:11,color:MU}}>↗ {p.utilisation} utilisations</span>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6,flexShrink:0}}>
                      <button onClick={e=>{e.stopPropagation();cpPro(p);}} style={{background:copiedId===p.id?"#27AE6022":`${GOLD}22`,border:`1px solid ${copiedId===p.id?"#27AE60":GOLD}55`,color:copiedId===p.id?"#27AE60":GL,borderRadius:7,padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>{copiedId===p.id?"✓ Copié!":"📋 Copier"}</button>
                      <button onClick={e=>{e.stopPropagation();startEP(p);}} style={{background:"transparent",border:"1px solid #333",color:TX2,borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:12}}>✏️</button>
                      <button onClick={e=>{e.stopPropagation();delPro(p.id);}} style={{background:"transparent",border:"1px solid #C0392B44",color:"#C0392B",borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:12}}>×</button>
                    </div>
                    <span style={{color:TX2,fontSize:12}}>{expandedId===p.id?"▲":"▼"}</span>
                  </div>
                  {expandedId===p.id&&(
                    <div style={{padding:"0 16px 16px"}}>
                      <div style={{background:DK4,border:"1px solid #2a2a2a",borderRadius:8,padding:14,fontFamily:"monospace",fontSize:12,lineHeight:1.8,color:TX,whiteSpace:"pre-wrap"}}>
                        {p.contenu.split(/(\[[A-Z_]+\])/).map((part,i)=>/^\[[A-Z_]+\]$/.test(part)?<span key={i} style={{background:`${GOLD}33`,color:GL,borderRadius:4,padding:"1px 4px",fontWeight:700}}>{part}</span>:part)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ AGENDA ══ */}
        {tab==="calendar"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontSize:18,fontWeight:800}}>Agenda</div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <button onClick={()=>setCalDate(new Date(yr,mo-1,1))} style={{background:DK3,border:"1px solid #333",color:TX,borderRadius:6,padding:"4px 12px",cursor:"pointer"}}>‹</button>
                <span style={{fontSize:14,fontWeight:700,minWidth:130,textAlign:"center"}}>{MONTHS[mo]} {yr}</span>
                <button onClick={()=>setCalDate(new Date(yr,mo+1,1))} style={{background:DK3,border:"1px solid #333",color:TX,borderRadius:6,padding:"4px 12px",cursor:"pointer"}}>›</button>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",gap:2,marginBottom:4}}>
              {DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:11,color:TX2,fontWeight:700,padding:"6px 0"}}>{d}</div>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",gap:2}}>
              {Array(fd).fill(null).map((_,i)=><div key={`e${i}`} style={{background:DK2,borderRadius:6,minHeight:70}}/>)}
              {Array(dm).fill(null).map((_,i)=>{
                const day=i+1,ds=`${yr}-${String(mo+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const dt=tbd[ds]||[],isT=ds==="2026-04-20";
                return<div key={day} style={{background:isT?`${GOLD}18`:DK3,border:isT?`1px solid ${GOLD}`:"1px solid #1e1e1e",borderRadius:6,minHeight:70,padding:6}}>
                  <div style={{fontSize:12,fontWeight:isT?800:400,color:isT?GL:TX2,marginBottom:4}}>{day}</div>
                  {dt.slice(0,2).map(t=><div key={t.id} style={{fontSize:9,background:t.priority==="Haute"?`${GOLD}33`:DK4,borderRadius:3,padding:"2px 4px",marginBottom:2,color:t.priority==="Haute"?GL:TX2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>)}
                  {dt.length>2&&<div style={{fontSize:9,color:MU}}>+{dt.length-2}</div>}
                </div>;
              })}
            </div>
          </div>
        )}

        {/* ══ AI ══ */}
        {tab==="ai"&&(
          <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 200px)",maxHeight:600}}>
            <div style={{fontSize:18,fontWeight:800,marginBottom:4}}>✦ Assistant IA Growth Plan</div>
            <div style={{fontSize:12,color:TX2,marginBottom:16}}>Alimenté par Claude · Contexte de tes tâches inclus</div>
            <div ref={chatRef} style={{flex:1,overflowY:"auto",background:DK3,border:"1px solid #222",borderRadius:12,padding:16,display:"flex",flexDirection:"column",gap:12}}>
              {aiMsgs.map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                  <div style={{background:m.role==="user"?gg():DK4,color:m.role==="user"?"#000":TX,borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"10px 14px",maxWidth:"80%",fontSize:13,lineHeight:1.6,fontWeight:m.role==="user"?600:400,border:m.role==="user"?"none":"1px solid #2a2a2a",whiteSpace:"pre-wrap"}}>{m.content}</div>
                </div>
              ))}
              {aiLoading&&<div style={{display:"flex",justifyContent:"flex-start"}}><div style={{background:DK4,border:"1px solid #2a2a2a",borderRadius:"16px 16px 16px 4px",padding:"10px 16px",color:GOLD}}>⋯ En train de réfléchir</div></div>}
            </div>
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <input value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendAI()} placeholder="Planifie ma semaine, priorise mes tâches..." style={{...inp,flex:1,padding:"12px 16px"}}/>
              <button onClick={sendAI} disabled={aiLoading||!aiInput.trim()} style={{background:aiLoading?MU:gg(),color:"#000",fontWeight:800,border:"none",borderRadius:8,padding:"0 20px",cursor:aiLoading?"default":"pointer",fontSize:18}}>➤</button>
            </div>
            <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
              {["Planifie ma semaine","Quelles sont mes priorités?","Rédige un follow-up client","Aide-moi à débloquer une tâche"].map(p=>(
                <button key={p} onClick={()=>setAiInput(p)} style={{background:"transparent",border:"1px solid #333",borderRadius:20,color:TX2,fontSize:11,padding:"4px 12px",cursor:"pointer"}}>{p}</button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
