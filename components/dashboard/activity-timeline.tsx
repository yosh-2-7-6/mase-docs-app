"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, FileText, Settings, Calendar, Clock } from "lucide-react";

interface ActivityItem {
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

interface ActivityTimelineProps {
  activities: ActivityItem[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'audit':
        return <Shield className="h-4 w-4" />;
      case 'generation':
        return <FileText className="h-4 w-4" />;
      case 'profile':
        return <Settings className="h-4 w-4" />;
      case 'login':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'audit':
        return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300";
      case 'generation':
        return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300";
      case 'profile':
        return "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300";
      case 'login':
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} min`;
    } else if (diffInMinutes < 1440) {
      return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <Clock className="h-5 w-5 text-gray-500" />
          <span>Activité Récente</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id} className="flex items-start space-x-3">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  {index < activities.length - 1 && (
                    <div className="w-0.5 h-8 bg-gray-200 dark:bg-gray-700 mt-2" />
                  )}
                </div>

                {/* Activity content */}
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {activity.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.description}
                      </p>
                      
                      {/* Metadata */}
                      {activity.metadata && (
                        <div className="flex items-center space-x-2 mt-2">
                          {activity.metadata.score !== undefined && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                activity.metadata.score >= 80 
                                  ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700'
                                  : activity.metadata.score >= 60 
                                  ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700'
                                  : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700'
                              }`}
                            >
                              Score: {activity.metadata.score}%
                            </Badge>
                          )}
                          {activity.metadata.documentsCount && (
                            <Badge variant="outline" className="text-xs">
                              {activity.metadata.documentsCount} documents
                            </Badge>
                          )}
                          {activity.metadata.generationType && (
                            <Badge variant="outline" className="text-xs">
                              {activity.metadata.generationType}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Aucune activité récente
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Vos actions apparaîtront ici
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}