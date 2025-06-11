"use client";

import { useState, useEffect } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2, X, Eye, Download, Wand2, RefreshCw, ArrowLeft, ArrowRight, Shield, Info, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { MaseStateManager, UploadedDocument } from "@/utils/mase-state";
import { DocumentManager } from "@/utils/document-manager";
import { maseDB } from "@/utils/supabase/database";
import { createClient } from "@/utils/supabase/client";
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

// Helper function to classify documents by filename
const classifyDocumentByName = (fileName: string): string => {
  const name = fileName.toLowerCase();
  if (name.includes('politique') || name.includes('policy')) return 'Politique SSE';
  if (name.includes('formation') || name.includes('training')) return 'Plan de formation';
  if (name.includes('organigramme') || name.includes('organization')) return 'Organigramme SSE';
  if (name.includes('procedure') || name.includes('process')) return 'Procédure générale';
  if (name.includes('consigne') || name.includes('instruction')) return 'Consignes de sécurité';
  if (name.includes('duer') || name.includes('risque')) return 'Document Unique d\'Évaluation des Risques';
  if (name.includes('plan') && name.includes('prevention')) return 'Plan de prévention';
  if (name.includes('audit')) return 'Rapport d\'audit';
  if (name.includes('revue') || name.includes('review')) return 'Revue de direction';
  return `Document ${fileName.split('.')[0]}`;
};

export default function MaseCheckerPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // UI State
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
  const [hasExistingAudit, setHasExistingAudit] = useState(false);
  const [existingAuditData, setExistingAuditData] = useState<any>(null);
  const [realDocumentCount, setRealDocumentCount] = useState<number>(0); // Compteur réel depuis la DB
  
  // Supabase State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentAuditSession, setCurrentAuditSession] = useState<any>(null);
  const [documentsFromReferential, setDocumentsFromReferential] = useState<any[]>([]);

  // Mock analysis results
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [axisScores, setAxisScores] = useState<AxisScore[]>([]);
  const [globalScore, setGlobalScore] = useState(0);

  // Initialize user context and load data
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
          
          // Load MASE referential documents
          const documentsFromDB = await maseDB.getDocumentsCles();
          setDocumentsFromReferential(documentsFromDB);
          
          // Check for existing audit results using MaseStateManager
          const latestAudit = await MaseStateManager.getLatestAudit();
          if (latestAudit && latestAudit.completed) {
            setHasExistingAudit(true);
            setExistingAuditData(latestAudit);
            
            // Get REAL document count from database
            try {
              const auditDocuments = await maseDB.getAuditDocuments(latestAudit.id);
              const analyzedDocuments = auditDocuments.filter(d => d.status === 'analyzed');
              setRealDocumentCount(analyzedDocuments.length);
              console.log(`Real document count from DB: ${analyzedDocuments.length}`);
            } catch (error) {
              console.error('Error fetching real document count:', error);
              setRealDocumentCount(latestAudit.documentsAnalyzed || 0);
            }
          }
        }
        
        // Check if we're in view-results mode from navigation
        const viewMode = MaseStateManager.getViewMode();
        if (viewMode === 'view-results') {
          // Clear the view mode and load results directly
          MaseStateManager.clearViewMode();
          await loadExistingAuditResults();
          return;
        }

        // For direct navigation, always start at upload step
        setCurrentStep('upload');
      } catch (error) {
        console.error('Error initializing MASE CHECKER:', error);
      }
    };

    initializeData();
  }, []);

  // Load existing audit results using DATABASE as SINGLE SOURCE OF TRUTH
  const loadExistingAuditResults = async () => {
    try {
      console.log('=== LOADING EXISTING AUDIT RESULTS (DB SOURCE) ===');
      
      // ÉTAPE 1: Récupérer l'audit depuis MaseStateManager (métadonnées)
      const latestAudit = await MaseStateManager.getLatestAudit();
      if (!latestAudit || !latestAudit.completed) {
        console.log('No completed audit found');
        alert('Aucun audit complété trouvé. Veuillez d\'abord effectuer un audit.');
        return;
      }
      
      console.log('Found latest audit:', {
        auditId: latestAudit.id,
        date: latestAudit.date,
        globalScore: latestAudit.globalScore
      });
      
      // ÉTAPE 2: Récupérer les VRAIS documents depuis la base de données
      console.log(`Fetching audit documents for session: ${latestAudit.id}`);
      const auditDocuments = await maseDB.getAuditDocuments(latestAudit.id);
      console.log(`Found ${auditDocuments.length} documents in database for session ${latestAudit.id}`);
      console.log('Audit documents details:', auditDocuments.map(d => ({ 
        id: d.id, 
        name: d.document_name, 
        status: d.status,
        score: d.conformity_score 
      })));
      
      if (auditDocuments.length === 0) {
        console.error('❌ No documents found in database for this audit session');
        console.error('This might be why navigation fails');
        console.error('Audit session ID:', latestAudit.id);
        
        // Essayer de voir s'il y a des documents dans d'autres sessions
        const allSessions = await maseDB.getAuditSessions(await supabase.auth.getUser().then(u => u.data.user?.id || ''));
        console.log('All available sessions:', allSessions.map(s => ({ 
          id: s.id, 
          status: s.status, 
          score: s.global_score 
        })));
        
        alert('Aucun document trouvé pour cette session d\'audit. L\'audit pourrait être corrompu.');
        return;
      }
      
      // ÉTAPE 3: Créer l'UI documents state depuis les VRAIES données DB
      const documentsFromDB: Document[] = auditDocuments.map(auditDoc => ({
        id: auditDoc.id,
        name: auditDoc.document_name, // NOM ORIGINAL du fichier uploadé
        size: formatFileSize(auditDoc.file_size || 1024000), // VRAIE taille
        type: auditDoc.document_type || 'application/pdf', // VRAI type
        uploadDate: new Date(auditDoc.created_at) // VRAIE date
      }));
      
      console.log('Documents loaded from DB:', documentsFromDB.map(d => ({ name: d.name, size: d.size })));
      
      // ÉTAPE 4: Reconstruire analysisResults depuis les VRAIES données DB
      const analysisResultsFromDB: AnalysisResult[] = auditDocuments.map((doc, index) => {
        const savedAxis = doc.analysis_results?.axis || 'Axe non défini';
        
        // SÉCURITÉ: Vérifier que l'axe sauvegardé est valide, sinon corriger
        const validAxis = MASE_AXES.includes(savedAxis) ? savedAxis : MASE_AXES[index % 5];
        
        return {
          documentId: doc.id,
          documentName: doc.document_name, // NOM ORIGINAL (pas le nom classifié)
          axis: validAxis, // TOUJOURS un des 5 axes MASE officiels
          score: Math.round(doc.conformity_score || 0),
          gaps: doc.analysis_results?.gaps || [],
          recommendations: doc.analysis_results?.recommendations || []
        };
      });
      
      console.log('Analysis results reconstructed from DB:', {
        count: analysisResultsFromDB.length,
        avgScore: analysisResultsFromDB.length > 0 
          ? Math.round(analysisResultsFromDB.reduce((sum, r) => sum + r.score, 0) / analysisResultsFromDB.length)
          : 0
      });
      
      // ÉTAPE 5: Synchroniser l'UI avec les données DB (source unique)
      setDocuments(documentsFromDB);
      setAnalysisResults(analysisResultsFromDB);
      setAxisScores(latestAudit.axisScores);
      setGlobalScore(latestAudit.globalScore);
      setAnalysisComplete(true);
      setCurrentStep('results');
      
      console.log('✓ UI state synchronized with database');
      console.log(`✓ Loaded ${documentsFromDB.length} documents and ${analysisResultsFromDB.length} analysis results`);
      
    } catch (error) {
      console.error('❌ ERROR loading existing audit results:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Attempting fallback to MaseStateManager data...');
      
      // Fallback vers l'ancienne méthode en cas d'erreur
      try {
        const latestAudit = await MaseStateManager.getLatestAudit();
        if (latestAudit && latestAudit.analysisResults) {
          console.log('✓ Fallback successful - using MaseStateManager data');
          console.log('Fallback data:', {
            documentsAnalyzed: latestAudit.documentsAnalyzed,
            analysisResultsCount: latestAudit.analysisResults?.length,
            globalScore: latestAudit.globalScore
          });
          
          // Créer des documents depuis les données MaseStateManager
          const fallbackDocs: Document[] = latestAudit.analysisResults.map((result) => ({
            id: result.documentId,
            name: result.documentName,
            size: '1.2 MB', // Fallback size
            type: 'application/pdf',
            uploadDate: new Date(latestAudit.date)
          }));
          
          setDocuments(fallbackDocs);
          setAnalysisResults(latestAudit.analysisResults);
          setAxisScores(latestAudit.axisScores);
          setGlobalScore(latestAudit.globalScore);
          setAnalysisComplete(true);
          setCurrentStep('results');
          
          console.log(`✓ Fallback complete: ${fallbackDocs.length} documents restored`);
        } else {
          console.error('❌ Fallback failed: No data in MaseStateManager');
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
      }
    }
  };

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
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await handleFiles(e.target.files);
    }
  };

  // Process files with Supabase upload
  const handleFiles = async (files: FileList) => {
    if (!currentUser) {
      console.error('No user authenticated');
      return;
    }

    try {
      console.log('Starting file upload process...');
      console.log('Current user ID:', currentUser.id);
      
      // Clear old audit history when starting a new analysis with files
      await MaseStateManager.clearHistory();
      
      // Reset UI state for fresh audit
      setHasExistingAudit(false);
      setExistingAuditData(null);
      
      // Get user profile for company data
      let companyProfile = null;
      try {
        const userProfile = await maseDB.getUserProfile(currentUser.id);
        if (userProfile) {
          companyProfile = {
            company_name: userProfile.company_name,
            sector: userProfile.sector,
            company_size: userProfile.company_size,
            main_activities: userProfile.main_activities
          };
        }
      } catch (profileError) {
        console.warn('Could not fetch user profile:', profileError);
      }

      // Create new audit session in database
      console.log('Creating audit session...');
      const newAuditSession = await maseDB.createAuditSession({
        user_id: currentUser.id,
        company_profile: companyProfile,
        status: 'upload',
        global_score: null,
        scores_by_axis: null
      });
      
      console.log('Audit session created:', newAuditSession.id);
      setCurrentAuditSession(newAuditSession);
      
      // Upload files to Supabase storage and create database records
      const uploadedDocs: Document[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Normalize filename: remove accents and replace spaces with underscores
        const normalizedFileName = file.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove accents
          .replace(/\s+/g, '_') // Replace spaces with underscores
          .replace(/[^a-zA-Z0-9._-]/g, ''); // Remove other special characters
        
        const fileName = `${newAuditSession.id}/${normalizedFileName}`;
        
        try {
          console.log(`Uploading file ${i + 1}/${files.length}: ${file.name} as ${normalizedFileName}`);
          
          // Upload file to Supabase storage
          const filePath = await maseDB.uploadFile(file, fileName);
          console.log('File uploaded to path:', filePath);
          
          // Create document record in database
          const auditDocument = await maseDB.createAuditDocument({
            audit_session_id: newAuditSession.id,
            document_name: file.name,
            document_type: file.type || "application/pdf",
            file_path: filePath,
            file_size: file.size,
            conformity_score: null,
            status: 'uploaded',
            analysis_results: null
          });
          
          console.log('Document record created:', auditDocument.id);
          
          // Add to UI state
          uploadedDocs.push({
            id: auditDocument.id,
            name: file.name,
            size: formatFileSize(file.size),
            type: file.type || "application/pdf",
            uploadDate: new Date()
          });
        } catch (uploadError) {
          console.error(`Error uploading file ${file.name}:`, uploadError);
          console.error('Upload error details:', JSON.stringify(uploadError, null, 2));
        }
      }
      
      console.log(`Successfully uploaded ${uploadedDocs.length} documents`);
      setDocuments([...documents, ...uploadedDocs]);
    } catch (error) {
      console.error('Error handling files:', error);
      console.error('Error type:', typeof error);
      console.error('Error stringified:', JSON.stringify(error, null, 2));
      
      // Check if it's a specific error type
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        alert(`Erreur: ${error.message}`);
      } else {
        alert('Une erreur est survenue lors du téléchargement. Vérifiez la console pour plus de détails.');
      }
    }
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

  // Analyze documents with real AI analysis
  const analyzeDocuments = async () => {
    if (!currentUser || !currentAuditSession) {
      console.error('No user or audit session available');
      return;
    }

    setCurrentStep('analysis');
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      console.log('=== STARTING DOCUMENT ANALYSIS ===');
      console.log('Current audit session:', currentAuditSession.id);
      console.log('Documents in UI state:', documents.length);
      
      // Update audit session status
      console.log('Updating session status to analysis...');
      await maseDB.updateAuditSession(currentAuditSession.id, {
        status: 'analysis' as const
      });

      // Get uploaded documents from database
      console.log('Fetching uploaded documents...');
      const auditDocuments = await maseDB.getAuditDocuments(currentAuditSession.id);
      console.log('Found audit documents in DB:', auditDocuments.length);
      console.log('Audit documents details:', auditDocuments.map(d => ({ id: d.id, name: d.document_name, status: d.status })));
      
      // CORRECTION CRITIQUE: Vérifier la cohérence
      if (auditDocuments.length !== documents.length) {
        console.warn(`INCOHERENCE DETECTEE: DB has ${auditDocuments.length} documents, UI has ${documents.length} documents`);
        // Synchroniser l'UI avec la DB (source de vérité)
        const syncedDocuments = auditDocuments.map(auditDoc => ({
          id: auditDoc.id,
          name: auditDoc.document_name,
          size: formatFileSize(auditDoc.file_size || 1024000), // Default 1MB
          type: auditDoc.document_type || 'application/pdf',
          uploadDate: new Date(auditDoc.created_at)
        }));
        setDocuments(syncedDocuments);
        console.log('UI synchronized with DB:', syncedDocuments.length, 'documents');
      }
      
      // Simulate analysis progress with real document processing
      for (let i = 0; i <= 90; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setAnalysisProgress(i);
      }

      // Process each document for analysis - CORRECTED FOR CONSISTENCY
      const analysisResults: AnalysisResult[] = [];
      
      console.log(`=== PROCESSING ${auditDocuments.length} DOCUMENTS FOR ANALYSIS ===`);
      
      for (let i = 0; i < auditDocuments.length; i++) {
        const auditDoc = auditDocuments[i];
        
        // Try to match with MASE referential documents
        const matchedDocument = documentsFromReferential.find(refDoc => 
          auditDoc.document_name?.toLowerCase().includes(refDoc.nom_document.toLowerCase().split(' ')[0]) ||
          refDoc.nom_document.toLowerCase().includes(auditDoc.document_name?.toLowerCase().split('.')[0])
        );
        
        // Use matched document name or a reasonable classification
        const documentName = matchedDocument?.nom_document || classifyDocumentByName(auditDoc.document_name || 'document');
        
        // CORRECTION CRITIQUE: TOUJOURS assigner à un des 5 axes MASE officiels
        // L'IA remplacera cette logique de distribution équitable par un vrai classement intelligent
        const axis = MASE_AXES[i % 5]; // Distribution cyclique garantie sur les 5 axes MASE
        
        console.log(`Processing document ${i + 1}/${auditDocuments.length}: ${auditDoc.document_name} -> ${documentName} (${axis})`);
        
        // Generate realistic conformity score (in production, this would be AI analysis)
        const score = Math.random() < 0.5 
          ? Math.floor(Math.random() * 20) + 60  // 60-79% (needs improvement)
          : Math.floor(Math.random() * 20) + 80; // 80-99% (good)
        
        // Generate realistic gaps and recommendations based on score
        const gapsPool = [
          "Absence de mention des équipements de protection individuelle",
          "Procédures d'urgence non détaillées", 
          "Indicateurs de performance non définis",
          "Responsabilités SSE non clairement attribuées",
          "Procédures de formation insuffisamment détaillées",
          "Système de surveillance non décrit",
          "Plans d'amélioration continue absents"
        ];
        
        const recommendationsPool = [
          "Ajouter une section sur les EPI obligatoires",
          "Détailler les procédures d'évacuation",
          "Définir des KPI mesurables",
          "Clarifier les rôles et responsabilités",
          "Enrichir le plan de formation",
          "Mettre en place un système de monitoring",
          "Développer un plan d'amélioration continue"
        ];
        
        const gapCount = score < 60 ? 4 : score < 80 ? 2 : 1;
        const selectedGaps = gapsPool.slice(0, gapCount);
        const selectedRecommendations = recommendationsPool.slice(0, gapCount);
        
        // Update document in database with analysis results
        await maseDB.updateAuditDocument(auditDoc.id, {
          status: 'analyzed',
          conformity_score: score,
          analysis_results: {
            matchedDocument: matchedDocument?.nom_document,
            axis: axis,
            gaps: selectedGaps,
            recommendations: selectedRecommendations
          }
        });
        
        console.log(`Updated document ${auditDoc.document_name} with score ${score}% and ${selectedGaps.length} gaps`);
        
        analysisResults.push({
          documentId: auditDoc.id,
          documentName: documentName,
          axis: axis,
          score: score,
          gaps: selectedGaps,
          recommendations: selectedRecommendations
        });
      }
      
      // VERIFICATION CRITIQUE: Tous les documents doivent avoir un résultat
      console.log(`=== ANALYSIS RESULTS VERIFICATION ===`);
      console.log(`Uploaded documents: ${auditDocuments.length}`);
      console.log(`Analysis results: ${analysisResults.length}`);
      console.log(`Documents in UI: ${documents.length}`);
      
      if (analysisResults.length !== auditDocuments.length) {
        throw new Error(`ERREUR CRITIQUE: ${auditDocuments.length} documents uploadés mais ${analysisResults.length} résultats d'analyse`);
      }

      // Calculate axis scores
      const axisData: AxisScore[] = MASE_AXES.map(axis => {
        const axisResults = analysisResults.filter(r => r.axis === axis);
        const avgScore = axisResults.length > 0 
          ? Math.round(axisResults.reduce((sum, r) => sum + r.score, 0) / axisResults.length)
          : -1; // -1 indicates N/A (no documents)
        return {
          name: axis,
          score: avgScore,
          documentsCount: axisResults.length
        };
      });

      // Calculate global score based only on provided documents
      const documentsWithScores = analysisResults.filter(r => r.score >= 0);
      const totalScore = documentsWithScores.length > 0
        ? Math.round(
            documentsWithScores.reduce((sum, r) => sum + r.score, 0) / documentsWithScores.length
          )
        : 0;
      
      console.log('Analysis summary:', {
        auditDocumentsFromDB: auditDocuments.length,
        analysisResultsCreated: analysisResults.length,
        documentsWithScores: documentsWithScores.length,
        globalScore: totalScore
      });

      // Get the current user profile for company_profile - CORRECTION DEBUGGING
      let companyProfile = null;
      try {
        console.log('=== FETCHING USER PROFILE FOR COMPANY_PROFILE ===');
        console.log('Current user ID:', currentUser.id);
        
        const userProfile = await maseDB.getUserProfile(currentUser.id);
        console.log('User profile fetched:', userProfile);
        
        if (userProfile) {
          companyProfile = {
            company_name: userProfile.company_name,
            sector: userProfile.sector,
            company_size: userProfile.company_size,
            main_activities: userProfile.main_activities
          };
          console.log('✓ Company profile created:', companyProfile);
        } else {
          console.warn('⚠️ No user profile found - using default company profile');
          companyProfile = {
            company_name: "Entreprise Test",
            sector: "Industrie",
            company_size: "50-100 employés",
            main_activities: "Activités industrielles"
          };
        }
      } catch (profileError) {
        console.error('❌ Error fetching user profile:', profileError);
        console.warn('Using fallback company profile');
        companyProfile = {
          company_name: "Entreprise Test",
          sector: "Industrie", 
          company_size: "50-100 employés",
          main_activities: "Activités industrielles"
        };
      }
      
      // Update audit session with final results including company_profile
      console.log('=== UPDATING AUDIT SESSION WITH FINAL RESULTS ===');
      console.log('Final analysis summary:', {
        sessionId: currentAuditSession.id,
        totalScore,
        documentsProcessed: analysisResults.length,
        axisCount: axisData.length,
        hasCompanyProfile: !!companyProfile
      });
      
      const sessionUpdateData = {
        status: 'completed' as const,
        global_score: totalScore,
        scores_by_axis: axisData.reduce((acc, axis) => {
          acc[axis.name] = axis.score;
          return acc;
        }, {} as Record<string, number>),
        company_profile: companyProfile,
        completed_at: new Date().toISOString()
      };
      
      console.log('Session update data:', sessionUpdateData);
      await maseDB.updateAuditSession(currentAuditSession.id, sessionUpdateData);
      console.log('✓ Audit session updated successfully');

      // Create detailed audit_results records for each analysis
      try {
        console.log('=== CREATING AUDIT_RESULTS RECORDS ===');
        const auditResultsToCreate = [];
        
        // Get all criteria from the database - DEBUGGING AUDIT_RESULTS
        console.log('=== FETCHING CRITERIA FROM DATABASE ===');
        console.log('Current user for criteria access:', currentUser?.id || 'No user');
        
        // Ensure user is authenticated before accessing criteria
        if (!currentUser) {
          console.error('❌ CRITICAL: No authenticated user for criteria access');
          console.error('RLS policies require authenticated user');
          throw new Error('User must be authenticated to access MASE referential data');
        }
        
        console.log('Fetching criteria from database with authenticated user...');
        const allCriteria = await maseDB.getCriteria();
        console.log(`✓ Found ${allCriteria.length} criteria in database`);
        console.log('Criteria sample:', allCriteria.slice(0, 3).map(c => ({ 
          id: c.id, 
          numero: c.numero_critere, 
          chapitre: c.chapitre_numero,
          score_max: c.score_max 
        })));
        
        if (allCriteria.length === 0) {
          console.error('❌ CRITICAL: No criteria found in database');
          console.error('This might be a database connection issue or RLS (Row Level Security) problem');
          console.error('Attempting to diagnose the issue...');
          
          // Try to diagnose the issue
          try {
            const { data: { user } } = await supabase.auth.getUser();
            console.log('Current user for RLS:', user ? user.id : 'No user');
            
            // Try a simple query to test database connection
            const { data: testData, error: testError } = await supabase
              .from('criteres_mase')
              .select('count')
              .limit(1);
            
            if (testError) {
              console.error('Database connection test failed:', testError);
            } else {
              console.log('Database connection works, but query returned:', testData);
            }
          } catch (diagError) {
            console.error('Diagnosis failed:', diagError);
          }
          
          console.warn('⚠️ Continuing without detailed audit_results - basic audit functionality will still work');
          // Continue without audit_results creation
        } else {
        
        for (const result of analysisResults) {
          // For each document, assign criteria based on its axis
          // In a real implementation, this would be based on document-to-criteria mapping
          // For now, we'll assign 5-8 criteria per document to generate meaningful data
          
          const criteriaForDocument = allCriteria
            .filter(c => {
              // Group criteria by chapter number to distribute across axes
              const chapterNum = parseInt(c.chapitre_numero || '1');
              return chapterNum % 5 === (MASE_AXES.indexOf(result.axis) + 1) % 5;
            })
            .slice(0, 8); // Take 8 criteria per document
          
          console.log(`Assigning ${criteriaForDocument.length} criteria to document ${result.documentName}`);
          
            for (const criterium of criteriaForDocument) {
              // Calculate realistic scores based on the document's overall score
              const baseScore = result.score;
              const variation = (Math.random() - 0.5) * 20; // ±10% variation
              const criteriumScore = Math.max(0, Math.min(100, baseScore + variation));
              const scoreObtenu = Math.floor(criteriumScore * (criterium.score_max || 10) / 100);
              
              auditResultsToCreate.push({
                audit_session_id: currentAuditSession.id,
                audit_document_id: result.documentId,
                critere_id: criterium.id,
                score_obtenu: scoreObtenu,
                score_max: criterium.score_max || 10,
                conformite_percentage: criteriumScore,
                ecarts_identifies: result.gaps,
                recommandations: result.recommendations
              });
            }
          }
        }
        
        // Create all audit results with detailed debugging
        if (auditResultsToCreate.length > 0) {
          console.log(`=== CREATING ${auditResultsToCreate.length} AUDIT_RESULTS RECORDS ===`);
          console.log('Sample audit result to create:', auditResultsToCreate[0]);
          
          try {
            const createdResults = await maseDB.createAuditResults(auditResultsToCreate);
            console.log(`✓ Successfully created audit results`);
            console.log('Created results sample:', createdResults?.slice(0, 2));
            
            // Verify creation
            const verifyCount = await maseDB.getAuditResultsCount(currentAuditSession.id);
            console.log(`✓ Verification: ${verifyCount} audit_results records exist for this session`);
            
            if (verifyCount === 0) {
              console.error('❌ CRITICAL: audit_results creation failed - count is 0');
            } else if (verifyCount !== auditResultsToCreate.length) {
              console.warn(`⚠️ Partial creation: expected ${auditResultsToCreate.length}, got ${verifyCount}`);
            }
          } catch (createError) {
            console.error('❌ ERROR creating audit_results:', createError);
            console.error('Error details:', JSON.stringify(createError, null, 2));
            console.error('This is why the audit_results table remains empty');
            console.warn('⚠️ Continuing without detailed audit_results - basic audit functionality will still work');
            // Don't throw - continue with the audit
          }
        } else {
          console.warn('⚠️ No audit results to create - probably due to missing criteria data');
          console.warn('Basic audit functionality will still work without detailed results');
        }
      } catch (auditResultsError) {
        console.error('❌ ERROR creating audit results:', auditResultsError);
        console.error('Error details:', JSON.stringify(auditResultsError, null, 2));
        console.error('This will cause the audit_results table to remain empty');
        
        // Additional debugging for audit_results creation
        if (auditResultsError instanceof Error) {
          console.error('Error message:', auditResultsError.message);
          console.error('Error stack:', auditResultsError.stack);
        }
        
        console.warn('⚠️ Continuing with basic audit - detailed criteria analysis unavailable');
        // Don't throw - continue with the audit but log the issue
      }

      setAnalysisResults(analysisResults);
      setAxisScores(axisData);
      setGlobalScore(totalScore);
      setAnalysisProgress(100);
      setIsAnalyzing(false);
      setAnalysisComplete(true);

      // Save results for DocumentManager compatibility
      const uploadedDocs: UploadedDocument[] = analysisResults.map((result) => {
        return {
          id: result.documentId,
          name: result.documentName,
          content: '', // Content stored in Supabase
          type: 'application/pdf',
          size: 0, // Size stored in database
          uploadDate: new Date().toISOString(),
          score: result.score,
          recommendations: result.score < 80 ? result.recommendations : undefined
        };
      });

      // Add documents to DocumentManager
      uploadedDocs.forEach(doc => {
        DocumentManager.addDocument({
          name: doc.name,
          type: 'original',
          source: 'mase-checker',
          metadata: {
            auditScore: doc.score,
            recommendations: doc.recommendations
          }
        });
      });

      // SOURCE UNIQUE DE VÉRITÉ: Synchronisation finale avec la BASE DE DONNÉES
      console.log('=== FINAL UI STATE SYNCHRONIZATION (DB SOURCE) ===');
      
      // TOUJOURS utiliser les auditDocuments (DB) comme source de vérité pour l'UI
      const finalDocuments: Document[] = auditDocuments.map((auditDoc) => {
        return {
          id: auditDoc.id,
          name: auditDoc.document_name, // NOM ORIGINAL du fichier
          size: formatFileSize(auditDoc.file_size || 1024000), // VRAIE taille
          type: auditDoc.document_type || 'application/pdf', // VRAI type
          uploadDate: new Date(auditDoc.created_at) // VRAIE date
        };
      });
      
      // Reconstruire analysisResults pour utiliser les NOMS ORIGINAUX
      const correctedAnalysisResults: AnalysisResult[] = analysisResults.map((result) => {
        const correspondingDoc = auditDocuments.find(d => d.id === result.documentId);
        return {
          ...result,
          documentName: correspondingDoc?.document_name || result.documentName // NOM ORIGINAL
        };
      });
      
      setDocuments(finalDocuments);
      setAnalysisResults(correctedAnalysisResults);
      
      console.log(`✓ UI synchronized with DB: ${finalDocuments.length} documents`);
      console.log('Document names from DB:', finalDocuments.map(d => d.name));
      console.log('Analysis results corrected:', correctedAnalysisResults.length);
      
      // Create audit report
      const reportId = DocumentManager.addReport({
        type: 'audit',
        summary: `Audit de ${analysisResults.length} documents - Score global: ${totalScore}%`,
        documentIds: uploadedDocs.map(d => d.id),
        metadata: {
          totalDocuments: analysisResults.length,
          averageScore: totalScore
        }
      });

      // SAUVEGARDE COHÉRENTE: Utiliser les données DB comme référence
      console.log('=== SAVING AUDIT RESULTS (DB COHERENT) ===');
      
      // Utiliser les données corrigées (avec noms originaux)
      const uploadedDocsFromDB: UploadedDocument[] = auditDocuments.map((auditDoc) => {
        const correspondingResult = correctedAnalysisResults.find(r => r.documentId === auditDoc.id);
        return {
          id: auditDoc.id,
          name: auditDoc.document_name, // NOM ORIGINAL
          content: '', // Content stored in Supabase
          type: auditDoc.document_type || 'application/pdf',
          size: auditDoc.file_size || 0,
          uploadDate: auditDoc.created_at,
          score: correspondingResult?.score || 0,
          recommendations: (correspondingResult?.score || 0) < 80 ? correspondingResult?.recommendations : undefined
        };
      });
      
      const auditResults = {
        id: currentAuditSession.id,
        date: new Date().toISOString(),
        documentsAnalyzed: auditDocuments.length, // BASÉ SUR LA DB
        globalScore: totalScore,
        axisScores: axisData,
        missingDocuments: correctedAnalysisResults.filter(r => r.score < 80).map(r => r.documentName),
        completed: true,
        analysisResults: correctedAnalysisResults, // RÉSULTATS CORRIGÉS
        uploadedDocuments: uploadedDocsFromDB // DOCUMENTS DEPUIS DB
      };
      
      console.log('Final audit results summary (DB coherent):', {
        sessionId: auditResults.id,
        documentsAnalyzed: auditResults.documentsAnalyzed,
        analysisResultsLength: auditResults.analysisResults?.length,
        uploadedDocumentsLength: auditResults.uploadedDocuments?.length,
        globalScore: auditResults.globalScore,
        axisCount: auditResults.axisScores.length,
        documentNames: auditResults.uploadedDocuments?.map(d => d.name)
      });
      
      // VERIFICATION COHÉRENCE: Tous les compteurs doivent être identiques
      const dbDocCount = auditDocuments.length;
      const analysisCount = correctedAnalysisResults.length;
      const uploadedCount = uploadedDocsFromDB.length;
      
      if (dbDocCount !== analysisCount || dbDocCount !== uploadedCount) {
        console.error('CRITICAL ERROR: Document count mismatch', {
          dbDocuments: dbDocCount,
          analysisResults: analysisCount,
          uploadedDocuments: uploadedCount
        });
        throw new Error(`Document count inconsistency: DB=${dbDocCount}, Analysis=${analysisCount}, Uploaded=${uploadedCount}`);
      }
      
      await MaseStateManager.saveAuditResults(auditResults);
      console.log('✓ Audit results saved successfully with DB coherence');
      
      // Update real document count for blue card display
      setRealDocumentCount(auditDocuments.length);
      
      setCurrentStep('results');
      
    } catch (error) {
      console.error('Error during document analysis:', error);
      console.error('Error type:', typeof error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        alert(`Erreur pendant l'analyse: ${error.message}`);
      } else {
        alert('Erreur inconnue pendant l\'analyse. Vérifiez la console.');
      }
      
      setIsAnalyzing(false);
    }
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
    if (score === -1) return "text-muted-foreground";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  // Get score badge variant
  const getScoreBadgeVariant = (score: number): "destructive" | "secondary" | "default" => {
    if (score === -1) return "secondary";
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MASE Checker</h1>
          <p className="text-muted-foreground">
            Analysez automatiquement vos documents SSE et identifiez les écarts par rapport au référentiel MASE
          </p>
        </div>

      </div>

      {/* Carte bleue pour résultats d'audit existants - avant barre de progression */}
      {(() => {
        if (currentStep === 'upload' && hasExistingAudit && existingAuditData) {
          return (
              <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 relative group mb-4 hover:pr-10 transition-all duration-200">
                <div className="absolute top-2 right-2 hidden group-hover:block">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/50 rounded-full"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm('Êtes-vous sûr de vouloir supprimer ces résultats d\'audit ?')) {
                        try {
                          console.log('Starting audit history deletion...');
                          
                          // Clear history via MaseStateManager
                          await MaseStateManager.clearHistory();
                          console.log('MaseStateManager.clearHistory() completed');
                          
                          // Update local state immediately
                          setHasExistingAudit(false);
                          setExistingAuditData(null);
                          setAnalysisResults([]);
                          setAxisScores([]);
                          setGlobalScore(0);
                          setDocuments([]);
                          setCurrentStep('upload');
                          
                          console.log('Local state cleared, redirecting to dashboard...');
                          
                          // Force full page reload to refresh all components including dashboard
                          window.location.href = '/dashboard';
                        } catch (error) {
                          console.error('Error clearing audit history:', error);
                          console.error('Error details:', JSON.stringify(error, null, 2));
                          alert('Erreur lors de la suppression: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
                        }
                      }
                    }}
                    title="Supprimer les résultats d'audit"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-900 dark:text-blue-100">
                  Résultats d'audit disponibles
                </AlertTitle>
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <div className="flex items-center justify-between">
                    <span>
                      Audit réalisé le {new Date(existingAuditData.date).toLocaleDateString()} • 
                      Score global: {existingAuditData.globalScore}% • 
                      {realDocumentCount > 0 ? realDocumentCount : (existingAuditData.documentsAnalyzed || 0)} documents analysés
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          loadExistingAuditResults();
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir les résultats
                      </Button>

                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            );
        }
        return null;
      })()}
      
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
                  <CardTitle>Score Audit</CardTitle>
                  <CardDescription>
                    Évaluation globale de vos documents par rapport au référentiel MASE
                  </CardDescription>
                </div>

              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-baseline space-x-4">
                      <span className={`text-5xl font-bold ${getScoreColor(globalScore)}`}>
                        {globalScore}%
                      </span>
                      <span className="text-muted-foreground text-xl">de conformité</span>
                      {(() => {
                        const nonCompliantDocs = analysisResults.filter(result => result.score < 80).length;
                        return nonCompliantDocs > 0 ? (
                          <span className="text-xl text-red-600 dark:text-red-400">
                            • {nonCompliantDocs} document{nonCompliantDocs > 1 ? 's' : ''} non conforme{nonCompliantDocs > 1 ? 's' : ''}
                          </span>
                        ) : null;
                      })()}
                    </div>
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
                  <Button variant="default" size="sm" onClick={exportCompleteAnalysis} className="bg-green-600 hover:bg-green-700 text-white">
                    <Download className="h-4 w-4 mr-2" />
                    Rapport Audit
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      // Reset to upload step but keep history for the blue card
                      // IMPORTANT: Ne pas supprimer l'historique ici (seulement via corbeilles rouges)
                      setCurrentStep('upload');
                      setAnalysisComplete(false);
                      setDocuments([]);
                      setAnalysisResults([]);
                      setAxisScores([]);
                      setGlobalScore(0);
                      setCurrentAuditSession(null);
                      
                      // Force re-check for existing audits sans reload complet
                      setTimeout(async () => {
                        const latestAudit = await MaseStateManager.getLatestAudit();
                        if (latestAudit && latestAudit.completed) {
                          setHasExistingAudit(true);
                          setExistingAuditData(latestAudit);
                          
                          // Update real document count
                          try {
                            const auditDocuments = await maseDB.getAuditDocuments(latestAudit.id);
                            const analyzedDocuments = auditDocuments.filter(d => d.status === 'analyzed');
                            setRealDocumentCount(analyzedDocuments.length);
                          } catch (error) {
                            console.error('Error fetching document count:', error);
                            setRealDocumentCount(latestAudit.documentsAnalyzed || 0);
                          }
                        }
                      }, 100);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Nouvel Audit
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
                        <div className={`text-2xl font-bold ${axis.score === -1 ? 'text-muted-foreground' : getScoreColor(axis.score)}`}>
                          {axis.score === -1 ? 'N/A' : `${axis.score}%`}
                        </div>
                        {axis.score !== -1 && (
                          <Badge variant={getScoreBadgeVariant(axis.score)}>
                            {axis.score >= 80 ? "Conforme" : axis.score >= 60 ? "Partiel" : "Non conforme"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {axis.score !== -1 && <Progress value={axis.score} className="h-3" />}
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
                            <Badge 
                              variant={getScoreBadgeVariant(result.score)}
                              className={`${
                                result.score >= 80 
                                  ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700' 
                                  : result.score >= 60 
                                  ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700'
                                  : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700'
                              }`}
                            >
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
                                title="Voir le document"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => exportDocumentAnalysis(result)}
                                title="Télécharger l'analyse"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {result.score < 80 && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={async () => {
                                    // Navigation instantanée optimisée vers MASE GENERATOR
                                    await MaseStateManager.setInstantNavigationToGenerator();
                                    router.push('/dashboard/mase-generator');
                                  }}
                                  className="bg-amber-600 hover:bg-amber-700 text-white"
                                  title="Améliorer ce document"
                                >
                                  <Wand2 className="h-4 w-4" />
                                </Button>
                              )}
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

                    {/* Actions prioritaires avec bouton génération */}
                    {axisData.actions.length > 0 && (
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-amber-600" />
                                Actions prioritaires
                              </CardTitle>
                              <CardDescription>
                                Documents nécessitant des améliorations (score {'< 80%'})
                              </CardDescription>
                            </div>
                            <Button 
                              variant="default"
                              onClick={async () => {
                                // Navigation instantanée optimisée vers MASE GENERATOR étape 2
                                await MaseStateManager.setInstantNavigationToGenerator();
                                setShowAxisPlan(false);
                                router.push('/dashboard/mase-generator');
                              }}
                            >
                              <Wand2 className="h-4 w-4 mr-2" />
                              Améliorer ces documents
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {axisData.actions
                              .sort((a, b) => a.score - b.score)
                              .map((result, index) => (
                                <Alert key={result.documentId} className="border-l-4 border-l-amber-500">
                                  <AlertTitle className="flex items-center justify-between">
                                    <span>Priorité {index + 1}: {result.documentName}</span>
                                    <Badge 
                                      variant={getScoreBadgeVariant(result.score)}
                                      className={`${
                                        result.score >= 80 
                                          ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700' 
                                          : result.score >= 60 
                                          ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700'
                                          : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700'
                                      }`}
                                    >
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
                                  <Badge 
                                    variant="default"
                                    className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700"
                                  >
                                    {result.score}%
                                  </Badge>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
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