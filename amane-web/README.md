# AMANE Web — Portail médecin et administrateur

Application Next.js pour les médecins (validation des cas) et les admins (supervision).

> Voir le [README racine](../README.md) pour l'architecture globale d'AMANE.

## Démarrage

```powershell
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

→ http://localhost:3000

## Pages

```
/                    Landing immersive (publique)
/login               Sélecteur de rôle + form
/medecin             File d'attente des cas
/medecin/[id]        Workspace de validation (image + heatmap + double IA)
/medecin/validated   Cas que vous avez déjà validés
/admin               Dashboard avec KPIs + charts
/admin/map           Carte du Maroc des consultations
/admin/audit         Journal d'audit immutable
```

## Stack

- **Next.js 16** (App Router) + **React 19**
- **Tailwind v4** + **shadcn/ui** + **framer-motion**
- **TanStack Query** (état serveur) + **zustand** (auth) avec localStorage
- **react-hook-form** + **zod** (formulaires)
- **Recharts** (graphiques) + **react-leaflet** (carte)
- **Lucide React** (icônes) + **sonner** (toasts)

## Variables d'environnement

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000   # backend FastAPI
```

## Build production

```powershell
npm run build
npm start
```

## Sécurité

- JWT stocké dans **localStorage**
- Auth guards stricts : `medecin` → `/medecin/*` uniquement, `admin` → `/admin/*` uniquement
- Token revérifié auprès du backend via `/api/auth/me` au démarrage
- Logout sur 401 (interceptor axios)

## Structure

```
src/
├── app/                     Pages (App Router)
│   ├── page.tsx             Landing
│   ├── login/page.tsx
│   ├── medecin/             Layout sidebar emerald
│   └── admin/               Layout sidebar dark + violet
├── components/
│   ├── ui/                  shadcn/ui composants
│   ├── landing/             Helpers framer-motion (Reveal, Spotlight, etc.)
│   ├── medecin/             Composants partagés (ConsultationListView)
│   ├── GeminiCard.tsx
│   ├── HeatmapImage.tsx
│   ├── MoroccoMap.tsx
│   ├── Providers.tsx        QueryClient + Toaster
│   └── RiskBadge.tsx
└── lib/
    ├── api.ts               Axios + JWT auto + 401 handler
    ├── auth-store.ts        Zustand persist
    ├── queries.ts           Hooks React Query
    ├── schemas.ts           Zod schemas
    ├── types.ts             Types backend
    └── utils.ts             cn() helper
```
