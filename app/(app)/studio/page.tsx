'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '@/lib/supabase/browser'
import { SplitWorkspaceLayout } from '@/components/studio/SplitWorkspaceLayout'
import { ClientChatPanel } from '@/components/studio/ClientChatPanel'
import { QuoteInvoiceEditor } from '@/components/studio/QuoteInvoiceEditor'
import { Users, Loader2, Sparkles, Plus, ArrowRight } from 'lucide-react'

export default function StudioIndexPage() {
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadClients() {
      try {
        const supabase = getBrowserClient()
        const { data, error } = await supabase
          .from('clients')
          .select('id, nom, email, telephone, adresse, ville')
          .order('nom', { ascending: true })

        if (!error && Array.isArray(data) && data.length > 0) {
          setClients(data)
          setSelectedClient(data[0])
        }
      } catch (err) {
        console.error('Erreur chargement clients studio:', err)
      } finally {
        setLoading(false)
      }
    }

    loadClients()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-[#0A0C10] text-zinc-400 text-xs gap-3">
        <Loader2 size={24} className="animate-spin text-amber-500" />
        Initialisation du Studio...
      </div>
    )
  }

  if (!selectedClient) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4 text-xs">
        <Users size={32} className="mx-auto text-amber-400 mb-2" />
        <h2 className="text-base font-bold text-zinc-100">Aucun client trouvé</h2>
        <p className="text-zinc-400">Créez votre premier client pour ouvrir le Studio d'Estimation et de Chat.</p>
        <button
          onClick={() => router.push('/clients/nouveau')}
          className="px-4 py-2 rounded-lg bg-amber-500 text-black font-bold text-xs"
        >
          Créer un client
        </button>
      </div>
    )
  }

  return (
    <SplitWorkspaceLayout
      clientNom={selectedClient.nom}
      backHref="/clients"
      chatPanel={
        <ClientChatPanel
          clientId={selectedClient.id}
          clientNom={selectedClient.nom}
          clientEmail={selectedClient.email || ''}
          clientTelephone={selectedClient.telephone || ''}
        />
      }
      editorPanel={
        <QuoteInvoiceEditor
          clientId={selectedClient.id}
          clientNom={selectedClient.nom}
          clientEmail={selectedClient.email || ''}
          clientTelephone={selectedClient.telephone || ''}
          clientAdresse={selectedClient.adresse || ''}
          clientVille={selectedClient.ville || ''}
          initialDocType="quote"
          onSave={async () => alert('Devis sauvegardé dans le Studio !')}
          onSend={async () => alert('Devis envoyé au client avec succès !')}
        />
      }
    />
  )
}
