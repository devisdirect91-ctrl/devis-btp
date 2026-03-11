# DevisBTP

Application de gestion de devis et factures pour les artisans et entreprises du BTP.

## Fonctionnalités

- **Devis** — Création, envoi, signature électronique, suivi des statuts
- **Factures** — Génération depuis un devis ou de zéro, suivi des paiements
- **Clients** — Gestion des fiches clients (particuliers et professionnels)
- **Catalogue** — Bibliothèque de prestations réutilisables
- **PDF** — Export PDF des devis et factures
- **Emails** — Envoi automatique via Resend

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 14 (App Router) |
| Langage | TypeScript |
| Style | Tailwind CSS |
| ORM | Prisma |
| Base de données | PostgreSQL (Supabase) |
| Auth | NextAuth.js (credentials) |
| PDF | @react-pdf/renderer |
| Email | Resend |
| Signature | signature_pad v5 |

## Installation locale

### Prérequis

- Node.js 18+
- Un projet Supabase (base de données PostgreSQL)
- Un compte Resend (optionnel, pour les emails)

### 1. Cloner le repo

```bash
git clone https://github.com/<ton-username>/devis-btp.git
cd devis-btp
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Crée un fichier `.env.local` à la racine :

```env
# Base de données Supabase
DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_SECRET="une-chaine-aleatoire-longue"
NEXTAUTH_URL="http://localhost:3000"

# Supabase (stockage fichiers)
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Resend (optionnel)
RESEND_API_KEY="re_..."
```

### 4. Initialiser la base de données

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Lancer en développement

```bash
npm run dev
```

L'application est disponible sur http://localhost:3000.

## Déploiement

Le projet est prêt pour Vercel. Ajoute les variables d'environnement dans les paramètres du projet, puis connecte le repo GitHub.
