// Utilitaire pour gérer l'état partagé entre MASE CHECKER et MASE GENERATOR

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
}

const STORAGE_KEY = 'mase_audit_history';
const NAVIGATION_KEY = 'mase_navigation_mode';

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
}