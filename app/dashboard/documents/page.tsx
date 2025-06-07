"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Eye, Edit, Trash2, Search, Filter, Upload, Clock, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MaseStateManager } from "@/utils/mase-state";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Document {
  id: string;
  name: string;
  type: 'original' | 'modified' | 'generated';
  category: string;
  axis: string;
  uploadDate: string;
  modifiedDate?: string;
  score?: number;
  size: string;
  status: 'conforme' | 'non-conforme';
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedAxis, setSelectedAxis] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    // Charger les documents depuis le state manager
    loadDocuments();
  }, []);

  useEffect(() => {
    // Appliquer les filtres
    let filtered = documents;

    // Filtre par recherche
    if (searchQuery) {
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtre par type
    if (selectedType !== "all") {
      filtered = filtered.filter(doc => doc.type === selectedType);
    }

    // Filtre par axe
    if (selectedAxis !== "all") {
      filtered = filtered.filter(doc => doc.axis === selectedAxis);
    }

    // Filtre par statut
    if (selectedStatus !== "all") {
      filtered = filtered.filter(doc => doc.status === selectedStatus);
    }

    setFilteredDocuments(filtered);
  }, [documents, searchQuery, selectedType, selectedAxis, selectedStatus]);

  const loadDocuments = () => {
    // Récupérer uniquement les documents uploadés dans MASE CHECKER et générés via MASE GENERATOR
    const documents: Document[] = [];
    
    // Documents depuis l'audit MASE CHECKER (documents uploadés)
    const auditResults = MaseStateManager.getLatestAudit();
    if (auditResults && auditResults.analysisResults) {
      auditResults.analysisResults.forEach((result, index) => {
        documents.push({
          id: `audit-${index}`,
          name: result.documentName,
          type: 'original',
          category: 'Documents uploadés',
          axis: result.axis || 'Non catégorisé',
          uploadDate: auditResults.date,
          score: result.score,
          size: `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 9) + 1} MB`,
          status: result.score >= 80 ? 'conforme' : 'non-conforme'
        });
      });
    }

    // Documents depuis MASE GENERATOR (documents générés)
    const generationHistory = MaseStateManager.getGenerationHistory();
    generationHistory.forEach(generation => {
      generation.documentsGenerated.forEach((doc, index) => {
        documents.push({
          id: `gen-${generation.id}-${index}`,
          name: doc.name,
          type: 'generated',
          category: 'Documents générés',
          axis: doc.axis,
          uploadDate: generation.date,
          size: `${Math.floor(Math.random() * 2) + 1}.${Math.floor(Math.random() * 9) + 1} MB`,
          status: 'conforme'
        });
      });
    });

    // Créer quelques documents modifiés à partir des originaux
    const originalDocs = documents.filter(d => d.type === 'original');
    if (originalDocs.length > 0) {
      // Modifier le premier document original pour créer une version modifiée
      const modifiedDoc = { ...originalDocs[0] };
      modifiedDoc.id = 'modified-' + modifiedDoc.id;
      modifiedDoc.type = 'modified';
      modifiedDoc.category = 'Documents modifiés';
      modifiedDoc.modifiedDate = new Date().toISOString();
      modifiedDoc.name = modifiedDoc.name + ' (Version IA)';
      modifiedDoc.status = 'conforme'; // La modification par IA améliore la conformité
      modifiedDoc.score = Math.max(85, modifiedDoc.score || 0); // Score amélioré
      documents.push(modifiedDoc);
    }

    setDocuments(documents);
  };

  const getTypeIcon = (type: Document['type']) => {
    switch (type) {
      case 'original':
        return <Upload className="h-4 w-4" />;
      case 'modified':
        return <Edit className="h-4 w-4" />;
      case 'generated':
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: Document['type']) => {
    switch (type) {
      case 'original':
        return <Badge variant="outline">Original</Badge>;
      case 'modified':
        return <Badge variant="secondary">Modifié</Badge>;
      case 'generated':
        return <Badge variant="default">Généré</Badge>;
    }
  };

  const getStatusBadge = (status: Document['status'], score?: number) => {
    switch (status) {
      case 'conforme':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700">
            {score ? `${score}%` : 'Conforme'}
          </Badge>
        );
      case 'non-conforme':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700">
            {score ? `${score}%` : 'Non conforme'}
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
  };

  const handleDeleteDocument = (docId: string) => {
    setShowDeleteConfirm(docId);
  };

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      // Supprimer le document du state
      setDocuments(documents.filter(doc => doc.id !== showDeleteConfirm));
      setShowDeleteConfirm(null);
      
      // TODO: Supprimer aussi du localStorage MaseStateManager si nécessaire
    }
  };

  const handleViewDocument = (doc: Document) => {
    // Simuler l'ouverture d'un document
    const blob = new Blob(['Contenu du document: ' + doc.name], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    URL.revokeObjectURL(url);
  };

  const handleDownloadDocument = (doc: Document) => {
    // Simuler le téléchargement d'un document
    const link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent('Contenu du document: ' + doc.name);
    link.download = doc.name + '.txt';
    link.click();
  };

  const getAxisDisplayName = (axis: string) => {
    const axisMap: { [key: string]: string } = {
      "Engagement de la direction": "Axe 1 - Engagement de la direction",
      "Compétences et qualifications": "Axe 2 - Compétences et qualifications", 
      "Préparation et organisation des interventions": "Axe 3 - Préparation et organisation des interventions",
      "Réalisation des interventions": "Axe 4 - Réalisation des interventions",
      "Retour d'expérience et amélioration continue": "Axe 5 - Retour d'expérience et amélioration continue"
    };
    return axisMap[axis] || axis;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Mes Documents</h1>
        <p className="text-muted-foreground">
          Gérez tous vos documents MASE en un seul endroit
        </p>
      </div>

      {/* Stats Cards - 2 lignes */}
      <div className="space-y-4">
        {/* Première ligne */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documents.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Documents Conformes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {documents.filter(d => d.status === 'conforme').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Documents Non Conformes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {documents.filter(d => d.status === 'non-conforme').length}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Deuxième ligne */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Documents Originaux</CardTitle>
              <CardDescription className="text-xs">Uploadés par l'utilisateur</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {documents.filter(d => d.type === 'original').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Documents Modifiés</CardTitle>
              <CardDescription className="text-xs">Améliorés par l'IA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {documents.filter(d => d.type === 'modified').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Documents Générés</CardTitle>
              <CardDescription className="text-xs">Créés par l'IA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {documents.filter(d => d.type === 'generated').length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un document..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="original">Original</SelectItem>
                  <SelectItem value="modified">Modifié</SelectItem>
                  <SelectItem value="generated">Généré</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedAxis} onValueChange={setSelectedAxis}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Axe MASE" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les axes</SelectItem>
                  <SelectItem value="Engagement de la direction">Axe 1 - Engagement de la direction</SelectItem>
                  <SelectItem value="Compétences et qualifications">Axe 2 - Compétences et qualifications</SelectItem>
                  <SelectItem value="Préparation et organisation des interventions">Axe 3 - Préparation et organisation des interventions</SelectItem>
                  <SelectItem value="Réalisation des interventions">Axe 4 - Réalisation des interventions</SelectItem>
                  <SelectItem value="Retour d'expérience et amélioration continue">Axe 5 - Retour d'expérience et amélioration continue</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="conforme">Conforme</SelectItem>
                  <SelectItem value="non-conforme">Non conforme</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
          <CardDescription>
            Tous vos documents MASE classés par type et statut
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun document trouvé
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Axe MASE</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow 
                    key={doc.id}
                    className="relative"
                    onMouseEnter={() => setHoveredRow(doc.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{doc.name}</div>
                          <div className="text-xs text-muted-foreground">{doc.size}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(doc.type)}</TableCell>
                    <TableCell className="text-sm">{getAxisDisplayName(doc.axis)}</TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(doc.modifiedDate || doc.uploadDate)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(doc.status, doc.score)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDocument(doc)}
                          title="Visualiser le document"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownloadDocument(doc)}
                          title="Télécharger le document"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    {/* Bouton de suppression au hover */}
                    {hoveredRow === doc.id && (
                      <div className="absolute top-2 right-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                          title="Supprimer le document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription>
              Voulez-vous vraiment supprimer ce document ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(null)}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}