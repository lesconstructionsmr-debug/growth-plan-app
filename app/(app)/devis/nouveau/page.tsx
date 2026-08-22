'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '@/lib/supabase/browser'
import { SplitWorkspaceLayout } from '@/components/studio/SplitWorkspaceLayout'
import { ClientChatPanel } from '@/components/studio/ClientChatPanel'
import { QuoteInvoiceEditor } from '@/components/studio/QuoteInvoiceEditor'
import { Users, Loader2, Plus, MessageSquare, Sparkles } from 'lucide-react'

export default function NouveauDevisPage() {
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadClients() {
      try {
        const clientParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('client') : null
        const supabase = getBrowserClient()
        const { data, error } = await supabase
          .from('clients')
          .select('id, nom, email, telephone, adresse, ville')
          .order('nom', { ascending: true })

        if (!error && Array.isArray(data)) {
          setClients(data)
          if (data.length > 0) {
            const initial = clientParam ? data.find(c => c.id === clientParam) || data[0] : data[0]
            setSelectedClientId(initial.id)
            setSelectedClient(initial)
          }
        }
      } catch (err) {
        console.error('Erreur chargement clients nouveau devis:', err)
      } finally {
        setLoading(false)
      }
    }

    loadClients()
  }, [])

  function handleClientChange(id: string) {
    setSelectedClientId(id)
    const found = clients.find(c => c.id === id) || null
    setSelectedClient(found)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-[#0A0C10] text-zinc-400 text-xs gap-3">
        <Loader2 size={24} className="animate-spin text-amber-500" />
        Initialisation du Studio d'Estimation...
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4 text-xs mt-12">
        <Users size={32} className="mx-auto text-amber-400 mb-2" />
        <h2 className="text-base font-bold text-zinc-100">Aucun client enregistré</h2>
        <p className="text-zinc-400">Créez votre premier client pour ouvrir le Studio d'Estimation et de Chat.</p>
        <button
          onClick={() => router.push('/clients/nouveau')}
          className="px-4 py-2 rounded-lg bg-amber-500 text-black font-bold text-xs hover:brightness-110 transition-all"
        >
          ➕ Créer un premier client
        </button>
      </div>
    )
  }

  const clientNom = selectedClient?.nom || 'Client'
  const clientEmail = selectedClient?.email || ''
  const clientTelephone = selectedClient?.telephone || ''
  const clientAdresse = selectedClient?.adresse || ''
  const clientVille = selectedClient?.ville || ''

  return (
    <div className="flex flex-col h-full">
      {/* Barre de sélection de client au-dessus du Split-Screen */}
      <div className="bg-[#12151D] px-6 py-2 border-b border-[#222733] flex items-center justify-between gap-4 flex-wrap text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-zinc-400">Prospect / Client actif :</span>
          <select
            value={selectedClientId}
            onChange={e => handleClientChange(e.target.value)}
            className="bg-[#0E1015] border border-[#2B3242] text-amber-400 font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500/50"
          >
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.nom} {c.ville ? `(${c.ville})` : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => router.push('/clients/nouveau')}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-amber-400 text-xs font-semibold transition-colors"
        >
          <Plus size={13} /> Nouveau client
        </button>
      </div>

      {/* Vue Double Panneau Split-Screen */}
      <SplitWorkspaceLayout
        clientNom={clientNom}
        backHref="/devis"
        chatPanel={
          <ClientChatPanel
            key={selectedClientId}
            clientId={selectedClientId}
            clientNom={clientNom}
            clientEmail={clientEmail}
            clientTelephone={clientTelephone}
          />
        }
        editorPanel={
          <QuoteInvoiceEditor
            key={selectedClientId}
            clientId={selectedClientId}
            clientNom={clientNom}
            clientEmail={clientEmail}
            clientTelephone={clientTelephone}
            clientAdresse={clientAdresse}
            clientVille={clientVille}
            initialDocType="quote"
            onSave={async data => {
              alert(`Soumission sauvegardée pour ${clientNom} !`)
            }}
            onSend={async data => {
              alert(`Devis transmis par courriel à ${clientEmail || clientNom} avec succès !`)
            }}
          />
        }
      />
    </div>
  )
}
