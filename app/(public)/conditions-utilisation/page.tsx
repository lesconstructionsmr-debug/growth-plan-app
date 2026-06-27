import { FileText } from 'lucide-react'

export const metadata = {
  title: "Conditions générales d'utilisation — Plan Growth",
}

export default function CGUPage() {
  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 80px' }}>

      {/* En-tête */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <FileText size={20} color="var(--gold)" />
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--txt-1)', margin: 0 }}>
            Conditions générales d'utilisation
          </h1>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--txt-3)', margin: 0 }}>
          Dernière mise à jour : 23 juin 2026 · En vigueur dès la création d'un compte
        </p>
      </div>

      <Section titre="1. Parties">
        <p>Les présentes Conditions générales d'utilisation (« CGU ») constituent un contrat entre <strong>Nova Structure AI inc.</strong> (« Plan Growth », « nous », « notre »), société constituée selon les lois du Québec, et toute personne physique ou morale (« l'Abonné ») qui accède au logiciel Plan Growth disponible à l'adresse <strong>app.growth-plan.ca</strong>.</p>
        <p>En créant un compte ou en utilisant le Service, l'Abonné accepte expressément les présentes CGU dans leur intégralité.</p>
      </Section>

      <Section titre="2. Description du service">
        <p>Plan Growth est un logiciel de gestion d'entreprise (ERP) en mode SaaS (Software as a Service) destiné aux entrepreneurs en construction et en rénovation au Québec. Il comprend notamment :</p>
        <ul>
          <li>Gestion des clients, prospects et pipeline CRM</li>
          <li>Création et envoi de devis et factures avec signatures électroniques</li>
          <li>Gestion des chantiers, calendrier et pointage des employés</li>
          <li>Tableau de bord financier, rapports et indicateurs de performance</li>
          <li>Outils d'acquisition de clients assistés par intelligence artificielle</li>
          <li>Automatisations (rappels, facturation, notifications)</li>
        </ul>
      </Section>

      <Section titre="3. Compte et accès">
        <p><strong>3.1 Inscription.</strong> L'Abonné doit créer un compte en fournissant des informations exactes et à jour. L'Abonné est responsable de la confidentialité de ses identifiants.</p>
        <p><strong>3.2 Multi-utilisateurs.</strong> Chaque compte est isolé dans un espace sécurisé (« compagnie ») distinct des autres abonnés. Aucun autre abonné ne peut accéder aux données de la compagnie de l'Abonné.</p>
        <p><strong>3.3 Usage acceptable.</strong> L'Abonné s'engage à utiliser le Service uniquement à des fins légales et conformes aux lois canadiennes et québécoises applicables.</p>
      </Section>

      <Section titre="4. Abonnement et facturation">
        <p><strong>4.1 Plans.</strong> Plan Growth est offert en deux plans : mensuel (175 $ CAD/mois) et annuel (2 000 $ CAD/an, soit l'équivalent de ~167 $/mois). Les prix s'entendent taxes en sus.</p>
        <p><strong>4.2 Essai gratuit.</strong> Un essai gratuit de 45 jours peut être accordé sous conditions via code promotionnel. Aucune carte de crédit n'est requise pendant la période d'essai.</p>
        <p><strong>4.3 Renouvellement automatique.</strong> L'abonnement se renouvelle automatiquement à la fin de chaque période sauf résiliation par l'Abonné avant la date de renouvellement.</p>
        <p><strong>4.4 Remboursements.</strong> Les sommes déjà facturées ne sont pas remboursables, sauf disposition contraire prévue par la loi ou accord écrit de Plan Growth.</p>
        <p><strong>4.5 Traitement des paiements.</strong> Les paiements sont traités par Stripe Inc. Plan Growth ne conserve aucune information de carte de crédit.</p>
      </Section>

      <Section titre="5. Propriété intellectuelle">
        <p><strong>5.1 Logiciel.</strong> Le Service, son code source, son interface, ses algorithmes et sa documentation sont la propriété exclusive de Nova Structure AI inc. et sont protégés par les lois canadiennes sur le droit d'auteur.</p>
        <p><strong>5.2 Données de l'Abonné.</strong> L'Abonné conserve l'entière propriété de toutes les données qu'il saisit dans le Service (clients, devis, factures, etc.). Plan Growth n'utilise pas ces données à des fins commerciales.</p>
        <p><strong>5.3 Licence d'utilisation.</strong> Plan Growth accorde à l'Abonné une licence non exclusive, non transférable et révocable d'accès au Service pendant la durée de l'abonnement actif.</p>
      </Section>

      <Section titre="6. Protection des renseignements personnels">
        <p>La collecte et l'utilisation des renseignements personnels sont régies par notre <a href="/politique-confidentialite" style={{ color: 'var(--gold-2)' }}>Politique de confidentialité</a>, qui fait partie intégrante des présentes CGU et qui est conforme à la <em>Loi sur la protection des renseignements personnels dans le secteur privé</em> (Loi 25) du Québec et à la <em>Loi sur la protection des renseignements personnels et les documents électroniques</em> (LPRPDE) du Canada.</p>
      </Section>

      <Section titre="7. Disponibilité et maintenance">
        <p><strong>7.1 Disponibilité cible.</strong> Plan Growth vise une disponibilité du Service de 99 % sur une base mensuelle, excluant les maintenances planifiées et les événements hors de son contrôle.</p>
        <p><strong>7.2 Maintenance.</strong> Des interruptions planifiées peuvent survenir et seront annoncées au minimum 24 heures à l'avance via email ou page de statut.</p>
        <p><strong>7.3 Aucune garantie absolue.</strong> Le Service est fourni « tel quel ». Plan Growth ne garantit pas que le Service sera exempt d'erreurs ou ininterrompu en tout temps.</p>
      </Section>

      <Section titre="8. Limitation de responsabilité">
        <p>Dans toute la mesure permise par la loi applicable, Plan Growth ne pourra être tenu responsable de dommages indirects, incidents, spéciaux ou consécutifs (perte de revenus, perte de données, perte de clients) découlant de l'utilisation ou de l'impossibilité d'utiliser le Service.</p>
        <p>La responsabilité totale de Plan Growth envers l'Abonné pour toute réclamation est limitée aux sommes effectivement payées par l'Abonné au cours des trois (3) mois précédant l'événement à l'origine de la réclamation.</p>
      </Section>

      <Section titre="9. Résiliation">
        <p><strong>9.1 Par l'Abonné.</strong> L'Abonné peut résilier son abonnement à tout moment via le Portail Stripe accessible dans Paramètres → Abonnement. La résiliation prend effet à la fin de la période de facturation en cours.</p>
        <p><strong>9.2 Par Plan Growth.</strong> Plan Growth peut suspendre ou résilier l'accès de l'Abonné en cas de violation des présentes CGU, de non-paiement, ou pour des motifs légaux impérieux, avec un préavis de 15 jours sauf urgence.</p>
        <p><strong>9.3 Export des données.</strong> À la résiliation, l'Abonné dispose de 30 jours pour exporter ses données. Après ce délai, les données pourront être supprimées définitivement.</p>
      </Section>

      <Section titre="10. Modification des CGU">
        <p>Plan Growth se réserve le droit de modifier les présentes CGU. L'Abonné sera notifié par email au moins 30 jours avant l'entrée en vigueur des modifications. L'utilisation continue du Service après cette période vaut acceptation des nouvelles CGU.</p>
      </Section>

      <Section titre="11. Droit applicable et tribunaux compétents">
        <p>Les présentes CGU sont régies par les lois de la province de Québec et les lois fédérales du Canada applicables. Tout litige sera soumis à la compétence exclusive des tribunaux du district judiciaire de Québec.</p>
      </Section>

      <Section titre="12. Contact">
        <p>Pour toute question relative aux présentes CGU :</p>
        <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '14px 16px', marginTop: '10px', fontSize: '12px', lineHeight: 1.8 }}>
          <strong>Nova Structure AI inc.</strong><br />
          📧 <a href="mailto:max@growth-plan.ca" style={{ color: 'var(--gold-2)' }}>max@growth-plan.ca</a><br />
          🌐 <a href="https://app.growth-plan.ca" style={{ color: 'var(--gold-2)' }}>app.growth-plan.ca</a>
        </div>
      </Section>

    </div>
  )
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--txt-1)', marginBottom: '10px', paddingBottom: '6px', borderBottom: '0.5px solid var(--line)' }}>
        {titre}
      </h2>
      <div style={{ fontSize: '13px', color: 'var(--txt-2)', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {children}
      </div>
    </div>
  )
}
