// Utilitaire pour gérer l'état partagé entre MASE CHECKER et MASE GENERATOR avec Supabase
import { maseDB, AuditSession, GenerationSession, AuditDocument } from '@/utils/supabase/database'
import { createClient } from '@/utils/supabase/client'

// Types pour les documents uploadés
export interface UploadedDocument {
  id: string;
  name: string;
  content?: string; // Contenu temporaire en session
  type: string;
  size: number;
  uploadDate: string;
  score?: number;
  recommendations?: string[];
}

export interface MaseAuditResult {
  id: string;
  date: string;
  documentsAnalyzed: number;
  globalScore: number;
  axisScores: Array<{
    name: string;
    score: number;
    documentsCount: number;
  }>;
  missingDocuments: string[];
  completed: boolean;
  analysisResults?: Array<{
    documentId: string;
    documentName: string;
    axis: string;
    score: number;
    gaps: string[];
    recommendations: string[];
  }>;
  uploadedDocuments?: UploadedDocument[]; // Documents uploadés durant l'audit
}

export interface MaseGenerationResult {
  id: string;
  date: string;
  mode: 'post-audit' | 'from-scratch'; // Seulement 2 modes maintenant
  generationType: 'personalized'; // Toujours personnalisé maintenant
  documentsGenerated: Array<{
    id: string;
    name: string;
    axis: string;
    template: string;
  }>;
  config: {
    companyName: string;
    sector: string;
    companySize: string;
    mainActivities: string;
    implementationDate: string;
  };
  personalizedInstructions?: string | { [docId: string]: string };
  completed: boolean;
  auditId?: string; // Lien vers l'audit associé si mode post-audit
  improvedDocuments?: string[]; // IDs des documents améliorés si mode from-existing
}

const STORAGE_KEY = 'mase_audit_history';
const NAVIGATION_KEY = 'mase_navigation_mode';
const VIEW_MODE_KEY = 'mase_view_mode';
const GENERATION_KEY = 'mase_generation_history';
const GENERATION_VIEW_KEY = 'mase_generation_view_mode';

// Utilitaire pour vérifier la disponibilité de localStorage
const isLocalStorageAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
};

export class MaseStateManager {
  // Sauvegarder les résultats d'audit
  static async saveAuditResults(results: MaseAuditResult): Promise<void> {
    try {
      console.log('=== SAVING AUDIT RESULTS TO LOCALSTORAGE ===');
      console.log('Audit session ID:', results.id);
      console.log('Documents analyzed:', results.documentsAnalyzed);
      console.log('Global score:', results.globalScore);
      
      // NOTE: Ne pas créer de nouvelle session dans la DB !
      // La session existe déjà dans la DB avec les documents associés
      // On sauvegarde seulement dans localStorage pour la navigation
      
      if (isLocalStorageAvailable()) {
        const existingHistory = await this.getAuditHistory();
        const updatedHistory = [results, ...existingHistory.slice(0, 4)];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
        console.log('✓ Audit results saved to localStorage');
        console.log('✓ Session ID in localStorage:', results.id);
      } else {
        console.warn('localStorage not available');
      }
    } catch (error) {
      console.error('❌ Error saving audit results to localStorage:', error);
      
      // Fallback to localStorage only
      if (isLocalStorageAvailable()) {
        try {
          const existingHistory = await this.getAuditHistory();
          const updatedHistory = [results, ...existingHistory.slice(0, 4)];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
          console.log('✓ Fallback save to localStorage successful');
        } catch (fallbackError) {
          console.error('❌ Fallback save also failed:', fallbackError);
        }
      }
    }
  }

  // Récupérer l'historique des audits
  static async getAuditHistory(): Promise<MaseAuditResult[]> {
    try {
      // Get current user
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Fallback to localStorage if not authenticated
        if (isLocalStorageAvailable()) {
          const stored = localStorage.getItem(STORAGE_KEY);
          return stored ? JSON.parse(stored) : [];
        }
        return [];
      }

      // Get from database
      const auditSessions = await maseDB.getAuditSessions(user.id);
      
      // Convert to MaseAuditResult format with DB as SINGLE SOURCE OF TRUTH
      const results: MaseAuditResult[] = [];
      
      for (const session of auditSessions.filter(s => s.status === 'completed')) {
        try {
          console.log(`MaseStateManager: Processing session ${session.id}`);
          
          // Get ALL documents for this session (not just analyzed ones)
          const allDocuments = await maseDB.getAuditDocuments(session.id);
          const analyzedDocuments = allDocuments.filter(d => d.status === 'analyzed');
          
          console.log(`Session ${session.id}: ${allDocuments.length} total docs, ${analyzedDocuments.length} analyzed`);
          
          // Skip sessions without documents (orphaned sessions)
          if (analyzedDocuments.length === 0) {
            console.warn(`⚠️ Skipping session ${session.id} - no analyzed documents`);
            continue;
          }
          
          // Use analyzedDocuments.length for consistency (this is what we actually process)
          const documentsAnalyzed = analyzedDocuments.length;
          
          // Calculate axis scores using the actual analysis results
          const axisScoresMap = new Map<string, { totalScore: number; count: number; documentsCount: number }>();
          
          // SÉCURITÉ: Définition des 5 axes MASE officiels
          const MASE_AXES = [
            "Engagement de la direction",
            "Compétences et qualifications", 
            "Préparation et organisation des interventions",
            "Réalisation des interventions",
            "Retour d'expérience et amélioration continue"
          ];
          
          analyzedDocuments.forEach(doc => {
            const savedAxis = doc.analysis_results?.axis || 'Axe non défini';
            const axis = MASE_AXES.includes(savedAxis) ? savedAxis : 'Engagement de la direction';
            
            // Sécuriser le score - éviter NaN
            const rawScore = doc.conformity_score;
            const score = (rawScore === null || rawScore === undefined || isNaN(rawScore)) ? 0 : Math.round(rawScore);
            
            if (!axisScoresMap.has(axis)) {
              axisScoresMap.set(axis, { totalScore: 0, count: 0, documentsCount: 0 });
            }
            
            const axisData = axisScoresMap.get(axis)!;
            axisData.totalScore += score;
            axisData.count++;
            axisData.documentsCount++;
          });
          
          const axisScores = Array.from(axisScoresMap.entries()).map(([name, data]) => {
            // Triple sécurité pour éviter NaN dans les calculs d'axisScores
            const safeCount = Math.max(data.count, 1); // Au moins 1 pour éviter division par 0
            const safeTotalScore = isNaN(data.totalScore) ? 0 : data.totalScore;
            const averageScore = safeTotalScore / safeCount;
            const finalScore = isNaN(averageScore) ? 0 : Math.round(averageScore);
            
            return {
              name,
              score: Math.max(0, Math.min(100, finalScore)), // Score entre 0 et 100
              documentsCount: data.documentsCount
            };
          });
          
          results.push({
            id: session.id,
            date: session.completed_at || session.created_at,
            documentsAnalyzed: documentsAnalyzed, // COHÉRENT avec les documents traités
            globalScore: Math.round(session.global_score || 0),
            axisScores: axisScores, // CALCULÉ depuis les vraies données
            missingDocuments: analyzedDocuments
              .filter(d => (d.conformity_score || 0) < 80)
              .map(d => d.document_name), // NOM ORIGINAL
            completed: true,
            analysisResults: analyzedDocuments.map((d, index) => {
              const savedAxis = d.analysis_results?.axis || 'Axe non défini';
              // SÉCURITÉ: Garantir un des 5 axes MASE officiels (réutilise la définition locale)
              const validAxis = MASE_AXES.includes(savedAxis) ? savedAxis : MASE_AXES[index % 5];
              
              return {
                documentId: d.id,
                documentName: d.document_name, // NOM ORIGINAL du fichier
                axis: validAxis, // TOUJOURS un des 5 axes MASE officiels
                score: Math.round(d.conformity_score || 0),
                gaps: d.analysis_results?.gaps || [],
                recommendations: d.analysis_results?.recommendations || []
              };
            }),
            uploadedDocuments: analyzedDocuments.map(d => ({
              id: d.id,
              name: d.document_name, // NOM ORIGINAL du fichier
              content: '',
              type: d.document_type || 'application/pdf',
              size: d.file_size || 0,
              uploadDate: d.created_at,
              score: d.conformity_score || undefined,
              recommendations: (d.conformity_score || 0) < 80 ? 
                d.analysis_results?.recommendations : undefined
            }))
          });
          
          console.log(`✓ Session ${session.id} processed: ${documentsAnalyzed} documents, score ${session.global_score}%`);
          
        } catch (sessionError) {
          console.error(`Error processing session ${session.id}:`, sessionError);
          // Continue avec les autres sessions
        }
      }

      // Update localStorage backup
      if (isLocalStorageAvailable()) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(results.slice(0, 5)));
      }
      
      console.log(`MaseStateManager.getAuditHistory: Returning ${results.length} audit results`);
      return results;
    } catch (error) {
      console.warn('Impossible de récupérer l\'historique d\'audit:', error);
      
      // Fallback to localStorage
      if (isLocalStorageAvailable()) {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
      }
      return [];
    }
  }

  // Vérifier s'il y a eu au moins un audit complété
  static async hasCompletedAudit(): Promise<boolean> {
    try {
      const history = await this.getAuditHistory();
      return history.some(audit => audit.completed);
    } catch (error) {
      console.warn('Error checking completed audit:', error);
      return false;
    }
  }

  // Récupérer le dernier audit complété
  static async getLatestAudit(): Promise<MaseAuditResult | null> {
    try {
      const history = await this.getAuditHistory();
      console.log(`MaseStateManager.getLatestAudit: Found ${history.length} audit(s) in history`);
      const latestCompleted = history.find(audit => audit.completed);
      if (latestCompleted) {
        console.log(`Latest audit found: ${latestCompleted.id} from ${latestCompleted.date}`);
      } else {
        console.log('No completed audit found');
      }
      return latestCompleted || null;
    } catch (error) {
      console.warn('Error getting latest audit:', error);
      return null;
    }
  }

  // Obtenir les documents manquants du dernier audit
  static async getMissingDocuments(): Promise<string[]> {
    try {
      const latestAudit = await this.getLatestAudit();
      return latestAudit?.missingDocuments || [];
    } catch (error) {
      console.warn('Error getting missing documents:', error);
      return [];
    }
  }

  // Effacer l'historique (pour reset)
  static async clearHistory(): Promise<void> {
    try {
      console.log('=== STARTING AUDIT HISTORY CLEANUP ===');
      
      // Clear localStorage first
      if (isLocalStorageAvailable()) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(NAVIGATION_KEY);
        localStorage.removeItem(VIEW_MODE_KEY);
        console.log('✓ Cleared localStorage audit data');
      }
      
      // Clear from Supabase
      const supabase = createClient();
      const { data: { user }, error: getUserError } = await supabase.auth.getUser();
      
      if (getUserError) {
        console.error('Error getting current user:', getUserError);
        throw new Error(`Authentication error: ${getUserError.message}`);
      }
      
      if (!user) {
        console.warn('User not authenticated, only cleared localStorage');
        return;
      }
      
      console.log(`User authenticated: ${user.id}`);
      
      // Get all audit sessions for this user
      const auditSessions = await maseDB.getAuditSessions(user.id);
      console.log(`Found ${auditSessions.length} audit sessions to delete`);
      
      if (auditSessions.length === 0) {
        console.log('No audit sessions to delete');
        return;
      }
      
      // Use a batch delete approach for better performance and consistency
      const sessionIds = auditSessions.map(s => s.id);
      console.log('Session IDs to delete:', sessionIds);
      
      // Step 1: Delete all files from storage
      console.log('Step 1: Deleting files from storage...');
      for (const session of auditSessions) {
        try {
          const auditDocuments = await maseDB.getAuditDocuments(session.id);
          console.log(`Session ${session.id}: Found ${auditDocuments.length} documents`);
          
          // Delete files from Supabase Storage in batch
          const filePaths = auditDocuments
            .filter(doc => doc.file_path)
            .map(doc => doc.file_path!);
          
          if (filePaths.length > 0) {
            const { error: storageError } = await supabase.storage
              .from('documents')
              .remove(filePaths);
            
            if (storageError) {
              console.warn(`Storage deletion error for session ${session.id}:`, storageError);
            } else {
              console.log(`✓ Deleted ${filePaths.length} files for session ${session.id}`);
            }
          }
        } catch (storageError) {
          console.warn(`Could not delete files for session ${session.id}:`, storageError);
        }
      }
      
      // Step 2: Delete database records in correct order (FK constraints)
      console.log('Step 2: Deleting database records...');
      console.log('Sessions to delete:', sessionIds);
      
      // Check current user for RLS
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser) {
        throw new Error(`Authentication required for deletion: ${authError?.message || 'No user'}`);
      }
      console.log('Current user for deletion:', currentUser.id);
      
      // Delete audit_results first (foreign key to audit_documents)
      console.log('Deleting audit_results...');
      const { error: resultsError, count: resultsCount } = await supabase
        .from('audit_results')
        .delete({ count: 'exact' })
        .in('audit_session_id', sessionIds);
      
      if (resultsError) {
        console.error('❌ Error deleting audit_results:', resultsError);
        console.error('Error code:', resultsError.code);
        console.error('Error message:', resultsError.message);
        console.error('Error details:', resultsError.details);
        throw new Error(`Failed to delete audit results: ${resultsError.message}`);
      }
      console.log(`✓ Deleted ${resultsCount || 0} audit_results records`);
      
      // Delete audit_documents second (foreign key to audit_sessions)
      console.log('Deleting audit_documents...');
      const { error: documentsError, count: documentsCount } = await supabase
        .from('audit_documents')
        .delete({ count: 'exact' })
        .in('audit_session_id', sessionIds);
      
      if (documentsError) {
        console.error('❌ Error deleting audit_documents:', documentsError);
        console.error('Error code:', documentsError.code);
        console.error('Error message:', documentsError.message);
        console.error('Error details:', documentsError.details);
        throw new Error(`Failed to delete audit documents: ${documentsError.message}`);
      }
      console.log(`✓ Deleted ${documentsCount || 0} audit_documents records`);
      
      // Delete audit_sessions last
      console.log('Deleting audit_sessions...');
      const { error: sessionsError, count: sessionsCount } = await supabase
        .from('audit_sessions')
        .delete({ count: 'exact' })
        .in('id', sessionIds);
      
      if (sessionsError) {
        console.error('❌ Error deleting audit_sessions:', sessionsError);
        console.error('Error code:', sessionsError.code);
        console.error('Error message:', sessionsError.message);
        console.error('Error details:', sessionsError.details);
        throw new Error(`Failed to delete audit sessions: ${sessionsError.message}`);
      }
      console.log(`✓ Deleted ${sessionsCount || 0} audit_sessions records`);
      
      console.log('=== AUDIT HISTORY CLEANUP COMPLETED SUCCESSFULLY ===');
      console.log(`Summary: Deleted ${sessionsCount} sessions, ${documentsCount} documents, ${resultsCount} results`);
      
    } catch (error) {
      console.error('=== AUDIT HISTORY CLEANUP FAILED ===');
      console.error('Error during audit history cleanup:', error);
      
      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`Audit cleanup failed: ${error.message}`);
      } else {
        throw new Error('Audit cleanup failed with unknown error');
      }
    }
  }

  // Générer un ID unique pour l'audit
  static generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Gérer le mode de navigation pour la redirection MASE CHECKER -> MASE GENERATOR
  static setNavigationMode(mode: 'post-audit-direct' | null): void {
    try {
      if (mode) {
        localStorage.setItem(NAVIGATION_KEY, mode);
      } else {
        localStorage.removeItem(NAVIGATION_KEY);
      }
    } catch (error) {
      console.warn('Impossible de définir le mode de navigation:', error);
    }
  }

  // Optimisé: Configuration instantanée pour navigation directe
  static async setInstantNavigationToGenerator(): Promise<void> {
    try {
      // Préparer toutes les données nécessaires en une fois
      localStorage.setItem(NAVIGATION_KEY, 'post-audit-direct');
      // Précharger l'audit dans la cache pour accès instantané
      const latestAudit = await this.getLatestAudit();
      if (latestAudit) {
        // Marquer comme prêt pour navigation instantanée
        sessionStorage.setItem('mase_instant_nav_ready', 'true');
      }
    } catch (error) {
      console.warn('Impossible de préparer la navigation instantanée:', error);
    }
  }

  static getNavigationMode(): string | null {
    try {
      return localStorage.getItem(NAVIGATION_KEY);
    } catch (error) {
      console.warn('Impossible de récupérer le mode de navigation:', error);
      return null;
    }
  }

  static clearNavigationMode(): void {
    try {
      localStorage.removeItem(NAVIGATION_KEY);
    } catch (error) {
      console.warn('Impossible d\'effacer le mode de navigation:', error);
    }
  }

  // Gérer le mode de vue pour accéder aux résultats depuis n'importe où
  static setViewMode(mode: 'view-results' | null): void {
    try {
      if (mode) {
        localStorage.setItem(VIEW_MODE_KEY, mode);
      } else {
        localStorage.removeItem(VIEW_MODE_KEY);
      }
    } catch (error) {
      console.warn('Impossible de définir le mode de vue:', error);
    }
  }

  static getViewMode(): string | null {
    try {
      return localStorage.getItem(VIEW_MODE_KEY);
    } catch (error) {
      console.warn('Impossible de récupérer le mode de vue:', error);
      return null;
    }
  }

  static clearViewMode(): void {
    try {
      localStorage.removeItem(VIEW_MODE_KEY);
    } catch (error) {
      console.warn('Impossible d\'effacer le mode de vue:', error);
    }
  }

  // === MÉTHODES POUR MASE GENERATOR ===
  
  // Sauvegarder les résultats de génération
  static saveGenerationResults(results: MaseGenerationResult): void {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      const existingHistory = this.getGenerationHistory();
      const updatedHistory = [results, ...existingHistory.slice(0, 4)]; // Garder les 5 derniers
      localStorage.setItem(GENERATION_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.warn('Impossible de sauvegarder les résultats de génération:', error);
    }
  }

  // Récupérer l'historique des générations
  static getGenerationHistory(): MaseGenerationResult[] {
    try {
      if (typeof window === 'undefined') {
        return [];
      }
      const stored = localStorage.getItem(GENERATION_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Impossible de récupérer l\'historique de génération:', error);
      return [];
    }
  }

  // Récupérer la dernière génération
  static getLatestGeneration(): MaseGenerationResult | null {
    const history = this.getGenerationHistory();
    return history.length > 0 ? history[0] : null;
  }

  // Vérifier s'il y a une génération complétée
  static hasCompletedGeneration(): boolean {
    const history = this.getGenerationHistory();
    return history.some(gen => gen.completed);
  }

  // Effacer l'historique de génération
  static clearGenerationHistory(): void {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      localStorage.removeItem(GENERATION_KEY);
      localStorage.removeItem(GENERATION_VIEW_KEY);
    } catch (error) {
      console.warn('Impossible d\'effacer l\'historique de génération:', error);
    }
  }

  // Générer un ID unique pour la génération
  static generateGenerationId(): string {
    return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Gérer le mode de vue pour la génération
  static setGenerationViewMode(mode: 'view-results' | null): void {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      if (mode) {
        localStorage.setItem(GENERATION_VIEW_KEY, mode);
      } else {
        localStorage.removeItem(GENERATION_VIEW_KEY);
      }
    } catch (error) {
      console.warn('Impossible de définir le mode de vue génération:', error);
    }
  }

  static getGenerationViewMode(): string | null {
    try {
      if (typeof window === 'undefined') {
        return null;
      }
      return localStorage.getItem(GENERATION_VIEW_KEY);
    } catch (error) {
      console.warn('Impossible de récupérer le mode de vue génération:', error);
      return null;
    }
  }

  static clearGenerationViewMode(): void {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      localStorage.removeItem(GENERATION_VIEW_KEY);
    } catch (error) {
      console.warn('Impossible d\'effacer le mode de vue génération:', error);
    }
  }
}