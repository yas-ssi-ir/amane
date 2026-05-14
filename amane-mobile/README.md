# AMANE Mobile — App relais et infirmier

Application Expo (React Native) pour les agents terrain : capture d'image, formulaire patient, résultat d'analyse IA.

> Voir le [README racine](../README.md) pour l'architecture globale d'AMANE.

## Démarrage

```powershell
npm install

# Trouver votre IP locale (le téléphone doit pouvoir atteindre le backend)
# Windows :  (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -match "Wi-Fi"}).IPAddress
echo "EXPO_PUBLIC_API_URL=http://192.168.X.X:8000" > .env

# Backend doit être lancé avec --host 0.0.0.0 pour accepter le téléphone
npx expo start
```

Puis :
- **Téléphone** : scanner le QR avec [Expo Go](https://expo.dev/client) (même WiFi que le PC)
- **Web** : touche `w` dans le terminal Expo → http://localhost:8081

## Écrans

```
/login               Login dark immersif (gradient + glow)
/(tabs)/index        Dashboard (greeting + stats + liste consultations)
/(tabs)/new          Form 4 étapes : photo → patient → symptômes → confirm
/(tabs)/profile      Profil + déconnexion
/result/[id]         Résultat IA (vue role-based : relais ≠ infirmier ≠ médecin)
```

## Stack

- **Expo SDK 54** + **React Native 0.81** + **React 19**
- **expo-router 6** (file-based routing)
- **NativeWind 4** (Tailwind v3 pour RN)
- **Reanimated 4** (animations 60fps)
- **expo-haptics** (retour haptique)
- **expo-image-picker** (caméra/galerie)
- **expo-secure-store** (stockage JWT chiffré)
- **TanStack Query** + **zustand** (état)
- **react-hook-form** + **zod** (formulaires)

## Variables d'environnement

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.X:8000   # IP LAN du PC backend
```

⚠️ Pas `localhost` — le téléphone n'est pas sur la même machine. Récupérer l'IP avec :
- Windows : `ipconfig` → "Adresse IPv4"
- Mac : `ifconfig | grep "inet "`

## Build production (APK Android)

```powershell
npm install -g eas-cli
eas login
eas build --profile preview --platform android
```

L'APK sera téléchargeable depuis le compte Expo une fois le build terminé.

## Structure

```
app/
├── _layout.tsx              Root (Providers, theme dark)
├── index.tsx                Redirect selon auth
├── login.tsx                Login immersif
├── (tabs)/                  Bottom tabs (Accueil, Nouveau, Profil)
└── result/[id].tsx          Résultat role-based

components/
├── ConsultationCard.tsx
└── RiskBadge.tsx

lib/
├── api.ts                   Axios + JWT
├── auth-store.ts            Zustand + SecureStore (mobile) / localStorage (web)
├── queries.ts               React Query hooks
├── schemas.ts               Zod
├── types.ts                 Types miroir backend (Gemini inclus)
└── haptics.ts               Helpers expo-haptics
```

## Sécurité

- JWT chiffré dans **SecureStore** (Keychain iOS / Keystore Android)
- Sur web : fallback localStorage
- Logout sur 401
- Validation côté client (zod) miroir des contraintes backend

## Haptics

Retour haptique sur :
- Tap sur option/chip (`selection`)
- Navigation step (`light`)
- Capture photo (`medium`)
- Submit réussi (`success`)
- Erreur (`error`)
- Logout (`warning`)
