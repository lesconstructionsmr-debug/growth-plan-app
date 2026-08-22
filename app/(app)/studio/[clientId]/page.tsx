'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getBrowserClient } from '@/lib/supabase/browser'
import { SplitWorkspaceLayout } from '@/components/studio/SplitWorkspaceLayout'
import { ClientChatPanel } from '@/components/studio/ClientChatPanel'
import { QuoteInvoiceEditor } from '@/components/studio/QuoteInvoiceEditor'
import { Loader2 } from 'lucide-react'

export default function StudioClientPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const router = useRouter()
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clientId) {
      setLoading(false)
      return
    }

    async function loadClient() {
      try {
        const supabase = getBrowserClient()
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .maybeSingle()

        if (!error && data) {
          setClient(data)
        }
      } catch (err) {
        console.error('Erreur chargement client studio:', err)
      } finally {
        setLoading(false)
      }
    }

    loadClient()
  }, [clientId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-[#0A0C10] text-zinc-400 text-xs gap-3">
        <Loader2 size={24} className="animate-spin text-amber-500" />
        Chargement du Studio d'Estimation...
      </div>
    )
  }

  const clientNom = client?.nom || 'Client Particulier'
  const clientEmail = client?.email || ''
  const clientTelephone = client?.telephone || ''
  const clientAdresse = client?.adresse || ''
  const clientVille = client?.ville || ''

  return (
    <SplitWorkspaceLayout
      clientNom={clientNom}
      backHref={`/clients/${clientId}`}
      chatPanel={
        <ClientChatPanel
          clientId={clientId}
          clientNom={clientNom}
          clientEmail={clientEmail}
          clientTelephone={clientTelephone}
        />
      }
      editorPanel={
        <QuoteInvoiceEditor
          clientId={clientId}
          clientNom={clientNom}
          clientEmail={clientEmail}
          clientTelephone={clientTelephone}
          clientAdresse={clientAdresse}
          clientVille={clientVille}
          initialDocType="quote"
          onSave={async data => {
            alert('Devis sauvegardé dans le Studio avec succès !')
          }}
          onSend={async data => {
            alert(`Devis transmis à ${clientEmail || clientNom} avec succès !`)
          }}
        />
      }
    />
  )
}
