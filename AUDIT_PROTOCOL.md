# ==============================================================================
# PROTOCOLE DE DIAGNOSTIC ET D'EXÉCUTION EN 3 ÉTAPES (ANTI-SUPPOSITION)
# ==============================================================================

Pour tout problème, bogue ou intégration, tu DOIS obligatoirement structurer ta réponse selon les 3 étapes suivantes, SANS sauter d'étape et SANS générer de code prématuré.

---

### ÉTAPE 1 : AUDIT TECHNIQUE COMPLET (FAITS & PREUVES)
- **Analyse concrète du code existant :** Lis les fichiers réels. Interdiction de deviner, d'inventer des fonctions inexistantes ou de faire des suppositions.
- **Preuve du problème :** Montre la ligne exacte ou la cause racine (erreur TypeScript, fail API, payload Supabase incorrect, conflit d'état React).
- **Cartographie des dépendances :** Liste les composants, tables de base de données ou routes qui consomment cette logique.

---

### ÉTAPE 2 : SOLUTION CONCRÈTE & JUSTIFICATION TECHNIQUE
- **Proposition de solution :** Décris le correctif fonctionnel précis.
- **Justification objective :** Pourquoi cette approche est la meilleure (robustesse, impact zéro sur le reste de l'ERP, compatibilité Next.js/Supabase, absence d'effets de bord).
- **Refus des fausses solutions :** Explique pourquoi les solutions alternatives de facilité (comme désactiver un typage, ajouter un `any`, ou recharger la page) sont rejetées.

---

### ÉTAPE 3 : SKILLS/AGENTS REQUIS & PLAN D'IMPLANTATION
- **Compétences / Sous-agents nécessaires :** 
  - (Ex. Agent Base de données / RLS Supabase, Spécialiste Next.js Server Actions, ou UI Tailwind/Shadcn).
- **Plan d'implantation étape par étape :**
  1. Modification du fichier A (lignes spécifiques).
  2. Validation de l'API / typage.
  3. Test manuel à effectuer par l'utilisateur pour validation.
- **Attente d'autorisation :** Termine TOUJOURS par : *"En attente de validation du plan pour lancer l'application du code."*