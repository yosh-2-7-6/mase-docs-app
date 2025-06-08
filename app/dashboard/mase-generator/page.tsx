"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MaseStateManager } from "@/utils/mase-state";
import { UserProfileManager } from "@/utils/user-profile";
import { 
  FileText, 
  Wand2, 
  CheckCircle2, 
  Search, 
  Settings, 
  Palette, 
  Info, 
  ArrowRight, 
  ArrowLeft,
  Download,
  Eye,
  Clock,
  Building,
  Shield,
  Users,
  Wrench,
  RefreshCw,
  X,
  AlertTriangle,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Types
interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  axis: string;
  required: boolean;
  estimatedTime: string;
  auditScore?: number; // Score de l'audit si disponible
}

interface GenerationConfig {
  mode: 'post-audit' | 'complete';
  selectedDocs: string[];
  generationType: 'standard' | 'personalized';
  personalizedInstructions: { [docId: string]: string };
  styling: {
    template: string;
    primaryColor: string;
    logo: File | null;
  };
}

interface CompanyProfile {
  name: string;
  sector: string;
  size: string;
  activities: string;
}

interface GeneratedDocument {
  id: string;
  templateId: string;
  name: string;
  status: 'generated' | 'in-progress' | 'error';
  downloadUrl?: string;
  content?: string;
}

// Mock data pour les 5 axes MASE et leurs documents
const MASE_AXES = [
  "Engagement de la direction",
  "Compétences et qualifications", 
  "Préparation et organisation des interventions",
  "Réalisation des interventions",
  "Retour d'expérience et amélioration continue"
];

const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  { id: 'politique-sse', name: 'Politique SSE', description: 'Document de politique santé, sécurité et environnement', axis: MASE_AXES[0], required: true, estimatedTime: '5 min' },
  { id: 'organigramme', name: 'Organigramme SSE', description: 'Structure organisationnelle SSE', axis: MASE_AXES[0], required: true, estimatedTime: '3 min' },
  { id: 'plan-formation', name: 'Plan de formation', description: 'Programme de formation du personnel', axis: MASE_AXES[1], required: true, estimatedTime: '7 min' },
  { id: 'habilitations', name: 'Matrice des habilitations', description: 'Suivi des compétences et habilitations', axis: MASE_AXES[1], required: false, estimatedTime: '4 min' },
  { id: 'procedure-preparation', name: 'Procédure de préparation', description: 'Méthodes de préparation des interventions', axis: MASE_AXES[2], required: true, estimatedTime: '6 min' },
  { id: 'check-list', name: 'Check-lists interventions', description: 'Listes de vérification pour les interventions', axis: MASE_AXES[2], required: false, estimatedTime: '4 min' },
  { id: 'consignes-securite', name: 'Consignes de sécurité', description: 'Instructions de sécurité opérationnelles', axis: MASE_AXES[3], required: true, estimatedTime: '5 min' },
  { id: 'fiche-poste', name: 'Fiches de poste', description: 'Descriptions des postes de travail', axis: MASE_AXES[3], required: false, estimatedTime: '8 min' },
  { id: 'retour-experience', name: 'Procédure REX', description: 'Processus de retour d\'expérience', axis: MASE_AXES[4], required: true, estimatedTime: '5 min' },
  { id: 'indicateurs', name: 'Tableau de bord SSE', description: 'Indicateurs de performance SSE', axis: MASE_AXES[4], required: false, estimatedTime: '6 min' }
];

export default function MaseGeneratorPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<'mode' | 'selection' | 'config' | 'info' | 'personalization' | 'generation' | 'results'>('mode');
  const [config, setConfig] = useState<GenerationConfig>({
    mode: 'complete',
    selectedDocs: [],
    generationType: 'standard',
    personalizedInstructions: {},
    styling: { template: 'moderne', primaryColor: '#3b82f6', logo: null }
  });
  
  // Profil entreprise (récupéré depuis /settings)
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    name: 'Mon Entreprise',
    sector: 'Non défini',
    size: 'Non défini',
    activities: 'Non défini'
  });

  // État de l'historique d'audit (récupéré depuis MASE CHECKER)
  const [hasAuditHistory, setHasAuditHistory] = useState(false);
  const [latestAudit, setLatestAudit] = useState<any>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<GeneratedDocument | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Vérifier l'historique d'audit et charger le profil utilisateur au chargement
  useEffect(() => {
    const checkAuditHistory = () => {
      const hasCompleted = MaseStateManager.hasCompletedAudit();
      const latest = MaseStateManager.getLatestAudit();
      
      setHasAuditHistory(hasCompleted);
      setLatestAudit(latest);

      // Vérifier si on vient directement de MASE CHECKER
      const navigationMode = MaseStateManager.getNavigationMode();
      if (navigationMode === 'post-audit-direct' && hasCompleted) {
        // Aller directement à l'étape 2 avec le mode post-audit
        // On va utiliser un setTimeout pour s'assurer que handleModeSelection est définie
        setTimeout(() => {
          handleModeSelection('post-audit');
          // Nettoyer le mode de navigation
          MaseStateManager.clearNavigationMode();
        }, 100);
      }
    };

    const loadUserProfile = () => {
      // Charger le profil utilisateur depuis les paramètres
      const profile = UserProfileManager.getCompanyProfileForGenerator();
      setCompanyProfile(profile);
    };

    const checkGenerationHistory = () => {
      // Vérifier s'il y a une génération en mémoire à afficher
      const viewMode = MaseStateManager.getGenerationViewMode();
      const latestGeneration = MaseStateManager.getLatestGeneration();
      
      if (viewMode === 'view-results' && latestGeneration && latestGeneration.completed) {
        // Restaurer les résultats de la dernière génération
        setConfig({
          mode: latestGeneration.mode,
          selectedDocs: latestGeneration.documentsGenerated.map(d => d.id),
          generationType: latestGeneration.generationType,
          personalizedInstructions: typeof latestGeneration.personalizedInstructions === 'string' 
            ? {} 
            : latestGeneration.personalizedInstructions || {},
          styling: { template: 'moderne', primaryColor: '#3b82f6', logo: null }
        });
        
        setGeneratedDocuments(latestGeneration.documentsGenerated.map(doc => ({
          id: doc.id,
          templateId: doc.template,
          name: doc.name,
          status: 'generated' as const,
          downloadUrl: '#',
          content: `Contenu du document ${doc.name} généré automatiquement selon le référentiel MASE.`
        })));
        
        setCurrentStep('results');
        // Nettoyer le mode de vue
        MaseStateManager.clearGenerationViewMode();
      }
    };

    // Charger les données au démarrage
    checkAuditHistory();
    loadUserProfile();
    checkGenerationHistory();

    // Vérifier aussi quand la fenêtre reprend le focus (navigation entre pages)
    const handleFocus = () => {
      checkAuditHistory();
      loadUserProfile(); // Recharger le profil aussi
      checkGenerationHistory();
    };
    window.addEventListener('focus', handleFocus);
    
    // Vérifier périodiquement (toutes les 2 secondes) pour détecter les changements
    const interval = setInterval(() => {
      checkAuditHistory();
      loadUserProfile();
    }, 2000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  // Step 1: Mode Selection
  const handleModeSelection = (mode: GenerationConfig['mode']) => {
    let selectedDocs = config.selectedDocs;
    
    // Si mode post-audit, présélectionner les documents à améliorer (<80%)
    if (mode === 'post-audit' && latestAudit && latestAudit.analysisResults) {
      // Trouver tous les documents avec un score < 80%
      const lowScoreDocIds = latestAudit.analysisResults
        .filter((result: any) => result.score < 80)
        .map((result: any) => {
          // Mapper les noms de documents aux IDs de templates
          // Améliorer la logique de matching pour être plus flexible
          const normalizedResultName = result.documentName.toLowerCase().trim();
          const template = DOCUMENT_TEMPLATES.find(t => {
            const normalizedTemplateName = t.name.toLowerCase().trim();
            // Vérifier une correspondance exacte ou partielle
            return normalizedTemplateName === normalizedResultName ||
                   normalizedTemplateName.includes(normalizedResultName) ||
                   normalizedResultName.includes(normalizedTemplateName) ||
                   // Vérifier aussi les mots clés importants
                   (normalizedResultName.includes('politique') && normalizedTemplateName.includes('politique')) ||
                   (normalizedResultName.includes('organigramme') && normalizedTemplateName.includes('organigramme')) ||
                   (normalizedResultName.includes('formation') && normalizedTemplateName.includes('formation')) ||
                   (normalizedResultName.includes('habilitation') && normalizedTemplateName.includes('habilitation')) ||
                   (normalizedResultName.includes('check') && normalizedTemplateName.includes('check')) ||
                   (normalizedResultName.includes('consigne') && normalizedTemplateName.includes('consigne')) ||
                   (normalizedResultName.includes('fiche') && normalizedTemplateName.includes('fiche')) ||
                   (normalizedResultName.includes('rex') && normalizedTemplateName.includes('rex')) ||
                   (normalizedResultName.includes('tableau') && normalizedTemplateName.includes('tableau')) ||
                   (normalizedResultName.includes('indicateur') && normalizedTemplateName.includes('tableau'));
          });
          return template?.id;
        })
        .filter(Boolean);
      
      // Ajouter aussi les documents manquants
      const missingDocIds = latestAudit.missingDocuments
        .map((docName: string) => {
          const normalizedDocName = docName.toLowerCase().trim();
          const template = DOCUMENT_TEMPLATES.find(t => {
            const normalizedTemplateName = t.name.toLowerCase().trim();
            return normalizedTemplateName === normalizedDocName ||
                   normalizedTemplateName.includes(normalizedDocName) ||
                   normalizedDocName.includes(normalizedTemplateName);
          });
          return template?.id;
        })
        .filter(Boolean);
      
      // Combiner et dédupliquer
      const combined = [...lowScoreDocIds, ...missingDocIds];
      const allDocIds = Array.from(new Set(combined));
      selectedDocs = allDocIds;
    }
    
    setConfig({ ...config, mode, selectedDocs });
    setCurrentStep('selection');
  };

  // Step 2: Document Selection
  const toggleDocumentSelection = (docId: string) => {
    const selected = config.selectedDocs.includes(docId);
    if (selected) {
      setConfig({
        ...config,
        selectedDocs: config.selectedDocs.filter(id => id !== docId)
      });
    } else {
      setConfig({
        ...config,
        selectedDocs: [...config.selectedDocs, docId]
      });
    }
  };

  const selectAllByAxis = (axis: string) => {
    const axisDocs = DOCUMENT_TEMPLATES.filter(doc => doc.axis === axis).map(doc => doc.id);
    const currentAxisDocs = config.selectedDocs.filter(id => 
      DOCUMENT_TEMPLATES.find(doc => doc.id === id)?.axis === axis
    );
    
    if (currentAxisDocs.length === axisDocs.length) {
      // Deselect all from this axis
      setConfig({
        ...config,
        selectedDocs: config.selectedDocs.filter(id => 
          DOCUMENT_TEMPLATES.find(doc => doc.id === id)?.axis !== axis
        )
      });
    } else {
      // Select all from this axis
      const newSelected = [...config.selectedDocs];
      axisDocs.forEach(docId => {
        if (!newSelected.includes(docId)) {
          newSelected.push(docId);
        }
      });
      setConfig({ ...config, selectedDocs: newSelected });
    }
  };

  const selectAllDocuments = () => {
    const allDocIds = DOCUMENT_TEMPLATES.map(doc => doc.id);
    if (config.selectedDocs.length === allDocIds.length) {
      // Deselect all
      setConfig({ ...config, selectedDocs: [] });
    } else {
      // Select all
      setConfig({ ...config, selectedDocs: allDocIds });
    }
  };

  // Step 3: Configuration
  const handleConfigChange = (field: string, value: any) => {
    if (field.startsWith('styling.')) {
      const stylePath = field.split('.')[1];
      setConfig({
        ...config,
        styling: { ...config.styling, [stylePath]: value }
      });
    }
  };

  // Step 5: Generation
  const startGeneration = async () => {
    setCurrentStep('generation');
    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate document generation
    const totalDocs = config.selectedDocs.length;
    const generatedDocs: GeneratedDocument[] = [];

    for (let i = 0; i < totalDocs; i++) {
      const templateId = config.selectedDocs[i];
      const template = DOCUMENT_TEMPLATES.find(t => t.id === templateId);
      
      // Simulate generation time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const generatedDoc: GeneratedDocument = {
        id: `gen-${Date.now()}-${i}`,
        templateId,
        name: template?.name || 'Document',
        status: 'generated',
        downloadUrl: '#',
        content: `Contenu du document ${template?.name} généré automatiquement selon le référentiel MASE.`
      };
      
      generatedDocs.push(generatedDoc);
      setGeneratedDocuments([...generatedDocs]);
      setGenerationProgress(((i + 1) / totalDocs) * 100);
    }

    setIsGenerating(false);
    
    // Sauvegarder les résultats de génération
    const generationResult = {
      id: MaseStateManager.generateGenerationId(),
      date: new Date().toISOString(),
      mode: config.mode,
      generationType: config.generationType,
      documentsGenerated: generatedDocs.map(doc => ({
        id: doc.id,
        name: doc.name,
        axis: DOCUMENT_TEMPLATES.find(t => t.id === doc.templateId)?.axis || '',
        template: doc.templateId
      })),
      config: {
        companyName: companyProfile.name,
        sector: companyProfile.sector,
        companySize: companyProfile.size,
        mainActivities: companyProfile.activities,
        implementationDate: new Date().toISOString()
      },
      personalizedInstructions: config.generationType === 'personalized' ? config.personalizedInstructions : undefined,
      completed: true,
      auditId: latestAudit?.id
    };
    
    MaseStateManager.saveGenerationResults(generationResult);
    setCurrentStep('results');
  };

  // Export all documents
  const exportAllDocuments = () => {
    const exportData = {
      date: new Date().toISOString(),
      config,
      documents: generatedDocuments
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mase-documents-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download individual document
  const downloadDocument = (doc: GeneratedDocument) => {
    const template = DOCUMENT_TEMPLATES.find(t => t.id === doc.templateId);
    const instructions = config.personalizedInstructions && config.personalizedInstructions[doc.templateId];
    
    const content = `${doc.name}

Entreprise: ${companyProfile.name}
Secteur: ${companyProfile.sector}
Taille: ${companyProfile.size} salariés

${doc.content}

Ce document a été généré automatiquement selon les exigences du référentiel MASE 2024.
${config.generationType === 'personalized' ? 'Génération personnalisée avec instructions spécifiques.' : 'Génération standard.'}

Il inclut toutes les sections requises:
• Objectifs et politique
• Responsabilités
• Procédures
• Indicateurs de performance
• Modalités de révision

${instructions ? `Instructions personnalisées appliquées:\n${instructions}\n\n` : ''}Axe MASE: ${template?.axis}
Modèle utilisé: ${config.styling.template}
Date de génération: ${new Date().toLocaleDateString()}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Reset generator
  const resetGenerator = () => {
    // Effacer le mode de vue de génération si nécessaire
    MaseStateManager.clearGenerationViewMode();
    
    setCurrentStep('mode');
    setConfig({
      mode: 'complete',
      selectedDocs: [],
      generationType: 'standard',
      personalizedInstructions: {},
      styling: { template: 'moderne', primaryColor: '#3b82f6', logo: null }
    });
    setGeneratedDocuments([]);
    setGenerationProgress(0);
  };

  const getStepNumber = () => {
    // Mapping des étapes vers leurs numéros affichés
    const stepMapping: { [key: string]: number } = {
      'mode': 1,
      'selection': 2, 
      'config': 3,
      'info': 4,
      'personalization': 5, // Seulement en mode personnalisé
      'generation': config.generationType === 'personalized' ? 6 : 5,
      'results': config.generationType === 'personalized' ? 7 : 6
    };
    
    return stepMapping[currentStep] || 1;
  };
  
  const getTotalSteps = () => {
    // 7 étapes pour personnalisé, 6 pour standard
    return config.generationType === 'personalized' ? 7 : 6;
  };

  // Vérifier s'il y a des résultats en mémoire (côté client uniquement)
  const [latestGenerationState, setLatestGenerationState] = useState<any>(null);
  const [hasGenerationHistory, setHasGenerationHistory] = useState(false);
  
  useEffect(() => {
    const latestGen = MaseStateManager.getLatestGeneration();
    setLatestGenerationState(latestGen);
    setHasGenerationHistory(Boolean(latestGen && latestGen.completed && currentStep !== 'results'));
  }, [currentStep]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">MASE Generator</h1>
        <p className="text-muted-foreground">
          Générez automatiquement vos documents conformes au référentiel MASE
        </p>
      </div>

      {/* Notification de génération en mémoire */}
      {hasGenerationHistory && (
        <Alert className={
          (currentStep === 'info' || currentStep === 'personalization' || currentStep === 'generation' || currentStep === 'results')
            ? "border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 relative group"
            : "border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 relative group"
        }>
          {/* Trash button that appears on hover */}
          {!(currentStep === 'info' || currentStep === 'personalization' || currentStep === 'generation' || currentStep === 'results') && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/50 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 rounded-md"
              onClick={(e) => {
                e.stopPropagation();
                MaseStateManager.clearGenerationHistory();
                setHasGenerationHistory(false);
                setLatestGenerationState(null);
              }}
              title="Supprimer l'historique de génération"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
          
          {(currentStep === 'info' || currentStep === 'personalization' || currentStep === 'generation' || currentStep === 'results') ? (
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          ) : (
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          )}
          <AlertTitle className={
            (currentStep === 'info' || currentStep === 'personalization' || currentStep === 'generation' || currentStep === 'results')
              ? "text-red-900 dark:text-red-100"
              : "text-blue-900 dark:text-blue-100"
          }>
            {(currentStep === 'info' || currentStep === 'personalization' || currentStep === 'generation' || currentStep === 'results')
              ? "Attention : Écrasement des résultats précédents"
              : "Génération précédente disponible"
            }
          </AlertTitle>
          <AlertDescription className={
            (currentStep === 'info' || currentStep === 'personalization' || currentStep === 'generation' || currentStep === 'results')
              ? "text-red-800 dark:text-red-200"
              : "text-blue-800 dark:text-blue-200"
          }>
            <div className="flex items-center justify-between">
              <span>
                {(currentStep === 'info' || currentStep === 'personalization' || currentStep === 'generation' || currentStep === 'results') ? (
                  <>
                    <strong>Les {latestGenerationState.documentsGenerated.length} documents générés le {new Date(latestGenerationState.date).toLocaleDateString()} seront définitivement effacés</strong> si vous poursuivez cette nouvelle génération.
                  </>
                ) : (
                  `${latestGenerationState.documentsGenerated.length} documents générés le ${new Date(latestGenerationState.date).toLocaleDateString()} à ${new Date(latestGenerationState.date).toLocaleTimeString()}`
                )}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  MaseStateManager.setGenerationViewMode('view-results');
                  window.location.reload();
                }}
                className="ml-4"
              >
                <Eye className="h-4 w-4 mr-2" />
                Voir les résultats
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Progress indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Étape {getStepNumber()}/{getTotalSteps()}</span>
            <Badge variant="outline">
              {currentStep === 'mode' && 'Sélection du mode'}
              {currentStep === 'selection' && 'Choix des documents'}
              {currentStep === 'config' && 'Configuration'}
              {currentStep === 'info' && 'Récapitulatif'}
              {currentStep === 'personalization' && 'Personnalisation SSE'}
              {currentStep === 'generation' && 'Génération en cours'}
              {currentStep === 'results' && 'Résultats'}
            </Badge>
          </div>
          <Progress value={(getStepNumber() / getTotalSteps()) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Step 1: Mode Selection */}
      {currentStep === 'mode' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Choisissez votre mode de génération</CardTitle>
              <CardDescription>
                Sélectionnez la méthode qui correspond le mieux à votre situation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 max-w-4xl mx-auto">
                {hasAuditHistory ? (
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary"
                    onClick={() => handleModeSelection('post-audit')}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Search className="h-5 w-5" />
                        Après audit MASE CHECKER
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Générez les documents manquants identifiés lors de votre audit automatique
                      </p>
                      {latestAudit && (
                        <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800 relative group">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/50 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 rounded-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              MaseStateManager.clearHistory();
                              setHasAuditHistory(false);
                              setLatestAudit(null);
                            }}
                            title="Supprimer l'historique d'audit"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                            Dernier audit: {new Date(latestAudit.date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Score global: {latestAudit.globalScore}% • {latestAudit.documentsAnalyzed} documents analysés
                          </p>
                          {latestAudit.missingDocuments.length > 0 && (
                            <p className="text-xs text-green-600 dark:text-green-400">
                              {latestAudit.missingDocuments.length} document(s) à améliorer
                            </p>
                          )}
                          <button 
                            className="text-xs text-blue-600 dark:text-blue-400 mt-1 underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Set view mode and navigate to MASE CHECKER results
                              MaseStateManager.setViewMode('view-results');
                              router.push('/dashboard/mase-checker');
                            }}
                          >
                            💡 Cliquer pour voir les détails
                          </button>
                        </div>
                      )}
                      <Badge>Recommandé</Badge>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-2 border-dashed border-muted-foreground/25 opacity-60">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg text-muted-foreground">
                        <Search className="h-5 w-5" />
                        Après audit MASE CHECKER
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Effectuez d'abord un audit avec MASE CHECKER pour utiliser ce mode
                      </p>
                      <div className="flex gap-2">
                        <Badge variant="secondary">Non disponible</Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push('/dashboard/mase-checker')}
                        >
                          Faire un audit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary"
                  onClick={() => handleModeSelection('complete')}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Wand2 className="h-5 w-5" />
                      Génération complète
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Créez tous vos documents MASE depuis zéro selon vos besoins
                    </p>
                    <Badge variant="outline">Nouveau projet</Badge>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Document Selection */}
      {currentStep === 'selection' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Sélectionnez les documents à générer</CardTitle>
                  <CardDescription>
                    Choisissez les documents MASE selon vos besoins
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {config.mode === 'post-audit' && hasAuditHistory && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        MaseStateManager.setViewMode('view-results');
                        router.push('/dashboard/mase-checker');
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Voir audit
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={selectAllDocuments}
                  >
                    {config.selectedDocs.length === DOCUMENT_TEMPLATES.length 
                      ? 'Tout désélectionner' 
                      : 'Tout sélectionner'
                    }
                  </Button>
                  <Badge variant="outline">
                    {config.selectedDocs.length}/{DOCUMENT_TEMPLATES.length} document(s) sélectionné(s)
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {config.mode === 'post-audit' && latestAudit && (
                <Alert className="mb-4">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Documents présélectionnés</AlertTitle>
                  <AlertDescription>
                    Basé sur votre audit du {new Date(latestAudit.date).toLocaleDateString()}, 
                    nous avons présélectionné {
                      latestAudit.analysisResults?.filter((result: any) => result.score < 80).length || 0
                    } document(s) {'< 80%'} de conformité sur les {latestAudit.documentsAnalyzed} documents audités. 
                    Ajustez cette sélection selon vos besoins.
                  </AlertDescription>
                </Alert>
              )}
              
              <Tabs defaultValue="by-axis">
                <TabsList>
                  <TabsTrigger value="by-axis">Par axe MASE</TabsTrigger>
                  <TabsTrigger value="all-docs">Tous les documents</TabsTrigger>
                </TabsList>

                <TabsContent value="by-axis" className="space-y-6">
                  {MASE_AXES.map((axis, axisIndex) => {
                    const axisDocs = DOCUMENT_TEMPLATES.filter(doc => doc.axis === axis);
                    const selectedAxisDocs = axisDocs.filter(doc => config.selectedDocs.includes(doc.id));
                    
                    // Enrichir les documents avec les scores d'audit s'ils existent
                    const enrichedAxisDocs = axisDocs.map(doc => {
                      if (config.mode === 'post-audit' && latestAudit) {
                        // Trouver le score correspondant dans les résultats d'audit
                        const normalizedDocName = doc.name.toLowerCase().trim();
                        const auditResult = latestAudit.analysisResults?.find((result: any) => {
                          const normalizedResultName = result.documentName.toLowerCase().trim();
                          return normalizedDocName === normalizedResultName ||
                                 normalizedDocName.includes(normalizedResultName) ||
                                 normalizedResultName.includes(normalizedDocName) ||
                                 // Vérifier les mots clés importants
                                 (normalizedResultName.includes('politique') && normalizedDocName.includes('politique')) ||
                                 (normalizedResultName.includes('organigramme') && normalizedDocName.includes('organigramme')) ||
                                 (normalizedResultName.includes('formation') && normalizedDocName.includes('formation')) ||
                                 (normalizedResultName.includes('habilitation') && normalizedDocName.includes('habilitation')) ||
                                 (normalizedResultName.includes('check') && normalizedDocName.includes('check')) ||
                                 (normalizedResultName.includes('consigne') && normalizedDocName.includes('consigne')) ||
                                 (normalizedResultName.includes('fiche') && normalizedDocName.includes('fiche')) ||
                                 (normalizedResultName.includes('rex') && normalizedDocName.includes('rex')) ||
                                 (normalizedResultName.includes('tableau') && normalizedDocName.includes('tableau')) ||
                                 (normalizedResultName.includes('indicateur') && normalizedDocName.includes('tableau'));
                        });
                        return { ...doc, auditScore: auditResult?.score };
                      }
                      return doc;
                    });
                    
                    return (
                      <Card key={axisIndex}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">Axe {axisIndex + 1}: {axis}</CardTitle>
                              <CardDescription>
                                {selectedAxisDocs.length}/{axisDocs.length} documents sélectionnés
                              </CardDescription>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => selectAllByAxis(axis)}
                            >
                              {selectedAxisDocs.length === axisDocs.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
                            {enrichedAxisDocs.map((doc) => {
                              const needsImprovement = doc.auditScore !== undefined && doc.auditScore < 80;
                              return (
                                <div 
                                  key={doc.id}
                                  className={`relative flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer ${
                                    needsImprovement ? 'border-amber-500 bg-amber-50 dark:bg-amber-950' : ''
                                  }`}
                                  onClick={() => toggleDocumentSelection(doc.id)}
                                >
                                  <Checkbox 
                                    checked={config.selectedDocs.includes(doc.id)}
                                    onChange={() => toggleDocumentSelection(doc.id)}
                                  />
                                  <div className="flex-1 pr-20">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-sm">{doc.name}</p>
                                      {doc.required && <Badge variant="destructive" className="text-xs">Obligatoire</Badge>}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{doc.description}</p>
                                    {needsImprovement && (
                                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                        <Shield className="h-3 w-3 inline mr-1" />
                                        Amélioration recommandée (score faible)
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                      <Clock className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">{doc.estimatedTime}</span>
                                    </div>
                                  </div>
                                  {/* Labels en haut à droite */}
                                  <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                                    {doc.auditScore !== undefined && (
                                      <Badge 
                                        variant={doc.auditScore >= 80 ? "default" : doc.auditScore >= 60 ? "secondary" : "destructive"}
                                        className={`text-xs ${
                                          doc.auditScore >= 80 
                                            ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700' 
                                            : doc.auditScore >= 60 
                                            ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700'
                                            : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700'
                                        }`}
                                        title="Score d'audit"
                                      >
                                        {doc.auditScore}%
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </TabsContent>

                <TabsContent value="all-docs">
                  <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {DOCUMENT_TEMPLATES.map((doc) => {
                      // Enrichir le document avec le score d'audit s'il existe
                      let enrichedDoc = doc;
                      if (config.mode === 'post-audit' && latestAudit) {
                        const normalizedDocName = doc.name.toLowerCase().trim();
                        const auditResult = latestAudit.analysisResults?.find((result: any) => {
                          const normalizedResultName = result.documentName.toLowerCase().trim();
                          return normalizedDocName === normalizedResultName ||
                                 normalizedDocName.includes(normalizedResultName) ||
                                 normalizedResultName.includes(normalizedDocName) ||
                                 // Vérifier les mots clés importants
                                 (normalizedResultName.includes('politique') && normalizedDocName.includes('politique')) ||
                                 (normalizedResultName.includes('organigramme') && normalizedDocName.includes('organigramme')) ||
                                 (normalizedResultName.includes('formation') && normalizedDocName.includes('formation')) ||
                                 (normalizedResultName.includes('habilitation') && normalizedDocName.includes('habilitation')) ||
                                 (normalizedResultName.includes('check') && normalizedDocName.includes('check')) ||
                                 (normalizedResultName.includes('consigne') && normalizedDocName.includes('consigne')) ||
                                 (normalizedResultName.includes('fiche') && normalizedDocName.includes('fiche')) ||
                                 (normalizedResultName.includes('rex') && normalizedDocName.includes('rex')) ||
                                 (normalizedResultName.includes('tableau') && normalizedDocName.includes('tableau')) ||
                                 (normalizedResultName.includes('indicateur') && normalizedDocName.includes('tableau'));
                        });
                        enrichedDoc = { ...doc, auditScore: auditResult?.score };
                      }
                      
                      const needsImprovement = enrichedDoc.auditScore !== undefined && enrichedDoc.auditScore < 80;
                      
                      return (
                        <div 
                          key={doc.id}
                          className={`relative flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer ${
                            needsImprovement ? 'border-amber-500 bg-amber-50 dark:bg-amber-950' : ''
                          }`}
                          onClick={() => toggleDocumentSelection(doc.id)}
                        >
                          <Checkbox 
                            checked={config.selectedDocs.includes(doc.id)}
                            onChange={() => toggleDocumentSelection(doc.id)}
                          />
                          <div className="flex-1 pr-20">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{enrichedDoc.name}</p>
                              {enrichedDoc.required && <Badge variant="destructive" className="text-xs">Obligatoire</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">{enrichedDoc.description}</p>
                            {needsImprovement && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">
                                <Shield className="h-3 w-3 inline mr-1" />
                                Amélioration recommandée (score faible)
                              </p>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{enrichedDoc.estimatedTime}</span>
                            </div>
                          </div>
                          {/* Labels en haut à droite */}
                          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                            {enrichedDoc.auditScore !== undefined && (
                              <Badge 
                                variant={enrichedDoc.auditScore >= 80 ? "default" : enrichedDoc.auditScore >= 60 ? "secondary" : "destructive"}
                                className={`text-xs ${
                                  enrichedDoc.auditScore >= 80 
                                    ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700' 
                                    : enrichedDoc.auditScore >= 60 
                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700'
                                    : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700'
                                }`}
                                title="Score d'audit"
                              >
                                {enrichedDoc.auditScore}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep('mode')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <Button 
              onClick={() => setCurrentStep('config')}
              disabled={config.selectedDocs.length === 0}
            >
              Continuer
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Configuration */}
      {currentStep === 'config' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Style et apparence
                </CardTitle>
                <CardDescription>
                  Personnalisez l'apparence de vos documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="template">Modèle de document</Label>
                  <select 
                    id="template"
                    className="w-full mt-1 p-2 border rounded-md"
                    value={config.styling.template}
                    onChange={(e) => handleConfigChange('styling.template', e.target.value)}
                  >
                    <option value="moderne">Moderne</option>
                    <option value="classique">Classique</option>
                    <option value="minimaliste">Minimaliste</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="color">Couleur principale</Label>
                  <div className="flex gap-2 mt-1">
                    <input
                      id="color"
                      type="color"
                      value={config.styling.primaryColor}
                      onChange={(e) => handleConfigChange('styling.primaryColor', e.target.value)}
                      className="w-12 h-10 border rounded"
                    />
                    <Input
                      value={config.styling.primaryColor}
                      onChange={(e) => handleConfigChange('styling.primaryColor', e.target.value)}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="logo">Logo de l'entreprise (optionnel)</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    className="mt-1"
                    onChange={(e) => handleConfigChange('styling.logo', e.target.files?.[0] || null)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Informations de votre entreprise
                </CardTitle>
                <CardDescription>
                  Données récupérées depuis vos paramètres de profil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Nom de l'entreprise</Label>
                    <p className="text-sm text-muted-foreground">{companyProfile.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Secteur d'activité</Label>
                    <p className="text-sm text-muted-foreground">{companyProfile.sector}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Taille</Label>
                    <p className="text-sm text-muted-foreground">{companyProfile.size} salariés</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Activités principales</Label>
                    <p className="text-sm text-muted-foreground">{companyProfile.activities}</p>
                  </div>
                </div>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Pour modifier ces informations, rendez-vous dans{' '}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto font-normal"
                      onClick={() => router.push('/dashboard/settings')}
                    >
                      Paramètres → Profile
                    </Button>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep('selection')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <Button onClick={() => setCurrentStep('info')}>
              Continuer
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Récapitulatif et choix du type de génération */}
      {currentStep === 'info' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Récapitulatif de votre génération
              </CardTitle>
              <CardDescription>
                Vérifiez les paramètres et choisissez le type de génération
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Mode de génération</h4>
                    <Badge>
                      {config.mode === 'post-audit' && 'Après audit MASE CHECKER'}
                      {config.mode === 'complete' && 'Génération complète'}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Documents sélectionnés</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {config.selectedDocs.map(docId => {
                        const doc = DOCUMENT_TEMPLATES.find(d => d.id === docId);
                        return (
                          <div key={docId} className="text-sm">• {doc?.name}</div>
                        );
                      })}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Total: {config.selectedDocs.length} documents
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Entreprise</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Nom:</strong> {companyProfile.name}</p>
                      <p><strong>Secteur:</strong> {companyProfile.sector}</p>
                      <p><strong>Taille:</strong> {companyProfile.size} salariés</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Style</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Modèle:</strong> {config.styling.template}</p>
                      <div className="flex items-center gap-2">
                        <strong>Couleur:</strong>
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: config.styling.primaryColor }}
                        />
                        <span>{config.styling.primaryColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Choix du type de génération */}
          <Card>
            <CardHeader>
              <CardTitle>Type de génération</CardTitle>
              <CardDescription>
                Choisissez le niveau de personnalisation pour vos documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card 
                  className={`cursor-pointer transition-all border-2 ${
                    config.generationType === 'standard' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setConfig({ ...config, generationType: 'standard' })}
                >
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wand2 className="h-5 w-5" />
                      Génération standard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Documents conformes aux exigences MASE avec vos informations d'entreprise
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Conformité référentiel MASE</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Personnalisation automatique</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Génération rapide</span>
                      </div>
                    </div>
                    <Alert className="mt-4">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Temps estimé: ~{Math.ceil(config.selectedDocs.length * 1)} minute(s)
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-all border-2 ${
                    config.generationType === 'personalized' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setConfig({ ...config, generationType: 'personalized' })}
                >
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Génération personnalisée
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Documents ultra-personnalisés avec vos instructions SSE spécifiques
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Conformité référentiel MASE</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Instructions SSE sur mesure</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Contenu adapté à vos spécificités</span>
                      </div>
                    </div>
                    <Alert className="mt-4">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Temps estimé: ~{Math.ceil(config.selectedDocs.length * 2)} minute(s)
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep('config')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            
            {config.generationType === 'standard' ? (
              <Button onClick={startGeneration}>
                <Wand2 className="h-4 w-4 mr-2" />
                Lancer la génération standard
              </Button>
            ) : (
              <Button onClick={() => setCurrentStep('personalization')}>
                Personnaliser les documents
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step 5: Personnalisation SSE */}
      {currentStep === 'personalization' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Instructions SSE personnalisées
              </CardTitle>
              <CardDescription>
                Donnez des instructions spécifiques pour personnaliser chaque document selon vos besoins SSE
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Ces instructions permettront à l'IA de personnaliser le contenu de chaque document en respectant vos spécificités métier et vos contraintes SSE.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-6">
                {config.selectedDocs.map((docId) => {
                  const doc = DOCUMENT_TEMPLATES.find(d => d.id === docId);
                  return (
                    <Card key={docId} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{doc?.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {doc?.description} • Axe MASE: {doc?.axis}
                            </CardDescription>
                          </div>
                          <Badge variant="outline">{doc?.estimatedTime}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Label htmlFor={`instructions-${docId}`}>
                            Instructions spécifiques pour ce document
                          </Label>
                          <Textarea
                            id={`instructions-${docId}`}
                            placeholder={`Exemple: "Inclure nos procédures spécifiques au travail en hauteur, mentionner notre certification ISO 45001, adapter au contexte ${companyProfile.sector.toLowerCase()}..."`}
                            value={(config.personalizedInstructions && config.personalizedInstructions[docId]) || ''}
                            onChange={(e) => setConfig({
                              ...config,
                              personalizedInstructions: {
                                ...(config.personalizedInstructions || {}),
                                [docId]: e.target.value
                              }
                            })}
                            rows={4}
                            className="resize-none"
                          />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {(config.personalizedInstructions && config.personalizedInstructions[docId]?.length) || 0} caractères
                            </span>
                            {!(config.personalizedInstructions && config.personalizedInstructions[docId]) && (
                              <span className="text-amber-600">Optionnel - document généré avec contenu standard si vide</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep('info')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <Button onClick={startGeneration}>
              <Wand2 className="h-4 w-4 mr-2" />
              Lancer la génération personnalisée
            </Button>
          </div>
        </div>
      )}

      {/* Step 6: Generation */}
      {currentStep === 'generation' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin" />
                Génération en cours
              </CardTitle>
              <CardDescription>
                Vos documents MASE sont en cours de création...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progression globale</span>
                    <span>{Math.round(generationProgress)}%</span>
                  </div>
                  <Progress value={generationProgress} className="h-3" />
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Documents générés:</h4>
                  <div className="space-y-1">
                    {generatedDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>{doc.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Génération automatique</AlertTitle>
                  <AlertDescription>
                    Vos documents sont générés selon le référentiel MASE 2024 et personnalisés avec les informations de votre entreprise.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 6: Results */}
      {currentStep === 'results' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Documents générés avec succès
                  </CardTitle>
                  <CardDescription>
                    {generatedDocuments.length} documents MASE ont été créés pour {companyProfile.name}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={exportAllDocuments}>
                    <Download className="h-4 w-4 mr-2" />
                    Tout exporter
                  </Button>
                  <Button 
                    variant="default"
                    onClick={resetGenerator}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Nouvelle génération
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {generatedDocuments.map((doc) => {
                  const template = DOCUMENT_TEMPLATES.find(t => t.id === doc.templateId);
                  return (
                    <Card key={doc.id} className="relative">
                      <CardHeader className="pb-4 pr-4">
                        <div className="pr-24">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            <span className="truncate">{doc.name}</span>
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {template?.description}
                          </CardDescription>
                        </div>
                        <Badge 
                          className="absolute top-4 right-4 text-xs px-2 py-1 max-w-[80px]" 
                          variant="secondary"
                          title={template?.axis}
                        >
                          <span className="truncate">Axe {MASE_AXES.indexOf(template?.axis || '') + 1}</span>
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setSelectedDocument(doc);
                              setShowPreview(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Aperçu
                          </Button>
                          <Button 
                            size="sm"
                            className="flex-1"
                            onClick={() => downloadDocument(doc)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Télécharger
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Document Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aperçu - {selectedDocument?.name}</DialogTitle>
            <DialogDescription>
              Document généré selon le référentiel MASE
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Aperçu simplifié</AlertTitle>
              <AlertDescription>
                Ceci est un aperçu du contenu. Le document final sera formaté selon le modèle sélectionné.
              </AlertDescription>
            </Alert>
            {selectedDocument && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                <h3 className="font-bold text-lg mb-4">{selectedDocument.name}</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Entreprise: {companyProfile.name}</h4>
                    <p className="text-sm text-muted-foreground">Secteur: {companyProfile.sector} • {companyProfile.size} salariés</p>
                  </div>
                  
                  {(config.personalizedInstructions && config.personalizedInstructions[selectedDocument.templateId]) && (
                    <div>
                      <h4 className="font-semibold">Instructions personnalisées appliquées:</h4>
                      <p className="text-sm text-muted-foreground italic border-l-2 border-primary pl-3">
                        "{config.personalizedInstructions[selectedDocument.templateId]}"
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-semibold">Contenu du document:</h4>
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedDocument.content}
                      
                      {"\n\nCe document a été généré automatiquement selon les exigences du référentiel MASE 2024."}
                      {config.generationType === 'personalized' 
                        ? "\nGénération personnalisée avec instructions spécifiques."
                        : "\nGénération standard avec personnalisation automatique."
                      }
                      {"\n\nIl inclut toutes les sections requises:"}
                      {"\n• Objectifs et politique"}
                      {"\n• Responsabilités"}
                      {"\n• Procédures"}
                      {"\n• Indicateurs de performance"}
                      {"\n• Modalités de révision"}
                    </p>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Modèle: {config.styling.template}</span>
                      <span>Généré le {new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}