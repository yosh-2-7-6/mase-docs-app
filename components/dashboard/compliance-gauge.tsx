"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ComplianceGaugeProps {
  score: number | null;
  lastAuditDate?: string;
}

export function ComplianceGauge({ score, lastAuditDate }: ComplianceGaugeProps) {
  const getStatusInfo = (score: number | null) => {
    if (score === null) {
      return {
        status: "Aucun audit",
        color: "bg-gray-400",
        textColor: "text-gray-600",
        bgColor: "bg-gray-100",
        borderColor: "border-gray-300"
      };
    }
    
    if (score >= 90) {
      return {
        status: "Excellence MASE",
        color: "bg-emerald-600",
        textColor: "text-emerald-800",
        bgColor: "bg-emerald-100",
        borderColor: "border-emerald-300"
      };
    }
    if (score >= 80) {
      return {
        status: "Conforme MASE",
        color: "bg-green-600",
        textColor: "text-green-800",
        bgColor: "bg-green-100",
        borderColor: "border-green-300"
      };
    }
    if (score >= 60) {
      return {
        status: "En amélioration",
        color: "bg-yellow-500",
        textColor: "text-yellow-800",
        bgColor: "bg-yellow-100",
        borderColor: "border-yellow-300"
      };
    }
    return {
      status: "Non conforme",
      color: "bg-red-500",
      textColor: "text-red-800",
      bgColor: "bg-red-100",
      borderColor: "border-red-300"
    };
  };

  const statusInfo = getStatusInfo(score);

  // Calculate the stroke-dasharray for the circular progress
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = score !== null 
    ? circumference - (score / 100) * circumference 
    : circumference;

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-8">
        <div className="flex flex-col items-center space-y-6">
          {/* Circular Progress */}
          <div className="relative">
            <svg
              className="transform -rotate-90 w-64 h-64"
              width="256"
              height="256"
            >
              {/* Background circle */}
              <circle
                cx="128"
                cy="128"
                r={radius}
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* Progress circle */}
              {score !== null && (
                <circle
                  cx="128"
                  cy="128"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeLinecap="round"
                  className={statusInfo.color.replace('bg-', 'text-')}
                  style={{
                    strokeDasharray,
                    strokeDashoffset,
                    transition: 'stroke-dashoffset 1s ease-in-out',
                  }}
                />
              )}
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                {score !== null ? `${score}%` : '—'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Score global
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex flex-col items-center space-y-2">
            <Badge 
              variant="outline" 
              className={`${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor} px-4 py-2 text-sm font-medium`}
            >
              {statusInfo.status}
            </Badge>
            
            {lastAuditDate && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Dernier audit : {lastAuditDate}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}