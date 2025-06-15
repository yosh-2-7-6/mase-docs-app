# Architecture Technique MASE DOCS
## Document de Protection INPI
## Projet démarré le 12/04/2025 à 21:48:04 (Bolt.new) - Date de dépôt : 15/06/2025

## 1. Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 14)                    │
├─────────────────────────────────────────────────────────────┤
│  • App Router avec Server Components                         │
│  • TypeScript + Tailwind CSS                                 │
│  • Authentification via Supabase Auth                        │
│  • UI Components: shadcn/ui                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Supabase)                        │
├─────────────────────────────────────────────────────────────┤
│  • PostgreSQL avec Row Level Security (RLS)                  │
│  • Authentification et autorisation                          │
│  • Storage pour documents                                    │
│  • Real-time subscriptions                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   IA & TRAITEMENT                            │
├─────────────────────────────────────────────────────────────┤
│  • Analyse documentaire via IA                               │
│  • Génération de contenu personnalisé                        │
│  • Scoring algorithmique propriétaire                        │
└─────────────────────────────────────────────────────────────┘
```

## 2. Workflows Principaux

### A. Workflow MASE Checker (Audit)

```
1. UPLOAD DOCUMENTS
   └─> Utilisateur upload documents
       └─> Stockage Supabase Storage
           └─> Création session d'audit

2. ANALYSE AUTOMATIQUE
   └─> Extraction contenu documents
       └─> Matching avec critères MASE
           └─> Calcul scores par critère
               └─> Agrégation scores par axe

3. GÉNÉRATION RAPPORT
   └─> Identification écarts
       └─> Recommandations personnalisées
           └─> Dashboard interactif
               └─> Export PDF
```

### B. Workflow MASE Generator

```
1. SÉLECTION MODE
   ├─> Mode Standard
   │   └─> Choix documents à générer
   └─> Mode Post-Audit
       └─> Import résultats audit

2. PERSONNALISATION
   └─> Instructions spécifiques
       └─> Contexte entreprise
           └─> Secteur d'activité

3. GÉNÉRATION
   └─> Création contenu via IA
       └─> Validation structure MASE
           └─> Export multi-format
               └─> Word, Excel, PDF
```

### C. Workflow Dashboard & Pilotage

```
1. CONNEXION UTILISATEUR
   └─> Authentification Supabase
       └─> Chargement profil entreprise

2. TABLEAU DE BORD
   ├─> Vue synthétique scores
   ├─> Progression temporelle
   ├─> Alertes et notifications
   └─> Actions recommandées

3. PILOTAGE CONTINU
   └─> Suivi indicateurs
       └─> Mise à jour documents
           └─> Nouvelles analyses
               └─> Amélioration continue
```

## 3. Composants Techniques Clés

### Frontend Components
- `/app/dashboard/mase-checker/page.tsx` - Interface d'audit
- `/app/dashboard/mase-generator/page.tsx` - Interface de génération
- `/app/dashboard/page.tsx` - Tableau de bord principal
- `/components/ui/*` - Composants réutilisables

### Utilitaires Core
- `/utils/mase-state.ts` - Gestion état global MASE
- `/utils/user-profile.ts` - Gestion profils utilisateurs
- `/utils/supabase/*` - Clients et helpers Supabase

### Configuration
- `/app/globals.css` - Styles globaux
- `/middleware.ts` - Gestion authentification
- `/next.config.js` - Configuration Next.js

## 4. Flux de Données

```
USER INPUT
    │
    ▼
VALIDATION LAYER (Frontend)
    │
    ▼
API ROUTES (Next.js)
    │
    ▼
SUPABASE CLIENT
    │
    ├─> PostgreSQL (Data)
    ├─> Storage (Files)
    └─> Auth (Security)
    │
    ▼
PROCESSING LAYER
    │
    ├─> IA Analysis
    ├─> Score Calculation
    └─> Document Generation
    │
    ▼
RESPONSE TO USER
```

## 5. Sécurité et Isolation

### Multi-tenancy
- Isolation complète des données par utilisateur
- RLS (Row Level Security) sur toutes les tables
- Pas d'accès croisé entre organisations

### Authentification
- OAuth2 via Supabase Auth
- Sessions sécurisées
- Tokens JWT

### Protection des Données
- Chiffrement en transit (HTTPS)
- Chiffrement au repos (Supabase)
- Logs d'audit

## 6. Innovation Technique

### Algorithme de Scoring Propriétaire
- Pondération dynamique selon type de critère (B/V/VD)
- Calcul en cascade : critère → chapitre → axe → global
- Détection automatique des écarts critiques

### Moteur de Génération Contextuelle
- Templates intelligents basés sur le secteur
- Adaptation au niveau de maturité SSE
- Intégration des résultats d'audit

### Architecture Scalable
- Server Components pour performance
- Caching intelligent
- Optimisation des requêtes DB

## 7. Stack Technologique

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod (validation)

### Backend
- Supabase (PostgreSQL)
- Edge Functions
- Row Level Security

### Outils
- Git pour versioning
- npm pour packages
- Vercel pour déploiement

## 8. Points d'Extension

Le système est conçu pour permettre :
- Ajout de nouveaux référentiels (ISO, etc.)
- Intégration APIs tierces
- Modules complémentaires (formation, etc.)
- Personnalisation par secteur d'activité