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
