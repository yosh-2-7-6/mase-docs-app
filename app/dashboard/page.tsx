"use client";

import { useEffect, useState } from "react";
import { ComplianceGauge } from "@/components/dashboard/compliance-gauge";
import { ModuleStatusCard } from "@/components/dashboard/module-status-card";
import { AxisProgressBars } from "@/components/dashboard/axis-progress-bars";
import { PriorityActions } from "@/components/dashboard/priority-actions";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { DashboardAnalytics, type DashboardData } from "@/utils/dashboard-analytics";
import { UserProfileManager } from "@/utils/user-profile";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MaseStateManager } from "@/utils/mase-state";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = () => {
      try {
        const data = DashboardAnalytics.getDashboardData();
        const profile = UserProfileManager.getUserProfile();
        
        setDashboardData(data);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();

    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleAxisClick = (axisName: string) => {
    // Set view mode to show axis details in MASE CHECKER
    MaseStateManager.setViewMode('view-results');
    window.location.href = '/dashboard/mase-checker';
  };

  if (isLoading || !dashboardData) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard MASE</h1>
            <p className="text-muted-foreground">
              {userProfile?.companyName || 'Votre'} tableau de bord conformité MASE
            </p>
          </div>
          {dashboardData.lastAuditDate && (
            <Badge variant="outline" className="text-xs">
              Dernier audit : {DashboardAnalytics.getTimeAgo(dashboardData.lastAuditDate)}
            </Badge>
          )}
        </div>
      </div>

      {/* Top Section - Global Score & Module Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Compliance Gauge */}
        <div className="lg:col-span-1">
          <ComplianceGauge 
            score={dashboardData.globalScore}
            lastAuditDate={dashboardData.lastAuditDate ? DashboardAnalytics.formatDate(dashboardData.lastAuditDate) : undefined}
          />
        </div>

        {/* Module Status Cards */}
        <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
          <ModuleStatusCard
            module="checker"
            title="MASE CHECKER"
            description="Audit de conformité SSE"
            status={dashboardData.checkerData.status}
            metric={dashboardData.checkerData.metric}
            lastActivity={dashboardData.checkerData.lastActivity ? DashboardAnalytics.getTimeAgo(dashboardData.checkerData.lastActivity) : undefined}
            actionLabel={dashboardData.checkerData.hasData ? "Voir les résultats" : "Commencer l'audit"}
            actionPath="/dashboard/mase-checker"
            hasData={dashboardData.checkerData.hasData}
            additionalInfo={dashboardData.checkerData.additionalInfo}
          />
          
          <ModuleStatusCard
            module="generator"
            title="MASE GENERATOR"
            description="Génération de documents"
            status={dashboardData.generatorData.status}
            metric={dashboardData.generatorData.metric}
            lastActivity={dashboardData.generatorData.lastActivity ? DashboardAnalytics.getTimeAgo(dashboardData.generatorData.lastActivity) : undefined}
            actionLabel={dashboardData.generatorData.hasData ? "Nouvelle génération" : "Commencer la génération"}
            actionPath="/dashboard/mase-generator"
            hasData={dashboardData.generatorData.hasData}
            additionalInfo={dashboardData.generatorData.additionalInfo}
          />
        </div>
      </div>

      {/* Middle Section - Axis Progress & Priority Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AxisProgressBars 
          axisScores={dashboardData.axisScores}
          onAxisClick={handleAxisClick}
        />
        
        <PriorityActions 
          actions={dashboardData.priorityActions}
          auditDate={dashboardData.lastAuditDate ? DashboardAnalytics.formatDate(dashboardData.lastAuditDate) : undefined}
        />
      </div>

      {/* Bottom Section - Activity Timeline */}
      <div className="grid gap-6">
        <ActivityTimeline activities={dashboardData.recentActivity} />
      </div>

      {/* Welcome Message for New Users */}
      {!dashboardData.lastAuditDate && (!userProfile || !userProfile.isOnboardingCompleted) && (
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold mb-2">Bienvenue sur MASE DOCS ! 👋</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Pour commencer votre parcours vers la conformité MASE, nous vous recommandons de :
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600 dark:text-blue-400">1.</span>
              <span className="text-sm">Compléter votre profil entreprise dans les paramètres</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600 dark:text-green-400">2.</span>
              <span className="text-sm">Effectuer votre premier audit avec MASE CHECKER</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
