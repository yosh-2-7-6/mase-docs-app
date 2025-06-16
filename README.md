# MASE DOCS - Plateforme de Certification MASE Automatisée

<div align="center">
  <img src="https://github.com/user-attachments/assets/mase-docs-logo.png" alt="MASE DOCS Logo" width="200"/>
  
  <h3>La solution SaaS pour automatiser votre certification MASE</h3>
  
  <p>
    <strong>MASE CHECKER</strong> · <strong>MASE GENERATOR</strong> · <strong>Dashboard Intelligent</strong>
  </p>
</div>

## 🎯 Vue d'ensemble

**MASE DOCS** est une plateforme SaaS complète qui révolutionne le processus de certification MASE (Manuel d'Amélioration Sécurité des Entreprises) en automatisant l'audit documentaire et la génération de documents conformes. Conçue pour les entreprises qui souhaitent obtenir ou maintenir leur certification MASE tout en restant concentrées sur leur cœur de métier.

> **Note importante** : L'application est actuellement un **prototype fonctionnel** avec une interface utilisateur complète. L'analyse IA et la génération documentaire utilisent des données simulées en attendant l'intégration complète avec les services d'intelligence artificielle.

### 🚀 Fonctionnalités principales

- **Audit automatisé** de vos documents HSE existants
- **Génération intelligente** de documents conformes MASE
- **Scoring en temps réel** selon les 5 axes MASE
- **Dashboard interactif** avec métriques et recommandations
- **Export multi-formats** (Word, Excel, PDF)
- **Conformité garantie** avec le référentiel MASE 2024

## 📋 Modules

### 🔍 MASE CHECKER - Module d'Audit Automatisé

Analysez automatiquement vos documents HSE et identifiez les écarts par rapport au référentiel MASE.

**Fonctionnalités :**
- Upload simple par drag & drop (PDF, Word, Excel)
- Analyse IA de conformité selon 270+ critères MASE
- Scoring par document et par axe (5 axes MASE)
- Identification précise des écarts et non-conformités
- Génération de rapports d'audit détaillés
- Plans d'action prioritisés et personnalisés

**Processus en 4 phases :**
1. **Classification** - Identification automatique du type de document
2. **Analyse des écarts** - Comparaison avec les exigences MASE
3. **Scoring** - Calcul des scores de conformité (B/V/VD)
4. **Plan d'actions** - Recommandations priorisées

### 📝 MASE GENERATOR - Module de Génération de Documents

Générez automatiquement tous vos documents MASE conformes et personnalisés.

**Fonctionnalités :**
- Génération de 41 documents MASE obligatoires
- Deux modes : Post-audit ou From scratch
- Personnalisation avec vos données d'entreprise
- Instructions SSE spécifiques intégrables
- Templates conformes au référentiel MASE 2024
- Export multi-formats selon vos besoins

**Documents générés (exemples) :**
- Politique SSE
- Document Unique d'Évaluation des Risques (DUER)
- Plan d'actions SSE
- Procédures de sécurité
- Registres obligatoires
- Bilans et rapports annuels

### 📊 Dashboard Intelligent

Pilotez votre conformité MASE en temps réel avec des indicateurs clés.

**Métriques affichées :**
- Score global de conformité
- Scores détaillés par axe MASE
- État d'avancement de la certification
- Actions prioritaires recommandées
- Historique des audits et générations
- Timeline d'activité

## 🏗️ Architecture Technique

### Stack Technologique

- **Frontend** : Next.js 14 (App Router) + TypeScript
- **UI/UX** : shadcn/ui + Tailwind CSS
- **Base de données** : Supabase (PostgreSQL)
- **Authentification** : Supabase Auth
- **État** : React Hooks + Context API
- **Stockage** : Supabase Storage pour les documents

### Structure du Projet

```
mase-docs-app/
├── app/
│   ├── (public)/          # Pages publiques (landing, auth)
│   ├── dashboard/         # Application principale
│   │   ├── page.tsx      # Dashboard principal
│   │   ├── mase-checker/ # Module d'audit
│   │   ├── mase-generator/ # Module de génération
│   │   ├── settings/     # Paramètres utilisateur
│   │   └── billing/      # Gestion abonnement
│   └── api/              # API Routes
├── components/
│   ├── ui/               # Composants shadcn/ui
│   ├── app-sidebar.tsx   # Navigation principale
│   └── dashboard/        # Composants dashboard
├── utils/
│   ├── supabase/         # Configuration Supabase
│   ├── mase-state.ts     # Gestion état MASE
│   └── user-profile.ts   # Gestion profils
└── public/               # Assets statiques
```

## 🚀 Installation et Démarrage

### Prérequis

- Node.js 18+ et npm/yarn/pnpm
- Compte Supabase (gratuit sur [supabase.com](https://supabase.com))
- Git

### Installation

1. **Cloner le repository**
   ```bash
   git clone https://github.com/your-org/mase-docs-app.git
   cd mase-docs-app
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   # ou
   yarn install
   # ou
   pnpm install
   ```

3. **Configuration environnement**
   
   Copier `.env.example` vers `.env.local` et renseigner :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Configuration base de données**
   
   Exécuter les migrations Supabase (voir `/supabase/migrations/`)

5. **Lancer l'application**
   ```bash
   npm run dev
   ```

   L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📊 Référentiel MASE 2024

L'application s'appuie sur le référentiel officiel MASE structuré en :

### 5 Axes d'Évaluation

1. **Axe 1** - Engagement de la direction (900 points)
2. **Axe 2** - Compétences et qualifications du personnel (800 points)
3. **Axe 3** - Préparation et organisation des interventions (1300 points)
4. **Axe 4** - Contrôles et amélioration continue (1100 points)
5. **Axe 5** - Bilan et amélioration continue (900 points)

**Score total** : 5000 points | **Seuil certification** : 70%

### Système de Scoring

- **Critères Binaires (B)** : 0 ou score max
- **Critères Variables (V)** : Score proportionnel 0-100%
- **Critères Variables Doublés (VD)** : Score x2 si excellence

### Seuils de Conformité

- 🟢 **≥80%** : Document conforme
- 🟡 **60-79%** : À améliorer
- 🔴 **<60%** : Non conforme

## 🔒 Sécurité et Conformité

- **Isolation des données** : Chaque entreprise accède uniquement à ses données
- **Chiffrement** : Communications et stockage chiffrés
- **Row Level Security** : Protection au niveau base de données
- **Audit trail** : Traçabilité complète des actions
- **RGPD** : Conforme aux réglementations européennes

## 🛠️ Développement

### Scripts disponibles

```bash
npm run dev      # Développement avec hot-reload
npm run build    # Build de production
npm run start    # Lancer la production
npm run lint     # Vérification du code
npm run test     # Tests unitaires
```

### Structure des Données

Les principales tables Supabase :

**Tables Référentiel (Données statiques) :**
- `axes_mase` - 5 axes MASE avec contenus préambulaires
- `chapitres_mase` - 24 chapitres répartis sur les 5 axes
- `criteres_mase` - 270+ critères d'évaluation (B/V/VD)
- `documents_cles` - 41 documents obligatoires MASE
- `contenu_documents_cles` - Templates et structures documentaires

**Tables Utilisateur (Données dynamiques) :**
- `user_profiles` - Profils entreprises
- `audit_sessions` - Sessions d'audit
- `audit_documents` - Documents analysés
- `audit_results` - Résultats détaillés
- `generation_sessions` - Sessions de génération
- `generated_documents` - Documents générés

## 🚧 État du Développement

### Actuellement Implémenté ✅
- Interface utilisateur complète (Next.js + shadcn/ui)
- Système d'authentification (Supabase Auth)
- Base de données avec référentiel MASE 2024 complet
- Workflows utilisateur (upload, analyse, génération)
- Dashboard avec métriques et visualisations
- Système d'onboarding et profils utilisateur

### En Cours de Développement 🔄
- Migration localStorage → Supabase pour persistance
- Intégration de l'IA pour analyse réelle (Claude/Gemini API)
- Génération documentaire dynamique basée sur templates
- Export multi-format (Word, Excel, PDF)

### Prochaines Étapes 📋
1. Finaliser l'intégration backend Supabase
2. Implémenter l'analyse sémantique par IA
3. Développer la génération documentaire intelligente
4. Ajouter l'OCR pour documents scannés
5. Mettre en place le système de facturation

## 📱 Support et Contact

- **Documentation** : [masedocs.accompagnement-mase.fr](https://masedocs.accompagnement-mase.fr)
- **Support** : masedocs@accompagnement-mase.fr
- **Issues** : [GitHub Issues](https://github.com/your-org/mase-docs-app/issues)

## 📄 Licence

Copyright © 2025 MASE DOCS. Tous droits réservés.

---

<div align="center">
  <p>Développé avec ❤️ pour simplifier votre certification MASE</p>
</div>