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

export class DashboardAnalytics {
  
  /**
   * Calcule le score global de conformité MASE
   */
  static calculateGlobalScore(): number | null {
    const auditResults = MaseStateManager.getLatestAudit();
    if (!auditResults) return null;

    // Pondération des axes MASE
    const axisWeights = {
      'Management des risques': 0.25,
      'Personnel et formation': 0.20,
      'Matériel et maintenance': 0.20,
      'Sous-traitance': 0.20,
      'Retour d\'expérience': 0.15
    };

    let totalScore = 0;
    let totalWeight = 0;

    auditResults.axisScores.forEach(axis => {
      const weight = axisWeights[axis.name as keyof typeof axisWeights] || 0;
      totalScore += axis.score * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : null;
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

    // 4. Documents non conformes (< 80%)
    if (auditResults.analysisResults) {
      const nonCompliantDocs = auditResults.analysisResults.filter(doc => doc.score < 80);
      
      if (nonCompliantDocs.length > 0) {
        actions.push({
          id: 'non-compliant-docs',
          type: 'document',
          priority: 'high',
          title: `${nonCompliantDocs.length} document(s) non conforme(s)`,
          description: 'Des documents nécessitent une amélioration ou une mise à jour',
          action: 'Générer des améliorations',
          path: '/dashboard/mase-generator',
          context: `Score moyen: ${Math.round(nonCompliantDocs.reduce((sum, doc) => sum + doc.score, 0) / nonCompliantDocs.length)}%`
        });
      }
    }

    // 5. Axes MASE déséquilibrés
    const axisScores = this.getAxisScores();
    if (axisScores) {
      const weakAxes = axisScores.filter(axis => axis.score < 80);
      
      if (weakAxes.length > 0) {
        const weakestAxis = weakAxes.reduce((min, axis) => axis.score < min.score ? axis : min);
        
        actions.push({
          id: 'weak-axis',
          type: 'axis',
          priority: 'medium',
          title: `Axe "${weakestAxis.name}" faible`,
          description: 'Cet axe MASE nécessite une attention particulière',
          action: 'Voir les recommandations',
          path: '/dashboard/mase-checker',
          context: `Score: ${weakestAxis.score}%`
        });
      }
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
      const globalScore = this.calculateGlobalScore();
      activities.push({
        id: 'audit-' + auditResults.date,
        type: 'audit',
        title: 'Audit MASE effectué',
        description: 'Analyse complète de vos documents SSE',
        timestamp: auditResults.date,
        metadata: {
          score: globalScore || undefined,
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