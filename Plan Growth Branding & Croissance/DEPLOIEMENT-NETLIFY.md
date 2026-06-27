# 🚀 Déploiement ERP Construction sur Netlify

> Temps estimé : **15 à 20 minutes**  
> Résultat : une URL publique `https://ton-erp.netlify.app` accessible depuis n'importe quel appareil

---

## Étape 1 — Préparer le code (terminal PowerShell)

Ouvre un terminal dans le dossier du projet :

```powershell
cd C:\Users\WARRIORS666\erp-construction
```

Installe le plugin Netlify pour Next.js :

```powershell
npm install --save-dev @netlify/plugin-nextjs
```

Vérifie que le build fonctionne en local **avant** de déployer :

```powershell
npm run build
```

Si aucune erreur rouge → tu es prêt à déployer.

---

## Étape 2 — Mettre le code sur GitHub

Netlify déploie depuis un repo GitHub. Si ce n'est pas encore fait :

```powershell
# Dans le dossier du projet
git init
git add .
git commit -m "ERP Construction — version initiale"
```

Ensuite sur **github.com** :
1. Clique **New repository**
2. Nom : `erp-construction` (privé recommandé)
3. **Ne pas** cocher « Add README »
4. Copie les commandes `git remote add` et `git push` affichées

```powershell
git remote add origin https://github.com/TON_USERNAME/erp-construction.git
git branch -M main
git push -u origin main
```

---

## Étape 3 — Créer le site sur Netlify

1. Va sur **[netlify.com](https://netlify.com)** → connecte-toi (ou crée un compte gratuit)
2. Clique **Add new site** → **Import an existing project**
3. Choisis **GitHub** → autorise Netlify → sélectionne `erp-construction`
4. Netlify détecte automatiquement Next.js :
   - **Build command** : `npm run build` ✓
   - **Publish directory** : `.next` ✓
5. Ne clique pas encore "Deploy" — passe à l'étape 4 d'abord

---

## Étape 4 — Variables d'environnement (OBLIGATOIRE)

Sur la page de configuration du site Netlify, descends à **Environment variables** et ajoute :

| Variable | Valeur | Obligatoire |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://XXXX.supabase.co` | ✅ Oui |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | ✅ Oui |
| `NEXT_PUBLIC_BASE_URL` | `https://ton-erp.netlify.app` | ✅ Oui |
| `OPENAI_API_KEY` | `sk-...` | Si tu utilises l'IA |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Si tu utilises Claude |
| `RESEND_API_KEY` | `re_...` | Pour les emails |
| `RESEND_FROM` | `notifications@tondomaine.com` | Pour les emails |

> **Où trouver les clés Supabase ?**  
> [supabase.com/dashboard](https://supabase.com/dashboard) → ton projet → **Settings** → **API**

---

## Étape 5 — Déployer !

Clique **Deploy site** sur Netlify.

Le premier build prend ~2 à 4 minutes. Tu peux suivre les logs en direct.

Une fois terminé, Netlify te donne une URL du genre :  
`https://eloquent-koala-abc123.netlify.app`

Tu peux la renommer : **Site settings** → **Change site name** → `mon-erp-construction`

---

## Étape 6 — Configurer Supabase pour la prod

Supabase bloque les requêtes des domaines non autorisés. Ajoute ton URL Netlify :

1. Va sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. Ton projet → **Authentication** → **URL Configuration**
3. **Site URL** : `https://ton-erp.netlify.app`
4. **Redirect URLs** : ajoute `https://ton-erp.netlify.app/**`
5. Sauvegarde

---

## Étape 7 — Déploiements automatiques (optionnel)

Chaque `git push` déclenche automatiquement un nouveau build sur Netlify.

```powershell
# Workflow normal après modification du code
git add .
git commit -m "Nouvelle fonctionnalité"
git push
# → Netlify rebuild et redéploie automatiquement en ~2 min
```

---

## Domaine personnalisé (optionnel)

Si tu as un domaine (ex: `erp.novastructureai.com`) :

1. Netlify → **Site settings** → **Domain management** → **Add custom domain**
2. Tape ton domaine → Netlify te donne les DNS records à configurer chez ton registraire
3. SSL/HTTPS est activé automatiquement par Netlify (Let's Encrypt)

---

## Résolution de problèmes fréquents

### Build échoue avec une erreur de type TypeScript
```
Solution : npm run build en local d'abord et corriger les erreurs
```

### "Module not found" après le déploiement
```
Solution : vérifier que la dépendance est dans "dependencies" (pas seulement devDependencies)
```

### La page affiche 404 après connexion
```
Solution : vérifier NEXT_PUBLIC_SUPABASE_URL dans les variables Netlify
```

### L'IA ne répond pas
```
Solution : vérifier OPENAI_API_KEY ou ANTHROPIC_API_KEY dans les variables Netlify
```

### Les emails ne partent pas
```
Solution : vérifier RESEND_API_KEY et que RESEND_FROM est un domaine vérifié sur Resend
```

---

## Résumé des fichiers créés

| Fichier | Rôle |
|---|---|
| `netlify.toml` | Config build + plugin Next.js + headers sécurité |
| `.env.example` | Template des variables d'environnement |
| `.gitignore` | Exclut `.netlify/` du repo |

---

*Guide préparé pour ERP Construction — max@novastructureai.com*
