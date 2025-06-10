"use client";

import { MaseStateManager, type MaseGenerationResult } from './mase-state';
import { UserProfileManager } from './user-profile';

// Interfaces pour le dashboard
export interface DashboardData {
  globalScore: number | null;
  maseStatus: string;
  lastAuditDate: string | null;
  axisScores: AxisScore[] | null;
  checkerData: ModuleData;
  generatorData: ModuleData;
  priorityActions: PriorityAction[];
  recentActivity: ActivityItem[];
}

export interface AxisScore {
  name: string;
  score: number;
  color: string;
}

export interface ModuleData {
  hasData: boolean;
  status: string;
  metric?: {
    value: string | number;
    label: string;
  };
  lastActivity?: string;
  additionalInfo?: string;
}

export interface PriorityAction {
  id: string;
  type: 'audit' | 'document' | 'profile' | 'axis';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  path: string;
  context?: string;
}

export interface ActivityItem {
  id: string;
  type: 'audit' | 'generation' | 'profile' | 'login';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    score?: number;
    documentsCount?: number;
    generationType?: string;
  };
}

export interface SimplifiedDashboardData {
  globalScore: number | null;
  auditScore: number | null;  // Score d'audit réel calculé dans MASE CHECKER
  maseStatus: string;
  lastAuditDate: string | null;
  existingDocuments: number;
  missingDocuments: number;
  nonCompliantDocuments: number;
  conformeDocuments: number;
  documentsRequis: number;
  axisScores: AxisScore[] | null;  // Scores des 5 axes MASE
  priorityActions: PriorityAction[];
  recentActivity: ActivityItem[];
}

export class DashboardAnalytics {
  
  /**
   * Récupère le score global de l'audit MASE (calculé dans MASE CHECKER)
   */
  static getAuditGlobalScore(): number | null {
    const auditResults = MaseStateManager.getLatestAudit();
    if (!auditResults) return null;
    
    // Utilise directement le score calculé dans MASE CHECKER
    return auditResults.globalScore;
  }

  /**
   * Calcule le score global de conformité MASE (pour la conformité globale)
   */
  static calculateGlobalScore(): number | null {
    const auditResults = MaseStateManager.getLatestAudit();
    if (!auditResults) return null;

    // Pour la conformité globale MASE, on utilise le score d'audit
    // mais cela pourrait être ajusté avec d'autres facteurs à l'avenir
    return auditResults.globalScore;
  }

  /**
   * Détermine le statut MASE basé sur le score global
   */
  static getMaseStatus(globalScore: number | null): string {
    if (globalScore === null) return "Aucun audit";
    
    if (globalScore >= 90) return "Excellence MASE";
    if (globalScore >= 80) return "Conforme MASE";
    if (globalScore >= 60) return "En amélioration";
    return "Non conforme";
  }

  /**
   * Récupère les scores par axe MASE
   */
  static getAxisScores(): AxisScore[] | null {
    const auditResults = MaseStateManager.getLatestAudit();
    if (!auditResults) return null;

    return auditResults.axisScores.map(axis => ({
      name: axis.name,
      score: axis.score,
      color: axis.score >= 80 ? 'green' : axis.score >= 60 ? 'yellow' : 'red'
    }));
  }

  /**
   * Analyse les données du module MASE CHECKER
   */
  static getCheckerModuleData(): ModuleData {
    const auditResults = MaseStateManager.getLatestAudit();
    
    if (!auditResults) {
      return {
        hasData: false,
        status: "Aucun audit effectué",
        additionalInfo: "Commencez par analyser vos documents SSE"
      };
    }

    const globalScore = this.calculateGlobalScore();
    const documentCount = auditResults.analysisResults?.length || 0;
    
    return {
      hasData: true,
      status: "Audit disponible",
      metric: {
        value: globalScore ? `${globalScore}%` : '—',
        label: "Score global"
      },
      lastActivity: auditResults.date,
      additionalInfo: `${documentCount} documents analysés`
    };
  }

  /**
   * Analyse les données du module MASE GENERATOR
   */
  static getGeneratorModuleData(): ModuleData {
    const generationHistory = MaseStateManager.getGenerationHistory();
    
    if (generationHistory.length === 0) {
      return {
        hasData: false,
        status: "Aucune génération",
        additionalInfo: "Générez vos premiers documents conformes"
      };
    }

    const latestGeneration = generationHistory[0];
    const thisMonthGenerations = generationHistory.filter(gen => {
      const genDate = new Date(gen.date);
      const now = new Date();
      return genDate.getMonth() === now.getMonth() && genDate.getFullYear() === now.getFullYear();
    });

    return {
      hasData: true,
      status: "Documents générés",
      metric: {
        value: thisMonthGenerations.reduce((sum, gen) => sum + gen.documentsGenerated.length, 0),
        label: "Documents ce mois"
      },
      lastActivity: latestGeneration.date,
      additionalInfo: `Dernière génération: ${latestGeneration.generationType}`
    };
  }

  /**
   * Génère les actions prioritaires basées sur l'analyse
   */
  static generatePriorityActions(): PriorityAction[] {
    const actions: PriorityAction[] = [];
    const auditResults = MaseStateManager.getLatestAudit();
    const userProfile = UserProfileManager.getUserProfile();

    // 1. Profil incomplet
    if (!userProfile || !userProfile.isOnboardingCompleted) {
      actions.push({
        id: 'profile-incomplete',
        type: 'profile',
        priority: 'medium',
        title: 'Compléter votre profil',
        description: 'Renseignez vos informations pour des recommandations personnalisées',
        action: 'Compléter le profil',
        path: '/dashboard/settings'
      });
    }

    // 2. Aucun audit récent
    if (!auditResults) {
      actions.push({
        id: 'no-audit',
        type: 'audit',
        priority: 'high',
        title: 'Effectuer votre premier audit',
        description: 'Analysez vos documents SSE pour connaître votre niveau de conformité',
        action: 'Commencer l\'audit',
        path: '/dashboard/mase-checker'
      });
      return actions;
    }

    // 3. Audit ancien (plus de 6 mois)
    const auditDate = new Date(auditResults.date);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    if (auditDate < sixMonthsAgo) {
      actions.push({
        id: 'old-audit',
        type: 'audit',
        priority: 'medium',
        title: 'Audit obsolète',
        description: 'Votre dernier audit date de plus de 6 mois',
        action: 'Nouvel audit',
        path: '/dashboard/mase-checker',
        context: `Dernier audit: ${auditResults.date}`
      });
    }

    // 4. Documents non conformes (< 80%) - Affichage individuel
    if (auditResults.analysisResults) {
      const nonCompliantDocs = auditResults.analysisResults
        .filter(doc => doc.score < 80)
        .sort((a, b) => a.score - b.score); // Tri croissant (pires en premier)
      
      // Ajouter chaque document non conforme individuellement
      nonCompliantDocs.forEach((doc, index) => {
        actions.push({
          id: `doc-${doc.documentId || index}`,
          type: 'document',
          priority: doc.score < 60 ? 'high' : 'medium',
          title: doc.documentName,
          description: `Score de conformité: ${doc.score}%`,
          action: 'Améliorer la conformité',
          path: '/dashboard/mase-generator',
          context: doc.axis || 'Document SSE'
        });
      });
    }

    // Limiter à 5 actions maximum, triées par priorité
    return actions
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 5);
  }

  /**
   * Récupère l'activité récente
   */
  static getRecentActivity(): ActivityItem[] {
    const activities: ActivityItem[] = [];
    
    // Activité d'audit
    const auditResults = MaseStateManager.getLatestAudit();
    if (auditResults) {
      const auditScore = this.getAuditGlobalScore(); // Utilise le vrai score d'audit
      activities.push({
        id: 'audit-' + auditResults.date,
        type: 'audit',
        title: 'Audit MASE effectué',
        description: 'Analyse complète de vos documents SSE',
        timestamp: auditResults.date,
        metadata: {
          score: auditScore || undefined,
          documentsCount: auditResults.analysisResults?.length
        }
      });
    }

    // Activité de génération
    const generationHistory = MaseStateManager.getGenerationHistory();
    generationHistory.forEach(generation => {
      activities.push({
        id: 'generation-' + generation.id,
        type: 'generation',
        title: 'Documents générés',
        description: `Génération ${generation.generationType} de documents MASE`,
        timestamp: generation.date,
        metadata: {
          documentsCount: generation.documentsGenerated.length,
          generationType: generation.generationType
        }
      });
    });

    // Activité de profil
    const userProfile = UserProfileManager.getUserProfile();
    if (userProfile && userProfile.updatedAt) {
      activities.push({
        id: 'profile-' + userProfile.updatedAt,
        type: 'profile',
        title: 'Profil mis à jour',
        description: 'Informations de l\'entreprise modifiées',
        timestamp: userProfile.updatedAt
      });
    }

    // Trier par date décroissante et limiter à 10
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }

  /**
   * Compile toutes les données du dashboard
   */
  static getDashboardData(): DashboardData {
    const globalScore = this.calculateGlobalScore();
    const auditResults = MaseStateManager.getLatestAudit();
    
    return {
      globalScore,
      maseStatus: this.getMaseStatus(globalScore),
      lastAuditDate: auditResults?.date || null,
      axisScores: this.getAxisScores(),
      checkerData: this.getCheckerModuleData(),
      generatorData: this.getGeneratorModuleData(),
      priorityActions: this.generatePriorityActions(),
      recentActivity: this.getRecentActivity()
    };
  }

  /**
   * Formate une date en format français
   */
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Compile les données simplifiées du dashboard
   */
  static getSimplifiedDashboardData(): SimplifiedDashboardData {
    const globalScore = this.calculateGlobalScore();
    const auditScore = this.getAuditGlobalScore(); // Vrai score d'audit
    const auditResults = MaseStateManager.getLatestAudit();
    
    let existingDocuments = 0;
    let missingDocuments = 0;
    let nonCompliantDocuments = 0;
    let conformeDocuments = 0;
    const documentsRequis = 20; // Nombre total de documents dans le référentiel MASE (15 requis + 5 optionnels)
    
    if (auditResults && auditResults.analysisResults) {
      existingDocuments = auditResults.analysisResults.length;
      nonCompliantDocuments = auditResults.analysisResults.filter(doc => doc.score < 80).length;
      conformeDocuments = auditResults.analysisResults.filter(doc => doc.score >= 80).length;
      
      // Calcul des documents manquants
      missingDocuments = Math.max(0, documentsRequis - existingDocuments);
    } else {
      // Si aucun audit, tous les documents sont manquants
      missingDocuments = documentsRequis;
    }
    
    return {
      globalScore,
      auditScore, // Ajouter le vrai score d'audit
      maseStatus: this.getMaseStatus(globalScore),
      lastAuditDate: auditResults?.date || null,
      existingDocuments,
      missingDocuments,
      nonCompliantDocuments,
      conformeDocuments,
      documentsRequis,
      axisScores: this.getAxisScores(), // Ajouter les scores des axes
      priorityActions: this.generatePriorityActions().slice(0, 5), // Limiter à 5
      recentActivity: this.getRecentActivity().slice(0, 5) // Limiter à 5
    };
  }
  
  /**
   * Calcule le temps écoulé depuis une date
   */
  static getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Aujourd'hui";
    if (diffInDays === 1) return "Hier";
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
    if (diffInDays < 30) return `Il y a ${Math.floor(diffInDays / 7)} semaines`;
    if (diffInDays < 365) return `Il y a ${Math.floor(diffInDays / 30)} mois`;
    return `Il y a ${Math.floor(diffInDays / 365)} ans`;
  }
}