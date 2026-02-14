# Guide de Déploiement Vercel : Youpi Cookies

Votre application est **100% prête** pour la production. Voici les étapes pour la mettre en ligne immédiatement.

## 1. Création du projet sur Vercel
1.  Connectez votre compte GitHub/GitLab à [Vercel](https://vercel.com).
2.  Importez le dépôt `Youpi`.
3.  Vercel détectera automatiquement qu'il s'agit d'un projet **Next.js**.

## 2. Configuration des Variables d'Environnement
Dans l'onglet **Environment Variables** de Vercel, ajoutez les clés suivantes (copiez les valeurs depuis votre fichier `.env.local`) :

| Clé | Valeur |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://mxayguqeselletqccczb.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1Ni... (votre clé anon)` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1Ni... (votre clé service_role)` |

## 3. Déploiement
- Cliquez sur **Deploy**.
- Le build prendra environ 2-3 minutes.
- Une fois terminé, votre application sera accessible sur une URL `.vercel.app`.

## 4. Points de Vérification après déploiement
- **Authentification** : Testez la connexion avec `admin@youpi.com`.
- **Base de données** : Vérifiez que les produits et commandes s'affichent correctement.
- **Vitesse** : Vous devriez constater une navigation instantanée grâce au build de production.

> [!TIP]
> Si vous avez besoin d'un domaine personnalisé (ex: `gestion.youpicookies.com`), vous pourrez l'ajouter dans l'onglet **Settings** -> **Domains** de Vercel.
