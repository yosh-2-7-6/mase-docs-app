"use client";

import { useState } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2, X, Eye, Download } from "lucide-react";
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
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate analysis progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setAnalysisProgress(i);
    }

    // Generate mock results
    const mockResults: AnalysisResult[] = documents.map((doc, index) => ({
      documentId: doc.id,
      documentName: doc.name,
      axis: MASE_AXES[index % 5],
      score: Math.floor(Math.random() * 40) + 60, // Score between 60-100
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
    }));

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
  };

  // Export results
  const exportResults = () => {
    // Mock export functionality
    const exportData = {
      date: new Date().toISOString(),
      globalScore,
      axisScores,
      documents: analysisResults
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mase-checker-results-${new Date().toISOString().split('T')[0]}.json`;
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">MASE Checker</h1>
        <p className="text-muted-foreground">
          Analysez automatiquement vos documents SSE et identifiez les écarts par rapport au référentiel MASE
        </p>
      </div>

      {!analysisComplete ? (
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
      ) : (
        <div className="space-y-6">
          {/* Global Score Card */}
          <Card>
            <CardHeader>
              <CardTitle>Score de conformité global</CardTitle>
              <CardDescription>
                Évaluation globale de vos documents par rapport au référentiel MASE
              </CardDescription>
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
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportResults}>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAnalysisComplete(false);
                      setDocuments([]);
                      setAnalysisResults([]);
                    }}
                  >
                    Nouvelle analyse
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
              <TabsTrigger value="action-plan">Plan d'action</TabsTrigger>
            </TabsList>

            <TabsContent value="by-axis" className="space-y-4">
              {axisScores.map((axis, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Axe {index + 1}: {axis.name}</CardTitle>
                        <CardDescription>
                          {axis.documentsCount} document(s) analysé(s)
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
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="action-plan">
              <Card>
                <CardHeader>
                  <CardTitle>Plan d'action priorisé</CardTitle>
                  <CardDescription>
                    Recommandations pour atteindre la conformité MASE
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisResults
                      .filter(r => r.score < 80)
                      .sort((a, b) => a.score - b.score)
                      .map((result, index) => (
                        <Alert key={result.documentId}>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>
                            Priorité {index + 1}: {result.documentName}
                          </AlertTitle>
                          <AlertDescription>
                            <div className="mt-2 space-y-2">
                              <p className="font-semibold">Écarts identifiés:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {result.gaps.map((gap, gapIndex) => (
                                  <li key={gapIndex} className="text-sm">{gap}</li>
                                ))}
                              </ul>
                              <p className="font-semibold mt-3">Recommandations:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {result.recommendations.map((rec, recIndex) => (
                                  <li key={recIndex} className="text-sm">{rec}</li>
                                ))}
                              </ul>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

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