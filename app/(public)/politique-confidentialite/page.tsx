import Link from 'next/link'
import { Building2, Shield, Lock, Eye, Trash2, Mail, Calendar } from 'lucide-react'

export const metadata = {
  title: 'Politique de confidentialité — ERP Construction',
  description: 'Politique de confidentialité conforme à la Loi 25 du Québec (Loi sur la protection des renseignements personnels dans le secteur privé).',
}

const SECTION_STYLE: React.CSSProperties = {
  background: '#fff', border: '0.5px solid #E5E5E5',
  borderRadius: '10px', padding: '24px 28px', marginBottom: '16px',
}

const H2_STYLE: React.CSSProperties = {
  fontSize: '15px', fontWeight: 700, color: '#111', marginBottom: '12px',
  display: 'flex', alignItems: 'center', gap: '8px',
}

const P_STYLE: React.CSSProperties = {
  fontSize: '13px', color: '#444', lineHeight: 1.7, margin: '0 0 10px',
}

const UL_STYLE: React.CSSProperties = {
  paddingLeft: '20px', margin: '6px 0 10px',
}

const LI_STYLE: React.CSSProperties = {
  fontSize: '13px', color: '#444', lineHeight: 1.7, marginBottom: '4px',
}

export default function PolitiqueConfidentialite() {
  return (
    <div style={{ background: '#F7F7F5', minHeight: '100vh', padding: '40px 16px' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>

        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '12px',
            background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <Shield size={24} color="#C9A84C" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111', marginBottom: '8px' }}>
            Politique de confidentialité
          </h1>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>
            ERP Construction — NovaStructure AI Inc.
          </p>
          <p style={{ fontSize: '12px', color: '#999' }}>
            Dernière mise à jour : 23 juin 2026 · Conforme à la <strong>Loi 25 du Québec</strong>
          </p>
        </div>

        {/* Bannière Loi 25 */}
        <div style={{
          background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.3)',
          borderRadius: '10px', padding: '16px 20px', marginBottom: '20px',
          display: 'flex', gap: '14px', alignItems: 'flex-start',
        }}>
          <Shield size={18} color="#C9A84C" style={{ marginTop: '1px', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', marginBottom: '4px' }}>
              Conforme à la Loi 25 — Loi sur la protection des renseignements personnels dans le secteur privé (L.R.Q., c. P-39.1)
            </div>
            <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.6 }}>
              Cette politique explique quels renseignements personnels nous collectons, pourquoi, comment nous les protégeons et quels sont vos droits. Vous avez le droit d'accéder à vos données, de les corriger ou d'en demander la suppression.
            </div>
          </div>
        </div>

        {/* 1. Qui sommes-nous */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}><Building2 size={15} color="#C9A84C" /> 1. Responsable du traitement</h2>
          <p style={P_STYLE}>
            <strong>NovaStructure AI Inc.</strong> (ci-après « nous », « notre entreprise ») est responsable du traitement de vos renseignements personnels dans le cadre de l'utilisation du logiciel ERP Construction.
          </p>
          <p style={P_STYLE}>
            <strong>Responsable de la protection des renseignements personnels (RPRP) :</strong><br />
            Max — max@growth-plan.ca<br />
            Toute demande relative à vos renseignements personnels doit être adressée à cette personne.
          </p>
        </div>

        {/* 2. Renseignements collectés */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}><Eye size={15} color="#C9A84C" /> 2. Renseignements personnels collectés</h2>
          <p style={P_STYLE}>Nous collectons uniquement les renseignements nécessaires aux fins décrites dans cette politique :</p>

          <p style={{ ...P_STYLE, fontWeight: 600, color: '#111' }}>Informations de compte :</p>
          <ul style={UL_STYLE}>
            <li style={LI_STYLE}>Nom complet</li>
            <li style={LI_STYLE}>Adresse courriel</li>
            <li style={LI_STYLE}>Mot de passe (chiffré — nous n'y avons jamais accès)</li>
          </ul>

          <p style={{ ...P_STYLE, fontWeight: 600, color: '#111' }}>Informations des clients (données saisies par l'entreprise utilisatrice) :</p>
          <ul style={UL_STYLE}>
            <li style={LI_STYLE}>Nom, prénom et coordonnées des clients</li>
            <li style={LI_STYLE}>Adresses de projets de construction</li>
            <li style={LI_STYLE}>Informations de facturation (montants, devis, factures)</li>
            <li style={LI_STYLE}>Communications échangées via le portail client</li>
          </ul>

          <p style={{ ...P_STYLE, fontWeight: 600, color: '#111' }}>Données techniques :</p>
          <ul style={UL_STYLE}>
            <li style={LI_STYLE}>Adresse IP (journaux de connexion)</li>
            <li style={LI_STYLE}>Type de navigateur et appareil</li>
            <li style={LI_STYLE}>Horodatages de connexion</li>
          </ul>

          <p style={{ ...P_STYLE, color: '#888', fontStyle: 'italic' }}>
            Nous ne collectons pas de numéros d'assurance sociale, d'informations de santé, ni de données de carte de crédit (les paiements sont gérés par des processeurs tiers certifiés).
          </p>
        </div>

        {/* 3. Finalités */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}><Lock size={15} color="#C9A84C" /> 3. Finalités du traitement</h2>
          <p style={P_STYLE}>Vos renseignements sont utilisés aux seules fins suivantes :</p>
          <ul style={UL_STYLE}>
            <li style={LI_STYLE}><strong>Authentification :</strong> vérifier votre identité lors de la connexion</li>
            <li style={LI_STYLE}><strong>Gestion opérationnelle :</strong> création de devis, factures, gestion de chantiers</li>
            <li style={LI_STYLE}><strong>Communication :</strong> envoi de devis, rappels et confirmations par courriel</li>
            <li style={LI_STYLE}><strong>Sécurité :</strong> détection de fraude et protection du compte</li>
            <li style={LI_STYLE}><strong>Amélioration du service :</strong> analyse des fonctionnalités utilisées (données agrégées et anonymisées)</li>
          </ul>
          <p style={{ ...P_STYLE, color: '#888', fontStyle: 'italic' }}>
            Nous n'utilisons pas vos renseignements à des fins de publicité ciblée. Nous ne vendons jamais vos données à des tiers.
          </p>
        </div>

        {/* 4. Sécurité */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}><Lock size={15} color="#C9A84C" /> 4. Mesures de sécurité</h2>
          <p style={P_STYLE}>
            Nous appliquons des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos renseignements :
          </p>
          <ul style={UL_STYLE}>
            <li style={LI_STYLE}><strong>Chiffrement au repos :</strong> AES-256 (via Supabase / infrastructure AWS)</li>
            <li style={LI_STYLE}><strong>Chiffrement en transit :</strong> TLS 1.2+ sur toutes les connexions</li>
            <li style={LI_STYLE}><strong>Mots de passe :</strong> hachés avec bcrypt — nous ne pouvons pas lire votre mot de passe</li>
            <li style={LI_STYLE}><strong>Contrôle d'accès :</strong> Row Level Security (RLS) — chaque utilisateur n'accède qu'à ses propres données</li>
            <li style={LI_STYLE}><strong>Authentification :</strong> sessions sécurisées par jetons JWT à durée limitée</li>
            <li style={LI_STYLE}><strong>Infrastructure :</strong> hébergée sur AWS (région us-east-1) — conformité SOC 2 Type II</li>
          </ul>
          <p style={P_STYLE}>
            En cas d'incident de confidentialité susceptible de causer un préjudice sérieux, nous vous en informerons et le déclarerons à la Commission d'accès à l'information (CAI) dans les délais requis par la Loi 25.
          </p>
        </div>

        {/* 5. Conservation */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}><Calendar size={15} color="#C9A84C" /> 5. Durée de conservation</h2>
          <ul style={UL_STYLE}>
            <li style={LI_STYLE}><strong>Données de compte actif :</strong> conservées tant que le compte est actif</li>
            <li style={LI_STYLE}><strong>Données de compte inactif :</strong> supprimées après 2 ans d'inactivité</li>
            <li style={LI_STYLE}><strong>Factures et devis :</strong> conservés 7 ans (obligation légale fiscale québécoise)</li>
            <li style={LI_STYLE}><strong>Journaux de connexion :</strong> conservés 90 jours</li>
            <li style={LI_STYLE}><strong>Données supprimées à la demande :</strong> effacement sous 30 jours</li>
          </ul>
        </div>

        {/* 6. Vos droits */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}><Shield size={15} color="#C9A84C" /> 6. Vos droits (Loi 25)</h2>
          <p style={P_STYLE}>Conformément à la Loi 25, vous avez les droits suivants :</p>
          <ul style={UL_STYLE}>
            <li style={LI_STYLE}><strong>Droit d'accès :</strong> consulter les renseignements que nous détenons sur vous</li>
            <li style={LI_STYLE}><strong>Droit de rectification :</strong> corriger des informations inexactes ou incomplètes</li>
            <li style={LI_STYLE}><strong>Droit de suppression :</strong> demander l'effacement de vos données (sous réserve des obligations légales)</li>
            <li style={LI_STYLE}><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré et lisible par machine</li>
            <li style={LI_STYLE}><strong>Droit de retrait du consentement :</strong> retirer votre consentement à tout moment</li>
            <li style={LI_STYLE}><strong>Droit de déposer une plainte :</strong> auprès de la Commission d'accès à l'information (CAI) du Québec</li>
          </ul>
          <div style={{
            background: '#F0F9F4', border: '0.5px solid #86EFAC',
            borderRadius: '8px', padding: '12px 16px', marginTop: '10px',
          }}>
            <p style={{ ...P_STYLE, margin: 0 }}>
              Pour exercer vos droits, contactez notre RPRP :<br />
              <strong>max@growth-plan.ca</strong><br />
              Nous répondrons dans un délai maximum de 30 jours.
            </p>
          </div>
        </div>

        {/* 7. Tiers */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}><Building2 size={15} color="#C9A84C" /> 7. Partage avec des tiers</h2>
          <p style={P_STYLE}>Nous partageons vos données uniquement avec :</p>
          <ul style={UL_STYLE}>
            <li style={LI_STYLE}><strong>Supabase</strong> (base de données et authentification) — conforme SOC 2, GDPR</li>
            <li style={LI_STYLE}><strong>Netlify</strong> (hébergement) — certifié SOC 2 Type II</li>
            <li style={LI_STYLE}><strong>Resend</strong> (envoi de courriels transactionnels) — données minimales</li>
            <li style={LI_STYLE}><strong>OpenAI / Anthropic</strong> (fonctionnalités IA) — uniquement si vous utilisez les fonctions IA ; aucune donnée client identifiable n'est transmise</li>
          </ul>
          <p style={{ ...P_STYLE, color: '#888', fontStyle: 'italic' }}>
            Aucun de ces fournisseurs n'est autorisé à utiliser vos données à d'autres fins que la prestation du service.
          </p>
        </div>

        {/* 8. Cookies */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}><Lock size={15} color="#C9A84C" /> 8. Témoins (cookies)</h2>
          <p style={P_STYLE}>Nous utilisons uniquement les témoins essentiels au fonctionnement du service :</p>
          <ul style={UL_STYLE}>
            <li style={LI_STYLE}><strong>sb-access-token</strong> — maintient votre session de connexion (expire en 1 heure)</li>
            <li style={LI_STYLE}><strong>sb-refresh-token</strong> — permet le renouvellement automatique de session (expire en 30 jours)</li>
          </ul>
          <p style={{ ...P_STYLE, color: '#888' }}>
            Nous n'utilisons pas de témoins publicitaires, de traçage inter-sites, ni de Google Analytics.
          </p>
        </div>

        {/* 9. Modifications */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}><Calendar size={15} color="#C9A84C" /> 9. Modifications de cette politique</h2>
          <p style={P_STYLE}>
            Nous pouvons modifier cette politique pour refléter des changements législatifs ou opérationnels. Toute modification importante sera communiquée par courriel 30 jours avant son entrée en vigueur.
          </p>
          <p style={P_STYLE}>
            La version en vigueur est toujours accessible à cette adresse.
          </p>
        </div>

        {/* Contact */}
        <div style={{
          background: 'rgba(201,168,76,0.06)', border: '0.5px solid rgba(201,168,76,0.25)',
          borderRadius: '10px', padding: '20px 24px', textAlign: 'center', marginBottom: '32px',
        }}>
          <Mail size={18} color="#C9A84C" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#111', marginBottom: '4px' }}>
            Questions sur vos renseignements personnels ?
          </div>
          <div style={{ fontSize: '13px', color: '#555', marginBottom: '12px' }}>
            Contactez notre Responsable de la protection des renseignements personnels
          </div>
          <a href="mailto:max@growth-plan.ca" style={{
            display: 'inline-block', background: '#C9A84C', color: '#0A0A0A',
            borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: 600,
            textDecoration: 'none',
          }}>
            max@growth-plan.ca
          </a>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: '11px', color: '#999' }}>
          <Link href="/login" style={{ color: '#999', textDecoration: 'underline' }}>Retour à la connexion</Link>
          {' · '}NovaStructure AI Inc. · Québec, Canada · © 2026
        </p>

      </div>
    </div>
  )
}
