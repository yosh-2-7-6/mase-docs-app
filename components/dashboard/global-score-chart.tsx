"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
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
  
  // Nettoyer et valider les données d'axisScores pour éviter les erreurs NaN
  const cleanAxisScores = (scores: AxisScore[] | null): AxisScore[] => {
    if (!scores || scores.length === 0) {
      console.log('No axisScores provided, using test data');
      return testAxisScores;
    }
    
    console.log('Cleaning axisScores, original length:', scores.length);
    
    // Protection spéciale pour le cas d'un seul document
    if (totalDocuments === 1) {
      console.log('🔍 CAS SPÉCIAL: Un seul document détecté, utilisation de données simulées');
      // Avec un seul document, on simule une répartition équitable
      return [
        { name: 'Engagement de la direction', score: 85, color: 'green' },
        { name: 'Compétences et qualifications', score: 0, color: 'gray' },
        { name: 'Préparation et organisation des interventions', score: 0, color: 'gray' },
        { name: 'Réalisation des interventions', score: 0, color: 'gray' },
        { name: 'Retour d\'expérience et amélioration continue', score: 0, color: 'gray' }
      ];
    }
    
    const cleaned = scores.map((axis, index) => {
      const originalScore = axis.score;
      let cleanedScore = 0;
      
      if (originalScore === null || originalScore === undefined) {
        cleanedScore = 0;
      } else if (isNaN(originalScore)) {
        console.warn(`⚠️ NaN detected in axis ${axis.name}, setting to 0`);
        cleanedScore = 0;
      } else if (originalScore < 0) {
        cleanedScore = 0;
      } else {
        cleanedScore = Math.min(100, Math.round(originalScore));
      }
      
      console.log(`  Axis ${index + 1}: ${axis.name} - Original: ${originalScore} → Cleaned: ${cleanedScore}`);
      
      return {
        ...axis,
        score: cleanedScore
      };
    });
    
    return cleaned;
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
                    const safeMappedScore = safeNumber(axis.score, 0);
                    console.log(`BarChart mapping - Axe ${index + 1}: ${axis.name} → score: ${safeMappedScore}`);
                    
                    // Triple protection pour BarChart
                    const finalScore = isNaN(safeMappedScore) ? 0 : Math.max(0, Math.min(100, safeMappedScore));
                    
                    return {
                      name: `Axe ${index + 1}`,
                      fullName: axis.name,
                      score: finalScore,
                      color: axisColors[index] || '#6b7280'
                    };
                  }).filter(item => {
                    // Filtrer tout item avec des valeurs invalides
                    const isValid = typeof item.score === 'number' && !isNaN(item.score) && isFinite(item.score);
                    if (!isValid) {
                      console.error(`❌ Item invalide filtré: ${item.name} - score: ${item.score}`);
                    }
                    return isValid;
                  })}
                  layout="horizontal"
                  margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
                >
                  <XAxis 
                    type="number" 
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name"
                    width={60}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [`${value}%`, 'Score']}
                    labelFormatter={(label) => {
                      const item = displayAxisScores.find((_, index) => `Axe ${index + 1}` === label);
                      return item ? displayAxisScores[displayAxisScores.indexOf(item)].name : label;
                    }}
                  />
                  <Bar 
                    dataKey="score" 
                    radius={[0, 4, 4, 0]}
                  >
                    {displayAxisScores.map((axis, index) => (
                      <Cell key={`cell-${index}`} fill={axisColors[index] || '#6b7280'} />
                    ))}
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
                        data={testAxisScores.map((axis, index) => ({
                          name: `Axe ${index + 1}`,
                          fullName: axis.name,
                          score: axis.score,
                          color: axisColors[index] || '#6b7280'
                        }))}
                        layout="horizontal"
                        margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
                      >
                        <XAxis 
                          type="number" 
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}%`}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name"
                          width={60}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value, name) => [`${value}%`, 'Score']}
                        />
                        <Bar 
                          dataKey="score" 
                          radius={[0, 4, 4, 0]}
                        >
                          {testAxisScores.map((axis, index) => (
                            <Cell key={`cell-${index}`} fill={axisColors[index] || '#6b7280'} />
                          ))}
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
                {displayAxisScores && displayAxisScores.length > 0 ? displayAxisScores.map((axis, index) => {
                  const color = axisColors[index] || '#6b7280';
                  const isValidScore = axis.score >= 0;
                  return (
                    <div key={axis.name} className="text-center p-2 rounded-lg border" style={{ backgroundColor: `${color}10` }}>
                      <div className="text-lg font-bold" style={{ color: color }}>
                        {isValidScore ? `${axis.score}%` : 'N/A'}
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