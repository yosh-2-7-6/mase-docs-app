"use client";

import { useState } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2, X, Eye, Download, Wand2, RefreshCw, ArrowLeft, ArrowRight, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { MaseStateManager } from "@/utils/mase-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Types
interface Document {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadDate: Date;
}

interface AnalysisResult {
  documentId: string;
  documentName: string;
  axis: string;
  score: number;
  gaps: string[];
  recommendations: string[];
}

interface AxisScore {
  name: string;
  score: number;
  documentsCount: number;
}

// Mock data pour les 5 axes MASE
const MASE_AXES = [
  "Engagement de la direction",
  "Compétences et qualifications",
  "Préparation et organisation des interventions",
  "Réalisation des interventions",
  "Retour d'expérience et amélioration continue"
];

export default function MaseCheckerPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<'upload' | 'analysis' | 'results'>('upload');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedAxis, setSelectedAxis] = useState<string | null>(null);
  const [showAxisPlan, setShowAxisPlan] = useState(false);

  // Mock analysis results
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [axisScores, setAxisScores] = useState<AxisScore[]>([]);
  const [globalScore, setGlobalScore] = useState(0);

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  // Process files
  const handleFiles = (files: FileList) => {
    const newDocuments: Document[] = Array.from(files).map((file, index) => ({
      id: `doc-${Date.now()}-${index}`,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type || "application/pdf",
      uploadDate: new Date()
    }));
    setDocuments([...documents, ...newDocuments]);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Remove document
  const removeDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  // Analyze documents
  const analyzeDocuments = async () => {
    setCurrentStep('analysis');
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate analysis progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setAnalysisProgress(i);
    }

    // Generate mock results with realistic MASE document names
    const mockDocumentNames = [
      'Politique SSE',
      'Organigramme SSE', 
      'Plan de formation',
      'Matrice des habilitations',
      'Procédure de préparation',
      'Check-lists interventions',
      'Consignes de sécurité',
      'Fiches de poste',
      'Procédure REX',
      'Tableau de bord SSE'
    ];

    const mockResults: AnalysisResult[] = documents.map((doc, index) => {
      // Use a recognizable MASE document name for the mock
      const mockName = mockDocumentNames[index % mockDocumentNames.length];
      // Generate a score, with 50% chance of being below 75%
      const score = Math.random() < 0.5 
        ? Math.floor(Math.random() * 15) + 60  // 60-74% (needs improvement)
        : Math.floor(Math.random() * 20) + 80; // 80-99% (good)
      
      return {
        documentId: doc.id,
        documentName: mockName, // Use the mock name instead of actual file name
        axis: MASE_AXES[index % 5],
        score: score,
        gaps: [
          "Absence de mention des équipements de protection individuelle",
          "Procédures d'urgence non détaillées",
          "Indicateurs de performance non définis"
        ].slice(0, Math.floor(Math.random() * 3) + 1),
        recommendations: [
          "Ajouter une section sur les EPI obligatoires",
          "Détailler les procédures d'évacuation",
          "Définir des KPI mesurables"
        ].slice(0, Math.floor(Math.random() * 3) + 1)
      };
    });

    // Calculate axis scores
    const axisData: AxisScore[] = MASE_AXES.map(axis => {
      const axisResults = mockResults.filter(r => r.axis === axis);
      const avgScore = axisResults.length > 0 
        ? Math.round(axisResults.reduce((sum, r) => sum + r.score, 0) / axisResults.length)
        : 0;
      return {
        name: axis,
        score: avgScore,
        documentsCount: axisResults.length
      };
    });

    // Calculate global score
    const totalScore = Math.round(
      mockResults.reduce((sum, r) => sum + r.score, 0) / mockResults.length
    );

    setAnalysisResults(mockResults);
    setAxisScores(axisData);
    setGlobalScore(totalScore);
    setIsAnalyzing(false);
    setAnalysisComplete(true);

    // Sauvegarder les résultats pour MASE GENERATOR
    const auditResults = {
      id: MaseStateManager.generateAuditId(),
      date: new Date().toISOString(),
      documentsAnalyzed: documents.length,
      globalScore: totalScore,
      axisScores: axisData,
      missingDocuments: mockResults.filter(r => r.score < 70).map(r => r.documentName),
      completed: true,
      analysisResults: mockResults // Ajouter les résultats détaillés pour MASE GENERATOR
    };
    
    MaseStateManager.saveAuditResults(auditResults);
    setCurrentStep('results');
  };

  // Export complete analysis
  const exportCompleteAnalysis = () => {
    const content = `RAPPORT D'AUDIT MASE CHECKER
Date: ${new Date().toLocaleDateString()}

=== RÉSUMÉ GLOBAL ===
Score de conformité global: ${globalScore}%
Nombre de documents analysés: ${documents.length}
Statut: ${globalScore >= 80 ? "Conforme" : globalScore >= 60 ? "À améliorer" : "Non conforme"}

=== SCORES PAR AXE MASE ===
${axisScores.map((axis, index) => 
  `Axe ${index + 1}: ${axis.name}
  Score: ${axis.score}%
  Documents analysés: ${axis.documentsCount}
  Statut: ${axis.score >= 80 ? "Conforme" : axis.score >= 60 ? "Partiel" : "Non conforme"}
`).join('\n')}

=== ANALYSE DÉTAILLÉE PAR DOCUMENT ===
${analysisResults.map(result => 
  `Document: ${result.documentName}
  Axe MASE: ${result.axis}
  Score: ${result.score}%
  
  Écarts identifiés:
  ${result.gaps.map(gap => `  • ${gap}`).join('\n')}
  
  Recommandations:
  ${result.recommendations.map(rec => `  • ${rec}`).join('\n')}
  
  ---
`).join('\n')}

=== PLAN D'ACTION PRIORISÉ ===
${analysisResults
  .filter(r => r.score < 80)
  .sort((a, b) => a.score - b.score)
  .map((result, index) => 
    `Priorité ${index + 1}: ${result.documentName} (${result.score}%)
    Actions requises:
    ${result.recommendations.map(rec => `    • ${rec}`).join('\n')}
    `
  ).join('\n')}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-audit-mase-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export single document analysis
  const exportDocumentAnalysis = (result: AnalysisResult) => {
    const content = `ANALYSE DÉTAILLÉE - ${result.documentName}
Date: ${new Date().toLocaleDateString()}

=== INFORMATIONS GÉNÉRALES ===
Document: ${result.documentName}
Axe MASE: ${result.axis}
Score de conformité: ${result.score}%
Statut: ${result.score >= 80 ? "Conforme" : result.score >= 60 ? "Partiel" : "Non conforme"}

=== ÉCARTS IDENTIFIÉS ===
${result.gaps.map((gap, index) => `${index + 1}. ${gap}`).join('\n')}

=== RECOMMANDATIONS ===
${result.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

=== ACTIONS CORRECTIVES SUGGÉRÉES ===
Pour atteindre la conformité MASE, ce document nécessite:
${result.score < 60 ? "• Révision complète du contenu" : "• Améliorations ciblées"}
• Mise en conformité avec le référentiel MASE 2024
• Validation par un responsable SSE
• Test de mise en application`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analyse-${result.documentName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  // Get score badge variant
  const getScoreBadgeVariant = (score: number): "destructive" | "secondary" | "default" => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  // Handle axis click to show action plan
  const handleAxisClick = (axisName: string) => {
    setSelectedAxis(axisName);
    setShowAxisPlan(true);
  };

  // Get axis action plan
  const getAxisActionPlan = (axisName: string) => {
    const axisResults = analysisResults.filter(r => r.axis === axisName);
    const lowScoreResults = axisResults.filter(r => r.score < 80);
    
    return {
      documents: axisResults,
      actions: lowScoreResults,
      avgScore: axisResults.length > 0 
        ? Math.round(axisResults.reduce((sum, r) => sum + r.score, 0) / axisResults.length)
        : 0
    };
  };

  // Get step number for progress
  const getStepNumber = () => {
    const steps = ['upload', 'analysis', 'results'];
    return steps.indexOf(currentStep) + 1;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">MASE Checker</h1>
        <p className="text-muted-foreground">
          Analysez automatiquement vos documents SSE et identifiez les écarts par rapport au référentiel MASE
        </p>
      </div>

      {/* Progress indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Étape {getStepNumber()}/3</span>
            <Badge variant="outline">
              {currentStep === 'upload' && 'Upload des documents'}
              {currentStep === 'analysis' && 'Analyse en cours'}
              {currentStep === 'results' && 'Résultats d\'audit'}
            </Badge>
          </div>
          <Progress value={(getStepNumber() / 3) * 100} className="h-2" />
        </CardContent>
      </Card>

      {currentStep === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload de vos documents SSE</CardTitle>
            <CardDescription>
              Déposez vos documents ou cliquez pour les sélectionner. Formats acceptés : PDF, Word, Excel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-8
                ${dragActive ? 'border-primary bg-primary/10' : 'border-border'}
                transition-colors duration-200
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="h-10 w-10 mb-4 text-muted-foreground" />
                <p className="text-sm text-center">
                  <span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez vos fichiers ici
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  PDF, Word, Excel (max. 10MB par fichier)
                </p>
              </label>
            </div>

            {documents.length > 0 && (
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold">Documents uploadés ({documents.length})</h3>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.size}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(doc.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {isAnalyzing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Analyse en cours...</span>
                        <span>{analysisProgress}%</span>
                      </div>
                      <Progress value={analysisProgress} className="h-2" />
                    </div>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Analyse en cours</AlertTitle>
                      <AlertDescription>
                        Vos documents sont en cours d'analyse par rapport au référentiel MASE 2024.
                        Cela peut prendre quelques instants.
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <Button
                    onClick={analyzeDocuments}
                    disabled={documents.length === 0}
                    size="lg"
                    className="w-full"
                  >
                    Analyser mes documents
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {currentStep === 'analysis' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Analyse en cours
            </CardTitle>
            <CardDescription>
              Vos documents SSE sont en cours d'analyse par rapport au référentiel MASE 2024
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progression de l'analyse</span>
                  <span>{analysisProgress}%</span>
                </div>
                <Progress value={analysisProgress} className="h-3" />
              </div>
              
              {/* Étapes du processus d'analyse */}
              <div className="mt-6 space-y-3">
                <div className="text-sm font-medium text-muted-foreground">Processus d'analyse :</div>
                <div className="grid gap-2">
                  <div className={`flex items-center gap-3 ${analysisProgress >= 25 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                      analysisProgress >= 25 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      1
                    </div>
                    <div>
                      <p className="font-medium">Classification des documents</p>
                      <p className="text-xs text-muted-foreground">Identification du type de document par rapport au référentiel MASE</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-3 ${analysisProgress >= 50 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                      analysisProgress >= 50 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      2
                    </div>
                    <div>
                      <p className="font-medium">Analyse des écarts</p>
                      <p className="text-xs text-muted-foreground">Comparaison avec les exigences SSE et réglementaires</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-3 ${analysisProgress >= 75 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                      analysisProgress >= 75 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      3
                    </div>
                    <div>
                      <p className="font-medium">Scoring de conformité</p>
                      <p className="text-xs text-muted-foreground">Calcul des scores par document et par axe MASE</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-3 ${analysisProgress >= 90 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                      analysisProgress >= 90 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      4
                    </div>
                    <div>
                      <p className="font-medium">Plan d'actions</p>
                      <p className="text-xs text-muted-foreground">Génération des recommandations et actions prioritaires</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Analyse automatique en cours</AlertTitle>
                <AlertDescription>
                  Nos algorithmes d'IA analysent vos documents selon les 5 axes MASE et identifient les écarts de conformité.
                  Cette analyse peut prendre quelques instants selon le nombre de documents.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'results' && (
        <div className="space-y-6">
          {/* Global Score Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Score de conformité global</CardTitle>
                  <CardDescription>
                    Évaluation globale de vos documents par rapport au référentiel MASE
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentStep('upload');
                    setAnalysisComplete(false);
                    setDocuments([]);
                    setAnalysisResults([]);
                    setAxisScores([]);
                    setGlobalScore(0);
                  }}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Nouvelle analyse
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-4">
                  <div className="flex items-baseline space-x-2">
                    <span className={`text-5xl font-bold ${getScoreColor(globalScore)}`}>
                      {globalScore}%
                    </span>
                    <span className="text-muted-foreground">de conformité</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getScoreBadgeVariant(globalScore)}>
                      {globalScore >= 80 ? "Bon niveau" : globalScore >= 60 ? "À améliorer" : "Non conforme"}
                    </Badge>
                    <Badge variant="outline">
                      {documents.length} documents analysés
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    size="sm"
                    onClick={() => {
                      // Passer en mode post-audit et aller directement à l'étape 2
                      MaseStateManager.setNavigationMode('post-audit-direct');
                      router.push('/dashboard/mase-generator');
                    }}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Générer les documents manquants
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportCompleteAnalysis}>
                    <Download className="h-4 w-4 mr-2" />
                    Rapport complet
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Tabs */}
          <Tabs defaultValue="by-axis" className="space-y-4">
            <TabsList>
              <TabsTrigger value="by-axis">Par axe MASE</TabsTrigger>
              <TabsTrigger value="by-document">Par document</TabsTrigger>
            </TabsList>

            <TabsContent value="by-axis" className="space-y-4">
              {axisScores.map((axis, index) => (
                <Card 
                  key={index}
                  className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-primary"
                  onClick={() => handleAxisClick(axis.name)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Axe {index + 1}: {axis.name}</CardTitle>
                        <CardDescription>
                          {axis.documentsCount} document(s) analysé(s) • Cliquez pour voir le plan d'action
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(axis.score)}`}>
                          {axis.score}%
                        </div>
                        <Badge variant={getScoreBadgeVariant(axis.score)}>
                          {axis.score >= 80 ? "Conforme" : axis.score >= 60 ? "Partiel" : "Non conforme"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress value={axis.score} className="h-3" />
                    <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                      <span>Cliquez pour voir les actions recommandées</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="by-document">
              <Card>
                <CardHeader>
                  <CardTitle>Analyse détaillée par document</CardTitle>
                  <CardDescription>
                    Cliquez sur un document pour voir les détails de l'analyse
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Axe MASE</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Écarts identifiés</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysisResults.map((result) => (
                        <TableRow key={result.documentId}>
                          <TableCell className="font-medium">{result.documentName}</TableCell>
                          <TableCell>{result.axis}</TableCell>
                          <TableCell>
                            <Badge variant={getScoreBadgeVariant(result.score)}>
                              {result.score}%
                            </Badge>
                          </TableCell>
                          <TableCell>{result.gaps.length} écart(s)</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedDocument(documents.find(d => d.id === result.documentId) || null);
                                  setShowPreview(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => exportDocumentAnalysis(result)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      )}

      {/* Axis Action Plan Dialog */}
      <Dialog open={showAxisPlan} onOpenChange={setShowAxisPlan}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Plan d'action - {selectedAxis}</DialogTitle>
                <DialogDescription>
                  Actions recommandées pour améliorer la conformité de cet axe MASE
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAxisPlan(false)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </div>
          </DialogHeader>
          
          {selectedAxis && (
            <div className="mt-4 space-y-6">
              {(() => {
                const axisData = getAxisActionPlan(selectedAxis);
                return (
                  <>
                    {/* Résumé de l'axe */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Résumé de l'axe
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="text-center">
                            <div className={`text-3xl font-bold ${getScoreColor(axisData.avgScore)}`}>
                              {axisData.avgScore}%
                            </div>
                            <p className="text-sm text-muted-foreground">Score moyen</p>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">
                              {axisData.documents.length}
                            </div>
                            <p className="text-sm text-muted-foreground">Documents analysés</p>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-amber-600">
                              {axisData.actions.length}
                            </div>
                            <p className="text-sm text-muted-foreground">Actions nécessaires</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Actions prioritaires */}
                    {axisData.actions.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                            Actions prioritaires
                          </CardTitle>
                          <CardDescription>
                            Documents nécessitant des améliorations (score {'< 80%'})
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {axisData.actions
                              .sort((a, b) => a.score - b.score)
                              .map((result, index) => (
                                <Alert key={result.documentId} className="border-l-4 border-l-amber-500">
                                  <AlertTitle className="flex items-center justify-between">
                                    <span>Priorité {index + 1}: {result.documentName}</span>
                                    <Badge variant={getScoreBadgeVariant(result.score)}>
                                      {result.score}%
                                    </Badge>
                                  </AlertTitle>
                                  <AlertDescription>
                                    <div className="mt-3 space-y-3">
                                      <div>
                                        <p className="font-semibold text-sm">Écarts identifiés:</p>
                                        <ul className="list-disc list-inside space-y-1 mt-1">
                                          {result.gaps.map((gap, gapIndex) => (
                                            <li key={gapIndex} className="text-sm">{gap}</li>
                                          ))}
                                        </ul>
                                      </div>
                                      <div>
                                        <p className="font-semibold text-sm">Recommandations:</p>
                                        <ul className="list-disc list-inside space-y-1 mt-1">
                                          {result.recommendations.map((rec, recIndex) => (
                                            <li key={recIndex} className="text-sm">{rec}</li>
                                          ))}
                                        </ul>
                                      </div>
                                      <div className="flex gap-2 pt-2">
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => exportDocumentAnalysis(result)}
                                        >
                                          <Download className="h-4 w-4 mr-1" />
                                          Télécharger analyse
                                        </Button>
                                      </div>
                                    </div>
                                  </AlertDescription>
                                </Alert>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Documents conformes */}
                    {axisData.documents.filter(d => d.score >= 80).length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            Documents conformes
                          </CardTitle>
                          <CardDescription>
                            Documents avec un score satisfaisant ({'≥ 80%'})
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-2 md:grid-cols-2">
                            {axisData.documents
                              .filter(d => d.score >= 80)
                              .map((result) => (
                                <div key={result.documentId} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                                  <span className="font-medium text-sm">{result.documentName}</span>
                                  <Badge variant="default">{result.score}%</Badge>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Call to action pour MASE Generator */}
                    {axisData.actions.length > 0 && (
                      <Alert>
                        <Wand2 className="h-4 w-4" />
                        <AlertTitle>Améliorer automatiquement cet axe</AlertTitle>
                        <AlertDescription>
                          <div className="flex flex-col sm:flex-row gap-3 mt-3">
                            <span className="flex-1">
                              MASE Generator peut créer ou améliorer automatiquement les documents de cet axe selon le référentiel MASE.
                            </span>
                            <Button 
                              size="sm"
                              onClick={() => {
                                // Passer en mode post-audit et aller directement à l'étape 2
                                MaseStateManager.setNavigationMode('post-audit-direct');
                                setShowAxisPlan(false);
                                router.push('/dashboard/mase-generator');
                              }}
                            >
                              <Wand2 className="h-4 w-4 mr-2" />
                              Générer les documents
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Aperçu du document</DialogTitle>
            <DialogDescription>
              {selectedDocument?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Fonctionnalité de prévisualisation</AlertTitle>
              <AlertDescription>
                La prévisualisation complète des documents sera disponible dans la version finale.
                Pour l'instant, vous pouvez voir les métadonnées du document.
              </AlertDescription>
            </Alert>
            {selectedDocument && (
              <div className="mt-4 space-y-2">
                <p><strong>Nom:</strong> {selectedDocument.name}</p>
                <p><strong>Taille:</strong> {selectedDocument.size}</p>
                <p><strong>Type:</strong> {selectedDocument.type}</p>
                <p><strong>Date d'upload:</strong> {selectedDocument.uploadDate.toLocaleString()}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}