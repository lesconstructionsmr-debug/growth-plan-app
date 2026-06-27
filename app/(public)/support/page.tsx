'use client'

import { LifeBuoy, Mail, MessageCircle, FileText, BookOpen, Clock } from 'lucide-react'

const metadata = {
  title: 'Support — Plan Growth',
}

export default function SupportPage() {
  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 80px' }}>

      {/* En-tête */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <LifeBuoy size={24} color="var(--gold)" />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--txt-1)', margin: '0 0 10px' }}>
          Centre d'aide Plan Growth
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--txt-2)', margin: 0, maxWidth: '480px', marginInline: 'auto', lineHeight: 1.7 }}>
          Une question sur votre ERP ? Notre équipe est là pour vous aider.
          Réponse garantie dans les 24 heures ouvrables.
        </p>
      </div>

      {/* Cartes de contact */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '40px' }}>
        <ContactCard
          icon={<Mail size={20} color="var(--gold)" />}
          titre="Email"
          desc="Pour toute question générale, bug ou demande de fonctionnalité"
          action="max@growth-plan.ca"
          href="mailto:max@growth-plan.ca"
          délai="Réponse sous 24h"
        />
        <ContactCard
          icon={<MessageCircle size={20} color="#4F81F0" />}
          titre="Chat en direct"
          desc="Disponible directement dans votre ERP via le bouton de support"
          action="Ouvrir le chat"
          href="/dashboard"
          délai="Lun–Ven, 9h–17h EST"
        />
      </div>

      {/* Questions fréquentes */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={16} color="var(--gold)" />
          Questions fréquentes
        </h2>

        {[
          {
            q: "Comment créer mon premier devis ?",
            r: "Allez dans Devis → Nouveau devis. Sélectionnez votre client, ajoutez les lignes (description, quantité, prix unitaire), choisissez si vous appliquez TPS/TVQ, puis cliquez Créer & Envoyer. Le client recevra un lien pour approuver en ligne.",
          },
          {
            q: "Est-ce que mes données sont isolées des autres clients ?",
            r: "Oui, absolument. Chaque abonné dispose d'un espace compagnie totalement isolé avec Row Level Security (RLS) au niveau de la base de données. Aucun autre abonné ne peut accéder à vos données.",
          },
          {
            q: "Comment annuler ou modifier mon abonnement ?",
            r: "Dans votre ERP, allez dans Paramètres → Abonnement → Gérer l'abonnement. Vous serez redirigé vers le portail Stripe sécurisé pour modifier votre plan, changer votre carte ou annuler.",
          },
          {
            q: "Puis-je inviter mon équipe à utiliser Plan Growth ?",
            r: "Oui. Dans Paramètres → Équipe, vous pouvez inviter des collaborateurs par email. Chaque membre accède à votre espace compagnie avec son propre compte.",
          },
          {
            q: "La facture est-elle créée automatiquement quand le client approuve un devis ?",
            r: "Oui. Lorsque votre client approuve un devis via son portail client, une facture est créée automatiquement avec le même montant et les mêmes lignes. Vous n'avez qu'à l'envoyer.",
          },
          {
            q: "Êtes-vous conformes à la Loi 25 du Québec ?",
            r: "Oui. Plan Growth respecte la Loi sur la protection des renseignements personnels dans le secteur privé (Loi 25). Vous pouvez consulter notre Politique de confidentialité complète pour tous les détails.",
          },
        ].map((faq, i) => (
          <FAQ key={i} q={faq.q} r={faq.r} />
        ))}
      </div>

      {/* Liens utiles */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} color="var(--gold)" />
          Documents utiles
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { label: "Politique de confidentialité (Loi 25)",   href: '/politique-confidentialite' },
            { label: "Conditions générales d'utilisation",       href: '/conditions-utilisation' },
            { label: "Tarifs et plans",                           href: '/tarifs' },
          ].map(link => (
            <a key={link.href} href={link.href}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: 'var(--bg-1)',
                border: '0.5px solid var(--line)', borderRadius: '9px',
                fontSize: '13px', color: 'var(--txt-1)', textDecoration: 'none',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--gold-3)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--line)')}>
              {link.label}
              <span style={{ color: 'var(--txt-3)', fontSize: '16px' }}>→</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

function ContactCard({ icon, titre, desc, action, href, délai }: {
  icon: React.ReactNode; titre: string; desc: string;
  action: string; href: string; délai: string
}) {
  return (
    <a href={href} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px', background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', textDecoration: 'none', transition: 'border-color 0.15s' }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--gold-3)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--line)')}>
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '4px' }}>{titre}</div>
        <div style={{ fontSize: '11px', color: 'var(--txt-3)', lineHeight: 1.6 }}>{desc}</div>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--gold-2)', fontWeight: 500 }}>{action}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--txt-3)' }}>
        <Clock size={10} /> {délai}
      </div>
    </a>
  )
}

function FAQ({ q, r }: { q: string; r: string }) {
  return (
    <details style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '9px', marginBottom: '8px', overflow: 'hidden' }}>
      <summary style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 500, color: 'var(--txt-1)', cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {q}
        <span style={{ fontSize: '16px', color: 'var(--txt-3)', userSelect: 'none', flexShrink: 0 }}>+</span>
      </summary>
      <div style={{ padding: '0 16px 14px', fontSize: '12px', color: 'var(--txt-2)', lineHeight: 1.8, borderTop: '0.5px solid var(--line)' }}>
        <div style={{ paddingTop: '12px' }}>{r}</div>
      </div>
    </details>
  )
}
