# Claude Code Conversation History - Session 4

## Session: Architecture Technique Réelle de MASE DOCS (Janvier 2025)

### Contexte de la session
Cette session fait suite aux sessions précédentes documentées dans CLAUDE.md, CLAUDE2.md et CLAUDE3.md. L'utilisateur a clarifié le **véritable principe de fonctionnement technique** de MASE DOCS, qui diffère significativement de l'implémentation actuelle (prototype avec mock data).

### Clarification Fondamentale
L'application actuelle est un **prototype UX complet** avec données simulées. L'objectif est de la transformer en **système expert basé sur le référentiel MASE 2024** avec analyse et génération réelles par IA.

## 🎯 Architecture Technique Cible

### Principe de Fonctionnement - MASE CHECKER

#### **Étape 1 : Upload et intégration du référentiel**
- Intégration du document "référentiel MASE 2024" (incluant questionnaire d'évaluation et critères)
- Parsing et structuration en base de données Supabase

#### **Étape 2 : Extraction des documents clés requis**
- Extraction automatique de la liste des documents obligatoires par axe MASE
- Stockage structuré dans table `documents_cles_requis`

#### **Étape 3 : Extraction du contenu attendu**
- Pour chaque document clé : extraction du contenu requis pour conformité
- Critères précis de ce qui doit être présent dans chaque document
- Stockage dans table `contenu_requis_documents`

#### **Étape 4 : Upload des documents utilisateur**
- Support multi-format : DOCX, XLSX, PDF
- OCR uniquement si PDF scanné (cas rare)
- Extraction du contenu pour analyse

#### **Étape 5 : Traitement automatisé**
- **Classification** : Mapping automatique documents user ↔ 5 axes MASE
- **Analyse des écarts** : Comparaison sémantique par IA (contenu réel VS attendu)
- **Score de conformité** : Calcul multi-critères pour chaque document/axe/global
- **Plan d'action** : Recommandations concrètes priorisées

### Principe de Fonctionnement - MASE GENERATOR

#### **Étape 1 : Détermination des documents à générer**
- **Cas 1 - Post-audit** : Documents non conformes (<80%) + documents manquants
- **Cas 2 - From scratch** : Tous les documents clés requis du référentiel

#### **Étape 2 : Configuration style/apparence**
- Choix du format de sortie par type de document
- Personnalisation visuelle (en-têtes, logos, mise en page)

#### **Étape 3 : Personnalisation SSE**
- Intégration données entreprise (profil utilisateur)
- Instructions SSE spécifiques par l'utilisateur
- Contextualisation selon secteur d'activité

#### **Étape 4 : Structuration intelligente**
- Utilisation des structures pré-définies (depuis `contenu_requis_documents`)
- Enrichissement avec instructions personnalisées
- Organisation logique des informations

#### **Étape 5 : Export multi-format**
- **Word** : Documents narratifs (politique SSE, procédures...)
- **Excel** : Tableaux complexes (plans d'action, indicateurs...)
- **PDF** : Export universel pour tous documents

## 📊 Système de Notation Sophistiqué

### Types de Notation
1. **Note Binaire** : 0 ou maximum (critère présent/absent)
2. **Note Variable** : 0 à maximum (non/partiel/oui)
3. **Note Variable Doublée** : 0 à 2×maximum (uniquement en audit renouvellement)

### Calcul des Scores
- **Par critère** : Application du type de note + pondération
- **Par document** : Agrégation des critères du document
- **Par axe** : Moyenne pondérée des documents de l'axe
- **Global** : Moyenne pondérée des 5 axes MASE

### Pondérations des Axes MASE
1. Engagement de la direction : 25%
2. Compétences et qualification : 20%
3. Préparation des interventions : 20%
4. Mise en œuvre : 20%
5. Contrôle et amélioration : 15%

## 💾 Architecture de Données

### Tables Statiques (Référentiel MASE 2024)

#### `referentiel_mase_2024`
```sql
- id (uuid, PK)
- code_critere (text, unique)
- libelle_critere (text)
- axe_mase (text)
- type_notation (text) -- 'binaire', 'variable', 'variable_doublee'
- points_max (integer)
- ponderation (decimal)
- obligatoire (boolean)
- description_attendue (text)
```

#### `documents_cles_requis`
```sql
- id (uuid, PK)
- code_document (text, unique)
- nom_document (text)
- axe_mase (text)
- type_document (text) -- 'word', 'excel'
- obligatoire (boolean)
- ordre_affichage (integer)
```

#### `contenu_requis_documents`
```sql
- id (uuid, PK)
- document_id (uuid, FK → documents_cles_requis)
- section_titre (text)
- section_contenu (text)
- elements_obligatoires (jsonb)
- ordre_section (integer)
```

#### `criteres_documents`
```sql
- id (uuid, PK)
- critere_id (uuid, FK → referentiel_mase_2024)
- document_id (uuid, FK → documents_cles_requis)
- poids_relatif (decimal)
```

### Tables Dynamiques (voir GUIDE_UTILISATION_MASE_DOCS.md pour détails complets)
- `user_profiles`
- `audits` + `audit_documents`
- `generations` + `generated_documents`
- `documents`
- `activity_logs`

## 🤖 Intégration IA

### Backend IA
- **Options** : Claude API ou Gemini API (selon performances)
- **Rôle principal** : Analyse sémantique et génération contextuelle

### Analyse Sémantique (MASE CHECKER)
```typescript
// Pseudo-code du prompt d'analyse
const analyzeDocument = async (documentContent, expectedContent, criteria) => {
  const prompt = `
    Analysez ce document par rapport aux critères MASE suivants :
    
    Document à analyser : ${documentContent}
    
    Contenu attendu : ${expectedContent}
    
    Critères d'évaluation : ${JSON.stringify(criteria)}
    
    Pour chaque critère, indiquez :
    1. Si le critère est satisfait (oui/partiel/non)
    2. Les éléments manquants le cas échéant
    3. Une recommandation d'amélioration
    
    Retournez un JSON structuré avec le score et les gaps identifiés.
  `;
  
  return await callAI(prompt);
};
```

### Génération Documentaire (MASE GENERATOR)
```typescript
// Pseudo-code de génération
const generateDocument = async (
  documentType, 
  requiredStructure, 
  companyData, 
  sseInstructions
) => {
  const prompt = `
    Générez un document ${documentType} conforme MASE avec :
    
    Structure requise : ${requiredStructure}
    
    Données entreprise :
    - Nom : ${companyData.name}
    - Secteur : ${companyData.sector}
    - Taille : ${companyData.size}
    - Activités : ${companyData.activities}
    
    Instructions SSE spécifiques : ${sseInstructions}
    
    Le document doit :
    1. Respecter tous les éléments obligatoires
    2. Être personnalisé pour l'entreprise
    3. Intégrer les instructions SSE fournies
    4. Être immédiatement utilisable
  `;
  
  return await callAI(prompt);
};
```

## 🔄 Flux de Données Complets

### MASE CHECKER Flow
```
1. Upload documents → Supabase Storage
2. Extraction contenu → Processing service
3. Classification IA → Mapping avec référentiel
4. Analyse par critère → Scoring multi-niveaux
5. Agrégation scores → Document → Axe → Global
6. Gap analysis → Identification précise des manques
7. Génération plan d'action → Priorisation intelligente
8. Sauvegarde résultats → Tables audits + audit_documents
```

### MASE GENERATOR Flow
```
1. Sélection mode → Post-audit ou From-scratch
2. Détermination documents → Basé sur gaps ou liste complète
3. Configuration → Style + données entreprise
4. Personnalisation → Instructions SSE utilisateur
5. Génération IA → Pour chaque document sélectionné
6. Structuration → Selon format cible (Word/Excel)
7. Export → Génération fichiers + conversion PDF
8. Sauvegarde → Tables generations + generated_documents
```

## 📝 Points Techniques Clarifiés

### Sources de Données
- **CSV du référentiel** : ~300 lignes, divisé en 2 fichiers (documents + critères)
- **Format** : CSV déjà parsé, prêt pour import Supabase
- **Relations** : Liaison N:N entre documents et critères

### Gestion Multi-Format
- **Word** : Documents textuels (politiques, procédures)
- **Excel** : Tableaux et matrices (plans d'action, indicateurs)
- **PDF** : Export universel (conversion côté serveur)

### Prompt Engineering
- **Stockage** : Prompts en base pour ajustements sans déploiement
- **Contexte** : Extraits pertinents du référentiel (pas tout en mémoire)
- **Optimisation** : Itérations selon résultats Claude vs Gemini

### Architecture Évolutive
- **Phase 1** : Intégration données statiques Supabase
- **Phase 2** : Migration localStorage → Supabase
- **Phase 3** : Intégration IA (analyse + génération)
- **Phase 4** : Génération documents réels
- **Phase 5** : Features avancées (OCR, multi-tenant, API)

## 🎯 Transformation : Du Prototype à la Production

### État Actuel (Prototype)
- ✅ UX/UI complète et professionnelle
- ✅ Workflows utilisateur validés
- ✅ Architecture front-end robuste
- ❌ Données simulées (mock)
- ❌ Pas d'analyse réelle
- ❌ Génération template statique

### État Cible (Production)
- ✅ Même UX/UI (pas de changement utilisateur)
- ✅ Backend Supabase complet
- ✅ Analyse IA réelle basée sur référentiel
- ✅ Génération contextuelle personnalisée
- ✅ Scoring sophistiqué multi-critères
- ✅ Export multi-format professionnel

### Valeur Ajoutée
- **Conformité réelle** : Basée sur référentiel officiel MASE 2024
- **Gain de temps** : Audit manuel (semaines) → Automatique (minutes)
- **Qualité garantie** : Documents générés 100% conformes
- **Personnalisation** : Adapté au contexte de chaque entreprise
- **Évolutivité** : Architecture prête pour futures certifications

---

Cette documentation technique servira de référence pour l'implémentation du backend et l'intégration de l'intelligence artificielle dans MASE DOCS.