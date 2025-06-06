"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AlertTriangle, Shield, FileText, Calendar, ArrowRight } from "lucide-react";

interface PriorityAction {
  id: string;
  type: 'audit' | 'document' | 'profile' | 'axis';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  path: string;
  context?: string;
}

interface PriorityActionsProps {
  actions: PriorityAction[];
  auditDate?: string;
}

export function PriorityActions({ actions, auditDate }: PriorityActionsProps) {
  const router = useRouter();
  
  // Limiter à 3 actions prioritaires
  const topActions = actions.slice(0, 3);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700";
      case 'medium':
        return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700";
      case 'low':
        return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700";
      default:
        return "bg-gray-100 text-gray-600 border-gray-300";
    }
  };
  
  const getIconColor = (score?: number) => {
    if (!score) return "text-gray-500";
    if (score < 60) return "text-red-500";
    if (score < 80) return "text-yellow-500";
    return "text-green-500";
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Urgent';
      case 'medium': return 'Important';
      case 'low': return 'Optionnel';
      default: return 'Normal';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'audit':
        return Shield;
      case 'document':
        return FileText;
      case 'profile':
        return Calendar;
      case 'axis':
        return AlertTriangle;
      default:
        return ArrowRight;
    }
  };
  
  // Extraire le score de la description si c'est un document
  const extractScore = (description: string): number | null => {
    const match = description.match(/(\d+)%/);
    return match ? parseInt(match[1]) : null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span>Actions Prioritaires</span>
          </CardTitle>
          {actions.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {actions.filter(a => a.priority === 'high').length} urgentes
            </Badge>
          )}
        </div>
        {auditDate && (
          <p className="text-sm text-muted-foreground">
            Basé sur votre audit du {auditDate}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {topActions.length > 0 ? (
          <div className="space-y-3">
            {topActions.map((action) => {
              const score = extractScore(action.description);
              const Icon = getActionIcon(action.type);
              
              return (
                <div 
                  key={action.id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left side - Document info */}
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`mt-0.5 ${score !== null ? getIconColor(score) : 'text-gray-500'}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {action.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {action.context || 'Document SSE'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Right side - Priority, score, and button */}
                    <div className="flex flex-col items-end gap-2 min-w-[140px]">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(action.priority)}`}
                      >
                        {getPriorityLabel(action.priority)}
                      </Badge>
                      {score !== null && (
                        <span className={`text-lg font-bold ${
                          score < 60 ? 'text-red-600 dark:text-red-400' :
                          score < 80 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-green-600 dark:text-green-400'
                        }`}>
                          {score}%
                        </span>
                      )}
                      <Button
                        size="sm"
                        onClick={() => router.push(action.path)}
                        className="text-xs"
                      >
                        Améliorer la conformité
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Aucune action prioritaire détectée
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Effectuez un audit pour obtenir des recommandations personnalisées
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}