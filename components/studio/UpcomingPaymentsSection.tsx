'use client'

import { useState } from 'react'
import {
  Calendar, Plus, Trash2, CheckCircle2, Clock,
  AlertCircle, Sparkles, DollarSign, Receipt, ArrowRight,
  ShieldCheck, RefreshCw
} from 'lucide-react'
import {
  UpcomingPaymentItem,
  PaymentScheduleStatus,
  PaymentMethodOption,
  calculateScheduleSummary
} from '@/lib/hooks/useStudioCalculations'
import { formatCad } from '@/lib/format'

interface UpcomingPaymentsSectionProps {
  totalTtc: number
  echeances: UpcomingPaymentItem[]
  onChange: (echeances: UpcomingPaymentItem[]) => void
  onInvoicePayment?: (payment: UpcomingPaymentItem) => void
}

const STATUTS_PAYS: Record<
  PaymentScheduleStatus,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  pending: { label: 'En attente', color: 'var(--gold, #F59E0B)', bg: 'rgba(245,158,11,0.12)', icon: Clock },
  paid:    { label: 'Payé',       color: 'var(--green, #10B981)', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle2 },
  overdue: { label: 'En retard',  color: 'var(--red, #EF4444)',   bg: 'rgba(239,68,68,0.12)',   icon: AlertCircle },
}

const METHOD_LABELS: Record<PaymentMethodOption, string> = {
  virement:     'Virement bancaire',
  interac:      'Virement Interac',
  cheque:       'Chèque',
  carte_credit: 'Carte de crédit',
  financement:  'Prêt / Financement',
  especes:      'Espèces / Comptant',
}

export function UpcomingPaymentsSection({
  totalTtc,
  echeances,
  onChange,
  onInvoicePayment,
}: UpcomingPaymentsSectionProps) {
  const summary = calculateScheduleSummary(echeances, totalTtc)

  function updateItem(id: string, field: keyof UpcomingPaymentItem, value: any) {
    onChange(
      echeances.map(item => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        if (field === 'pourcentage') {
          const p = parseFloat(value) || 0
          updated.montant = Math.round(((totalTtc * p) / 100) * 100) / 100
        }
        return updated
      })
    )
  }

  function addPayment() {
    const newId = `pay-${Date.now()}`
    const restePct = Math.max(0, summary.restePourcentage)
    const newDate = new Date(Date.now() + echeances.length * 14 * 86400000)
      .toISOString()
      .split('T')[0]

    const newItem: UpcomingPaymentItem = {
      id: newId,
      label: `Versement #${echeances.length + 1}`,
      pourcentage: restePct > 0 ? restePct : 10,
      montant: Math.round(((totalTtc * (restePct > 0 ? restePct : 10)) / 100) * 100) / 100,
      date_due: newDate,
      statut: 'pending',
      methode: 'virement',
    }
    onChange([...echeances, newItem])
  }

  function removePayment(id: string) {
    onChange(echeances.filter(p => p.id !== id))
  }

  function applyPreset(type: '30/40/30' | '50/50' | '100') {
    const today = new Date()
    const d1 = today.toISOString().split('T')[0]
    const d2 = new Date(today.getTime() + 15 * 86400000).toISOString().split('T')[0]
    const d3 = new Date(today.getTime() + 30 * 86400000).toISOString().split('T')[0]

    if (type === '30/40/30') {
      onChange([
        {
          id: `p1-${Date.now()}`,
          label: 'Acompte de départ (Signature du contrat)',
          pourcentage: 30,
          montant: Math.round(((totalTtc * 30) / 100) * 100) / 100,
          date_due: d1,
          statut: 'pending',
          methode: 'virement',
        },
        {
          id: `p2-${Date.now()}`,
          label: 'Début des travaux / Approvisionnement matériaux',
          pourcentage: 40,
          montant: Math.round(((totalTtc * 40) / 100) * 100) / 100,
          date_due: d2,
          statut: 'pending',
          methode: 'interac',
        },
        {
          id: `p3-${Date.now()}`,
          label: 'Livraison finale & Quittance de chantier',
          pourcentage: 30,
          montant: Math.round(((totalTtc * 30) / 100) * 100) / 100,
          date_due: d3,
          statut: 'pending',
          methode: 'virement',
        },
      ])
    } else if (type === '50/50') {
      onChange([
        {
          id: `p1-${Date.now()}`,
          label: 'Acompte à la commande (50%)',
          pourcentage: 50,
          montant: Math.round(((totalTtc * 50) / 100) * 100) / 100,
          date_due: d1,
          statut: 'pending',
          methode: 'virement',
        },
        {
          id: `p2-${Date.now()}`,
          label: 'Solde à la livraison (50%)',
          pourcentage: 50,
          montant: Math.round(((totalTtc * 50) / 100) * 100) / 100,
          date_due: d3,
          statut: 'pending',
          methode: 'virement',
        },
      ])
    } else {
      onChange([
        {
          id: `p1-${Date.now()}`,
          label: 'Paiement unique des travaux (100%)',
          pourcentage: 100,
          montant: totalTtc,
          date_due: d3,
          statut: 'pending',
          methode: 'virement',
        },
      ])
    }
  }

  function autoBalance() {
    if (echeances.length === 0) return
    const last = echeances[echeances.length - 1]
    const otherTotal = echeances.slice(0, -1).reduce((s, x) => s + x.pourcentage, 0)
    const newLastPct = Math.max(0, Math.round((100 - otherTotal) * 100) / 100)
    updateItem(last.id, 'pourcentage', newLastPct)
  }

  return (
    <div className="space-y-4 text-xs">
      {/* En-tête de la section Upcoming Payments */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Calendar size={15} className="text-amber-400" />
            3. Upcoming Payments · Échéancier de facturation
          </h3>
          <p className="text-zinc-400 text-[11px] mt-0.5">
            Définissez les jalons contractuels et générez les factures progressives en 1 clic.
          </p>
        </div>

        {/* Presets rapides & Bouton d'ajout */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-[#0E1016] p-1 rounded-lg border border-[#262C3D] gap-1">
            <button
              type="button"
              onClick={() => applyPreset('30/40/30')}
              className="px-2 py-0.5 rounded text-[11px] font-semibold text-zinc-300 hover:text-amber-400 hover:bg-[#181C26] transition-colors"
            >
              🪄 30/40/30 BTP
            </button>
            <button
              type="button"
              onClick={() => applyPreset('50/50')}
              className="px-2 py-0.5 rounded text-[11px] font-semibold text-zinc-300 hover:text-amber-400 hover:bg-[#181C26] transition-colors"
            >
              🪄 50/50
            </button>
            <button
              type="button"
              onClick={() => applyPreset('100')}
              className="px-2 py-0.5 rounded text-[11px] font-semibold text-zinc-300 hover:text-amber-400 hover:bg-[#181C26] transition-colors"
            >
              🪄 100% Terme
            </button>
          </div>

          <button
            type="button"
            onClick={addPayment}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold text-xs hover:bg-amber-500/25 transition-all"
          >
            <Plus size={13} /> + Add payment
          </button>
        </div>
      </div>

      {/* Tableau interactif des Échéances */}
      <div className="border border-[#222733] rounded-xl overflow-hidden bg-[#141822]/60">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#181C26] text-zinc-400 font-semibold border-b border-[#222733]">
              <th className="p-3 w-28 text-center">Status</th>
              <th className="p-3 w-20 text-center">% (Part)</th>
              <th className="p-3">Notes / Jalon de déblocage</th>
              <th className="p-3 w-32 text-center">Date prévue</th>
              <th className="p-3 w-36">Mode de paiement</th>
              <th className="p-3 w-32 text-right font-bold">Montant ($)</th>
              <th className="p-3 w-28 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222733]/60">
            {echeances.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-8 text-zinc-500 text-xs">
                  Aucun jalon d'échéance défini. Cliquez sur <strong>+ Add payment</strong> ou appliquez un modèle rapide.
                </td>
              </tr>
            ) : (
              echeances.map((ech, idx) => {
                const cfg = STATUTS_PAYS[ech.statut] || STATUTS_PAYS.pending
                const Icon = cfg.icon
                const montantCalcule = Math.round(((totalTtc * ech.pourcentage) / 100) * 100) / 100

                return (
                  <tr key={ech.id} className="hover:bg-[#161B26] transition-colors">
                    {/* Colonne 1: Statut */}
                    <td className="p-2 text-center">
                      <select
                        value={ech.statut}
                        onChange={e => updateItem(ech.id, 'statut', e.target.value as PaymentScheduleStatus)}
                        className="bg-[#0E1015] border border-[#262C3D] text-[11px] font-semibold rounded-lg px-2 py-1 focus:outline-none"
                        style={{ color: cfg.color }}
                      >
                        <option value="pending">🟡 En attente</option>
                        <option value="paid">🟢 Payé</option>
                        <option value="overdue">🔴 En retard</option>
                      </select>
                    </td>

                    {/* Colonne 2: % Part */}
                    <td className="p-2">
                      <div className="flex items-center justify-center gap-1 bg-[#0E1015] border border-transparent focus-within:border-amber-500/40 rounded px-1.5 py-1">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          value={ech.pourcentage}
                          onChange={e => updateItem(ech.id, 'pourcentage', parseFloat(e.target.value) || 0)}
                          className="w-12 text-center bg-transparent text-amber-400 font-bold text-xs focus:outline-none"
                        />
                        <span className="text-zinc-500 font-semibold text-[11px]">%</span>
                      </div>
                    </td>

                    {/* Colonne 3: Description / Notes */}
                    <td className="p-2">
                      <input
                        type="text"
                        value={ech.label}
                        onChange={e => updateItem(ech.id, 'label', e.target.value)}
                        placeholder="Ex: Acompte à la signature..."
                        className="w-full bg-[#0E1015] border border-transparent focus:border-amber-500/40 rounded px-2.5 py-1 text-zinc-100 text-xs focus:outline-none"
                      />
                    </td>

                    {/* Colonne 4: Date */}
                    <td className="p-2 text-center">
                      <input
                        type="date"
                        value={ech.date_due}
                        onChange={e => updateItem(ech.id, 'date_due', e.target.value)}
                        className="bg-[#0E1015] border border-transparent focus:border-amber-500/40 rounded px-2 py-1 text-zinc-300 text-xs focus:outline-none text-center"
                      />
                    </td>

                    {/* Colonne 5: Method */}
                    <td className="p-2">
                      <select
                        value={ech.methode}
                        onChange={e => updateItem(ech.id, 'methode', e.target.value as PaymentMethodOption)}
                        className="w-full bg-[#0E1015] border border-transparent focus:border-amber-500/40 rounded px-2 py-1 text-zinc-300 text-xs focus:outline-none"
                      >
                        {Object.entries(METHOD_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Colonne 6: Amount ($) */}
                    <td className="p-3 text-right font-bold text-zinc-100 text-xs">
                      {formatCad(montantCalcule)}
                    </td>

                    {/* Colonne 7: Action */}
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onInvoicePayment && (
                          <button
                            type="button"
                            onClick={() => onInvoicePayment(ech)}
                            className="p-1 rounded text-zinc-400 hover:text-amber-400 hover:bg-[#1D2230] transition-colors"
                            title="Générer la facture d'acompte"
                          >
                            <Receipt size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removePayment(ech.id)}
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-[#1D2230] transition-colors"
                          title="Supprimer cette échéance"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Jauge d'équilibre & Synthèse des versements */}
      <div
        className={`p-3.5 rounded-xl border flex items-center justify-between flex-wrap gap-3 ${
          summary.isBalanced
            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
            : summary.totalPourcentage > 100
            ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
            : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
        }`}
      >
        <div className="flex items-center gap-2">
          {summary.isBalanced ? (
            <ShieldCheck size={16} className="text-emerald-400" />
          ) : (
            <AlertCircle size={16} className={summary.totalPourcentage > 100 ? 'text-rose-400' : 'text-amber-400'} />
          )}

          <div>
            <span className="font-bold">
              {summary.isBalanced
                ? 'Échéancier parfaitement équilibré à 100%'
                : summary.totalPourcentage > 100
                ? `Dépassement de ${(summary.totalPourcentage - 100).toFixed(1)}% (${formatCad(summary.totalAlloue - totalTtc)})`
                : `Reste ${summary.restePourcentage.toFixed(1)}% non alloué (${formatCad(summary.resteMontant)})`}
            </span>
            <span className="text-[11px] text-zinc-400 ml-2">
              · Total alloué : {formatCad(summary.totalAlloue)} sur {formatCad(totalTtc)} TTC
            </span>
          </div>
        </div>

        {!summary.isBalanced && echeances.length > 0 && (
          <button
            type="button"
            onClick={autoBalance}
            className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded bg-[#1C2230] border border-[#2F364B] text-zinc-200 hover:text-amber-400 transition-colors"
          >
            <RefreshCw size={11} /> Ajuster le dernier versement
          </button>
        )}
      </div>
    </div>
  )
}
