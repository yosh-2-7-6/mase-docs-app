"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Shield, FileText, TrendingUp, Calendar } from "lucide-react";

interface ModuleStatusCardProps {
  module: 'checker' | 'generator';
  title: string;
  description: string;
  status: string;
  metric?: {
    value: string | number;
    label: string;
  };
  lastActivity?: string;
  actionLabel: string;
  actionPath: string;
  hasData: boolean;
  additionalInfo?: string;
}

export function ModuleStatusCard({
  module,
  title,
  description,
  status,
  metric,
  lastActivity,
  actionLabel,
  actionPath,
  hasData,
  additionalInfo
}: ModuleStatusCardProps) {
  const router = useRouter();

  const getModuleIcon = () => {
    switch (module) {
      case 'checker':
        return <Shield className="h-6 w-6" />;
      case 'generator':
        return <FileText className="h-6 w-6" />;
      default:
        return <TrendingUp className="h-6 w-6" />;
    }
  };

  const getStatusColor = () => {
    if (!hasData) {
      return "bg-gray-100 text-gray-600 border-gray-300";
    }
    
    switch (module) {
      case 'checker':
        return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700";
      case 'generator':
        return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700";
      default:
        return "bg-gray-100 text-gray-600 border-gray-300";
    }
  };

  const getButtonStyle = () => {
    switch (module) {
      case 'checker':
        return "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200";
      case 'generator':
        return "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200";
      default:
        return "";
    }
  };

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Background pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        <div className="absolute inset-0 flex items-center justify-center text-6xl">
          {getModuleIcon()}
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${module === 'checker' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'}`}>
            {getModuleIcon()}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={getStatusColor()}>
            {status}
          </Badge>
          {lastActivity && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              {lastActivity}
            </div>
          )}
        </div>

        {/* Metric */}
        {metric && (
          <div className="flex items-center justify-between py-2">
            <span className="text-2xl font-bold">{metric.value}</span>
            <span className="text-sm text-muted-foreground">{metric.label}</span>
          </div>
        )}

        {/* Additional Info */}
        {additionalInfo && (
          <p className="text-xs text-muted-foreground border-l-2 border-gray-200 pl-3 dark:border-gray-700">
            {additionalInfo}
          </p>
        )}

        {/* Action Button */}
        <Button 
          onClick={() => router.push(actionPath)}
          className={`w-full ${getButtonStyle()}`}
          size="sm"
        >
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}