"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GlobalScoreChartProps {
  globalScore: number | null;
  totalDocuments: number;
  conformeDocuments: number;
  nonConformeDocuments: number;
  documentsRequis: number;
  auditScore?: number | null;
  hasAudit?: boolean;
}

export function GlobalScoreChart({ 
  globalScore, 
  totalDocuments, 
  conformeDocuments, 
  nonConformeDocuments,
  documentsRequis,
  auditScore,
  hasAudit = false
}: GlobalScoreChartProps) {
  
  // Données pour le camembert de conformité globale MASE
  const globalData = [
    {
      name: 'Documents Conformes',
      value: conformeDocuments,
      color: '#22c55e', // green-500
      percentage: documentsRequis > 0 ? Math.round((conformeDocuments / documentsRequis) * 100) : 0
    },
    {
      name: 'Documents Non Conformes',
      value: nonConformeDocuments,
      color: '#ef4444', // red-500
      percentage: documentsRequis > 0 ? Math.round((nonConformeDocuments / documentsRequis) * 100) : 0
    },
    {
      name: 'Documents Manquants',
      value: Math.max(0, documentsRequis - totalDocuments),
      color: '#f97316', // orange-500
      percentage: documentsRequis > 0 ? Math.round((Math.max(0, documentsRequis - totalDocuments) / documentsRequis) * 100) : 0
    }
  ];

  // Données pour le camembert d'audit (si disponible)
  const auditData = hasAudit ? [
    {
      name: 'Documents Conformes',
      value: conformeDocuments,
      color: '#22c55e', // green-500
      percentage: totalDocuments > 0 ? Math.round((conformeDocuments / totalDocuments) * 100) : 0
    },
    {
      name: 'Documents Non Conformes',
      value: nonConformeDocuments,
      color: '#ef4444', // red-500
      percentage: totalDocuments > 0 ? Math.round((nonConformeDocuments / totalDocuments) * 100) : 0
    }
  ] : [];

  // Filtrer les données qui ont une valeur > 0
  const filteredGlobalData = globalData.filter(item => item.value > 0);
  const filteredAuditData = auditData.filter(item => item.value > 0);

  const getScoreStatus = (score: number | null) => {
    if (score === null) return { text: "Aucun audit", color: "text-muted-foreground" };
    if (score >= 90) return { text: "Excellence MASE", color: "text-emerald-600" };
    if (score >= 80) return { text: "Conforme MASE", color: "text-green-600" };
    if (score >= 60) return { text: "En amélioration", color: "text-yellow-600" };
    return { text: "Non conforme", color: "text-red-600" };
  };

  const scoreStatus = getScoreStatus(globalScore);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">
            <span style={{ color: data.color }}>●</span> {data.value} documents ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Ne pas afficher les labels pour les très petites portions
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="16"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Camembert 1: Conformité Globale MASE */}
      <Card className="border-2 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Conformité Globale MASE
          </CardTitle>
          <CardDescription>
            Vue d'ensemble par rapport au référentiel complet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            {filteredGlobalData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filteredGlobalData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {filteredGlobalData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg font-medium">Aucune donnée disponible</p>
                  <p className="text-sm">Commencez par auditer vos documents</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {documentsRequis}
              </div>
              <p className="text-sm text-muted-foreground">Documents requis par le référentiel MASE</p>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-lg font-bold text-green-600">{conformeDocuments}</div>
                <div className="text-xs">Conformes</div>
              </div>
              <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-lg font-bold text-red-600">{nonConformeDocuments}</div>
                <div className="text-xs">Non conformes</div>
              </div>
              <div className="text-center p-2 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div className="text-lg font-bold text-orange-600">{Math.max(0, documentsRequis - totalDocuments)}</div>
                <div className="text-xs">Manquants</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Camembert 2: Conformité de l'Audit MASE */}
      <Card className={hasAudit ? "border-2 border-green-200 dark:border-green-800" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Conformité de l'Audit MASE
          </CardTitle>
          <CardDescription>
            Analyse détaillée des documents audités
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            {hasAudit && filteredAuditData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filteredAuditData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {filteredAuditData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg font-medium">Aucun audit effectué</p>
                  <p className="text-sm">Utilisez MASE CHECKER pour auditer vos documents</p>
                </div>
              </div>
            )}
          </div>
          
          {hasAudit && (
            <div className="mt-4 space-y-2">
              <div className="text-center">
                <div className={`text-3xl font-bold ${scoreStatus.color}`}>
                  {auditScore !== null ? `${auditScore}%` : 'N/A'}
                </div>
                <p className={`text-sm ${scoreStatus.color}`}>
                  {scoreStatus.text}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{conformeDocuments}</div>
                  <div className="text-xs">Conformes (≥80%)</div>
                </div>
                <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="text-lg font-bold text-red-600">{nonConformeDocuments}</div>
                  <div className="text-xs">Non conformes ({'<80%'})</div>
                </div>
              </div>
              
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg mt-2">
                <div className="text-lg font-bold">{totalDocuments}</div>
                <div className="text-xs text-muted-foreground">Documents audités</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}