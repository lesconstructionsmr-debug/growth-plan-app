'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Download, Send, Printer } from 'lucide-react'

const fmt = (n: number) =>
  n.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })

// Même mock que devis/[id] — remplacer par fetch Supabase
const DEVIS_MOCK = {
  numero: 'DEV-2026-001',
  titre: 'Rénovation cuisine complète',
  statut: 'envoye',
  client_nom: 'Jean Tremblay',
  client_email: 'jean.tremblay@example.com',
  client_adresse: '245 Avenue des Pins',
  client_ville: 'Québec, QC  G1R 2C7',
  projet_titre: 'Maison Tremblay — Cuisine',
  date_emission: '2026-06-10',
  date_validite: '2026-07-10',
  sous_total: 18500,
  taux_tps: 5,
  taux_tvq: 9.975,
  montant_tps: 925,
  montant_tvq: 1845.38,
  total_ttc: 21270.38,
  notes_client: 'Travaux à débuter dès approbation. Délai estimé : 3 semaines. Les matériaux inclus dans ce devis seront commandés à la signature.',
  conditions: 'Un acompte de 30% est requis à la signature. Le solde est dû à la completion des travaux. Ce devis est valide 30 jours à compter de la date d\'émission.',
  lignes: [
    { id: '1', description: 'Démolition et préparation',      quantite: 1,  unite: 'forfait', prix_unitaire: 2500,  total_ligne: 2500  },
    { id: '2', description: 'Armoires cuisine (supply)',       quantite: 1,  unite: 'forfait', prix_unitaire: 8000,  total_ligne: 8000  },
    { id: '3', description: 'Installation armoires',          quantite: 16, unite: 'h',       prix_unitaire: 85,    total_ligne: 1360  },
    { id: '4', description: 'Comptoir quartz 3cm',            quantite: 22, unite: 'pi²',     prix_unitaire: 145,   total_ligne: 3190  },
    { id: '5', description: 'Plomberie — relocalisation',     quantite: 1,  unite: 'forfait', prix_unitaire: 1200,  total_ligne: 1200  },
    { id: '6', description: 'Électricité — circuits dédiés',  quantite: 1,  unite: 'forfait', prix_unitaire: 950,   total_ligne: 950   },
    { id: '7', description: 'Peinture & finitions',           quantite: 1,  unite: 'forfait', prix_unitaire: 1300,  total_ligne: 1300  },
  ],
  organisation: {
    nom: 'ERP Construction Inc.',
    email: 'info@erpconstruction.ca',
    telephone: '(418) 555-0123',
    adresse: '1200 boul. Lebourgneuf',
    ville: 'Québec, QC  G2K 2G4',
    tps_numero: '123456789 RT0001',
    tvq_numero: '1234567890 TQ0001',
  },
}

export default function DevisPreviewPage() {
  const { id } = useParams<{ id: string }>()
  const [devis, setDevis] = useState(DEVIS_MOCK)

  useEffect(() => {
    if (!id) return
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase
      .from('devis')
      .select('id, numero, titre, statut, lignes, montant_ht, tps, tvq, montant_ttc, date_emission, valide_jusqu_au, notes, clients(nom, email, adresse, ville), companies(name, email, telephone, adresse, ville, tps_no, tvq_no)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) return
        const cli = data.clients as any ?? {}
        const org = data.companies as any ?? {}
        const lignes = Array.isArray(data.lignes) ? data.lignes.map((l: any, i: number) => ({
          id: String(i), description: l.description ?? '', quantite: Number(l.quantite ?? 1),
          unite: l.unite ?? 'u', prix_unitaire: Number(l.prix_unitaire ?? 0),
          total_ligne: Number(l.quantite ?? 1) * Number(l.prix_unitaire ?? 0),
        })) : []
        const ht = Number(data.montant_ht ?? 0)
        const tpsA = Number(data.tps ?? 0)
        const tvqA = Number(data.tvq ?? 0)
        setDevis({
          numero: data.numero ?? '',
          titre: data.titre ?? '',
          statut: data.statut ?? '',
          client_nom: cli.nom ?? '—',
          client_email: cli.email ?? '',
          client_adresse: cli.adresse ?? '',
          client_ville: cli.ville ?? '',
          projet_titre: data.titre ?? '',
          date_emission: data.date_emission ?? new Date().toISOString().split('T')[0],
          date_validite: data.valide_jusqu_au ?? '',
          sous_total: ht,
          taux_tps: 5, taux_tvq: 9.975,
          montant_tps: tpsA,
          montant_tvq: tvqA,
          total_ttc: Number(data.montant_ttc ?? 0),
          notes_client: data.notes ?? '',
          conditions: '',
          lignes,
          organisation: {
            nom: org.name ?? 'Mon Entreprise',
            email: org.email ?? '',
            telephone: org.telephone ?? '',
            adresse: org.adresse ?? '',
            ville: org.ville ?? '',
            tps_numero: org.tps_no ?? '',
            tvq_numero: org.tvq_no ?? '',
          },
        })
      })
  }, [id])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)' }}>
      {/* Barre d'outils (non imprimée) */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg-1)', borderBottom: '0.5px solid var(--line)',
        padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}
        className="no-print"
      >
        <a href={`/devis/${id}`} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '12px', color: 'var(--txt-3)', textDecoration: 'none',
        }}>
          <ArrowLeft size={13} /> Retour au devis
        </a>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => window.print()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: '0.5px solid var(--line)', borderRadius: '7px',
              padding: '7px 12px', fontSize: '11px', color: 'var(--txt-2)', cursor: 'pointer',
            }}
          >
            <Printer size={13} /> Imprimer
          </button>
          <button
            onClick={() => {
              const orig = document.title
              document.title = `Devis-${devis.numero}`
              window.print()
              document.title = orig
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'var(--gold)', border: 'none', borderRadius: '7px',
              padding: '7px 14px', fontSize: '11px', color: '#0A0A0A', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Download size={13} /> Télécharger PDF
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--gold)', border: 'none', borderRadius: '7px',
            padding: '7px 14px', fontSize: '11px', fontWeight: 700, color: '#0A0A0A', cursor: 'pointer',
          }}>
            <Send size={13} /> Envoyer au client
          </button>
        </div>
      </div>

      {/* Document */}
      <div style={{ padding: '32px 24px', display: 'flex', justifyContent: 'center' }}>
        <div
          id="devis-document"
          style={{
            background: '#ffffff', color: '#1a1a1a',
            width: '100%', maxWidth: '794px',
            padding: '56px 64px',
            borderRadius: '4px',
            boxShadow: '0 4px 32px rgba(0,0,0,0.3)',
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSize: '13px',
            lineHeight: 1.5,
          }}
        >
          {/* En-tête */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>
            {/* Logo / Entreprise */}
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#B8922A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                {devis.organisation.nom}
              </div>
              <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.7 }}>
                {devis.organisation.adresse}<br />
                {devis.organisation.ville}<br />
                {devis.organisation.telephone}<br />
                {devis.organisation.email}
              </div>
            </div>

            {/* Titre DEVIS */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#B8922A', letterSpacing: '-0.02em', lineHeight: 1 }}>
                DEVIS
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#222', marginTop: '4px' }}>
                {devis.numero}
              </div>
            </div>
          </div>

          {/* Ligne de séparation */}
          <div style={{ height: '2px', background: '#B8922A', marginBottom: '28px', borderRadius: '1px' }} />

          {/* Infos devis + client */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '36px' }}>
            {/* Client */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#B8922A', letterSpacing: '0.1em', marginBottom: '8px' }}>
                DEVIS PRÉPARÉ POUR
              </div>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{devis.client_nom}</div>
              <div style={{ color: '#555', fontSize: '12px', lineHeight: 1.7 }}>
                {devis.client_adresse}<br />
                {devis.client_ville}<br />
                {devis.client_email}
              </div>
            </div>

            {/* Détails */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#B8922A', letterSpacing: '0.1em', marginBottom: '8px' }}>
                DÉTAILS
              </div>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    { label: "Date d'émission", val: fmtDate(devis.date_emission) },
                    { label: 'Valide jusqu\'au',  val: fmtDate(devis.date_validite) },
                    { label: 'Projet',             val: devis.projet_titre ?? '—'  },
                  ].map(r => (
                    <tr key={r.label}>
                      <td style={{ color: '#888', paddingBottom: '6px', paddingRight: '12px', whiteSpace: 'nowrap' }}>{r.label}</td>
                      <td style={{ fontWeight: 600, paddingBottom: '6px' }}>{r.val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Titre du devis */}
          <div style={{
            background: '#f8f5ee', borderLeft: '4px solid #B8922A',
            padding: '12px 16px', marginBottom: '24px', borderRadius: '0 4px 4px 0',
          }}>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>{devis.titre}</span>
          </div>

          {/* Tableau des lignes */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '28px' }}>
            <thead>
              <tr style={{ background: '#B8922A' }}>
                {['Description', 'Qté', 'Unité', 'Prix unitaire', 'Total'].map((h, i) => (
                  <th key={h} style={{
                    color: '#fff', fontWeight: 700, fontSize: '11px', letterSpacing: '0.05em',
                    padding: '10px 12px', textAlign: i === 0 ? 'left' : 'right',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {devis.lignes.map((l, i) => (
                <tr key={l.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '10px 12px', fontSize: '12px' }}>{l.description}</td>
                  <td style={{ padding: '10px 12px', fontSize: '12px', textAlign: 'right' }}>{l.quantite}</td>
                  <td style={{ padding: '10px 12px', fontSize: '11px', color: '#888', textAlign: 'right' }}>{l.unite}</td>
                  <td style={{ padding: '10px 12px', fontSize: '12px', textAlign: 'right' }}>{fmt(l.prix_unitaire)}</td>
                  <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 600, textAlign: 'right' }}>{fmt(l.total_ligne)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totaux */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
            <div style={{ minWidth: '260px' }}>
              <div style={{ height: '1px', background: '#e0e0e0', marginBottom: '10px' }} />
              {[
                { label: 'Sous-total', val: fmt(devis.sous_total) },
                { label: `TPS ${devis.taux_tps}%  (${devis.organisation.tps_numero})`, val: fmt(devis.montant_tps) },
                { label: `TVQ ${devis.taux_tvq}%  (${devis.organisation.tvq_numero})`, val: fmt(devis.montant_tvq) },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#555', marginBottom: '6px' }}>
                  <span>{r.label}</span><span>{r.val}</span>
                </div>
              ))}
              <div style={{ height: '2px', background: '#B8922A', margin: '10px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: '#B8922A' }}>
                <span>TOTAL TTC</span><span>{fmt(devis.total_ttc)}</span>
              </div>
            </div>
          </div>

          {/* Notes client */}
          {devis.notes_client && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#B8922A', letterSpacing: '0.1em', marginBottom: '6px' }}>NOTES</div>
              <p style={{ fontSize: '12px', color: '#555', lineHeight: 1.6, margin: 0 }}>{devis.notes_client}</p>
            </div>
          )}

          {/* Conditions */}
          {devis.conditions && (
            <div style={{ marginBottom: '40px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#B8922A', letterSpacing: '0.1em', marginBottom: '6px' }}>CONDITIONS</div>
              <p style={{ fontSize: '11px', color: '#888', lineHeight: 1.6, margin: 0 }}>{devis.conditions}</p>
            </div>
          )}

          {/* Zone de signature */}
          <div style={{ height: '1px', background: '#e0e0e0', marginBottom: '28px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            {['Approuvé par le client', 'Pour ' + devis.organisation.nom].map(label => (
              <div key={label}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#B8922A', letterSpacing: '0.1em', marginBottom: '32px' }}>
                  {label.toUpperCase()}
                </div>
                <div style={{ height: '1px', background: '#999', marginBottom: '6px' }} />
                <div style={{ fontSize: '10px', color: '#888' }}>Signature &amp; date</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          #devis-document { box-shadow: none !important; }
        }
      `}</style>
    </div>
  )
}
