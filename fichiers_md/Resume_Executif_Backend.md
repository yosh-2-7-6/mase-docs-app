# MASE DOCS - Résumé Exécutif Backend

## Vision Générale

MASE DOCS représente une transformation complète du processus de certification MASE en automatisant l'audit documentaire et la génération de documents conformes. L'application actuelle, développée avec Next.js et Supabase, fonctionne avec des données mockées mais dispose déjà de toute l'architecture frontend nécessaire.

## Architecture des Données MASE 2024 - Analyse Détaillée

### Structure du Référentiel MASE (Données SQL Analysées)

#### 1. Chapitres MASE (`chapitres_mase`)
- **19 chapitres** répartis sur **5 axes principaux** :
  - **Axe 1** : Engagement Direction (8 chapitres, 855 points total)
  - **Axe 2** : Compétences (4 chapitres, 640 points total) 
  - **Axe 3** : Préparation & Organisation (4 chapitres, 1300 points total)
  - **Axe 4** : Contrôles & Amélioration (3 chapitres, 980 points total)
  - **Axe 5** : Bilan & Amélioration Continue (2 chapitres, 475 points total)

- **Score total maximum** : 4250 points
- **Chapitres clés** identifiés :
  - 3.1 "Analyse des risques" (455 points - chapitre le plus lourd)
  - 3.2 "Préparation" (305 points) 
  - 3.3 "Réalisation" (390 points)

#### 2. Critères d'Évaluation (`criteres_mase`)
- **~250 critères** avec 3 types de scoring :
  - **116 critères Binaires (B)** : 0 ou score max
  - **59 critères Variables (V)** : score proportionnel 0-100%
  - **27 critères Variables Doublés (VD)** : score x2 si excellence

- **Distribution par axe** :
  - Axe 1 : 1.1.1 à 1.7.10 (53 critères)
  - Axe 2 : 2.1.1 à 2.3.8 (35 critères) 
  - Axe 3 : 3.1.1 à 3.4.13 (85 critères)
  - Axe 4 : 4.1.1 à 4.3.16 (45 critères)
  - Axe 5 : 5.1.1 à 5.2.13 (26 critères)

#### 3. Documents Clés Requis (`documents_cles`)
- **40+ documents obligatoires** avec métadonnées complètes :
  - **Types** : politique, plan, registre, procédure, fiche, analyse, rapport, etc.
  - **Axes de rattachement** : chaque document lié à 1 axe principal + axes secondaires
  - **Critères liés** : mapping précis document ↔ critères d'évaluation
  - **Questions d'audit** : questions types pour chaque document
  - **Fréquence de MAJ** : annuelle, mensuelle, continue, selon_activité, etc.

**Exemples de documents prioritaires** :
- Politique SSE (axe 1, 6 critères liés)
- DUER - Document Unique (axe 3, critères 3.1.15)
- Plan d'actions SSE (axe 1, 6 critères liés)
- Bilan annuel SSE (axe 5, 13 critères liés)

#### 4. Contenu Détaillé (`contenu_documents_cles`)
- **20 sections documentées** pour 3 documents :
  - **Politique SSE** : 8 sections (préambule → validation)
  - **Liste Objectifs SSE** : 6 sections (infos générales → suivi)
  - **Tableau de bord SSE** : 5 sections (identification → actions correctives)

- **Structure type par section** :
  - Contenu attendu et éléments obligatoires
  - Exemples conformes et critères de validation
  - Ordre des sections et cohérence globale

**⚠️ Gap identifié** : Contenu manquant pour 38 documents sur 41.

## Architecture Technique Recommandée

### 1. Base de Données (Supabase PostgreSQL)

#### Tables Principales
```sql
-- Tables référentiel MASE (déjà structurées)
chapitres_mase          -- 19 enregistrements ✅
criteres_mase           -- ~250 enregistrements ✅  
documents_cles          -- 41 enregistrements ✅
contenu_documents_cles  -- 20 sections ✅ (38 manquantes)

-- Tables fonctionnelles (à créer)
user_profiles           -- Profils entreprises utilisatrices
audit_sessions          -- Sessions d'audit MASE CHECKER
audit_documents         -- Documents analysés par session
audit_results          -- Résultats détaillés par critère
generation_sessions     -- Sessions MASE GENERATOR
generated_documents     -- Documents générés et leur contenu
```

#### Sécurité et Accès
- **Row Level Security (RLS)** sur toutes les tables utilisateur
- **Isolation par entreprise** : chaque utilisateur accède uniquement à ses données
- **Audit trail** : traçabilité complète des actions

### 2. Services Backend

#### Service d'Analyse Documentaire
```typescript
class DocumentAnalysisService {
  // OCR + Extraction de contenu
  async extractContent(file: File): Promise<DocumentContent>
  
  // Analyse sémantique AI
  async analyzeCompliance(
    documentContent: DocumentContent,
    maseRequirements: MaseRequirement[]
  ): Promise<ComplianceAnalysis>
  
  // Calcul de scores selon types B/V/VD
  async calculateScore(analysis: ComplianceAnalysis): Promise<Score>
}
```

#### Service de Génération de Documents
```typescript
class DocumentGenerationService {
  // Génération basée sur templates + données client
  async generateDocument(
    template: DocumentTemplate,
    companyData: CompanyProfile,
    customInstructions?: string
  ): Promise<GeneratedDocument>
  
  // Export multi-formats
  async exportDocument(
    document: GeneratedDocument,
    format: 'word' | 'excel' | 'pdf'
  ): Promise<Buffer>
}
```

### 3. Algorithme de Scoring MASE

#### Logique de Calcul
```typescript
interface ScoringEngine {
  // Scoring par type de critère
  calculateBinaryScore(compliance: boolean, maxScore: number): number
  calculateVariableScore(percentage: number, maxScore: number): number  
  calculateVariableDoubledScore(percentage: number, maxScore: number): number
  
  // Agrégation multi-niveaux
  calculateDocumentScore(documentResults: CriteriaResult[]): DocumentScore
  calculateChapterScore(documentsInChapter: DocumentScore[]): ChapterScore
  calculateAxisScore(chaptersInAxis: ChapterScore[]): AxisScore
  calculateGlobalScore(allAxis: AxisScore[]): GlobalScore
}
```

#### Seuils de Conformité
- **≥80%** : Document conforme (VERT)
- **60-79%** : À améliorer (JAUNE)  
- **<60%** : Non conforme (ROUGE)
- **Seuil certification MASE** : 70% global minimum

## Workflow Fonctionnel Détaillé

### MASE CHECKER - Processus d'Audit

#### Phase 1 : Préparation (Frontend ✅)
1. **Upload documents** - Interface drag & drop opérationnelle
2. **Classification automatique** - À développer : reconnaissance type document
3. **Mapping référentiel** - À développer : association documents ↔ critères MASE

#### Phase 2 : Analyse (Backend à développer)
1. **Extraction OCR** - Service à implémenter
2. **Analyse sémantique** - IA pour comparer contenu vs exigences
3. **Scoring automatisé** - Application algorithme B/V/VD
4. **Détection écarts** - Identification précise des non-conformités

#### Phase 3 : Résultats (Frontend ✅)
1. **Tableau de bord** - Scores par axe/document déjà implémenté
2. **Rapport détaillé** - Export fonctionnel avec données mockées
3. **Plans d'action** - Génération automatique des recommandations

### MASE GENERATOR - Génération de Documents

#### Phase 1 : Configuration (Frontend ✅)
1. **Mode sélection** - Post-audit ou génération standalone
2. **Choix documents** - Sélection basée sur audit ou manuelle
3. **Données entreprise** - Profil utilisateur intégré

#### Phase 2 : Personnalisation (Frontend ✅)  
1. **Templates structurés** - À développer : base sur contenu_documents_cles
2. **Instructions SSE** - Interface de personnalisation opérationnelle
3. **Validation contenu** - Vérification cohérence avant génération

#### Phase 3 : Génération (Backend à développer)
1. **Assembly documentaire** - Fusion template + données + instructions
2. **Formatage multi-format** - Word/Excel/PDF
3. **Contrôle qualité** - Validation conformité MASE finale

## Roadmap d'Implémentation

### Phase 1 : Foundation (2-3 mois)
**Priorité HAUTE** - 80% des données prêtes
- ✅ Complétion tables contenu_documents_cles (38 documents manquants)
- Migration localStorage → Supabase avec RLS
- Service OCR + extraction de contenu basique
- Templates de génération pour 10 documents prioritaires

### Phase 2 : IA & Analyse (3-4 mois)  
**Priorité HAUTE** - Coeur métier
- Moteur d'analyse sémantique (OpenAI/Claude)
- Algorithme de scoring B/V/VD complet
- Tests de précision sur référentiel MASE réel
- Interface de calibrage et ajustement manuel

### Phase 3 : Génération Avancée (2-3 mois)
**Priorité MOYENNE** - Enhancement
- Templates complets pour les 40+ documents
- Export multi-formats optimisé (Word/Excel/PDF)
- Personnalisation avancée par secteur d'activité
- Intégration workflow audit → génération automatique

### Phase 4 : Optimisation (1-2 mois)
**Priorité BASSE** - Polish
- Dashboard analytics avancé
- API publique pour intégrations tierces  
- Mobile app pour audits terrain
- Fonctionnalités collaboratives multi-utilisateurs

## ROI et Business Case

### Valeur Métier
- **Réduction 90%** du temps d'audit documentaire (15j → 1.5j)
- **Standardisation** garantie conformité MASE 2024
- **Scalabilité** : traitement simultané multiple entreprises
- **Traçabilité** complète pour organismes certificateurs

### Faisabilité Technique
- **Architecture solide** : Frontend Next.js + Backend Supabase
- **Données structurées** : Référentiel MASE 2024 complet  
- **IA accessible** : APIs OpenAI/Claude pour analyse sémantique
- **Stack moderne** : TypeScript, PostgreSQL, serverless

### Indicateurs de Succès
- **Précision audit** : >95% vs audit manuel expert
- **Temps traitement** : <30min pour analyse 50 documents
- **Satisfaction client** : Score NPS >70 
- **Conformité** : 100% des documents générés passent audit certificateur

## Prochaines Étapes Immédiates

1. **Complétion données** - Finaliser contenu_documents_cles (38 docs manquants)
2. **POC scoring** - Implémentation algorithme B/V/VD sur 1 axe
3. **Service OCR** - Intégration extraction contenu pour tests
4. **Migration données** - LocalStorage → Supabase avec RLS
5. **Tests utilisateur** - Validation workflow avec 3 entreprises pilotes

**L'application MASE DOCS dispose déjà de 80% de l'infrastructure nécessaire et peut être opérationnelle pour un MVP en 3-4 mois avec l'implémentation backend appropriée.**