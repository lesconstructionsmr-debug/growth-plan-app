# ÉTAT ACTUEL DU PROJET - ERP LITE

## 1. Stack & Architecture
- Frontend : Next.js (App Router, Tailwind CSS, TypeScript)
- Backend : API Routes / Node.js / FastAPI
- Base de données : PostgreSQL / Supabase
- État global : Propre, sans modifications pendantes

## 2. Modules Existants & Frontières Hermétiques
- `/modules/auth` : Gestion connexions et profils uniquement.
- `/modules/calendar` : Gestion des rendez-vous et dates d'intervention uniquement. (AUCUNE LOGIQUE DE DEVIS).
- `/modules/quotes` : Gestion des soumissions, devis et items financiers.
- `/modules/clients` : Base de contacts et fiches clients.

## 3. Règle d'or de conversation
Chaque session traite UNE SEULE sous-tâche. Ne jamais mélanger le code d'un module avec un autre.
- [x] Phase 1-3 validée : Séquenceur atomique, logs Loi 25 et 120 tests unitaires passés.
- [x] Phase 4 validée : Assignation Responsable & Édition complète des tâches fondateur (titre, priorité, échéance, responsable, notes), tri intelligent du pipeline commercial adhésion, suppression instantanée des mauvais leads.
- [x] Phase 5 validée : Correction définitive Stripe Checkout (`add_invoice_items`), élimination du fallback d'essai silencieux, activation et débit immédiat sans redirection onboarding.