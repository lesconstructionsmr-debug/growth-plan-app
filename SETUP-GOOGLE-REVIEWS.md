# Configuration — Section Avis Google (peinturejtl.ca)

## Étapes d'installation

### 1. Ajouter la section à votre thème Shopify

1. Dans l'admin Shopify → **Boutique en ligne → Thèmes → Personnaliser**
2. Sélectionnez la **Page d'accueil**
3. Cliquez **Ajouter une section** en haut de la liste
4. Choisissez **Avis Google**
5. Glissez-la tout en haut de la page

### 2. Obtenir votre Place ID Google

1. Allez sur https://developers.google.com/maps/documentation/places/web-service/place-id
2. Entrez **"Peinture JTL"** dans la recherche
3. Copiez le `Place ID` (ex: `ChIJ...`)

### 3. Créer une clé API Google Maps

1. Allez sur https://console.cloud.google.com/
2. Créez un projet ou sélectionnez-en un
3. **APIs & Services → Activer des APIs** → activez :
   - **Places API**
   - **Maps JavaScript API**
4. **Identifiants → Créer des identifiants → Clé API**
5. **Restreignez la clé** aux référents HTTP :
   ```
   peinturejtl.ca/*
   www.peinturejtl.ca/*
   ```

### 4. Configurer dans Shopify

Dans le panneau de personnalisation de la section :

| Champ | Valeur |
|---|---|
| Clé API Google Maps | Votre clé API |
| Place ID Google | Votre Place ID |
| Nombre d'avis | 5 (recommandé) |
| Note minimale | 4 étoiles |

## Limitations de l'API Google Places

- L'API Google Places retourne au maximum **5 avis** (limitation Google).
- Les avis sont triés par pertinence par Google.
- Un compte de facturation Google Cloud est requis (le quota gratuit couvre l'usage normal d'un site vitrine).

## Coût estimé

- **Places Details** : 0,017 USD par appel
- Avec un cache navigateur de 24h, le coût mensuel est négligeable pour un site vitrine.
