# Guide d'Utilisation MASE DOCS - Instructions Complètes

## Vue d'ensemble de l'application

MASE DOCS est une plateforme SaaS qui accompagne les entreprises dans leur démarche de certification MASE (Manuel d'Amélioration Sécurité des Entreprises). L'application offre deux modules principaux : l'audit automatisé (MASE CHECKER) et la génération de documents conformes (MASE GENERATOR).

## 1. Première connexion et Onboarding

### Étapes initiales
1. **Inscription** : L'utilisateur s'inscrit via email/mot de passe
2. **Confirmation** : Validation de l'email (optionnel selon config Supabase)
3. **Première connexion** : Redirection automatique vers le dashboard

### Modal d'onboarding (automatique)
Au premier accès au dashboard, une modale s'affiche pour collecter :
- **Nom complet** de l'utilisateur
- **Nom de l'entreprise**
- **Secteur d'activité** (15 secteurs disponibles)
- **Taille de l'entreprise** (5 catégories : 1-10, 11-50, 51-250, 251-500, 500+)
- **Activités principales** (description textuelle)

> **Note Backend** : Ces données sont actuellement stockées en localStorage mais doivent être sauvegardées dans une table `user_profiles`

## 2. Dashboard Principal

### Composants affichés
1. **Score de conformité global** : Moyenne pondérée des 5 axes MASE
2. **Score de conformité audit** : Résultat du dernier audit MASE CHECKER
3. **Cartes des modules** :
   - MASE CHECKER : État (jamais utilisé/résultats disponibles)
   - MASE GENERATOR : État (jamais utilisé/documents générés)
4. **Barres de progression** : 5 axes MASE avec scores individuels
5. **Actions prioritaires** : Recommandations contextuelles basées sur l'état
6. **Timeline d'activité** : Historique des actions (audits, générations, mises à jour profil)

### Flux de navigation
- Clic sur carte MASE CHECKER → Module d'audit
- Clic sur carte MASE GENERATOR → Module de génération
- Clic sur axe MASE → Détails de l'axe dans MASE CHECKER
- Clic sur action prioritaire → Navigation contextuelle

## 3. Module MASE CHECKER (Audit)

### Workflow complet

#### Étape 1 : Upload des documents
1. L'utilisateur arrive sur la page d'upload (drag & drop)
2. Peut déposer plusieurs fichiers PDF simultanément
3. Limite : 10 MB par fichier
4. Bouton "Analyser les documents" devient actif après upload

#### Étape 2 : Analyse (simulée actuellement)
1. Affichage du processus en 4 phases :
   - Phase 1 (25%) : Classification des documents
   - Phase 2 (50%) : Analyse des écarts
   - Phase 3 (75%) : Scoring de conformité
   - Phase 4 (90%) : Plan d'actions
2. Durée simulée : ~10 secondes

#### Étape 3 : Résultats
1. **Vue globale** :
   - Score global de conformité (moyenne des 5 axes)
   - 5 cartes d'axes MASE avec scores individuels
   - Chaque axe est cliquable pour voir le détail

2. **Modal de détail par axe** :
   - Actions prioritaires avec bouton "Générer documents conformes"
   - Liste des documents conformes (≥80%)
   - Liste des documents à améliorer (<80%)

3. **Tableau détaillé** :
   - Tous les documents analysés avec scores individuels
   - Actions disponibles : Exporter, Voir détail
   - Export global de l'analyse complète

### Données générées (à sauvegarder)
```javascript
{
  auditId: string,
  userId: string,
  createdAt: Date,
  globalScore: number,
  axisScores: {
    axe1_engagement: number,
    axe2_competences: number,
    axe3_preparation: number,
    axe4_mise_en_oeuvre: number,
    axe5_controle: number
  },
  documents: [{
    id: string,
    name: string,
    type: string,
    axis: string,
    score: number,
    gaps: string[],
    recommendations: string[]
  }],
  actionPlan: [{
    priority: 'high' | 'medium' | 'low',
    action: string,
    documents: string[]
  }]
}
```

## 4. Module MASE GENERATOR (Génération)

### Modes disponibles
1. **"À partir d'un audit"** : Disponible uniquement si un audit existe
2. **"À partir de 0"** : Toujours disponible, création from scratch

### Workflow complet (7 étapes forcées)

#### Étape 1 : Sélection du mode
- Choix entre les deux modes
- Le mode "audit" affiche le score et la date du dernier audit

#### Étape 2 : Sélection des documents
- 20 types de documents MASE disponibles
- En mode "audit" : présélection automatique des documents <80%
- Possibilité de modifier la sélection
- Organisation par axe MASE

#### Étape 3 : Configuration
- Utilise automatiquement les données du profil utilisateur
- Affichage en lecture seule des informations entreprise

#### Étape 4 : Récapitulatif
- Résumé des choix effectués
- Possibilité de revenir en arrière

#### Étape 5 : Personnalisation SSE (forcée)
- Interface pour ajouter des instructions spécifiques sécurité
- 7 sections contextuelles pré-remplies
- Obligatoire avant génération

#### Étape 6 : Génération
- Simulation de génération (~15 secondes)
- Barre de progression

#### Étape 7 : Résultats
- Liste des documents générés
- Actions : Télécharger, Voir aperçu
- Téléchargement individuel ou groupé (ZIP)

### Données générées (à sauvegarder)
```javascript
{
  generationId: string,
  userId: string,
  createdAt: Date,
  mode: 'from_audit' | 'from_scratch',
  auditId?: string, // Si mode from_audit
  configuration: {
    companyName: string,
    sector: string,
    companySize: string,
    mainActivities: string
  },
  selectedDocuments: string[],
  sseInstructions: {
    section1: string,
    section2: string,
    // ... jusqu'à section7
  },
  generatedDocuments: [{
    id: string,
    type: string,
    name: string,
    content: string, // Contenu simulé actuellement
    format: 'pdf',
    size: number
  }]
}
```

## 5. Gestion Documentaire

### Fonctionnalités
1. **Vue unifiée** : Tous les documents (uploadés, modifiés, générés)
2. **Filtrage avancé** :
   - Par type (Uploadé, Modifié, Généré)
   - Par source (MASE CHECKER, MASE GENERATOR, Upload manuel)
   - Par date (Aujourd'hui, 7 jours, 30 jours, 3 mois)
   - Recherche textuelle

3. **Actions contextuelles** :
   - Documents uploadés : Télécharger, Supprimer
   - Documents avec amélioration : Améliorer (→ MASE GENERATOR)
   - Documents générés : Télécharger, Voir liens

### Structure de données
```javascript
{
  documentId: string,
  userId: string,
  name: string,
  type: 'uploaded' | 'modified' | 'generated',
  source: 'mase-checker' | 'mase-generator' | 'manual',
  sourceId?: string, // auditId ou generationId
  uploadedAt: Date,
  modifiedAt?: Date,
  metadata: {
    score?: number,
    hasImprovement?: boolean,
    linkedAuditId?: string,
    linkedGenerationId?: string
  }
}
```

## 6. Paramètres Utilisateur

### Sections disponibles
1. **Profil** :
   - Nom complet (modifiable)
   - Email (lecture seule)
   - Entreprise et secteur (modifiables)
   - Taille et activités (modifiables)

2. **Sécurité** :
   - Changement de mot de passe
   - Historique des connexions (à implémenter)

3. **Actions de debug** (dev only) :
   - Réinitialiser l'onboarding
   - Effacer les données locales

## 7. Flux de données critiques

### Persistance actuelle (localStorage)
1. **Profil utilisateur** : `mase_user_profile`
2. **État onboarding** : `mase_onboarding_completed`
3. **Résultats audit** : `mase_audit_results`
4. **Résultats génération** : `mase_generation_results`
5. **Documents** : `mase_documents`
6. **Mode navigation** : `mase_navigation_mode`

### Tables Supabase nécessaires

#### 1. `user_profiles`
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- full_name (text)
- company_name (text)
- sector (text)
- company_size (text)
- main_activities (text)
- is_onboarding_completed (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 2. `audits`
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- global_score (decimal)
- axis_scores (jsonb)
- status (text) // 'in_progress', 'completed'
- created_at (timestamp)
- completed_at (timestamp)
```

#### 3. `audit_documents`
```sql
- id (uuid, PK)
- audit_id (uuid, FK → audits)
- document_name (text)
- document_type (text)
- axis (text)
- score (decimal)
- gaps (jsonb)
- recommendations (jsonb)
- created_at (timestamp)
```

#### 4. `generations`
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- audit_id (uuid, FK → audits, nullable)
- mode (text) // 'from_audit', 'from_scratch'
- configuration (jsonb)
- selected_documents (jsonb)
- sse_instructions (jsonb)
- status (text) // 'in_progress', 'completed'
- created_at (timestamp)
- completed_at (timestamp)
```

#### 5. `generated_documents`
```sql
- id (uuid, PK)
- generation_id (uuid, FK → generations)
- document_type (text)
- document_name (text)
- content_url (text) // URL stockage Supabase
- format (text)
- size (integer)
- created_at (timestamp)
```

#### 6. `documents`
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- name (text)
- type (text) // 'uploaded', 'modified', 'generated'
- source (text) // 'mase-checker', 'mase-generator', 'manual'
- source_id (uuid, nullable)
- file_url (text)
- metadata (jsonb)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 7. `activity_logs`
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- activity_type (text) // 'audit_completed', 'generation_completed', etc.
- activity_data (jsonb)
- created_at (timestamp)
```

## 8. Permissions et RLS (Row Level Security)

### Règles générales
1. Les utilisateurs ne peuvent voir/modifier que leurs propres données
2. Les documents générés sont en lecture seule
3. Les audits complétés ne peuvent pas être modifiés
4. Les profils utilisateurs sont modifiables par leur propriétaire uniquement

### Exemple de politique RLS
```sql
-- Pour la table user_profiles
CREATE POLICY "Users can view own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = user_id);
```

## 9. Intégrations futures recommandées

1. **OCR réel** : Intégration avec service OCR pour analyse PDF
2. **IA/ML** : Modèle pour scoring et recommandations
3. **Génération PDF** : Service de génération de documents réels
4. **Notifications** : Email/SMS pour alertes et rappels
5. **Multi-tenant** : Support entreprises avec plusieurs utilisateurs
6. **API publique** : Pour intégrations tierces
7. **Webhooks** : Pour automatisations externes

## 10. Points d'attention pour le backend

1. **Gestion des fichiers** : Utiliser Supabase Storage pour les uploads
2. **Limites** : Implémenter des quotas (nb audits/mois, taille stockage)
3. **Performance** : Indexer les colonnes fréquemment requêtées
4. **Sécurité** : Valider côté serveur toutes les entrées utilisateur
5. **Logs** : Tracer toutes les actions pour audit trail
6. **Backup** : Stratégie de sauvegarde des données critiques
7. **RGPD** : Permettre export/suppression des données utilisateur

Ce guide couvre l'ensemble du parcours utilisateur et les flux de données nécessaires pour implémenter le backend Supabase de MASE DOCS.