/**
 * DocumentManager - Gestion centralisée des documents MASE
 * Stockage léger des métadonnées avec persistance entre sessions
 */

export interface MaseDocument {
  id: string;
  name: string;
  type: 'original' | 'modified' | 'generated';
  source: 'mase-checker' | 'mase-generator';
  templateId?: string;
  createdAt: string;
  sessionId: string;
  metadata: {
    size?: number;
    auditScore?: number;
    templateUsed?: string;
    parentDocumentId?: string;
    recommendations?: string[];
    appliedRecommendations?: string[];
  };
}

export interface MaseReport {
  id: string;
  type: 'audit' | 'generation';
  date: string;
  summary: string;
  documentIds: string[];
  metadata?: {
    totalDocuments?: number;
    averageScore?: number;
    generationType?: string;
  };
}

export interface DocumentRegistry {
  documents: MaseDocument[];
  reports: MaseReport[];
  lastUpdated: string;
}

const STORAGE_KEY = 'mase_document_registry';
const SESSION_STORAGE_KEY = 'mase_session_documents';

export class DocumentManager {
  private static registry: DocumentRegistry = {
    documents: [],
    reports: [],
    lastUpdated: new Date().toISOString()
  };

  private static sessionId: string = Date.now().toString();

  /**
   * Initialise le manager et charge les données persistées
   */
  static initialize(): void {
    // Charger depuis localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.registry = JSON.parse(stored);
      } catch (e) {
        console.error('Erreur lors du chargement du registre de documents:', e);
        this.registry = {
          documents: [],
          reports: [],
          lastUpdated: new Date().toISOString()
        };
      }
    }

    // Nettoyer les documents de plus de 30 jours
    this.cleanOldDocuments();
  }

  /**
   * Force le rechargement des données depuis le stockage
   */
  static forceReload(): void {
    console.log('Force reload des documents...');
    
    // Recharger depuis localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.registry = JSON.parse(stored);
        console.log('Documents rechargés:', this.registry.documents.length);
        console.log('Rapports rechargés:', this.registry.reports.length);
      } catch (e) {
        console.error('Erreur lors du rechargement du registre:', e);
      }
    } else {
      console.log('Aucune donnée trouvée dans localStorage, réinitialisation');
      this.registry = {
        documents: [],
        reports: [],
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Génère un ID unique pour un document
   */
  static generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Ajoute un document au registre
   */
  static addDocument(document: Omit<MaseDocument, 'id' | 'createdAt' | 'sessionId'>): string {
    const id = this.generateDocumentId();
    const newDocument: MaseDocument = {
      ...document,
      id,
      createdAt: new Date().toISOString(),
      sessionId: this.sessionId
    };

    this.registry.documents.push(newDocument);
    this.save();
    
    return id;
  }

  /**
   * Ajoute plusieurs documents
   */
  static addDocuments(documents: Omit<MaseDocument, 'id' | 'createdAt' | 'sessionId'>[]): string[] {
    const ids = documents.map(doc => this.addDocument(doc));
    return ids;
  }

  /**
   * Ajoute un rapport
   */
  static addReport(report: Omit<MaseReport, 'id' | 'date'>): string {
    const id = `report_${Date.now()}`;
    const newReport: MaseReport = {
      ...report,
      id,
      date: new Date().toISOString()
    };

    this.registry.reports.push(newReport);
    this.save();
    
    return id;
  }

  /**
   * Récupère tous les documents
   */
  static getAllDocuments(): MaseDocument[] {
    return [...this.registry.documents];
  }

  /**
   * Récupère les documents filtrés
   */
  static getFilteredDocuments(filters: {
    type?: 'all' | 'original' | 'modified' | 'generated';
    source?: 'all' | 'mase-checker' | 'mase-generator';
    dateRange?: 'all' | 'today' | 'week' | 'month';
    sessionId?: string;
  }): MaseDocument[] {
    let documents = [...this.registry.documents];

    // Filtre par type
    if (filters.type && filters.type !== 'all') {
      documents = documents.filter(doc => doc.type === filters.type);
    }

    // Filtre par source
    if (filters.source && filters.source !== 'all') {
      documents = documents.filter(doc => doc.source === filters.source);
    }

    // Filtre par session
    if (filters.sessionId) {
      documents = documents.filter(doc => doc.sessionId === filters.sessionId);
    }

    // Filtre par date
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setDate(filterDate.getDate() - 1);
          break;
        case 'week':
          filterDate.setDate(filterDate.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(filterDate.getMonth() - 1);
          break;
      }

      documents = documents.filter(doc => 
        new Date(doc.createdAt) >= filterDate
      );
    }

    // Trier par date décroissante
    documents.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return documents;
  }

  /**
   * Récupère un document par ID
   */
  static getDocument(id: string): MaseDocument | null {
    return this.registry.documents.find(doc => doc.id === id) || null;
  }

  /**
   * Récupère les documents liés (original et ses versions modifiées)
   */
  static getRelatedDocuments(documentId: string): MaseDocument[] {
    const document = this.getDocument(documentId);
    if (!document) return [];

    const related: MaseDocument[] = [];

    // Si c'est un document original, trouver ses versions modifiées
    if (document.type === 'original') {
      related.push(document);
      const modified = this.registry.documents.filter(
        doc => doc.metadata.parentDocumentId === documentId
      );
      related.push(...modified);
    }
    // Si c'est un document modifié, trouver l'original et les autres versions
    else if (document.metadata.parentDocumentId) {
      const original = this.getDocument(document.metadata.parentDocumentId);
      if (original) {
        related.push(original);
        const siblings = this.registry.documents.filter(
          doc => doc.metadata.parentDocumentId === document.metadata.parentDocumentId
        );
        related.push(...siblings);
      }
    } else {
      related.push(document);
    }

    return related;
  }

  /**
   * Récupère tous les rapports
   */
  static getAllReports(): MaseReport[] {
    return [...this.registry.reports];
  }

  /**
   * Met à jour les métadonnées d'un document
   */
  static updateDocumentMetadata(id: string, metadata: Partial<MaseDocument['metadata']>): void {
    const document = this.registry.documents.find(doc => doc.id === id);
    if (document) {
      document.metadata = { ...document.metadata, ...metadata };
      this.save();
    }
  }

  /**
   * Supprime un document du registre (pas le fichier)
   */
  static deleteDocument(id: string): void {
    this.registry.documents = this.registry.documents.filter(doc => doc.id !== id);
    this.save();
  }

  /**
   * Supprime tous les documents d'une source spécifique
   */
  static clearDocumentsBySource(source: 'mase-checker' | 'mase-generator'): void {
    const beforeCount = this.registry.documents.length;
    this.registry.documents = this.registry.documents.filter(doc => doc.source !== source);
    const afterCount = this.registry.documents.length;
    console.log(`Supprimés ${beforeCount - afterCount} documents de ${source}`);
    this.save();
  }

  /**
   * Supprime tous les documents et rapports (garde l'historique des rapports)
   */
  static clearAllDocuments(): void {
    console.log(`Suppression de ${this.registry.documents.length} documents`);
    this.registry.documents = [];
    // Garder les rapports pour l'historique
    this.save();
  }

  /**
   * Nettoie les documents de plus de 30 jours
   */
  private static cleanOldDocuments(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    this.registry.documents = this.registry.documents.filter(doc => 
      new Date(doc.createdAt) > thirtyDaysAgo
    );

    this.registry.reports = this.registry.reports.filter(report => 
      new Date(report.date) > thirtyDaysAgo
    );

    this.save();
  }

  /**
   * Sauvegarde le registre dans localStorage
   */
  private static save(): void {
    this.registry.lastUpdated = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.registry));
    } catch (e) {
      console.error('Erreur lors de la sauvegarde du registre:', e);
      // Si localStorage est plein, nettoyer les anciens documents
      this.cleanOldDocuments();
    }
  }

  /**
   * Stocke temporairement le contenu d'un document en session
   */
  static setDocumentContent(id: string, content: string): void {
    const sessionData = this.getSessionData();
    sessionData[id] = content;
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
  }

  /**
   * Récupère le contenu temporaire d'un document
   */
  static getDocumentContent(id: string): string | null {
    const sessionData = this.getSessionData();
    return sessionData[id] || null;
  }

  /**
   * Récupère le contenu d'un rapport
   */
  static getReportContent(id: string): string | null {
    const report = this.registry.reports.find(r => r.id === id);
    if (!report) return null;

    return `RAPPORT ${report.type.toUpperCase()}
========================================

Date de génération: ${new Date(report.date).toLocaleDateString('fr-FR')}
Type: ${report.type === 'audit' ? 'Rapport d\'audit MASE' : 'Rapport de génération de documents'}

RÉSUMÉ
-------
${report.summary}

DOCUMENTS ASSOCIÉS
------------------
${report.documentIds.map(docId => {
  const doc = this.getDocument(docId);
  return doc ? `- ${doc.name} (${doc.type})` : `- Document ID: ${docId}`;
}).join('\n')}

MÉTADONNÉES
-----------
${report.metadata ? Object.entries(report.metadata)
  .map(([key, value]) => `${key}: ${value}`)
  .join('\n') : 'Aucune métadonnée disponible'}

Généré automatiquement par MASE DOCS
`;
  }

  /**
   * Récupère les données de session
   */
  private static getSessionData(): Record<string, string> {
    try {
      const data = sessionStorage.getItem(SESSION_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  /**
   * Exporte tout le registre (pour backup)
   */
  static exportRegistry(): string {
    return JSON.stringify(this.registry, null, 2);
  }

  /**
   * Importe un registre (restore backup)
   */
  static importRegistry(data: string): void {
    try {
      const imported = JSON.parse(data);
      if (imported.documents && imported.reports) {
        this.registry = imported;
        this.save();
      }
    } catch (e) {
      console.error('Erreur lors de l\'import du registre:', e);
      throw new Error('Format de données invalide');
    }
  }

  /**
   * Réinitialise le registre
   */
  static reset(): void {
    this.registry = {
      documents: [],
      reports: [],
      lastUpdated: new Date().toISOString()
    };
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

// Initialiser au chargement
if (typeof window !== 'undefined') {
  DocumentManager.initialize();
}