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
}

export function GlobalScoreChart({ 
  globalScore, 
  totalDocuments, 
  conformeDocuments, 
  nonConformeDocuments,
  documentsRequis 
}: GlobalScoreChartProps) {
  
  // Préparer les données pour le camembert
  const data = [
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
    },
    {
      name: 'Documents Manquants',
      value: Math.max(0, documentsRequis - totalDocuments),
      color: '#f97316', // orange-500
      percentage: documentsRequis > 0 ? Math.round((Math.max(0, documentsRequis - totalDocuments) / documentsRequis) * 100) : 0
    }
  ];

  // Filtrer les données qui ont une valeur > 0
  const filteredData = data.filter(item => item.value > 0);

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
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Score Global de Conformité MASE
          {globalScore !== null && (
            <Badge variant="outline" className={scoreStatus.color}>
              {globalScore}%
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Répartition de vos documents par statut de conformité
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Graphique en camembert */}
          <div className="h-64">
            {filteredData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filteredData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {filteredData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg font-medium">Aucun document analysé</p>
                  <p className="text-sm">Effectuez votre premier audit pour voir les résultats</p>
                </div>
              </div>
            )}
          </div>

          {/* Statistiques détaillées */}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-3">Statut de Conformité</h4>
              <div className={`text-2xl font-bold ${scoreStatus.color}`}>
                {globalScore !== null ? `${globalScore}%` : 'N/A'}
              </div>
              <p className={`text-sm ${scoreStatus.color}`}>
                {scoreStatus.text}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Conformes</span>
                </div>
                <span className="font-bold text-green-600">{conformeDocuments}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">Non Conformes</span>
                </div>
                <span className="font-bold text-red-600">{nonConformeDocuments}</span>
              </div>

              {documentsRequis > totalDocuments && (
                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm font-medium">Manquants</span>
                  </div>
                  <span className="font-bold text-orange-600">{documentsRequis - totalDocuments}</span>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-t">
                <span className="text-sm font-medium">Total Documents</span>
                <span className="font-bold">{totalDocuments}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <span className="text-sm font-medium">Documents Requis</span>
                <span className="font-bold text-blue-600">{documentsRequis}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}