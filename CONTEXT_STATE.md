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
