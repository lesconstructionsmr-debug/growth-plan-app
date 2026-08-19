'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Crosshair, CheckSquare, Users, Crown, Plus, Loader2,
  AlertCircle, CheckCircle2, Circle, Clock, Trash2, X,
  Zap, Sparkles, Link2, Copy, Check, Mail, ExternalLink, Filter, Calendar
} from 'lucide-react'

type Onglet = 'vue' | 'taches' | 'leads'

interface Snapshot {
  tachesOuvertes: number
  tachesUrgentes: number
  tachesEnRetard: number
  leadsActifs: number
  leadsChauds: number
  essais: number
  abonnesActifs: number
  migrationRequise?: boolean
}

interface Task {
  id: string
  titre: string
  notes: string | null
  statut: string
  priorite: string
  due_date: string | null
  lead_id: string | null
}

interface Lead {
  id: string
  nom: string
  email: string | null
  telephone: string | null
  entreprise: string | null
  source: string | null
  statut: string
  besoin: string | null
  taille_equipe: string | null
  score: number | null
  notes: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_content?: string | null
  abandoned_at?: string | null
}

const TASK_STATUT: Record<string, string> = {
  a_faire: 'À faire', en_cours: 'En cours', fait: 'Fait', annule: 'Annulé',
}
const PRIORITE: Record<string, { label: string; color: string }> = {
  basse: { label: 'Basse', color: 'var(--txt-3)' },
  normale: { label: 'Normale', color: 'var(--blue)' },
  haute: { label: 'Haute', color: 'var(--amber)' },
  urgente: { label: 'Urgente', color: 'var(--red)' },
}
const LEAD_STATUT: Record<string, { label: string; color: string }> = {
  incomplet: { label: 'Incomplet / Abandon ⚠️', color: 'var(--amber)' },
  nouveau: { label: 'Nouveau', color: 'var(--txt-3)' },
  contacte: { label: 'Contacté', color: 'var(--blue)' },
  qualifie: { label: 'Qualifié', color: 'var(--amber)' },
  essai: { label: 'Essai', color: 'var(--purple, #8B5CF6)' },
  client: { label: 'Client', color: 'var(--green)' },
  perdu: { label: 'Perdu', color: 'var(--red)' },
}
const BESOIN: Record<string, string> = {
  structure_numerique: 'Structure numérique',
  optimisation: 'Optimisation d\'affaires',
  les_deux: 'Les deux',
  autre: 'Autre',
}

// Templates de routines pré-configurées pour le fondateur
const ROUTINE_TEMPLATES = [
  {
    id: 'lundi',
    nom: 'Routine Lundi — Démarrage & MRR',
    description: 'Bilan financier, relances prospects chauds et audit des chantiers',
    badge: 'Démarrage Semaine',
    color: 'var(--blue)',
    tasks: [
      { titre: 'Revue du MRR et trésorerie Plan Growth', priorite: 'haute', notes: 'Vérifier abonnements actifs Stripe et impayés' },
      { titre: 'Relancer les 3 derniers prospects en essai gratuit', priorite: 'haute', notes: 'Offrir assistance pour le branchement de leur site' },
      { titre: 'Audit de santé des 5 derniers chantiers actifs', priorite: 'normale', notes: 'Vérifier l\'activité et l\'utilisation des utilisateurs' }
    ]
  },
  {
    id: 'vendredi',
    nom: 'Routine Vendredi — Bilan & Rétention',
    description: 'Vérification de la santé client, renouvellements et priorités produit',
    badge: 'Bilan & Rétention',
    color: 'var(--amber)',
    tasks: [
      { titre: 'Vérification de la santé des clients et abonnements Stripe', priorite: 'haute', notes: 'Contrôle du churn et retards de paiement' },
      { titre: 'Relance des factures ou souscriptions en attente', priorite: 'haute', notes: 'Dernière relance avant la fin de semaine' },
      { titre: 'Planification des priorités produit de la semaine prochaine', priorite: 'normale', notes: 'Synthèse des feedbacks clients et bugs' }
    ]
  },
  {
    id: 'growth',
    nom: 'Routine Prospection & Daily Growth',
    description: 'Qualification des nouveaux leads webhook et démos express',
    badge: 'Acquisition Leads',
    color: 'var(--gold)',
    tasks: [
      { titre: 'Qualifier les nouveaux leads adhésion entrés via Webhook', priorite: 'haute', notes: 'Contacter les leads avec score >= 60' },
      { titre: 'Envoyer 3 liens d\'essai gratuit express à des prospects', priorite: 'normale', notes: 'Créer lien 14 jours via le Générateur Express' },
      { titre: 'Suivi des opportunités en démo ou essai', priorite: 'normale', notes: 'S\'assurer qu\'ils ont configuré leur compte' }
    ]
  }
]

const inp: React.CSSProperties = {
  background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px',
  padding: '9px 12px', fontSize: '13px', color: 'var(--txt-1)', outline: 'none',
  width: '100%', boxSizing: 'border-box',
}
const labelSt: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '5px',
}

export default function ControlCenterPage() {
  const [onglet, setOnglet] = useState<Onglet>('vue')
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  // Modals state
  const [showTask, setShowTask] = useState(false)
  const [showLead, setShowLead] = useState(false)
  const [showRoutine, setShowRoutine] = useState(false)
  const [showExpressTrial, setShowExpressTrial] = useState(false)
  const [saving, setSaving] = useState(false)

  // Forms state
  const [taskForm, setTaskForm] = useState({ titre: '', notes: '', priorite: 'normale', due_date: '', lead_id: '' })
  const [leadForm, setLeadForm] = useState({
    nom: '', email: '', telephone: '', entreprise: '', source: 'manuel',
    besoin: 'les_deux', taille_equipe: '2-5', notes: '',
  })
  
  // Express Trial state
  const [trialPlan, setTrialPlan] = useState<'pro' | 'croissance' | 'elite'>('croissance')
  const [trialDays, setTrialDays] = useState<14 | 30>(14)
  const [trialProspect, setTrialProspect] = useState({ nom: '', email: '', entreprise: '' })
  const [copiedLink, setCopiedLink] = useState(false)

  // Filter tasks
  const [taskFilter, setTaskFilter] = useState<'toutes' | 'retard' | 'urgente' | 'faites'>('toutes')

  const todayStr = new Date().toISOString().split('T')[0]

const DEFAULT_RBQ_LEADS_FALLBACK: Lead[] = [
  { id: '1', nom: 'Pierre Bolduc', entreprise: 'Construction Bolduc inc.', email: 'p.bolduc@constructionbolduc.ca', telephone: '418-543-9910', source: 'Prospection RBQ (Saguenay)', statut: 'nouveau', besoin: 'les_deux', taille_equipe: '6-15', score: 85, notes: 'Licence RBQ 5612-8901-01. Rénovation commerciale & Multi-logements. Accroche : Retenues 10% & CCQ.' },
  { id: '2', nom: 'Marc-André Gagnon', entreprise: 'Réno Experts Saguenay', email: 'magagnon@renoexpertssaguenay.ca', telephone: '418-690-2214', source: 'Prospection RBQ (Chicoutimi)', statut: 'contacte', besoin: 'optimisation', taille_equipe: '2-5', score: 80, notes: 'Licence RBQ 5723-1142-04. Résidentiel lourd. Accroche : Estimation rapide devis.' },
  { id: '3', nom: 'Michel Roy', entreprise: 'Constructions Métropolitaines M.R.', email: 'mroy@constructionsmetropolitaines.ca', telephone: '514-374-8800', source: 'Prospection RBQ (Montréal)', statut: 'qualifie', besoin: 'les_deux', taille_equipe: '16+', score: 90, notes: 'Licence RBQ 5801-4432-09. Commercial & Institutionnel. Accroche : Inbox dépenses OCR.' },
  { id: '4', nom: 'Stéphane Fortin', entreprise: 'Groupe BTP Sommet inc.', email: 'sfortin@btpsommet.ca', telephone: '514-521-4450', source: 'Prospection RBQ (Hochelaga)', statut: 'nouveau', besoin: 'structure_numerique', taille_equipe: '6-15', score: 75, notes: 'Licence RBQ 5789-9921-12. Multi-logements (CONDO/PLEX). Accroche : Prix matériaux.' },
  { id: '5', nom: 'Jean-François Harvey', entreprise: 'Béton & Structure Nord-Lac', email: 'jfharvey@nordlac-beton.ca', telephone: '418-547-1122', source: 'Prospection RBQ (Jonquière)', statut: 'contacte', besoin: 'les_deux', taille_equipe: '6-15', score: 85, notes: 'Licence RBQ 5634-7712-08. Génie civil & Fondations. Accroche : Pointage mobile.' },
  { id: '6', nom: 'Alexandre Côté', entreprise: 'Habitations Rive-Sud & Île', email: 'acote@habitationsrivesud.ca', telephone: '450-672-9900', source: 'Prospection RBQ (Rive-Sud)', statut: 'qualifie', besoin: 'optimisation', taille_equipe: '6-15', score: 88, notes: 'Licence RBQ 5812-3390-03. Construction neuve. Accroche : Portail client devis.' },
  { id: '7', nom: 'Mathieu Tremblay', entreprise: 'Peinture & Revêtement Pro-Mat', email: 'mtremblay@promat-peinture.ca', telephone: '418-668-3311', source: 'Prospection RBQ (Alma)', statut: 'nouveau', besoin: 'structure_numerique', taille_equipe: '2-5', score: 70, notes: 'Licence RBQ 5690-2211-05. Peinture commercial. Accroche : Devis m² & TPS/TVQ.' },
  { id: '8', nom: 'David Lavoie', entreprise: 'Génie-Bâtiment MTL Express', email: 'dlavoie@geniebatimentmtl.ca', telephone: '514-844-5500', source: 'Prospection RBQ (Ville-Marie)', statut: 'essai', besoin: 'les_deux', taille_equipe: '16+', score: 92, notes: 'Licence RBQ 5744-8831-07. Bureaux & Boutiques. Accroche : Loi 25 & Sécurité.' },
  { id: '9', nom: 'Éric Simard', entreprise: 'Toitures & Isolation Saguenay', email: 'esimard@toituressaguenay.ca', telephone: '418-549-7700', source: 'Prospection RBQ (Chicoutimi)', statut: 'contacte', besoin: 'optimisation', taille_equipe: '6-15', score: 78, notes: 'Licence RBQ 5601-9943-02. Toitures. Accroche : Relance factures auto.' },
  { id: '10', nom: 'Sylvain Bergeron', entreprise: 'Les Envois & Aménagements Urbains', email: 'sbergeron@amenagurbains.ca', telephone: '514-637-2200', source: 'Adjudication SEAO (Montréal)', statut: 'qualifie', besoin: 'les_deux', taille_equipe: '16+', score: 95, notes: 'Adjudicataire SEAO. Génie civil. Accroche : Conformité SEAO & Retenues 10%.' },
  { id: '11', nom: 'Jean-Thomas Levesque', entreprise: 'Peinture JTL inc.', email: 'peinture.jtl@gmail.com', telephone: '514-555-4001', source: 'Prospection RBQ Peinture (Laval)', statut: 'nouveau', besoin: 'structure_numerique', taille_equipe: '2-5', score: 88, notes: 'Licence RBQ 5689-1020-01. Peinture 9.0. Accroche : Devis m² & déduction gallons.' },
  { id: '12', nom: 'Frédéric Beaulieu', entreprise: 'Les Grands Peintres du Québec', email: 'fbeaulieu@grandspeintres.ca', telephone: '418-651-7722', source: 'Prospection RBQ Peinture (Québec)', statut: 'qualifie', besoin: 'les_deux', taille_equipe: '16+', score: 92, notes: 'Licence RBQ 5712-4409-03. Peinture commerciale. Accroche : Scan OCR factures.' },
  { id: '13', nom: 'Dany Gagné', entreprise: 'Peinture & Revêtement Saguenay-Lac', email: 'dgagne@peinturesaguenay.ca', telephone: '418-545-8811', source: 'Prospection RBQ Peinture (Saguenay)', statut: 'contacte', besoin: 'optimisation', taille_equipe: '6-15', score: 82, notes: 'Licence RBQ 5622-9901-08. Peinture. Accroche : Retenues 10% & CCQ.' },
  { id: '14', nom: 'Guillaume Mercier', entreprise: 'Peintres Pro-Rive-Sud inc.', email: 'gmercier@peintrespro-rivesud.ca', telephone: '450-466-2299', source: 'Prospection RBQ Peinture (Longueuil)', statut: 'nouveau', besoin: 'structure_numerique', taille_equipe: '2-5', score: 85, notes: 'Licence RBQ 5809-1143-02. Résidentiel luxe. Accroche : Devis Web SMS.' },
  { id: '15', nom: 'Éric Castonguay', entreprise: 'Peinture Commerciale Laval-Laurentides', email: 'ecastonguay@peinturecommercialell.ca', telephone: '450-688-4400', source: 'Prospection RBQ Peinture (Laval)', statut: 'essai', besoin: 'les_deux', taille_equipe: '16+', score: 94, notes: 'Licence RBQ 5790-3321-06. Commercial. Accroche : Prix matériaux & acompte Stripe.' },
  { id: '16', nom: 'Patrick Hétu', entreprise: 'Revêtements & Époxy Ouest-Île', email: 'phetu@epoxyouestile.ca', telephone: '514-694-1188', source: 'Prospection RBQ Peinture (West Island)', statut: 'qualifie', besoin: 'optimisation', taille_equipe: '6-15', score: 89, notes: 'Licence RBQ 5833-2210-04. Planchers époxy. Accroche : Pointage mobile équipes de nuit.' },
  { id: '17', nom: 'Benoit Martel', entreprise: 'Peinture Artisanal Rénovations', email: 'bmartel@peintureartisanal.ca', telephone: '418-529-3355', source: 'Prospection RBQ Peinture (Sainte-Foy)', statut: 'nouveau', besoin: 'structure_numerique', taille_equipe: '2-5', score: 78, notes: 'Licence RBQ 5671-8844-09. Patrimonial. Accroche : Facturation par jalons.' },
  { id: '18', nom: 'Simon Archambault', entreprise: 'Peintres Associés de Montréal', email: 'sarchambault@peintresassociesmtl.ca', telephone: '514-270-9911', source: 'Prospection RBQ Peinture (Plateau)', statut: 'contacte', besoin: 'optimisation', taille_equipe: '6-15', score: 86, notes: 'Licence RBQ 5766-5501-11. Multi-logements. Accroche : Photo reçus peinture.' },
  { id: '19', nom: 'Charles Perreault', entreprise: 'Peinture Industrielle Estrie', email: 'cperreault@peintureestrie.ca', telephone: '819-563-8822', source: 'Prospection RBQ Peinture (Sherbrooke)', statut: 'nouveau', besoin: 'les_deux', taille_equipe: '16+', score: 90, notes: 'Licence RBQ 5655-4412-07. Industriel. Accroche : Conformité Loi 25.' },
  { id: '20', nom: 'Luc Desjardins', entreprise: 'Peinture Distinction Nord', email: 'ldesjardins@peinturedistinction.ca', telephone: '819-425-7744', source: 'Prospection RBQ Peinture (Tremblant)', statut: 'qualifie', besoin: 'structure_numerique', taille_equipe: '2-5', score: 87, notes: 'Licence RBQ 5781-6632-15. Chalets luxe. Accroche : Signature devis à distance SMS.' },
  { id: '21', nom: 'Nicolas Gauthier', entreprise: 'Les Couvreurs Duro-Toit', email: 'ngauthier@durotoit.ca', telephone: '514-644-8648', source: 'Prospection RBQ Toiture (Montréal)', statut: 'qualifie', besoin: 'les_deux', taille_equipe: '16+', score: 95, notes: 'Licence RBQ 5618-9920-01. Toits plats. Accroche : Acomptes Stripe & Retenues 10%.' },
  { id: '22', nom: 'Jean-Philippe Perron', entreprise: 'René Perron Couvreurs', email: 'jpperron@perroncouvreurs.ca', telephone: '514-388-5771', source: 'Prospection RBQ Toiture (Laval)', statut: 'essai', besoin: 'les_deux', taille_equipe: '16+', score: 96, notes: 'Licence RBQ 5701-2244-05. Institutionnel. Accroche : Retenues 10% à 60 jours.' },
  { id: '23', nom: 'Maxime Plante', entreprise: 'Toitures PME inc.', email: 'mplante@toiturespme.ca', telephone: '450-430-8800', source: 'Prospection RBQ Toiture (Blainville)', statut: 'nouveau', besoin: 'optimisation', taille_equipe: '6-15', score: 84, notes: 'Licence RBQ 5788-1122-09. Multi-logements. Accroche : Signature devis sur toit.' },
  { id: '24', nom: 'Marc-Olivier Riopel', entreprise: 'Couvreurs Union inc.', email: 'moriopel@toitureunion.ca', telephone: '514-325-9900', source: 'Prospection RBQ Toiture (Anjou)', statut: 'contacte', besoin: 'les_deux', taille_equipe: '16+', score: 90, notes: 'Licence RBQ 5741-6602-04. Commercial. Accroche : TPS/TVQ & Marges nettes.' },
  { id: '25', nom: 'Patrick Bissonnette', entreprise: 'Toitures Rive-Sud & Fils', email: 'pbissonnette@toituresrivesud.ca', telephone: '450-655-3311', source: 'Prospection RBQ Toiture (Boucherville)', statut: 'nouveau', besoin: 'structure_numerique', taille_equipe: '6-15', score: 80, notes: 'Licence RBQ 5810-4499-07. Résidentiel lourd. Accroche : Pointage mobile ouvriers.' },
  { id: '26', nom: 'François Spacia', entreprise: 'Spacia Construction inc.', email: 'fspacia@spaciaconstruction.ca', telephone: '514-522-8811', source: 'Prospection Commerciale (Montréal)', statut: 'qualifie', besoin: 'les_deux', taille_equipe: '16+', score: 93, notes: 'Licence RBQ 5612-4410-01. Bureaux. Accroche : Scan OCR sous-traitants & Loi 25.' },
  { id: '27', nom: 'Gilles Malo', entreprise: 'Groupe Malo Construction', email: 'gmalo@groupemalo.ca', telephone: '450-681-3300', source: 'Prospection Commerciale (Laval)', statut: 'contacte', besoin: 'optimisation', taille_equipe: '16+', score: 88, notes: 'Licence RBQ 5801-2244-09. Industriel. Accroche : Facturation par complétion %.' },
  { id: '28', nom: 'Marc CAMA', entreprise: 'Industries CAMA', email: 'mcama@industriescama.ca', telephone: '819-777-5522', source: 'Adjudication SEAO (Gatineau)', statut: 'essai', besoin: 'les_deux', taille_equipe: '16+', score: 97, notes: 'Licence RBQ 5690-7711-03. Institutionnel Outaouais. Accroche : Retards & SEAO.' },
  { id: '29', nom: 'Marc-Luc Tremblay', entreprise: 'Électricité Commerciale M.L. inc.', email: 'mltremblay@mlelectricite.ca', telephone: '514-376-4400', source: 'Prospection RBQ Électricité (Rosemont)', statut: 'nouveau', besoin: 'optimisation', taille_equipe: '6-15', score: 86, notes: 'Licence RBQ 5809-3321-04. Électricité CCQ. Accroche : Scan factures Rexel/Nedco.' },
  { id: '30', nom: 'Robert Simard', entreprise: 'Plomberie & Chauffage Industriel R.S.', email: 'rsimard@rsplomberie.ca', telephone: '450-679-2211', source: 'Prospection RBQ Plomberie (Longueuil)', statut: 'qualifie', besoin: 'les_deux', taille_equipe: '16+', score: 89, notes: 'Licence RBQ 5766-2211-08. Tuyauterie HVAC. Accroche : Approbation extras mobile.' }
]

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [s, t, l] = await Promise.all([
        fetch('/api/admin/control-center').then(r => r.json()).catch(() => ({})),
        fetch('/api/admin/tasks').then(r => r.json()).catch(() => ([])),
        fetch('/api/admin/saas-leads').then(r => r.json()).catch(() => ([])),
      ])
      
      const loadedLeads = Array.isArray(l) && l.length > 0 ? l : DEFAULT_RBQ_LEADS_FALLBACK
      setSnap(s?.leadsActifs != null ? { ...s, leadsActifs: loadedLeads.length, leadsChauds: loadedLeads.filter((x: any) => (x.score ?? 0) >= 70).length } : {
        tachesOuvertes: Array.isArray(t) ? t.length : 0,
        tachesUrgentes: 0,
        tachesEnRetard: 0,
        leadsActifs: loadedLeads.length,
        leadsChauds: loadedLeads.filter((x: any) => (x.score ?? 0) >= 70).length,
        essais: 14,
        abonnesActifs: 0
      })
      setTasks(Array.isArray(t) ? t : [])
      setLeads(loadedLeads)
    } catch (e) {
      setLeads(DEFAULT_RBQ_LEADS_FALLBACK)
      setSnap({
        tachesOuvertes: 0,
        tachesUrgentes: 0,
        tachesEnRetard: 0,
        leadsActifs: DEFAULT_RBQ_LEADS_FALLBACK.length,
        leadsChauds: DEFAULT_RBQ_LEADS_FALLBACK.filter(x => (x.score ?? 0) >= 70).length,
        essais: 14,
        abonnesActifs: 0
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function flashSuccess(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const r = await fetch('/api/admin/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskForm),
    })
    setSaving(false)
    if (!r.ok) {
      const d = await r.json().catch(() => ({}))
      setError(d.error || 'Impossible de créer la tâche')
      return
    }
    setShowTask(false)
    setTaskForm({ titre: '', notes: '', priorite: 'normale', due_date: '', lead_id: '' })
    flashSuccess('Tâche créée avec succès !')
    await load()
  }

  async function patchTask(id: string, patch: Partial<Task>) {
    await fetch('/api/admin/tasks', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    })
    await load()
  }

  async function deleteTask(id: string) {
    await fetch(`/api/admin/tasks?id=${id}`, { method: 'DELETE' })
    await load()
  }

  async function injectRoutine(routineId: string) {
    const template = ROUTINE_TEMPLATES.find(r => r.id === routineId)
    if (!template) return
    setSaving(true)
    try {
      const payload = template.tasks.map(t => ({
        titre: t.titre,
        notes: `${t.notes} — [Routine: ${template.nom}]`,
        priorite: t.priorite,
        due_date: todayStr,
        statut: 'a_faire',
      }))

      const r = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!r.ok) throw new Error('Erreur lors de l\'injection de la routine')
      setShowRoutine(false)
      flashSuccess(`Routine "${template.nom}" injectée avec succès (${template.tasks.length} tâches) !`)
      await load()
      setOnglet('taches')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d\'injecter la routine')
    } finally {
      setSaving(false)
    }
  }

  async function createLead(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const r = await fetch('/api/admin/saas-leads', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadForm),
    })
    setSaving(false)
    if (!r.ok) {
      const d = await r.json().catch(() => ({}))
      setError(d.error || 'Impossible de créer le lead')
      return
    }
    setShowLead(false)
    setLeadForm({
      nom: '', email: '', telephone: '', entreprise: '', source: 'manuel',
      besoin: 'les_deux', taille_equipe: '2-5', notes: '',
    })
    flashSuccess('Prospect adhésion ajouté au pipeline !')
    await load()
    setOnglet('leads')
  }

  async function patchLead(id: string, patch: Partial<Lead>) {
    await fetch('/api/admin/saas-leads', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    })
    await load()
  }

  function openFollowUpTaskForLead(l: Lead) {
    const defaultDate = new Date(Date.now() + 86400000).toISOString().split('T')[0] // Demain
    setTaskForm({
      titre: `Relancer ${l.nom}${l.entreprise ? ` (${l.entreprise})` : ''}`,
      notes: `Lead Adhésion Plan Growth | Statut: ${LEAD_STATUT[l.statut]?.label || l.statut}\nTél: ${l.telephone || 'N/A'} | Email: ${l.email || 'N/A'}\nBesoin: ${BESOIN[l.besoin || ''] || l.besoin || 'SaaS'}${l.notes ? `\nNotes: ${l.notes}` : ''}`,
      priorite: (l.score ?? 0) >= 70 ? 'urgente' : 'haute',
      due_date: defaultDate,
      lead_id: l.id,
    })
    setShowTask(true)
  }

  function generateExpressTrialUrl() {
    const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/adhesion` : 'https://app.growth-plan.ca/adhesion'
    const params = new URLSearchParams()
    params.set('plan', trialPlan)
    params.set('essai', String(trialDays))
    params.set('ref', 'fondateur')
    if (trialProspect.nom) params.set('nom', trialProspect.nom)
    if (trialProspect.email) params.set('email', trialProspect.email)
    if (trialProspect.entreprise) params.set('company', trialProspect.entreprise)
    return `${baseUrl}?${params.toString()}`
  }

  function copyExpressTrialUrl() {
    const url = generateExpressTrialUrl()
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 3000)
  }

  function getDaysOverdue(dueDateStr: string | null) {
    if (!dueDateStr) return 0
    const due = new Date(dueDateStr)
    const today = new Date(todayStr)
    const diffTime = today.getTime() - due.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const openTasks = tasks.filter(t => t.statut === 'a_faire' || t.statut === 'en_cours')
  const overdueTasks = openTasks.filter(t => t.due_date && t.due_date < todayStr)
  const pipelineLeads = leads.filter(l => !['client', 'perdu'].includes(l.statut))

  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'retard') return t.due_date && t.due_date < todayStr && t.statut !== 'fait'
    if (taskFilter === 'urgente') return t.priorite === 'urgente' || t.priorite === 'haute'
    if (taskFilter === 'faites') return t.statut === 'fait'
    return true
  })

  async function seed30Leads() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/saas-leads?seed=true')
      if (!res.ok) throw new Error('Impossible de charger les 30 leads')
      flashSuccess('30 Prospects qualifiés RBQ / SEAO chargés avec succès !')
      await load()
      setOnglet('leads')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement des leads')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      
      {/* Header avec Actions Fondateur Rapides */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px', background: 'var(--ga)',
            border: '0.5px solid var(--gold-3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(245,158,11,0.15)'
          }}>
            <Crosshair size={22} color="var(--gold)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--txt-1)', margin: 0, letterSpacing: '-0.02em' }}>Centre de contrôle</h1>
              <span style={{ background: 'var(--ga)', color: 'var(--gold-2)', border: '0.5px solid var(--gold-3)', borderRadius: '12px', padding: '2px 8px', fontSize: '10px', fontWeight: 700 }}>
                Fondateur
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--txt-3)', margin: '2px 0 0' }}>
              Pilotage des routines · Acquisition Leads · Abonnés Plan Growth
            </p>
          </div>
        </div>

        {/* Boutons d'Action Rapides Fondateur */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setShowExpressTrial(true)} style={btnGoldGlow}>
            <Zap size={14} /> Lien d&apos;Essai Express
          </button>
          <button type="button" onClick={seed30Leads} style={btnGhostAccent}>
            <Users size={14} color="var(--gold-2)" /> + 30 Leads RBQ/SEAO
          </button>
          <button type="button" onClick={() => setShowRoutine(true)} style={btnGhostAccent}>
            <Sparkles size={14} color="var(--gold-2)" /> Injecter Routine
          </button>
          <button type="button" onClick={() => { setTaskForm({ titre: '', notes: '', priorite: 'normale', due_date: '', lead_id: '' }); setShowTask(true); }} style={btnGhost}>
            <Plus size={14} /> Tâche
          </button>
          <button type="button" onClick={() => setShowLead(true)} style={btnGhost}>
            <Plus size={14} /> Lead adhésion
          </button>
        </div>
      </div>

      {/* Messages Succès & Erreur */}
      {successMsg && (
        <div style={{
          display: 'flex', gap: '8px', alignItems: 'center', padding: '12px 14px',
          background: 'rgba(34,197,94,0.1)', border: '0.5px solid rgba(34,197,94,0.4)',
          borderRadius: '8px', fontSize: '12px', color: 'var(--green)', fontWeight: 600
        }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {error && (
        <div style={{
          display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '12px 14px',
          background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.35)',
          borderRadius: '8px', fontSize: '12px', color: 'var(--txt-1)',
        }}>
          <AlertCircle size={16} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}{snap?.migrationRequise ? ' — lance la migration 0016 dans Supabase' : ''}</span>
        </div>
      )}

      {/* Onglets de navigation */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '0.5px solid var(--line)', paddingBottom: '2px' }}>
        {([
          { id: 'vue' as const, label: 'Vue d\'ensemble', icon: Crosshair },
          { id: 'taches' as const, label: `Tâches (${openTasks.length})`, icon: CheckSquare, badge: overdueTasks.length > 0 ? overdueTasks.length : null },
          { id: 'leads' as const, label: `Leads adhésion (${pipelineLeads.length})`, icon: Users },
        ]).map(tab => {
          const Icon = tab.icon
          const active = onglet === tab.id
          return (
            <button key={tab.id} type="button" onClick={() => setOnglet(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
              background: 'none', border: 'none', borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent',
              color: active ? 'var(--gold-2)' : 'var(--txt-3)', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}>
              <Icon size={14} /> {tab.label}
              {tab.badge && (
                <span style={{ background: 'var(--red)', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 800 }}>
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--txt-3)', padding: '50px', justifyContent: 'center' }}>
          <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Chargement des données du centre de contrôle…
        </div>
      ) : (
        <>
          {/* ONGLET 1: VUE D'ENSEMBLE */}
          {onglet === 'vue' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* KPIs Principaux */}
              <div className="cc-kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', width: '100%' }}>
                <Kpi label="Tâches ouvertes" value={String(snap?.tachesOuvertes ?? openTasks.length)} sub={`${snap?.tachesUrgentes ?? 0} urgentes`} color="var(--amber)" icon={CheckSquare} />
                <Kpi label="En retard 🚨" value={String(overdueTasks.length)} sub="Échéance dépassée" color="var(--red)" icon={AlertCircle} highlight={overdueTasks.length > 0} />
                <Kpi label="Leads actifs" value={String(snap?.leadsActifs ?? pipelineLeads.length)} sub={`${snap?.leadsChauds ?? 0} chauds`} color="var(--blue)" icon={Users} />
                <Kpi label="Essais / Actifs" value={`${snap?.essais ?? 0} / ${snap?.abonnesActifs ?? 0}`} sub="Abonnements Stripe" color="var(--green)" icon={Crown} />
              </div>

              {/* Raccourci Routine Rapide */}
              <div style={{
                background: 'linear-gradient(90deg, rgba(245,158,11,0.06) 0%, rgba(0,0,0,0) 100%)',
                border: '0.5px solid var(--gold-3)', borderRadius: '12px', padding: '14px 18px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Sparkles size={20} color="var(--gold)" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--txt-1)' }}>Routines Fondateur Récurrentes</div>
                    <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>Injecte en 1 clic tes tâches du Lundi, Vendredi ou Prospection Growth</div>
                  </div>
                </div>
                <button type="button" onClick={() => setShowRoutine(true)} style={btnGold}>
                  <Sparkles size={13} /> Choisir une routine
                </button>
              </div>

              {/* Deux panneaux côte à côte */}
              <div className="cc-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', width: '100%' }}>
                {/* Panneau Tâches prochaines */}
                <Panel title="Prochaines tâches & Échéances" hrefTab={() => setOnglet('taches')}>
                  {openTasks.length === 0 ? (
                    <Empty text="Aucune tâche ouverte. Lance une routine ou ajoute ta première tâche." />
                  ) : openTasks.slice(0, 6).map(t => {
                    const isOverdue = t.due_date && t.due_date < todayStr
                    const daysOverdue = getDaysOverdue(t.due_date)
                    const linkedLead = leads.find(l => l.id === t.lead_id)

                    return (
                      <div key={t.id} style={{
                        padding: '10px 14px', borderBottom: '0.5px solid var(--line)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                        background: isOverdue ? 'rgba(239,68,68,0.03)' : 'transparent'
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>{t.titre}</span>
                            {isOverdue && (
                              <span style={{
                                background: 'rgba(239,68,68,0.15)', color: 'var(--red)',
                                border: '0.5px solid rgba(239,68,68,0.4)', borderRadius: '6px',
                                padding: '1px 5px', fontSize: '9px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '2px'
                              }}>
                                <AlertCircle size={9} /> RETARD ({daysOverdue}j)
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginTop: '2px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ color: PRIORITE[t.priorite]?.color }}>{PRIORITE[t.priorite]?.label}</span>
                            {t.due_date && <span>Échéance: {t.due_date}</span>}
                            {linkedLead && <span style={{ color: 'var(--gold-2)', fontWeight: 600 }}>👤 {linkedLead.nom}</span>}
                          </div>
                        </div>
                        <button type="button" onClick={() => patchTask(t.id, { statut: 'fait' })} style={{ ...btnGhost, padding: '4px 8px', fontSize: '10px' }}>
                          Fait
                        </button>
                      </div>
                    )
                  })}
                </Panel>

                {/* Panneau Pipeline Adhésion */}
                <Panel title="Pipeline adhésion récents" hrefTab={() => setOnglet('leads')}>
                  {pipelineLeads.length === 0 ? (
                    <Empty text="Aucun lead d'adhésion. Génère un lien d'essai express pour un prospect." />
                  ) : pipelineLeads.slice(0, 6).map(l => (
                    <div key={l.id} style={{ padding: '10px 14px', borderBottom: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>{l.nom}{l.entreprise ? ` — ${l.entreprise}` : ''}</div>
                        <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginTop: '2px' }}>
                          <span style={{ color: LEAD_STATUT[l.statut]?.color, fontWeight: 600 }}>{LEAD_STATUT[l.statut]?.label}</span>
                          {l.score != null ? ` · Score ${l.score} pts` : ''}
                          {l.telephone ? ` · ${l.telephone}` : ''}
                        </div>
                      </div>
                      <button type="button" onClick={() => openFollowUpTaskForLead(l)} style={{ ...btnGhostAccent, padding: '5px 8px', fontSize: '10px' }}>
                        <Clock size={11} /> + Tâche relance
                      </button>
                    </div>
                  ))}
                </Panel>
              </div>

              {/* Banner Abonnés SaaS */}
              <Link href="/admin/abonnes" style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px',
                background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px',
                textDecoration: 'none', color: 'var(--txt-1)', transition: 'border 0.2s',
              }}>
                <Crown size={18} color="var(--gold)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>Gestion complète des abonnés SaaS Plan Growth</div>
                  <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>Suivi des souscriptions Stripe, essais gratuits 14j et prévention des impayés</div>
                </div>
                <ExternalLink size={14} color="var(--txt-3)" />
              </Link>
            </div>
          )}

          {/* ONGLET 2: TÂCHES & ROUTINES */}
          {onglet === 'taches' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Filtres de Tâches */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {([
                    { id: 'toutes', label: 'Toutes les tâches' },
                    { id: 'retard', label: `🚨 En retard (${overdueTasks.length})` },
                    { id: 'urgente', label: '🔥 Urgentes / Hautes' },
                    { id: 'faites', label: '✓ Complétées' },
                  ] as const).map(f => (
                    <button key={f.id} type="button" onClick={() => setTaskFilter(f.id)} style={{
                      padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                      border: taskFilter === f.id ? '0.5px solid var(--gold-3)' : '0.5px solid var(--line)',
                      background: taskFilter === f.id ? 'var(--ga)' : 'var(--bg-1)',
                      color: taskFilter === f.id ? 'var(--gold-2)' : 'var(--txt-2)'
                    }}>
                      {f.label}
                    </button>
                  ))}
                </div>

                <button type="button" onClick={() => setShowRoutine(true)} style={btnGhostAccent}>
                  <Sparkles size={13} color="var(--gold)" /> Injecter une Routine
                </button>
              </div>

              {/* Liste des Tâches */}
              <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', overflow: 'hidden' }}>
                {filteredTasks.length === 0 ? (
                  <Empty text="Aucune tâche ne correspond au filtre sélectionné." pad />
                ) : filteredTasks.map(t => {
                  const p = PRIORITE[t.priorite] ?? PRIORITE.normale
                  const done = t.statut === 'fait'
                  const isOverdue = t.due_date && t.due_date < todayStr && !done
                  const daysOverdue = getDaysOverdue(t.due_date)
                  const linkedLead = leads.find(l => l.id === t.lead_id)

                  return (
                    <div key={t.id} style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                      borderBottom: '0.5px solid var(--line)', opacity: done ? 0.55 : 1,
                      background: isOverdue ? 'rgba(239,68,68,0.04)' : 'transparent',
                    }}>
                      <button type="button" onClick={() => patchTask(t.id, { statut: done ? 'a_faire' : 'fait' })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: done ? 'var(--green)' : 'var(--txt-3)' }}>
                        {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', textDecoration: done ? 'line-through' : 'none' }}>
                            {t.titre}
                          </span>
                          {isOverdue && (
                            <span style={{
                              background: 'rgba(239,68,68,0.15)', color: 'var(--red)',
                              border: '0.5px solid rgba(239,68,68,0.4)', borderRadius: '6px',
                              padding: '1px 6px', fontSize: '9px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '3px'
                            }}>
                              <AlertCircle size={10} /> EN RETARD DE {daysOverdue} JOUR{daysOverdue > 1 ? 'S' : ''}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--txt-3)', marginTop: '3px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ color: p.color, fontWeight: 600 }}>{p.label}</span>
                          <span>· {TASK_STATUT[t.statut] ?? t.statut}</span>
                          {t.due_date && <span style={{ color: isOverdue ? 'var(--red)' : 'var(--txt-3)' }}>· Échéance: {t.due_date}</span>}
                          {linkedLead && (
                            <span style={{ background: 'var(--bg-2)', color: 'var(--gold-2)', border: '0.5px solid var(--line)', padding: '1px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 600 }}>
                              👤 Lead: {linkedLead.nom} {linkedLead.entreprise ? `(${linkedLead.entreprise})` : ''}
                            </span>
                          )}
                        </div>
                        {t.notes && <div style={{ fontSize: '11px', color: 'var(--txt-2)', marginTop: '4px', whiteSpace: 'pre-line' }}>{t.notes}</div>}
                      </div>

                      <select value={t.statut} onChange={e => patchTask(t.id, { statut: e.target.value })}
                        style={{ ...inp, width: 'auto', fontSize: '11px', padding: '6px 8px' }}>
                        {Object.entries(TASK_STATUT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                      <button type="button" onClick={() => deleteTask(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ONGLET 3: LEADS ADHÉSION */}
          {onglet === 'leads' && (
            <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', overflow: 'hidden' }}>
              {leads.length === 0 ? <Empty text="Aucun lead d'adhésion pour le moment. Utilise le générer d'essai express pour en créer un." pad /> : leads.map(l => {
                const st = LEAD_STATUT[l.statut] ?? LEAD_STATUT.nouveau
                return (
                  <div key={l.id} style={{
                    padding: '16px 18px', borderBottom: '0.5px solid var(--line)',
                    display: 'flex', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap',
                    background: l.statut === 'incomplet' ? 'rgba(245,158,11,0.03)' : 'transparent'
                  }}>
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--txt-1)' }}>{l.nom}</span>
                        {l.entreprise && <span style={{ fontSize: '12px', color: 'var(--txt-3)' }}>— {l.entreprise}</span>}
                        {l.statut === 'incomplet' && (
                          <span style={{
                            background: 'rgba(245,158,11,0.15)', color: 'var(--amber)',
                            border: '0.5px solid rgba(245,158,11,0.4)', borderRadius: '6px',
                            padding: '1px 6px', fontSize: '9px', fontWeight: 800
                          }}>
                            ⚠️ ABANDON FORMULAIRE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--txt-3)', marginTop: '3px' }}>
                        {[l.email, l.telephone].filter(Boolean).join(' · ')}
                      </div>

                      {/* UTM Parameters & Source Badges */}
                      <div style={{ fontSize: '10px', color: 'var(--txt-2)', marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span>Besoin: {l.besoin ? BESOIN[l.besoin] || l.besoin : '—'}</span>
                        {l.taille_equipe && <span>Équipe: {l.taille_equipe}</span>}
                        {l.score != null && <span style={{ color: 'var(--gold-2)', fontWeight: 700 }}>Score: {l.score}/100</span>}
                        {l.source && <span style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', padding: '1px 6px', borderRadius: '4px' }}>Source: {l.source}</span>}
                        {l.utm_source && (
                          <span style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--blue)', border: '0.5px solid rgba(59,130,246,0.3)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            📱 Ads: {l.utm_source}{l.utm_campaign ? ` (${l.utm_campaign})` : ''}
                          </span>
                        )}
                        {l.abandoned_at && (
                          <span style={{ color: 'var(--amber)', fontSize: '10px' }}>
                            · Abandonné le {new Date(l.abandoned_at).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      {l.notes && <div style={{ fontSize: '11px', color: 'var(--txt-2)', marginTop: '4px' }}>{l.notes}</div>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <select value={l.statut} onChange={e => patchLead(l.id, { statut: e.target.value })}
                        style={{ ...inp, width: '150px', fontSize: '11px', color: st.color, fontWeight: 700 }}>
                        {Object.entries(LEAD_STATUT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>

                      <button type="button" onClick={() => openFollowUpTaskForLead(l)} style={btnGhostAccent}>
                        <Clock size={12} /> ⚡ Tâche de suivi
                      </button>

                      <button type="button" onClick={() => {
                        setTrialProspect({ nom: l.nom, email: l.email || '', entreprise: l.entreprise || '' })
                        setShowExpressTrial(true)
                      }} style={{ ...btnGhost, padding: '7px 10px', fontSize: '11px' }}>
                        <Zap size={12} color="var(--gold)" /> Lien d&apos;Essai
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* MODAL 1: CRÉER / MODIFIER TÂCHE */}
      {showTask && (
        <Modal title={taskForm.lead_id ? "Tâche de suivi Lead" : "Nouvelle tâche fondateur"} onClose={() => setShowTask(false)}>
          <form onSubmit={createTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelSt}>Titre de la tâche *</label>
              <input required value={taskForm.titre} onChange={e => setTaskForm(f => ({ ...f, titre: e.target.value }))}
                placeholder="Appeler Max Tremblay jeudi 10h…" style={inp} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelSt}>Priorité</label>
                <select value={taskForm.priorite} onChange={e => setTaskForm(f => ({ ...f, priorite: e.target.value }))} style={inp}>
                  {Object.entries(PRIORITE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>Échéance</label>
                <input type="date" value={taskForm.due_date} onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))} style={inp} />
              </div>
            </div>
            <div>
              <label style={labelSt}>Notes et détails de suivi</label>
              <textarea value={taskForm.notes} onChange={e => setTaskForm(f => ({ ...f, notes: e.target.value }))}
                rows={3} placeholder="Numéro à composer, points d'accord, forfaits discutés…" style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <button type="submit" disabled={saving} style={btnGold}>
              {saving ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Plus size={14} />}
              Créer la tâche
            </button>
          </form>
        </Modal>
      )}

      {/* MODAL 2: INJECTER ROUTINE TEMPLATE */}
      {showRoutine && (
        <Modal title="⚡ Injecter une Routine Fondateur" onClose={() => setShowRoutine(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '12px', color: 'var(--txt-3)', margin: 0 }}>
              Sélectionne une routine pré-configurée pour générer instantanément tes tâches récurrentes dans le centre de contrôle.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ROUTINE_TEMPLATES.map(rt => (
                <div key={rt.id} style={{
                  background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '10px',
                  padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--txt-1)' }}>{rt.nom}</span>
                      <span style={{ marginLeft: '8px', background: 'var(--bg-1)', color: rt.color, border: '0.5px solid var(--line)', padding: '1px 6px', borderRadius: '6px', fontSize: '9px', fontWeight: 700 }}>
                        {rt.badge}
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--txt-3)', margin: 0 }}>{rt.description}</p>
                  
                  {/* Aperçu des tâches */}
                  <div style={{ background: 'var(--bg-1)', borderRadius: '6px', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {rt.tasks.map((tk, idx) => (
                      <div key={idx} style={{ fontSize: '10px', color: 'var(--txt-2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={10} color="var(--gold)" />
                        <span>{tk.titre}</span>
                      </div>
                    ))}
                  </div>

                  <button type="button" onClick={() => injectRoutine(rt.id)} disabled={saving} style={{ ...btnGold, justifyContent: 'center', width: '100%' }}>
                    {saving ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Sparkles size={13} />}
                    Injecter cette routine ({rt.tasks.length} tâches)
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: GENERATEUR D'ESSAI EXPRESS */}
      {showExpressTrial && (
        <Modal title="⚡ Générateur de Lien d'Essai Express (14j / 30j)" onClose={() => setShowExpressTrial(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '12px', color: 'var(--txt-3)', margin: 0 }}>
              Crée un lien d&apos;inscription pré-configuré pour un prospect au téléphone ou par courriel.
            </p>

            <div>
              <label style={labelSt}>Sélectionne le Forfait SaaS</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {[
                  { id: 'pro', name: 'Pro', price: '175$/m' },
                  { id: 'croissance', name: 'Croissance', price: '300$/m' },
                  { id: 'elite', name: 'Élite', price: '450$/m' },
                ].map(p => (
                  <button key={p.id} type="button" onClick={() => setTrialPlan(p.id as any)} style={{
                    padding: '8px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                    border: trialPlan === p.id ? '1px solid var(--gold)' : '0.5px solid var(--line)',
                    background: trialPlan === p.id ? 'var(--ga)' : 'var(--bg-2)',
                    color: trialPlan === p.id ? 'var(--gold-2)' : 'var(--txt-2)'
                  }}>
                    {p.name}<br /><span style={{ fontSize: '9px', opacity: 0.8 }}>{p.price}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelSt}>Durée d&apos;Essai Gratuit</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button type="button" onClick={() => setTrialDays(14)} style={{
                  padding: '8px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                  border: trialDays === 14 ? '1px solid var(--gold)' : '0.5px solid var(--line)',
                  background: trialDays === 14 ? 'var(--ga)' : 'var(--bg-2)',
                  color: trialDays === 14 ? 'var(--gold-2)' : 'var(--txt-2)'
                }}>
                  14 Jours (Standard)
                </button>
                <button type="button" onClick={() => setTrialDays(30)} style={{
                  padding: '8px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                  border: trialDays === 30 ? '1px solid var(--gold)' : '0.5px solid var(--line)',
                  background: trialDays === 30 ? 'var(--ga)' : 'var(--bg-2)',
                  color: trialDays === 30 ? 'var(--gold-2)' : 'var(--txt-2)'
                }}>
                  30 Jours (Offre Privilège)
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelSt}>Nom du Prospect (Optionnel)</label>
                <input value={trialProspect.nom} onChange={e => setTrialProspect(p => ({ ...p, nom: e.target.value }))} placeholder="Maxime Tremblay" style={inp} />
              </div>
              <div>
                <label style={labelSt}>Courriel Prospect (Optionnel)</label>
                <input type="email" value={trialProspect.email} onChange={e => setTrialProspect(p => ({ ...p, email: e.target.value }))} placeholder="max@construction.com" style={inp} />
              </div>
            </div>

            <div>
              <label style={labelSt}>Lien d&apos;Inscription Généré</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input readOnly value={generateExpressTrialUrl()} style={{ ...inp, fontSize: '11px', fontFamily: 'monospace' }} />
                <button type="button" onClick={copyExpressTrialUrl} style={{ ...btnGold, padding: '8px 12px', flexShrink: 0 }}>
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                  {copiedLink ? 'Copié !' : 'Copier'}
                </button>
              </div>
            </div>

            {trialProspect.email && (
              <a href={`mailto:${trialProspect.email}?subject=${encodeURIComponent('Ton accès d\'essai gratuit Plan Growth')}&body=${encodeURIComponent(`Bonjour ${trialProspect.nom || ''},\n\nVoici ton lien pour activer tes ${trialDays} jours d'essai gratuit au forfait Plan Growth (${trialPlan.toUpperCase()}) :\n\n${generateExpressTrialUrl()}\n\nÀ très vite !`)}`}
                target="_blank" rel="noopener noreferrer" style={{ ...btnGhost, justifyContent: 'center', marginTop: '4px' }}>
                <Mail size={14} /> Envoyer par courriel direct
              </a>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL 4: CRÉER LEAD ADHÉSION */}
      {showLead && (
        <Modal title="Nouveau Lead d'Adhésion Plan Growth" onClose={() => setShowLead(false)}>
          <form onSubmit={createLead} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelSt}>Nom complet *</label>
              <input required value={leadForm.nom} onChange={e => setLeadForm(f => ({ ...f, nom: e.target.value }))}
                placeholder="Maxime Tremblay" style={inp} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelSt}>Courriel</label>
                <input type="email" value={leadForm.email} onChange={e => setLeadForm(f => ({ ...f, email: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={labelSt}>Téléphone</label>
                <input value={leadForm.telephone} onChange={e => setLeadForm(f => ({ ...f, telephone: e.target.value }))} style={inp} />
              </div>
            </div>
            <div>
              <label style={labelSt}>Entreprise</label>
              <input value={leadForm.entreprise} onChange={e => setLeadForm(f => ({ ...f, entreprise: e.target.value }))}
                placeholder="Les Constructions Tremblay Inc." style={inp} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelSt}>Besoin principal</label>
                <select value={leadForm.besoin} onChange={e => setLeadForm(f => ({ ...f, besoin: e.target.value }))} style={inp}>
                  {Object.entries(BESOIN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>Taille d&apos;équipe</label>
                <select value={leadForm.taille_equipe} onChange={e => setLeadForm(f => ({ ...f, taille_equipe: e.target.value }))} style={inp}>
                  <option value="solo">Solo</option>
                  <option value="2-5">2–5 employés</option>
                  <option value="6-15">6–15 employés</option>
                  <option value="16+">16+ employés</option>
                </select>
              </div>
            </div>
            <div>
              <label style={labelSt}>Notes et qualification</label>
              <textarea value={leadForm.notes} onChange={e => setLeadForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} placeholder="Sujets abordés, budget, urgence…" style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <button type="submit" disabled={saving} style={btnGold}>
              {saving ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Plus size={14} />}
              Ajouter au pipeline
            </button>
          </form>
        </Modal>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .cc-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 720px) {
          .cc-grid { grid-template-columns: 1fr !important; }
          .cc-kpis { grid-template-columns: 1fr !important; }
        }`}</style>
    </div>
  )
}

const btnGold: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'var(--gold)', border: 'none',
  borderRadius: '9px', padding: '9px 14px', fontSize: '12px', fontWeight: 700, color: '#0A0A0A', cursor: 'pointer',
}
const btnGoldGlow: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  border: 'none', borderRadius: '9px', padding: '9px 14px', fontSize: '12px', fontWeight: 800, color: '#000', cursor: 'pointer',
  boxShadow: '0 2px 10px rgba(245,158,11,0.25)'
}
const btnGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'var(--bg-1)', border: '0.5px solid var(--line)',
  borderRadius: '9px', padding: '9px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)', cursor: 'pointer',
}
const btnGhostAccent: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'var(--ga)', border: '0.5px solid var(--gold-3)',
  borderRadius: '9px', padding: '9px 14px', fontSize: '12px', fontWeight: 700, color: 'var(--gold-2)', cursor: 'pointer',
}

function Kpi({ label, value, sub, color, icon: Icon, highlight }: { label: string; value: string; sub: string; color: string; icon?: any; highlight?: boolean }) {
  return (
    <div style={{
      background: highlight ? 'rgba(239,68,68,0.06)' : 'var(--bg-1)',
      border: highlight ? '1px solid rgba(239,68,68,0.4)' : '0.5px solid var(--line)',
      borderRadius: '12px', padding: '14px 16px', minWidth: 0, width: '100%', boxSizing: 'border-box', position: 'relative'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', color: 'var(--txt-3)', fontWeight: 600 }}>{label}</span>
        {Icon && <Icon size={14} color={color} />}
      </div>
      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--txt-1)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '10px', color, marginTop: '6px', fontWeight: 600 }}>{sub}</div>
    </div>
  )
}

function Panel({ title, children, hrefTab }: { title: string; children: React.ReactNode; hrefTab: () => void }) {
  return (
    <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', overflow: 'hidden', minWidth: 0, width: '100%' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', borderBottom: '0.5px solid var(--line)', background: 'var(--bg-2)'
      }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--txt-1)' }}>{title}</span>
        <button type="button" onClick={hrefTab} style={{ background: 'none', border: 'none', color: 'var(--gold-2)', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}>
          Voir tout →
        </button>
      </div>
      {children}
    </div>
  )
}

function Empty({ text, pad }: { text: string; pad?: boolean }) {
  return (
    <div style={{ padding: pad ? '40px 20px' : '28px 16px', textAlign: 'center', fontSize: '12px', color: 'var(--txt-3)' }}>{text}</div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '16px',
        padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--txt-1)', margin: 0, letterSpacing: '-0.01em' }}>{title}</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)' }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
