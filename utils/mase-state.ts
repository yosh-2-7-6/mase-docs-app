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
      // Get current user
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('User not authenticated, cannot save audit results');
        return;
      }

      // Save to database
      const auditSession: Omit<AuditSession, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user.id,
        session_name: `Audit du ${new Date(results.date).toLocaleDateString()}`,
        status: results.completed ? 'completed' : 'analysis',
        global_score: results.globalScore,
        axis_scores: results.axisScores.reduce((acc, axis) => {
          acc[axis.name] = axis.score;
          return acc;
        }, {} as Record<string, number>),
        uploaded_documents_count: results.documentsAnalyzed,
        analyzed_documents_count: results.documentsAnalyzed
      };

      await maseDB.createAuditSession(auditSession);

      // Backup to localStorage for offline access
      if (isLocalStorageAvailable()) {
        const existingHistory = await this.getAuditHistory();
        const updatedHistory = [results, ...existingHistory.slice(0, 4)];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
      }
    } catch (error) {
      console.warn('Impossible de sauvegarder les résultats d\'audit:', error);
      
      // Fallback to localStorage only
      if (isLocalStorageAvailable()) {
        const existingHistory = await this.getAuditHistory();
        const updatedHistory = [results, ...existingHistory.slice(0, 4)];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
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
      
      // Convert to MaseAuditResult format
      const results: MaseAuditResult[] = auditSessions.map(session => ({
        id: session.id,
        date: session.created_at,
        documentsAnalyzed: session.analyzed_documents_count,
        globalScore: session.global_score || 0,
        axisScores: Object.entries(session.axis_scores).map(([name, score]) => ({
          name,
          score,
          documentsCount: 0 // This would need to be calculated from audit_documents
        })),
        missingDocuments: [], // This would need to be calculated from analysis
        completed: session.status === 'completed'
      }));

      // Update localStorage backup
      if (isLocalStorageAvailable()) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(results.slice(0, 5)));
      }

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
      const latestCompleted = history.find(audit => audit.completed);
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
  static clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Impossible d\'effacer l\'historique:', error);
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