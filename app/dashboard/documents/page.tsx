"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  Download, 
  Search, 
  Filter,
  Calendar,
  FileUp,
  FileCheck,
  Sparkles,
  Eye,
  Trash2,
  Package,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DocumentManager, MaseDocument, MaseReport } from "@/utils/document-manager";
import { useRouter } from "next/navigation";

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<MaseDocument[]>([]);
  const [reports, setReports] = useState<MaseReport[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<'all' | 'original' | 'modified' | 'generated'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'mase-checker' | 'mase-generator'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Charger les documents
  useEffect(() => {
    loadDocuments();
  }, [typeFilter, sourceFilter, dateFilter]);

  const loadDocuments = () => {
    setLoading(true);
    const filteredDocs = DocumentManager.getFilteredDocuments({
      type: typeFilter,
      source: sourceFilter,
      dateRange: dateFilter
    });
    
    // Filtrer par recherche
    const searchFiltered = searchTerm 
      ? filteredDocs.filter(doc => 
          doc.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : filteredDocs;
    
    setDocuments(searchFiltered);
    setReports(DocumentManager.getAllReports());
    setLoading(false);
  };

  // Recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      loadDocuments();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getTypeIcon = (type: MaseDocument['type']) => {
    switch (type) {
      case 'original':
        return <FileUp className="h-4 w-4" />;
      case 'modified':
        return <FileCheck className="h-4 w-4" />;
      case 'generated':
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: MaseDocument['type']) => {
    switch (type) {
      case 'original':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700';
      case 'modified':
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700';
      case 'generated':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700';
    }
  };

  const getSourceBadge = (source: MaseDocument['source']) => {
    return source === 'mase-checker' 
      ? <Badge variant="outline" className="text-xs">CHECKER</Badge>
      : <Badge variant="outline" className="text-xs">GENERATOR</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleDownload = (doc: MaseDocument) => {
    // Simuler le téléchargement
    const content = DocumentManager.getDocumentContent(doc.id) || 
      `Contenu du document ${doc.name}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleViewRelated = (doc: MaseDocument) => {
    // Afficher les documents liés
    const related = DocumentManager.getRelatedDocuments(doc.id);
    console.log('Documents liés:', related);
  };

  const handleImprove = (doc: MaseDocument) => {
    // Rediriger vers MASE Generator en mode amélioration
    router.push('/dashboard/mase-generator?mode=improve&documentId=' + doc.id);
  };

  const handleDelete = (doc: MaseDocument) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${doc.name}" de l'historique ?`)) {
      DocumentManager.deleteDocument(doc.id);
      loadDocuments();
    }
  };

  const handleDownloadAll = () => {
    // Télécharger tous les documents visibles
    documents.forEach(docItem => handleDownload(docItem));
  };

  const getDocumentStats = () => {
    const allDocs = DocumentManager.getAllDocuments();
    return {
      total: allDocs.length,
      original: allDocs.filter(d => d.type === 'original').length,
      modified: allDocs.filter(d => d.type === 'modified').length,
      generated: allDocs.filter(d => d.type === 'generated').length,
      thisWeek: allDocs.filter(d => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(d.createdAt) > weekAgo;
      }).length
    };
  };

  const stats = getDocumentStats();

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes Documents</h1>
          <p className="text-muted-foreground mt-1">
            Gérez tous vos documents MASE en un seul endroit
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => loadDocuments()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button 
            size="sm"
            onClick={handleDownloadAll}
            disabled={documents.length === 0}
          >
            <Package className="h-4 w-4 mr-2" />
            Tout télécharger
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <CardDescription className="text-2xl font-bold">{stats.total}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <FileUp className="h-3 w-3" /> Originaux
            </CardTitle>
            <CardDescription className="text-2xl font-bold">{stats.original}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <FileCheck className="h-3 w-3" /> Modifiés
            </CardTitle>
            <CardDescription className="text-2xl font-bold">{stats.modified}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Générés
            </CardTitle>
            <CardDescription className="text-2xl font-bold">{stats.generated}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Cette semaine</CardTitle>
            <CardDescription className="text-2xl font-bold">{stats.thisWeek}</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher un document..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Type de document" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="original">Originaux</SelectItem>
                <SelectItem value="modified">Modifiés</SelectItem>
                <SelectItem value="generated">Générés</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={(value: any) => setSourceFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les sources</SelectItem>
                <SelectItem value="mase-checker">MASE Checker</SelectItem>
                <SelectItem value="mase-generator">MASE Generator</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les dates</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Documents ({documents.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || typeFilter !== 'all' || sourceFilter !== 'all' || dateFilter !== 'all'
                  ? "Aucun document ne correspond à vos critères"
                  : "Aucun document pour le moment"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Commencez par analyser des documents dans MASE Checker ou générer des documents dans MASE Generator
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {doc.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`flex items-center gap-1 w-fit ${getTypeBadgeColor(doc.type)}`}
                      >
                        {getTypeIcon(doc.type)}
                        {doc.type === 'original' && 'Original'}
                        {doc.type === 'modified' && 'Modifié'}
                        {doc.type === 'generated' && 'Généré'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getSourceBadge(doc.source)}
                    </TableCell>
                    <TableCell>
                      {doc.metadata.auditScore && (
                        <Badge 
                          variant="outline"
                          className={
                            doc.metadata.auditScore >= 80 
                              ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700'
                              : doc.metadata.auditScore >= 60
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700'
                              : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700'
                          }
                        >
                          {doc.metadata.auditScore}%
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(doc.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(doc)}>
                            <Download className="mr-2 h-4 w-4" />
                            Télécharger
                          </DropdownMenuItem>
                          {doc.metadata.parentDocumentId && (
                            <DropdownMenuItem onClick={() => handleViewRelated(doc)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir l'original
                            </DropdownMenuItem>
                          )}
                          {doc.type === 'original' && doc.metadata.recommendations && (
                            <DropdownMenuItem onClick={() => handleImprove(doc)}>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Améliorer
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleDelete(doc)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Rapports */}
      {reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rapports récents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">
                      {report.type === 'audit' ? 'Rapport d\'audit' : 'Rapport de génération'}
                    </p>
                    <p className="text-sm text-muted-foreground">{report.summary}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(report.date)}
                    </span>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}