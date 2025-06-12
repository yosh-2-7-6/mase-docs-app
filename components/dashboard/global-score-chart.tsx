"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, LabelList } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

interface AxisScore {
  name: string;
  score: number;
  color: string;
}

interface GlobalScoreChartProps {
  globalScore: number | null;
  totalDocuments: number;
  conformeDocuments: number;
  nonConformeDocuments: number;
  documentsRequis: number;
  auditScore?: number | null;
  hasAudit?: boolean;
  axisScores?: AxisScore[] | null;
}

export function GlobalScoreChart({ 
  globalScore, 
  totalDocuments, 
  conformeDocuments, 
  nonConformeDocuments,
  documentsRequis,
  auditScore,
  hasAudit = false,
  axisScores = null
}: GlobalScoreChartProps) {
  
  // État pour gérer le rendu côté client
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Debug: Afficher les données reçues et les valeurs calculées
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== GlobalScoreChart Debug ===');
      console.log('Props reçues:');
      console.log('  hasAudit:', hasAudit);
      console.log('  globalScore:', globalScore);
      console.log('  totalDocuments:', totalDocuments);
      console.log('  conformeDocuments:', conformeDocuments);
      console.log('  nonConformeDocuments:', nonConformeDocuments);
      console.log('  documentsRequis:', documentsRequis);
      console.log('  auditScore:', auditScore);
      console.log('  axisScores:', axisScores);
      
      if (axisScores) {
        console.log('axisScores détaillé:');
        axisScores.forEach((axis, index) => {
          console.log(`  Axe ${index + 1}: ${axis.name} = ${axis.score} (type: ${typeof axis.score}, isNaN: ${isNaN(axis.score)})`);
        });
      }
    }
  }, [hasAudit, axisScores, auditScore, globalScore, totalDocuments, conformeDocuments, nonConformeDocuments, documentsRequis]);
  
  // ===== ÉTAPE 1: FONCTIONS UTILITAIRES (déclarées en premier) =====
  
  // Validation et nettoyage des valeurs numériques pour éviter NaN
  const safeNumber = (value: number | null | undefined, defaultValue: number = 0): number => {
    if (value === null || value === undefined || isNaN(value)) {
      return defaultValue;
    }
    return Math.round(value);
  };
  
  // ===== ÉTAPE 2: DONNÉES DE TEST =====
  
  // Données de test si aucun audit disponible (pour debugging)
  const testAxisScores = [
    { name: 'Engagement de la direction', score: 85, color: 'green' },
    { name: 'Compétences et qualifications', score: 72, color: 'yellow' },
    { name: 'Préparation et organisation des interventions', score: 68, color: 'yellow' },
    { name: 'Réalisation des interventions', score: 91, color: 'green' },
    { name: 'Retour d\'expérience et amélioration continue', score: 55, color: 'red' }
  ];
  
  // ===== ÉTAPE 3: FONCTIONS DE NETTOYAGE =====
  
  // Liste des 5 axes MASE officiels
  const MASE_AXES_NAMES = [
    'Engagement de la direction',
    'Compétences et qualifications',
    'Préparation et organisation des interventions',
    'Réalisation des interventions',
    'Retour d\'expérience et amélioration continue'
  ];

  // Nettoyer et valider les données d'axisScores pour éviter les erreurs NaN
  const cleanAxisScores = (scores: AxisScore[] | null): AxisScore[] => {
    // Toujours retourner les 5 axes MASE
    const result: AxisScore[] = MASE_AXES_NAMES.map((axisName, index) => {
      // Chercher le score correspondant dans les données fournies
      const foundAxis = scores?.find(s => s.name === axisName);
      
      if (foundAxis) {
        const originalScore = foundAxis.score;
        let cleanedScore = -1; // -1 pour N/A
        
        if (originalScore === null || originalScore === undefined || originalScore < 0) {
          cleanedScore = -1; // N/A
        } else if (isNaN(originalScore)) {
          console.warn(`⚠️ NaN detected in axis ${axisName}, setting to N/A`);
          cleanedScore = -1;
        } else {
          cleanedScore = Math.min(100, Math.round(originalScore));
        }
        
        return {
          name: axisName,
          score: cleanedScore,
          color: cleanedScore >= 0 ? (cleanedScore >= 80 ? 'green' : cleanedScore >= 60 ? 'yellow' : 'red') : 'gray'
        };
      } else {
        // Axe non trouvé dans les données, afficher N/A
        return {
          name: axisName,
          score: -1, // -1 pour N/A
          color: 'gray'
        };
      }
    });
    
    console.log('Cleaned axis scores with all 5 MASE axes:', result);
    return result;
  };
  
  // ===== ÉTAPE 4: TRAITEMENT DES DONNÉES =====
  
  // Utiliser les vraies données d'audit nettoyées ou les données de test si pas d'audit
  const displayAxisScores = cleanAxisScores(axisScores);
  
  // Debug: Vérifier les données nettoyées avant envoi au BarChart
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== displayAxisScores après nettoyage ===');
      console.log('displayAxisScores.length:', displayAxisScores.length);
      displayAxisScores.forEach((axis, index) => {
        console.log(`  Axe ${index + 1}: ${axis.name} = ${axis.score} (type: ${typeof axis.score}, isNaN: ${isNaN(axis.score)}, isNumber: ${typeof axis.score === 'number'})`);
        // Test la valeur après mapping pour BarChart
        const mappedScore = safeNumber(axis.score, 0);
        console.log(`    → Après safeNumber: ${mappedScore} (isNaN: ${isNaN(mappedScore)})`);
      });
    }
  }, [displayAxisScores]);
  
  // Si on n'est pas côté client, ne pas afficher les graphiques
  if (!isClient) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Conformité Globale MASE
            </CardTitle>
            <CardDescription>Vue d'ensemble de votre conformité MASE</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p>Chargement...</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Conformité de l'Audit MASE
            </CardTitle>
            <CardDescription>Analyse détaillée des documents audités</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p>Chargement...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // ===== ÉTAPE 5: CALCULS SÉCURISÉS POUR L'AFFICHAGE =====
  
  // Calcul du pourcentage de conformité globale MASE
  // Seuls les documents conformes comptent pour la conformité globale
  const safeConformeDocuments = safeNumber(conformeDocuments, 0);
  const safeNonConformeDocuments = safeNumber(nonConformeDocuments, 0);
  const safeTotalDocuments = safeNumber(totalDocuments, 0);
  const safeDocumentsRequis = safeNumber(documentsRequis, 1); // Au moins 1 pour éviter division par 0
  const safeGlobalScore = safeNumber(globalScore);
  const safeAuditScore = safeNumber(auditScore);
  
  const globalCompliance = safeDocumentsRequis > 0 ? Math.round((safeConformeDocuments / safeDocumentsRequis) * 100) : 0;
  
  // ===== ÉTAPE 6: FONCTIONS UTILITAIRES POUR L'AFFICHAGE =====
  
  const getScoreStatus = (score: number | null) => {
    if (score === null) return { text: "Aucun audit", color: "text-muted-foreground" };
    if (score >= 90) return { text: "Excellence MASE", color: "text-emerald-600" };
    if (score >= 80) return { text: "Conforme MASE", color: "text-green-600" };
    if (score >= 60) return { text: "En amélioration", color: "text-yellow-600" };
    return { text: "Non conforme", color: "text-red-600" };
  };

  const scoreStatus = getScoreStatus(safeGlobalScore);
  
  // Générer les couleurs pour les 5 axes MASE
  const axisColors = [
    '#3b82f6', // blue-500 - Engagement de la direction
    '#10b981', // emerald-500 - Compétences et qualifications 
    '#f59e0b', // amber-500 - Préparation et organisation
    '#ef4444', // red-500 - Réalisation des interventions
    '#8b5cf6'  // violet-500 - Retour d'expérience
  ];
  
  // ===== ÉTAPE 7: PRÉPARATION DES DONNÉES POUR LES GRAPHIQUES =====

  // Données pour le camembert de conformité globale MASE (utiliser les valeurs safe)
  const globalData = [
    {
      name: 'Documents Conformes',
      value: safeConformeDocuments,
      color: '#22c55e', // green-500
      percentage: safeDocumentsRequis > 0 ? Math.round((safeConformeDocuments / safeDocumentsRequis) * 100) : 0
    },
    {
      name: 'Documents Non Conformes',
      value: safeNonConformeDocuments,
      color: '#ef4444', // red-500
      percentage: safeDocumentsRequis > 0 ? Math.round((safeNonConformeDocuments / safeDocumentsRequis) * 100) : 0
    },
    {
      name: 'Documents Manquants',
      value: Math.max(0, safeDocumentsRequis - safeTotalDocuments),
      color: '#f97316', // orange-500
      percentage: safeDocumentsRequis > 0 ? Math.round((Math.max(0, safeDocumentsRequis - safeTotalDocuments) / safeDocumentsRequis) * 100) : 0
    }
  ];

  // Données pour le camembert des 5 axes MASE (si audit disponible)
  const auditedDocuments = safeConformeDocuments + safeNonConformeDocuments;
  
  const auditData = hasAudit && axisScores && axisScores.length > 0 ? 
    axisScores.map((axis, index) => {
      const safeScore = safeNumber(axis.score, 0);
      return {
        name: axis.name,
        value: Math.max(safeScore, 1), // Assurer une valeur minimum pour l'affichage
        score: safeScore, // Score réel nettoyé pour l'affichage
        color: axisColors[index] || '#6b7280', // gray-500 fallback
        percentage: safeScore,
        shortName: `Axe ${index + 1}` // Nom court pour l'affichage
      };
    }).filter(axis => axis.score >= 0) // Filtrer les axes avec score valide
    : [];

  // Filtrer les données qui ont une valeur > 0
  const filteredGlobalData = globalData.filter(item => item.value > 0);
  const filteredAuditData = auditData.filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      // Tooltip différent selon le type de camembert
      if (data.shortName) {
        // Camembert des axes MASE
        return (
          <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
            <p className="font-medium">{data.shortName}</p>
            <p className="text-xs text-muted-foreground mb-1">{data.name}</p>
            <p className="text-sm font-bold">
              <span style={{ color: data.color }}>●</span> Score: {data.score}%
            </p>
          </div>
        );
      } else {
        // Camembert global (documents)
        return (
          <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
            <p className="font-medium">{data.name}</p>
            <p className="text-sm">
              <span style={{ color: data.color }}>●</span> {data.value} documents ({data.percentage}%)
            </p>
          </div>
        );
      }
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
                {globalCompliance}%
              </div>
              <p className="text-sm text-muted-foreground">Conformité globale MASE</p>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-lg font-bold text-green-600">{safeConformeDocuments}</div>
                <div className="text-xs">Conformes</div>
              </div>
              <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-lg font-bold text-red-600">{safeNonConformeDocuments}</div>
                <div className="text-xs">Non conformes</div>
              </div>
              <div className="text-center p-2 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div className="text-lg font-bold text-orange-600">{Math.max(0, safeDocumentsRequis - safeTotalDocuments)}</div>
                <div className="text-xs">Manquants</div>
              </div>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">{safeDocumentsRequis} documents requis par le référentiel MASE</p>
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
            {displayAxisScores && displayAxisScores.length > 0 ? (
              (() => {
                try {
                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                  data={displayAxisScores.map((axis, index) => {
                    const safeMappedScore = axis.score;
                    const isNA = safeMappedScore < 0;
                    
                    return {
                      name: `Axe ${index + 1}`,
                      fullName: axis.name,
                      score: isNA ? 1 : safeMappedScore, // 1 au lieu de 0 pour avoir une petite barre visible
                      actualScore: isNA ? 0 : safeMappedScore, // Score réel pour l'affichage
                      displayScore: isNA ? 'N/A' : `${safeMappedScore}%`,
                      isNA: isNA,
                      color: isNA ? '#e5e7eb' : axisColors[index]
                    };
                  })}
                  margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                >
                  <XAxis 
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-xs text-muted-foreground mb-1">{data.fullName}</p>
                            <p className="text-sm font-bold">
                              Score: {data.isNA ? 'N/A' : `${data.actualScore}%`}
                            </p>
                            {data.isNA && (
                              <p className="text-xs text-muted-foreground mt-1">Aucun document audité pour cet axe</p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="score" 
                    radius={[4, 4, 0, 0]}
                  >
                    {displayAxisScores.map((axis, index) => (
                      <Cell key={`cell-${index}`} fill={axis.score < 0 ? '#e5e7eb' : axisColors[index]} />
                    ))}
                    <LabelList 
                      dataKey="displayScore"
                      position="top"
                      style={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                  </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  );
                } catch (error) {
                  console.error('❌ Erreur dans BarChart, utilisation des données de test:', error);
                  // En cas d'erreur persistante, utiliser les données de test
                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={MASE_AXES_NAMES.map((axisName, index) => ({
                          name: `Axe ${index + 1}`,
                          fullName: axisName,
                          score: 1, // 1 pour avoir une petite barre visible
                          actualScore: 0,
                          displayScore: 'N/A',
                          isNA: true,
                          color: '#e5e7eb'
                        }))}
                        margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                      >
                        <XAxis 
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}%`}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
                                  <p className="font-medium">{data.name}</p>
                                  <p className="text-xs text-muted-foreground mb-1">{data.fullName}</p>
                                  <p className="text-sm font-bold">Score: N/A</p>
                                  <p className="text-xs text-muted-foreground mt-1">Aucun document audité</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar 
                          dataKey="score" 
                          radius={[4, 4, 0, 0]}
                        >
                          {MASE_AXES_NAMES.map((_, index) => (
                            <Cell key={`cell-${index}`} fill="#e5e7eb" />
                          ))}
                          <LabelList 
                            dataKey="displayScore"
                            position="top"
                            style={{ fontSize: '12px', fontWeight: 'bold' }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  );
                }
              })()
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
                  Score d'audit MASE
                </p>
              </div>
              
              {/* Étiquettes des 5 axes MASE sur une ligne */}
              <div className="grid grid-cols-5 gap-1 mt-4">
                {displayAxisScores && displayAxisScores.length === 5 ? displayAxisScores.map((axis, index) => {
                  const isNA = axis.score < 0;
                  const color = isNA ? '#9ca3af' : axisColors[index]; // gray-400 si N/A
                  const bgColor = isNA ? '#f3f4f6' : `${axisColors[index]}10`; // gray-100 si N/A
                  return (
                    <div key={axis.name} className="text-center p-2 rounded-lg border" style={{ backgroundColor: bgColor }}>
                      <div className="text-lg font-bold" style={{ color: color }}>
                        {isNA ? 'N/A' : `${axis.score}%`}
                      </div>
                      <div className="text-xs">Axe {index + 1}</div>
                    </div>
                  );
                }) : (
                  <div className="col-span-5 text-center text-muted-foreground py-2">
                    Aucune donnée d'axes disponible
                  </div>
                )}
              </div>
              
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">{totalDocuments} documents audités sur les 5 axes MASE</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}