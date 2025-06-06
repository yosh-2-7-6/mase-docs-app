"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface AxisScore {
  name: string;
  score: number;
  color: string;
}

interface AxisProgressBarsProps {
  axisScores: AxisScore[] | null;
  onAxisClick?: (axisName: string) => void;
}

export function AxisProgressBars({ axisScores, onAxisClick }: AxisProgressBarsProps) {
  const defaultAxes = [
    { name: "Management des risques", score: 0, color: "gray" },
    { name: "Personnel et formation", score: 0, color: "gray" },
    { name: "Matériel et maintenance", score: 0, color: "gray" },
    { name: "Sous-traitance", score: 0, color: "gray" },
    { name: "Retour d'expérience", score: 0, color: "gray" }
  ];

  const axes = axisScores || defaultAxes;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700";
    if (score >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700";
    if (score > 0) return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700";
    return "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Conformité par Axe MASE
          {axisScores && (
            <Badge variant="outline" className="text-xs">
              {axes.filter(axis => axis.score >= 80).length}/5 conformes
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {axes.map((axis, index) => (
          <div 
            key={index}
            className={`space-y-2 p-3 rounded-lg border transition-colors duration-200 ${
              onAxisClick && axis.score > 0 
                ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700' 
                : 'border-gray-100 dark:border-gray-800'
            }`}
            onClick={() => onAxisClick && axis.score > 0 && onAxisClick(axis.name)}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate pr-2">{axis.name}</span>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getBadgeColor(axis.score)}`}
                >
                  {axis.score > 0 ? `${axis.score}%` : '—'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-1">
              <Progress 
                value={axis.score} 
                className="h-2"
                style={{
                  '--progress-color': axis.score >= 80 ? '#10b981' : axis.score >= 60 ? '#f59e0b' : axis.score > 0 ? '#ef4444' : '#6b7280'
                } as React.CSSProperties}
              />
              {axis.score < 80 && axis.score > 0 && (
                <p className="text-xs text-muted-foreground">
                  Amélioration recommandée
                </p>
              )}
            </div>
          </div>
        ))}
        
        {!axisScores && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Effectuez un audit pour voir la conformité par axe
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}