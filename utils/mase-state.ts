// Utilitaire pour gérer l'état partagé entre MASE CHECKER et MASE GENERATOR

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

export class MaseStateManager {
  // Sauvegarder les résultats d'audit
  static saveAuditResults(results: MaseAuditResult): void {
    try {
      const existingHistory = this.getAuditHistory();
      const updatedHistory = [results, ...existingHistory.slice(0, 4)]; // Garder les 5 derniers
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.warn('Impossible de sauvegarder les résultats d\'audit:', error);
    }
  }

  // Récupérer l'historique des audits
  static getAuditHistory(): MaseAuditResult[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Impossible de récupérer l\'historique d\'audit:', error);
      return [];
    }
  }

  // Vérifier s'il y a eu au moins un audit complété
  static hasCompletedAudit(): boolean {
    const history = this.getAuditHistory();
    return history.some(audit => audit.completed);
  }

  // Récupérer le dernier audit complété
  static getLatestAudit(): MaseAuditResult | null {
    const history = this.getAuditHistory();
    const latestCompleted = history.find(audit => audit.completed);
    return latestCompleted || null;
  }

  // Obtenir les documents manquants du dernier audit
  static getMissingDocuments(): string[] {
    const latestAudit = this.getLatestAudit();
    return latestAudit?.missingDocuments || [];
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