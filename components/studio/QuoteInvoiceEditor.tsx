'use client'

import { useState } from 'react'
import {
  FileText, Receipt, Plus, Trash2, Check,
  Download, Eye, Send, Save, Building2, MapPin,
  Calendar, User, Percent, DollarSign, Shield,
  Paperclip, Tag, Clock, ChevronDown, Sparkles
} from 'lucide-react'
import { StudioLigneItem, useStudioCalculations, UpcomingPaymentItem } from '@/lib/hooks/useStudioCalculations'
import { UpcomingPaymentsSection } from './UpcomingPaymentsSection'
import { formatCad } from '@/lib/format'

export interface QuoteInvoiceEditorProps {
  clientId: string
  clientNom: string
  clientEmail: string
  clientTelephone: string
  clientAdresse: string
  clientVille: string
  initialDocType?: 'quote' | 'invoice'
  onSave?: (data: any) => Promise<void>
  onSend?: (data: any) => Promise<void>
}

const UNITES = ['h', 'u', 'pi²', 'pi lin.', 'forfait', 'm²', 'lot', 'verge', 'jour']

export function QuoteInvoiceEditor({
  clientId,
  clientNom,
  clientEmail,
  clientTelephone,
  clientAdresse,
  clientVille,
  initialDocType = 'quote',
  onSave,
  onSend,
}: QuoteInvoiceEditorProps) {
  // ── Types d'onglets de navigation interne ─────────────────────
  const [docType, setDocType] = useState<'quote' | 'invoice'>(initialDocType)
  const [activeTab, setActiveTab] = useState<'info' | 'items' | 'schedule' | 'terms' | 'attachments'>('items')

  // ── États du formulaire ─────────────────────────────────────────
  const [numero, setNumero] = useState(
    `${docType === 'quote' ? 'DEV' : 'FAC'}-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`
  )
  const [titre, setTitre] = useState('Rénovation & Travaux de construction')
  const [statut, setStatut] = useState<'brouillon' | 'envoye' | 'approuve' | 'facture'>('brouillon')
  const [dateEmission, setDateEmission] = useState(new Date().toISOString().split('T')[0])
  const [dateEcheance, setDateEcheance] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )

  // Section 1 : Contact & Chantier
  const [contactChantier, setContactChantier] = useState({ nom: clientNom, telephone: clientTelephone })
  const [adresseChantier, setAdresseChantier] = useState({
    adresse: clientAdresse || '1234 Rue Principale',
    ville: clientVille || 'Montréal, QC',
    accesNotes: 'Code portail #4421, stationnement dans l\'allée',
  })
  const [assignedTo, setAssignedTo] = useState('Maxime Rochon')
  const [tags, setTags] = useState<string[]>(['Rénovation', 'Priorité Haute'])

  // Section 2 : Lignes d'articles enrichies
  const [lignes, setLignes] = useState<StudioLigneItem[]>([
    {
      id: '1',
      description: 'Préparation du chantier, protection des planchers & bâches',
      quantite: 1,
      unite: 'forfait',
      prix_unitaire: 650,
      cout_unitaire: 200,
      total_ligne: 650,
      total_cout: 200,
      marge_pourcentage: 69.2,
    },
    {
      id: '2',
      description: 'Fourniture et pose de plancher de bois franc d\'ingénierie',
      quantite: 450,
      unite: 'pi²',
      prix_unitaire: 12.5,
      cout_unitaire: 7.2,
      total_ligne: 5625,
      total_cout: 3240,
      marge_pourcentage: 42.4,
    },
    {
      id: '3',
      description: 'Peinture de finition latex 2 couches (murs et plafonds)',
      quantite: 1,
      unite: 'forfait',
      prix_unitaire: 1800,
      cout_unitaire: 650,
      total_ligne: 1800,
      total_cout: 650,
      marge_pourcentage: 63.8,
    },
  ])

  const [masquerDetailsClient, setMasquerDetailsClient] = useState(false)
  const [rabaisValeur, setRabaisValeur] = useState(0)
  const [rabaisType, setRabaisType] = useState<'pourcentage' | 'montant'>('montant')
  const [appliquerTps, setAppliquerTps] = useState(true)
  const [appliquerTvq, setAppliquerTvq] = useState(true)

  // ── Moteur de Calcul Réactif ──────────────────────────────────
  const stats = useStudioCalculations(
    lignes,
    rabaisValeur,
    rabaisType,
    appliquerTps,
    appliquerTvq,
    0
  )

  // Section 3 : Échéancier de paiements interactif
  const [echeances, setEcheances] = useState<UpcomingPaymentItem[]>([
    {
      id: 'p1',
      label: 'Acompte de départ (Signature du contrat)',
      pourcentage: 30,
      montant: 0,
      date_due: new Date().toISOString().split('T')[0],
      statut: 'pending',
      methode: 'virement',
    },
    {
      id: 'p2',
      label: 'Début des travaux / Approvisionnement matériaux',
      pourcentage: 40,
      montant: 0,
      date_due: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      statut: 'pending',
      methode: 'interac',
    },
    {
      id: 'p3',
      label: 'Livraison finale & Quittance de chantier',
      pourcentage: 30,
      montant: 0,
      date_due: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      statut: 'pending',
      methode: 'virement',
    },
  ])

  // Section 4-8 : Notes, Termes & Pièces jointes
  const [notesClient, setNotesClient] = useState(
    'Les travaux seront exécutés selon les règles de l\'art et les normes du Code de construction du Québec (RBQ).'
  )
  const [termesConditions, setTermesConditions] = useState(
    'Modalités de paiement : Net 30 jours. Tout retard entraînera des frais d\'intérêt de 1.5% par mois (18% l\'an).'
  )
  const [commentairesInternes, setCommentairesInternes] = useState(
    'Matériaux commandés chez Canac. Livraison prévue mardi matin.'
  )

  function updateLigne(id: string, field: keyof StudioLigneItem, val: any) {
    setLignes(prev =>
      prev.map(l => {
        if (l.id !== id) return l
        const updated = { ...l, [field]: val }
        const q = Number(updated.quantite) || 0
        const p = Number(updated.prix_unitaire) || 0
        const c = Number(updated.cout_unitaire) || 0

        updated.total_ligne = q * p
        updated.total_cout = q * c
        updated.marge_pourcentage = p > 0 ? ((p - c) / p) * 100 : 0
        return updated
      })
    )
  }

  function addLigne() {
    const newId = `ligne-${Date.now()}`
    setLignes(prev => [
      ...prev,
      {
        id: newId,
        description: '',
        quantite: 1,
        unite: 'u',
        prix_unitaire: 0,
        cout_unitaire: 0,
        total_ligne: 0,
        total_cout: 0,
        marge_pourcentage: 0,
      },
    ])
  }

  function removeLigne(id: string) {
    setLignes(prev => prev.filter(l => l.id !== id))
  }

  return (
    <div className="flex flex-col h-full bg-[#0E1015] text-zinc-100 select-none">
      {/* ── 1. Topbar Studio ────────────────────────────────────── */}
      <div className="p-3.5 px-6 border-b border-[#222733] bg-[#141822]/80 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#0E1016] p-1 rounded-lg border border-[#262C3D]">
            <button
              onClick={() => setDocType('quote')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                docType === 'quote'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileText size={13} /> Soumission
            </button>
            <button
              onClick={() => setDocType('invoice')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                docType === 'invoice'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Receipt size={13} /> Facture
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400 font-semibold">{numero}</span>
            <select
              value={statut}
              onChange={e => setStatut(e.target.value as any)}
              className="bg-[#0E1016] border border-[#262C3D] text-[11px] font-semibold text-amber-400 rounded-lg px-2.5 py-1 focus:outline-none"
            >
              <option value="brouillon">🟡 Brouillon</option>
              <option value="envoye">🔵 Envoyé</option>
              <option value="approuve">🟢 Approuvé</option>
              <option value="facture">🟣 Facturé</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSave && onSave({ lignes, stats })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1D2230] hover:bg-[#252B3D] text-zinc-200 font-semibold text-xs border border-[#2F364B] transition-all"
          >
            <Save size={13} /> Sauvegarder
          </button>
          <button
            onClick={() => onSend && onSend({ lignes, stats })}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-black font-bold text-xs shadow-md transition-all"
          >
            <Send size={13} /> Envoyer au Client
          </button>
        </div>
      </div>

      {/* ── 2. Navigation des 8 Sections ────────────────────────── */}
      <div className="flex items-center gap-2 px-6 py-2 border-b border-[#222733] bg-[#10131A] text-xs font-medium text-zinc-400">
        {[
          { id: 'items', label: '1. Articles & Marge %', badge: `${lignes.length}` },
          { id: 'info', label: '2. Contacts & Chantier' },
          { id: 'schedule', label: '3. Échéancier de paiement' },
          { id: 'terms', label: '4. Termes & Conditions RBQ' },
          { id: 'attachments', label: '5. Pièces Jointes & Notes' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === tab.id
                ? 'bg-[#1C2230] text-amber-400 font-semibold border border-amber-500/30'
                : 'hover:text-zinc-200 hover:bg-[#141822]'
            }`}
          >
            {tab.label}
            {tab.badge && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── 3. Corps Principal de l'Éditeur ────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 select-text">
        {/* ONGLET 1: ARTICLES & MARGES */}
        {activeTab === 'items' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  Bordereau des Travaux & Estimation
                </h3>
                <p className="text-xs text-zinc-400">
                  Calcul en direct du prix de vente, coût de revient et marge de profit nette.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer bg-[#141822] px-3 py-1.5 rounded-lg border border-[#222733]">
                  <input
                    type="checkbox"
                    checked={masquerDetailsClient}
                    onChange={e => setMasquerDetailsClient(e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  <span>Masquer le détail unitaire sur le devis client</span>
                </label>

                <button
                  onClick={addLigne}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold text-xs hover:bg-amber-500/25 transition-all"
                >
                  <Plus size={13} /> Ajouter une ligne
                </button>
              </div>
            </div>

            {/* Tableau d'Articles */}
            <div className="border border-[#222733] rounded-xl overflow-hidden bg-[#141822]/60">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#181C26] text-zinc-400 font-semibold border-b border-[#222733]">
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3">Description des travaux</th>
                    <th className="p-3 w-20 text-center">Qté</th>
                    <th className="p-3 w-24 text-center">Unité</th>
                    <th className="p-3 w-28 text-right">Prix Vente ($)</th>
                    <th className="p-3 w-28 text-right text-zinc-500">Coût ($)</th>
                    <th className="p-3 w-24 text-center text-emerald-400">Marge %</th>
                    <th className="p-3 w-28 text-right font-bold">Total Vente</th>
                    <th className="p-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222733]/60">
                  {lignes.map((l, index) => (
                    <tr key={l.id} className="hover:bg-[#161B26] transition-colors">
                      <td className="p-3 text-center text-zinc-500 font-mono text-[11px]">{index + 1}</td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={l.description}
                          onChange={e => updateLigne(l.id, 'description', e.target.value)}
                          placeholder="Description de la tâche ou fourniture..."
                          className="w-full bg-[#0E1015] border border-transparent focus:border-amber-500/40 rounded px-2 py-1 text-zinc-100 text-xs focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={l.quantite}
                          onChange={e => updateLigne(l.id, 'quantite', parseFloat(e.target.value) || 0)}
                          className="w-full text-center bg-[#0E1015] border border-transparent focus:border-amber-500/40 rounded px-1.5 py-1 text-zinc-100 text-xs focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={l.unite}
                          onChange={e => updateLigne(l.id, 'unite', e.target.value)}
                          className="w-full text-center bg-[#0E1015] border border-transparent focus:border-amber-500/40 rounded px-1 py-1 text-zinc-300 text-xs focus:outline-none"
                        >
                          {UNITES.map(u => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={l.prix_unitaire}
                          onChange={e => updateLigne(l.id, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                          className="w-full text-right bg-[#0E1015] border border-transparent focus:border-amber-500/40 rounded px-2 py-1 text-amber-400 font-semibold text-xs focus:outline-none"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={l.cout_unitaire}
                          onChange={e => updateLigne(l.id, 'cout_unitaire', parseFloat(e.target.value) || 0)}
                          className="w-full text-right bg-[#0E1015] border border-transparent focus:border-amber-500/40 rounded px-2 py-1 text-zinc-400 text-xs focus:outline-none"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`font-bold text-[11px] px-2 py-0.5 rounded-full ${
                            l.marge_pourcentage >= 40
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : l.marge_pourcentage >= 20
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {l.marge_pourcentage.toFixed(1)} %
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-zinc-100">{formatCad(l.total_ligne)}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => removeLigne(l.id)}
                          className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── 4. Synthèse Financière & Rentabilité ───────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {/* Carte Marge & Rentabilité Interne */}
              <div className="p-4 rounded-xl bg-[#141822] border border-[#222733] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-400" /> Rentabilité & Marge Brute
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {stats.margeGlobalePct.toFixed(1)} % Marge
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#0E1015] border border-[#222733]">
                    <div className="text-[11px] text-zinc-400">Coût de revient total</div>
                    <div className="text-sm font-bold text-zinc-300 mt-1">{formatCad(stats.coutTotal)}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0E1015] border border-[#222733]">
                    <div className="text-[11px] text-zinc-400">Profit brut estimé</div>
                    <div className="text-sm font-bold text-emerald-400 mt-1">{formatCad(stats.profitNet)}</div>
                  </div>
                </div>
              </div>

              {/* Carte Totaux Facturation Client */}
              <div className="p-4 rounded-xl bg-[#141822] border border-[#222733] space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Sous-total des travaux</span>
                  <span className="font-semibold text-zinc-200">{formatCad(stats.sousTotalVente)}</span>
                </div>

                {stats.rabaisMontant > 0 && (
                  <div className="flex justify-between text-rose-400 font-medium">
                    <span>Rabais appliqué</span>
                    <span>- {formatCad(stats.rabaisMontant)}</span>
                  </div>
                )}

                <div className="flex justify-between text-zinc-400 pt-1 border-t border-[#222733]">
                  <span>TPS (5.000%)</span>
                  <span>{formatCad(stats.tps)}</span>
                </div>

                <div className="flex justify-between text-zinc-400">
                  <span>TVQ (9.975%)</span>
                  <span>{formatCad(stats.tvq)}</span>
                </div>

                <div className="flex justify-between items-center text-sm font-extrabold text-amber-400 pt-2 border-t border-[#222733]">
                  <span>TOTAL ESTIMÉ (TTC)</span>
                  <span className="text-base">{formatCad(stats.totalTtc)}</span>
                </div>
              </div>
            </div>

            {/* ── 5. Échéancier de paiements (Upcoming Payments) ── */}
            <div className="mt-8 pt-6 border-t border-[#222733]">
              <UpcomingPaymentsSection
                totalTtc={stats.totalTtc}
                echeances={echeances}
                onChange={setEcheances}
                onInvoicePayment={payment => {
                  alert(`Génération de la facture d'acompte pour "${payment.label}" (${formatCad(payment.montant)})`)
                }}
              />
            </div>
          </div>
        )}

        {/* ONGLET 2: INFOS & CHANTIER */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-4 rounded-xl bg-[#141822] border border-[#222733] space-y-3">
              <h4 className="font-bold text-zinc-200 flex items-center gap-2">
                <User size={14} className="text-amber-400" /> Contact & Facturation
              </h4>
              <div>
                <label className="text-[11px] text-zinc-400">Nom du client</label>
                <input
                  type="text"
                  value={clientNom}
                  disabled
                  className="w-full bg-[#0E1015] border border-[#262C3D] rounded-lg p-2 text-zinc-200 mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400">Courriel</label>
                <input
                  type="text"
                  value={clientEmail}
                  disabled
                  className="w-full bg-[#0E1015] border border-[#262C3D] rounded-lg p-2 text-zinc-200 mt-1"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#141822] border border-[#222733] space-y-3">
              <h4 className="font-bold text-zinc-200 flex items-center gap-2">
                <MapPin size={14} className="text-amber-400" /> Adresse du Chantier
              </h4>
              <div>
                <label className="text-[11px] text-zinc-400">Adresse des travaux</label>
                <input
                  type="text"
                  value={adresseChantier.adresse}
                  onChange={e => setAdresseChantier(f => ({ ...f, adresse: e.target.value }))}
                  className="w-full bg-[#0E1015] border border-[#262C3D] rounded-lg p-2 text-zinc-200 mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400">Notes d'accès au chantier</label>
                <textarea
                  value={adresseChantier.accesNotes}
                  onChange={e => setAdresseChantier(f => ({ ...f, accesNotes: e.target.value }))}
                  rows={2}
                  className="w-full bg-[#0E1015] border border-[#262C3D] rounded-lg p-2 text-zinc-200 mt-1 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ONGLET 3: ÉCHÉANCIER */}
        {activeTab === 'schedule' && (
          <div className="p-4 rounded-xl bg-[#141822] border border-[#222733]">
            <UpcomingPaymentsSection
              totalTtc={stats.totalTtc}
              echeances={echeances}
              onChange={setEcheances}
              onInvoicePayment={payment => {
                alert(`Génération de la facture d'acompte pour "${payment.label}" (${formatCad(payment.montant)})`)
              }}
            />
          </div>
        )}

        {/* ONGLET 4: TERMES & CONDITIONS */}
        {activeTab === 'terms' && (
          <div className="p-4 rounded-xl bg-[#141822] border border-[#222733] space-y-3 text-xs">
            <h4 className="font-bold text-zinc-200">Clauses & Termes Contractuels RBQ</h4>
            <textarea
              value={termesConditions}
              onChange={e => setTermesConditions(e.target.value)}
              rows={6}
              className="w-full bg-[#0E1015] border border-[#262C3D] rounded-xl p-3 text-zinc-200 font-sans leading-relaxed resize-none focus:outline-none focus:border-amber-500/50"
            />
          </div>
        )}

        {/* ONGLET 5: PIÈCES JOINTES & NOTES */}
        {activeTab === 'attachments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#141822] border border-[#222733] space-y-3">
              <h4 className="font-bold text-zinc-200">Notes d'Exécution au Client</h4>
              <textarea
                value={notesClient}
                onChange={e => setNotesClient(e.target.value)}
                rows={5}
                className="w-full bg-[#0E1015] border border-[#262C3D] rounded-xl p-3 text-zinc-200 resize-none focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="p-4 rounded-xl bg-[#141822] border border-[#222733] space-y-3">
              <h4 className="font-bold text-zinc-200">Commentaires & Notes Internes d'Équipe</h4>
              <textarea
                value={commentairesInternes}
                onChange={e => setCommentairesInternes(e.target.value)}
                rows={5}
                className="w-full bg-[#0E1015] border border-[#262C3D] rounded-xl p-3 text-zinc-200 resize-none focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
