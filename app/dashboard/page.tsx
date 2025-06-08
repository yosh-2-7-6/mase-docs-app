"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardAnalytics, type SimplifiedDashboardData } from "@/utils/dashboard-analytics";
import { UserProfileManager } from "@/utils/user-profile";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PriorityActions } from "@/components/dashboard/priority-actions";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { GlobalScoreChart } from "@/components/dashboard/global-score-chart";

export default function DashboardPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<SimplifiedDashboardData | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = () => {
      try {
        const data = DashboardAnalytics.getSimplifiedDashboardData();
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

  if (isLoading || !dashboardData) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 col-span-2" />
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
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

      {/* Scores de Conformité avec 2 Camemberts */}
      <GlobalScoreChart 
        globalScore={dashboardData.globalScore}
        totalDocuments={dashboardData.existingDocuments}
        conformeDocuments={dashboardData.conformeDocuments}
        nonConformeDocuments={dashboardData.nonCompliantDocuments}
        documentsRequis={dashboardData.documentsRequis}
        auditScore={dashboardData.globalScore}
        hasAudit={dashboardData.lastAuditDate !== null}
      />

      {/* Priority Actions & Recent Activity - Limitées à 5 items */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PriorityActions 
          actions={dashboardData.priorityActions}
          auditDate={dashboardData.lastAuditDate ? DashboardAnalytics.formatDate(dashboardData.lastAuditDate) : undefined}
        />
        
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
