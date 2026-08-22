'use client'

import { useState, ReactNode } from 'react'
import { MessageSquare, FileText, ArrowLeft, Building2 } from 'lucide-react'
import Link from 'next/link'

interface SplitWorkspaceLayoutProps {
  chatPanel: ReactNode
  editorPanel: ReactNode
  clientNom?: string
  backHref?: string
}

export function SplitWorkspaceLayout({
  chatPanel,
  editorPanel,
  clientNom = 'Client',
  backHref = '/clients',
}: SplitWorkspaceLayoutProps) {
  const [mobileTab, setMobileTab] = useState<'chat' | 'editor'>('editor')

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden bg-[#0A0C10]">
      {/* Barre de navigation supérieure Studio */}
      <div className="h-11 px-4 border-b border-[#222733] bg-[#111318] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors font-medium"
          >
            <ArrowLeft size={13} /> Retour
          </Link>
          <span className="text-zinc-600">/</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-200">Studio d'Estimation :</span>
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/25">
              {clientNom}
            </span>
          </div>
        </div>

        {/* Sélecteur d'onglet mobile (< 1024px) */}
        <div className="flex lg:hidden items-center bg-[#0E1016] p-1 rounded-lg border border-[#262C3D]">
          <button
            onClick={() => setMobileTab('chat')}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded ${
              mobileTab === 'chat'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-zinc-400'
            }`}
          >
            <MessageSquare size={12} /> Échanges
          </button>
          <button
            onClick={() => setMobileTab('editor')}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded ${
              mobileTab === 'editor'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-zinc-400'
            }`}
          >
            <FileText size={12} /> Devis & Facture
          </button>
        </div>
      </div>

      {/* Disposition Split-Screen Desktop / Mobile */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[420px_1fr] h-full overflow-hidden">
        {/* Colonne Gauche : Chat & Interactions */}
        <div
          className={`h-full overflow-hidden ${
            mobileTab === 'chat' ? 'block' : 'hidden lg:block'
          }`}
        >
          {chatPanel}
        </div>

        {/* Colonne Droite : Éditeur Devis / Facture */}
        <div
          className={`h-full overflow-hidden ${
            mobileTab === 'editor' ? 'block' : 'hidden lg:block'
          }`}
        >
          {editorPanel}
        </div>
      </div>
    </div>
  )
}
