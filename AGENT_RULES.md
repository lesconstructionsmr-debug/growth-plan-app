# ==============================================================================
# PROTOCOLE STRICT - SPRINT FINAL / PRODUCTION (95% COMPLÉTÉ)
# RÈGLES DE SÉCURITÉ ET D'EXÉCUTION NON NÉGOCIABLES POUR L'AGENT
# ==============================================================================

## 1. POSTURE & DIRECTIVES CRITIQUES
- Le projet est en phase de livraison finale pour onboarding d'utilisateurs réels.
- AUCUN refactoring global.
- AUCUN changement d'architecture, de dépendance (package.json) ou de structure de base de données sans autorisation explicite.
- Le mot d'ordre absolu est : **STABILITÉ, ISOLATION, MINIMALISME**.

---

## 2. INTERDICTIONS FORMELLES (ZERO TOLERANCE)
1. **INTERDICTION GIT :**
   - Ne JAMAIS exécuter `git commit`, `git push`, `git checkout -b`, ou `git reset`.
   - L'humain gère l'intégralité du versioning Git.
2. **INTERDICTION D'ÉCRITURE HORS PÉRIMÈTRE :**
   - Ne modifie JAMAIS un fichier qui n'a pas été explicitement nommé ou ciblé dans la tâche.
   - Ne crée aucun fichier "surprise" (helpers, utils, types globaux) sans validation préalable.
3. **ISOLATION STRICTE DES MODULES :**
   - Le module `Calendar` gère UNIQUEMENT les rendez-vous / dates / planifications. Interdiction totale d'y insérer de la logique de devis, facturation ou CRM.
   - Le module `Quotes / Devis` gère UNIQUEMENT les soumissions et items chiffrés.
   - Ne JAMAIS croiser les dépendances métier directement dans les composants UI.

---

## 3. PROTOCOLE D'EXÉCUTION OBLIGATOIRE (AVANT D'ÉCRIRE DU CODE)
Pour chaque prompt ou demande, tu DOIS respecter cette structure de réponse :

1. **Vérification du périmètre (Scope Check) :**
   - Nomme la liste exacte des fichiers que tu vas modifier.
2. **Plan d'impact en 3 lignes maximum :**
   - Explique brièvement ce que tu ajoutes ou corriges.
   - Confirme que les modules adjacents ne sont pas impactés.
3. **Génération du code :**
   - Code propre, typé (TypeScript strict), sans code mort ni console.log inutiles.
   - Ne remplace jamais un fichier entier par des commentaires du genre `// ... rest of the code`. Fournis des modifications chirurgicales et complètes.

---

## 4. GESTION DES BUGS ET DU POLISH (DERNIÈRE LIGNE DROITE)
- Si un bogue est rapporté, applique un **correctif chirurgical (hotfix)** ciblant la cause exacte. Ne réécris pas l'entièreté du composant ou de la fonction.
- Conserve systématiquement les conventions de nommage, les composants UI (Tailwind/Shadcn) et les structures d'état déjà existantes.
- En cas de doute ou d'ambiguïté sur une règle métier : **ARRÊTE-TOI ET DEMANDE CLARIFICATION** au lieu de deviner ou d'improviser.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 🚨 RÈGLE STRICTE ABSOLUE — TRANSPARENCE DES DONNÉES (RÉEL VS DÉMO)

1. **TRANSPARENCE TOTALE DU STATUT DES DONNÉES** :
   L'IA ne doit JAMAIS faire passer des données de test, de simulation, de seeding ou de démonstration (ex: `seed-demo`, `PROSPECTS_RBQ_SEAO`, `PROSPECTS_SAAS_SEED`) pour des données réelles.

2. **AVERTISSEMENT OBLIGATOIRE ET SYSTÉMATIQUE** :
   Dès que l'IA référence, affiche ou manipule des données de démonstration ou de test, elle DOIT OBLIGATOIREMENT apposer l'avertissement explicite :
   `⚠️ [DONNÉES DE DÉMONSTRATION / TEST FICTIF]` en tête de réponse.

3. **DISTINCTION CLAIRE ENTRE DONNÉES RÉELLES ET FICTIVES** :
   L'IA doit toujours distinguer clairement les données entrantes réelles (formulaires Web, pubs Google Ads/Meta, webhooks en direct) des jeux de données d'exemple injectés dans le code.
