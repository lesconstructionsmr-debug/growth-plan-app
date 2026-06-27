'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Download, Printer } from 'lucide-react'

const fmt = (n: number) =>
  n.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })

interface FactureDoc {
  numero: string; titre: string; statut: string
  client_nom: string; client_email: string; client_adresse: string; client_ville: string
  date_emission: string; date_echeance: string
  sous_total: number; montant_tps: number; montant_tvq: number; total_ttc: number
  taux_tps: number; taux_tvq: number
  notes_client: string | null
  lignes: { id: string; description: string; quantite: number; unite: string; prix_unitaire: number; total_ligne: number }[]
  organisation: { nom: string; email: string; telephone: string; adresse: string; ville: string; tps_numero: string; tvq_numero: string }
}

const FALLBACK: FactureDoc = {
  numero: '—', titre: 'Chargement…', statut: '',
  client_nom: '—', client_email: '', client_adresse: '', client_ville: '',
  date_emission: new Date().toISOString().split('T')[0],
  date_echeance: new Date().toISOString().split('T')[0],
  sous_total: 0, montant_tps: 0, montant_tvq: 0, total_ttc: 0,
  taux_tps: 5, taux_tvq: 9.975,
  notes_client: null, lignes: [],
  organisation: { nom: 'Mon Entreprise', email: '', telephone: '', adresse: '', ville: '', tps_numero: '', tvq_numero: '' },
}

export default function FacturePreviewPage() {
  const { id } = useParams<{ id: string }>()
  const [facture, setFacture] = useState<FactureDoc>(FALLBACK)

  useEffect(() => {
    if (!id) return
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase
      .from('factures')
      .select('id, numero, titre, statut, lignes, montant_ht, tps, tvq, montant_ttc, date_emission, date_echeance, notes, clients(nom, email, adresse, ville), companies(name, email, telephone, adresse, ville, tps_no, tvq_no)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) return
        const cli = data.clients as any ?? {}
        const org = data.companies as any ?? {}
        const lignes = Array.isArray(data.lignes) ? data.lignes.map((l: any, i: number) => ({
          id: String(i), description: l.description ?? '',
          quantite: Number(l.quantite ?? 1), unite: l.unite ?? 'u',
          prix_unitaire: Number(l.prix_unitaire ?? 0),
          total_ligne: Number(l.quantite ?? 1) * Number(l.prix_unitaire ?? 0),
        })) : []
        setFacture({
          numero: data.numero ?? '',
          titre: data.titre ?? '',
          statut: data.statut ?? '',
          client_nom: cli.nom ?? '—',
          client_email: cli.email ?? '',
          client_adresse: cli.adresse ?? '',
          client_ville: cli.ville ?? '',
          date_emission: data.date_emission ?? '',
          date_echeance: data.date_echeance ?? '',
          sous_total: Number(data.montant_ht ?? 0),
          montant_tps: Number(data.tps ?? 0),
          montant_tvq: Number(data.tvq ?? 0),
          total_ttc: Number(data.montant_ttc ?? 0),
          taux_tps: 5, taux_tvq: 9.975,
          notes_client: data.notes ?? null,
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
      {/* Barre d'outils */}
      <div className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg-1)', borderBottom: '0.5px solid var(--line)',
        padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href={`/factures/${id}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--txt-3)', textDecoration: 'none' }}>
          <ArrowLeft size={13} /> Retour à la facture
        </a>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '7px 12px', fontSize: '11px', color: 'var(--txt-2)', cursor: 'pointer' }}>
            <Printer size={13} /> Imprimer
          </button>
          <button
            onClick={() => { const orig = document.title; document.title = `Facture-${facture.numero}`; window.print(); document.title = orig }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--gold)', border: 'none', borderRadius: '7px', padding: '7px 14px', fontSize: '11px', color: '#0A0A0A', fontWeight: 600, cursor: 'pointer' }}
          >
            <Download size={13} /> Télécharger PDF
          </button>
        </div>
      </div>

      {/* Document */}
      <div style={{ padding: '32px 24px', display: 'flex', justifyContent: 'center' }}>
        <div id="facture-document" style={{
          background: '#ffffff', color: '#1a1a1a',
          width: '100%', maxWidth: '794px', padding: '56px 64px',
          borderRadius: '4px', boxShadow: '0 4px 32px rgba(0,0,0,0.3)',
          fontFamily: '"Inter", system-ui, sans-serif', fontSize: '13px', lineHeight: 1.5,
        }}>
          {/* En-tête */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#B8922A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                {facture.organisation.nom}
              </div>
              <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.7 }}>
                {facture.organisation.adresse}<br />
                {facture.organisation.ville}<br />
                {facture.organisation.telephone}<br />
                {facture.organisation.email}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#B8922A', letterSpacing: '-0.02em', lineHeight: 1 }}>FACTURE</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#222', marginTop: '4px' }}>{facture.numero}</div>
              <div style={{ fontSize: '11px', marginTop: '6px', padding: '4px 10px', background: facture.statut === 'payee' ? '#dcfce7' : '#fef9c3', borderRadius: '4px', display: 'inline-block', fontWeight: 600, color: facture.statut === 'payee' ? '#166534' : '#854d0e' }}>
                {facture.statut === 'payee' ? 'PAYÉE' : 'EN ATTENTE'}
              </div>
            </div>
          </div>

          <div style={{ height: '2px', background: '#B8922A', marginBottom: '28px', borderRadius: '1px' }} />

          {/* Infos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '36px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#B8922A', letterSpacing: '0.1em', marginBottom: '8px' }}>FACTURÉ À</div>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{facture.client_nom}</div>
              <div style={{ color: '#555', fontSize: '12px', lineHeight: 1.7 }}>
                {facture.client_adresse && <>{facture.client_adresse}<br /></>}
                {facture.client_ville && <>{facture.client_ville}<br /></>}
                {facture.client_email}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#B8922A', letterSpacing: '0.1em', marginBottom: '8px' }}>DÉTAILS</div>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    { label: "Date d'émission", val: fmtDate(facture.date_emission) },
                    { label: "Date d'échéance",  val: fmtDate(facture.date_echeance) },
                    { label: 'Objet',             val: facture.titre || '—' },
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

          {/* Lignes */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '28px' }}>
            <thead>
              <tr style={{ background: '#B8922A' }}>
                {['Description', 'Qté', 'Unité', 'Prix unitaire', 'Total'].map((h, i) => (
                  <th key={h} style={{ color: '#fff', fontWeight: 700, fontSize: '11px', letterSpacing: '0.05em', padding: '10px 12px', textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {facture.lignes.map((l, i) => (
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
                { label: 'Sous-total', val: fmt(facture.sous_total) },
                { label: `TPS ${facture.taux_tps}%${facture.organisation.tps_numero ? `  (${facture.organisation.tps_numero})` : ''}`, val: fmt(facture.montant_tps) },
                { label: `TVQ ${facture.taux_tvq}%${facture.organisation.tvq_numero ? `  (${facture.organisation.tvq_numero})` : ''}`, val: fmt(facture.montant_tvq) },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#555', marginBottom: '6px' }}>
                  <span>{r.label}</span><span>{r.val}</span>
                </div>
              ))}
              <div style={{ height: '2px', background: '#B8922A', margin: '10px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: '#B8922A' }}>
                <span>TOTAL TTC</span><span>{fmt(facture.total_ttc)}</span>
              </div>
            </div>
          </div>

          {facture.notes_client && (
            <div style={{ marginBottom: '40px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#B8922A', letterSpacing: '0.1em', marginBottom: '6px' }}>NOTES</div>
              <p style={{ fontSize: '12px', color: '#555', lineHeight: 1.6, margin: 0 }}>{facture.notes_client}</p>
            </div>
          )}

          <div style={{ height: '1px', background: '#e0e0e0', marginBottom: '16px' }} />
          <p style={{ fontSize: '11px', color: '#888', textAlign: 'center', margin: 0 }}>
            Merci de votre confiance — {facture.organisation.nom}
          </p>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          #facture-document { box-shadow: none !important; }
        }
      `}</style>
    </div>
  )
}
