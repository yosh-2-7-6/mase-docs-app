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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700";
      case 'medium':
        return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700";
      case 'low':
        return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700";
      default:
        return "bg-gray-100 text-gray-600 border-gray-300";
    }
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
        return <Shield className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'profile':
        return <Calendar className="h-4 w-4" />;
      case 'axis':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <ArrowRight className="h-4 w-4" />;
    }
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
        {actions.length > 0 ? (
          <div className="space-y-3">
            {actions.map((action) => (
              <div 
                key={action.id}
                className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                <div className={`p-2 rounded-lg ${
                  action.type === 'audit' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' :
                  action.type === 'document' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' :
                  'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300'
                }`}>
                  {getActionIcon(action.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium truncate">{action.title}</h4>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(action.priority)}`}
                    >
                      {getPriorityLabel(action.priority)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {action.description}
                  </p>
                  {action.context && (
                    <p className="text-xs text-muted-foreground italic mb-2">
                      {action.context}
                    </p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(action.path)}
                    className="text-xs h-7"
                  >
                    {action.action}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
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