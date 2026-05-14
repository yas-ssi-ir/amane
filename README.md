# AMANE — Plateforme de dépistage dermatologique assisté

Plateforme médicale combinant IA explicable et validation humaine pour le dépistage des lésions cutanées, conçue pour les zones rurales du Maroc.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  amane-     │     │  amane-     │     │  backend/   │
│  mobile/    │ ◄──►│  web/       │ ◄──►│  (FastAPI)  │
│  (Expo)     │     │  (Next.js)  │     │  + PyTorch  │
│  Relais     │     │  Médecin    │     │  + Gemini   │
│  Infirmier  │     │  Admin      │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
                                        ┌─────────────┐
                                        │ SQLite/PG   │
                                        │ + Audit log │
                                        └─────────────┘
```

3 rôles, une seule chaîne de confiance :

1. **Relais** (terrain, mobile) photographie une lésion
2. **IA** (ResNet18 calibré + Gemini multimodal) analyse + génère heatmap
3. **Médecin** (web) valide la décision finale

## Démarrage rapide

### Pré-requis
- Python 3.11+
- Node.js 20+
- (optionnel) Compte Google AI Studio pour Gemini : https://aistudio.google.com/apikey

### 1. Backend

```powershell
# Depuis la racine
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Copier .env et configurer (au minimum AMANE_JWT_SECRET et GEMINI_API_KEY)
# Voir .env.example si dispo, sinon utiliser :
# AMANE_JWT_SECRET=<32+ chars random>
# GEMINI_API_KEY=<votre cle>

# Entraîner le modèle (1-3h sans GPU, skip si vous avez deja le checkpoint)
python -m backend.ai.train
python -m backend.ai.calibrate
python -m backend.ai.evaluate

# Seed pour la démo
python -m backend.seed --reset

# Lancer le serveur
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Web (médecin + admin)

```powershell
cd amane-web
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

→ http://localhost:3000

### 3. Mobile (relais + infirmier)

```powershell
cd amane-mobile
npm install
# .env avec EXPO_PUBLIC_API_URL=http://<votre-IP-LAN>:8000 (pas localhost pour téléphone)
npx expo start
```

Scanner le QR avec Expo Go. Pour test web : touche `w`.

## Comptes de démo (après `seed.py`)

| Username | Password | Rôle |
|---|---|---|
| `admin1` | `admin1234` | admin |
| `medecin1` | `medecin123` | médecin (Casablanca) |
| `medecin2` | `medecin123` | médecin (Rabat) |
| `relais1` | `relais123` | relais (Oriental) |
| `relais2` | `relais123` | relais (Drâa-Tafilalet) |
| `infirmier1` | `infirmier123` | infirmier (Béni Mellal) |

## Stack technique

### Backend
- **FastAPI** + **SQLAlchemy** (SQLite/PostgreSQL)
- **PyTorch** ResNet18 fine-tuné sur HAM10000 (10 000 lésions, 7 classes)
- **Temperature Scaling** pour calibration de confiance
- **Out-of-distribution detection** par entropie
- **Grad-CAM** pour heatmap d'explicabilité
- **Gemini 2.0 Flash** (multimodal) en second avis
- **JWT HS256** + RBAC + rate limiting
- Audit log immutable + politique de rétention

### Web
- **Next.js 16** (App Router) + **React 19**
- **Tailwind v4** + **shadcn/ui** + **framer-motion**
- **TanStack Query** + **zustand** (auth) + **react-hook-form** + **zod**
- **Recharts** pour les graphiques
- **Leaflet** pour la carte du Maroc

### Mobile
- **Expo SDK 54** + **React Native 0.81**
- **NativeWind** (Tailwind v3 pour RN)
- **Reanimated 4** pour les animations 60fps
- **expo-haptics** pour le retour haptique
- **expo-image-picker** pour la capture caméra

## Pipeline ML

```
HAM10000 dataset (10 015 images, 7 classes)
        │
        ▼ split stratifié 70/15/15 figé
train.py : ResNet18 fine-tuning + early stopping → amane_skin_v1.pth
        │
        ▼
calibrate.py : Temperature Scaling sur val → calibration.json (T ≈ 1.5)
        │
        ▼
evaluate.py : test set figé → evaluation_report.json (seuil incertitude calibré)
        │
        ▼
inference.py : prediction calibrée + OOD detection
explain.py   : Grad-CAM overlay + bounding box
gemini_analyzer.py : second avis multimodal en parallèle
```

## Endpoints principaux

```
POST  /api/auth/register          créer un compte
POST  /api/auth/login             obtenir un JWT
GET   /api/auth/me                utilisateur courant

POST  /api/consultations          upload + analyse IA + heatmap + Gemini
GET   /api/consultations          liste (filtre status)
GET   /api/consultations/{id}     détail
POST  /api/consultations/{id}/review   décision médecin (médecin/admin)

GET   /api/dashboard/stats        KPIs admin
GET   /api/dashboard/audit-log    journal d'audit (admin)
POST  /api/admin/audit/purge      purge audit log (admin)

GET   /api/health                 health check exhaustif
```

## Sécurité

- **JWT HS256** signé · secret en env (`AMANE_JWT_SECRET ≥ 32 chars`)
- **CORS whitelist** explicite (`CORS_ORIGINS` env)
- **Rate limiting** par IP (login, register, upload)
- **RBAC** strict : médecin ↔ /medecin uniquement, admin ↔ /admin uniquement
- **Validation upload** : MIME + magic bytes + taille max 10MB
- **Anonymisation patients** (Loi 09-08) — aucun nom collecté
- **Audit log immutable** avec politique de rétention configurable

## Structure du projet

```
AMANE/
├── backend/
│   ├── main.py              FastAPI app + endpoints
│   ├── auth.py              JWT + rate limiting + RBAC
│   ├── database.py          SQLAlchemy models + migrations
│   ├── schemas.py           Pydantic schemas
│   ├── seed.py              Données démo MIATHON
│   └── ai/
│       ├── train.py         Entraînement ResNet18
│       ├── calibrate.py     Temperature Scaling
│       ├── evaluate.py      Métriques sur test set
│       ├── inference.py     Prédiction + OOD
│       ├── explain.py       Grad-CAM
│       └── gemini_analyzer.py
├── amane-web/               Portail médecin + admin (Next.js)
├── amane-mobile/            App relais/infirmier (Expo)
├── data/                    HAM10000 dataset
└── requirements.txt
```

## Variables d'environnement

À placer dans `.env` à la racine :

```bash
# Auth
AMANE_JWT_SECRET=<32+ chars random>
AMANE_JWT_EXPIRES_MINUTES=60

# DB
AMANE_AUDIT_RETENTION_DAYS=365

# Gemini
GEMINI_API_KEY=<votre cle>
GEMINI_MODEL=gemini-2.0-flash

# CORS (optionnel, defaut: localhost:3000 + localhost:8081 + LAN regex)
CORS_ORIGINS=https://amane.ma,http://localhost:3000
```

## Licence

Projet MIATHON 2026 — Université Mohammed Premier Oujda.
