// Utility for MASE referential data and document operations
import { maseDB, DocumentCle, MaseChapter, MaseCriterion, ContenuDocumentCle } from './supabase/database'

export interface MaseDocument {
  id: string
  name: string
  axis: number
  axisName: string
  required: boolean
  type: 'word' | 'excel'
  description: string
  criteria: string[]
  questions: string[]
  updateFrequency: string
  score?: number
  conformityLevel?: 'conforme' | 'partiellement_conforme' | 'non_conforme'
  findings?: string[]
  recommendations?: string[]
}

export interface MaseAxis {
  number: string
  name: string
  chapters: MaseChapter[]
  documents: MaseDocument[]
  totalScore: number
}

export class MaseReferential {
  
  // Cache for referential data
  private static documentsCache: DocumentCle[] | null = null
  private static chaptersCache: MaseChapter[] | null = null
  private static criteriaCache: MaseCriterion[] | null = null

  /**
   * Get all MASE documents from the referential
   */
  static async getDocuments(): Promise<DocumentCle[]> {
    if (this.documentsCache) return this.documentsCache

    try {
      const documents = await maseDB.getDocumentsCles()
      this.documentsCache = documents
      return documents
    } catch (error) {
      console.error('Error fetching MASE documents:', error)
      return []
    }
  }

  /**
   * Get all MASE chapters
   */
  static async getChapters(): Promise<MaseChapter[]> {
    if (this.chaptersCache) return this.chaptersCache

    try {
      const chapters = await maseDB.getChapters()
      this.chaptersCache = chapters
      return chapters
    } catch (error) {
      console.error('Error fetching MASE chapters:', error)
      return []
    }
  }

  /**
   * Get all MASE criteria
   */
  static async getCriteria(): Promise<MaseCriterion[]> {
    if (this.criteriaCache) return this.criteriaCache

    try {
      const criteria = await maseDB.getCriteria()
      this.criteriaCache = criteria
      return criteria
    } catch (error) {
      console.error('Error fetching MASE criteria:', error)
      return []
    }
  }

  /**
   * Get documents organized by axis
   */
  static async getDocumentsByAxis(): Promise<Record<string, MaseDocument[]>> {
    const documents = await this.getDocuments()
    
    const documentsByAxis: Record<string, MaseDocument[]> = {}
    
    documents.forEach(doc => {
      const axis = doc.axe_principal
      if (!documentsByAxis[axis]) {
        documentsByAxis[axis] = []
      }
      
      documentsByAxis[axis].push({
        id: doc.id,
        name: doc.nom_document,
        axis: parseInt(doc.axe_principal),
        axisName: this.getAxisName(doc.axe_principal),
        required: doc.obligatoire,
        type: doc.type_document as 'word' | 'excel',
        description: doc.description_attendue,
        criteria: doc.criteres_lies,
        questions: doc.questions_liees,
        updateFrequency: doc.frequence_maj
      })
    })

    return documentsByAxis
  }

  /**
   * Get documents with low conformity scores (< 80%)
   */
  static getDocumentsNeedingImprovement(auditResults: any[]): MaseDocument[] {
    if (!auditResults) return []
    
    return auditResults
      .filter(result => result.conformity_score < 80)
      .map(result => ({
        id: result.document_id,
        name: result.document_name,
        axis: result.axis_number || 1,
        axisName: result.axis_name || 'Axe 1',
        required: true,
        type: 'word' as const,
        description: result.description || '',
        criteria: result.criteria || [],
        questions: result.questions || [],
        updateFrequency: 'annuelle',
        score: result.conformity_score,
        conformityLevel: this.getConformityLevel(result.conformity_score),
        findings: result.findings || [],
        recommendations: result.recommendations || []
      }))
  }

  /**
   * Get missing documents based on audit
   */
  static async getMissingDocuments(auditedDocumentIds: string[]): Promise<MaseDocument[]> {
    const allDocuments = await this.getDocuments()
    
    const missingDocs = allDocuments
      .filter(doc => !auditedDocumentIds.includes(doc.id))
      .map(doc => ({
        id: doc.id,
        name: doc.nom_document,
        axis: parseInt(doc.axe_principal),
        axisName: this.getAxisName(doc.axe_principal),
        required: doc.obligatoire,
        type: doc.type_document as 'word' | 'excel',
        description: doc.description_attendue,
        criteria: doc.criteres_lies,
        questions: doc.questions_liees,
        updateFrequency: doc.frequence_maj
      }))

    return missingDocs
  }

  /**
   * Get document content template
   */
  static async getDocumentContent(documentId: string): Promise<ContenuDocumentCle[]> {
    try {
      return await maseDB.getDocumentContent(documentId)
    } catch (error) {
      console.error('Error fetching document content:', error)
      return []
    }
  }

  /**
   * Get documents for a specific axis
   */
  static async getDocumentsByAxisNumber(axisNumber: string): Promise<MaseDocument[]> {
    const allDocuments = await this.getDocuments()
    
    return allDocuments
      .filter(doc => doc.axe_principal === axisNumber)
      .map(doc => ({
        id: doc.id,
        name: doc.nom_document,
        axis: parseInt(doc.axe_principal),
        axisName: this.getAxisName(doc.axe_principal),
        required: doc.obligatoire,
        type: doc.type_document as 'word' | 'excel',
        description: doc.description_attendue,
        criteria: doc.criteres_lies,
        questions: doc.questions_liees,
        updateFrequency: doc.frequence_maj
      }))
  }

  /**
   * Calculate axis score from documents
   */
  static calculateAxisScore(documentsInAxis: any[]): number {
    if (!documentsInAxis || documentsInAxis.length === 0) return 0
    
    const totalScore = documentsInAxis.reduce((sum, doc) => sum + (doc.score || 0), 0)
    return Math.round(totalScore / documentsInAxis.length)
  }

  /**
   * Get conformity level based on score
   */
  static getConformityLevel(score: number): 'conforme' | 'partiellement_conforme' | 'non_conforme' {
    if (score >= 80) return 'conforme'
    if (score >= 60) return 'partiellement_conforme'
    return 'non_conforme'
  }

  /**
   * Get axis name by number
   */
  static getAxisName(axisNumber: string): string {
    const axisNames: Record<string, string> = {
      '1': 'Engagement de la Direction',
      '2': 'Compétences et Qualifications',
      '3': 'Préparation et Organisation du Travail',
      '4': 'Contrôles et Amélioration Continue',
      '5': 'Bilan et Amélioration Continue'
    }
    return axisNames[axisNumber] || `Axe ${axisNumber}`
  }

  /**
   * Get axis configuration
   */
  static async getAxisConfiguration(): Promise<MaseAxis[]> {
    const [chapters, documents] = await Promise.all([
      this.getChapters(),
      this.getDocuments()
    ])

    const axisNumbers = ['1', '2', '3', '4', '5']
    
    return axisNumbers.map(axisNumber => {
      const axisChapters = chapters.filter(chapter => chapter.axe_numero === axisNumber)
      const axisDocuments = documents
        .filter(doc => doc.axe_principal === axisNumber)
        .map(doc => ({
          id: doc.id,
          name: doc.nom_document,
          axis: parseInt(doc.axe_principal),
          axisName: this.getAxisName(doc.axe_principal),
          required: doc.obligatoire,
          type: doc.type_document as 'word' | 'excel',
          description: doc.description_attendue,
          criteria: doc.criteres_lies,
          questions: doc.questions_liees,
          updateFrequency: doc.frequence_maj
        }))

      const totalScore = axisChapters.reduce((sum, chapter) => sum + (chapter.score || 0), 0)

      return {
        number: axisNumber,
        name: this.getAxisName(axisNumber),
        chapters: axisChapters,
        documents: axisDocuments,
        totalScore
      }
    })
  }

  /**
   * Search documents by name or description
   */
  static async searchDocuments(query: string): Promise<MaseDocument[]> {
    const documents = await this.getDocuments()
    const lowercaseQuery = query.toLowerCase()

    return documents
      .filter(doc => 
        doc.nom_document.toLowerCase().includes(lowercaseQuery) ||
        doc.description_attendue.toLowerCase().includes(lowercaseQuery)
      )
      .map(doc => ({
        id: doc.id,
        name: doc.nom_document,
        axis: parseInt(doc.axe_principal),
        axisName: this.getAxisName(doc.axe_principal),
        required: doc.obligatoire,
        type: doc.type_document as 'word' | 'excel',
        description: doc.description_attendue,
        criteria: doc.criteres_lies,
        questions: doc.questions_liees,
        updateFrequency: doc.frequence_maj
      }))
  }

  /**
   * Clear cache (useful for testing or when data updates)
   */
  static clearCache(): void {
    this.documentsCache = null
    this.chaptersCache = null
    this.criteriaCache = null
  }

  /**
   * Get document statistics
   */
  static async getDocumentStats(): Promise<{
    total: number
    required: number
    optional: number
    byAxis: Record<string, number>
    byType: Record<string, number>
  }> {
    const documents = await this.getDocuments()
    
    const stats = {
      total: documents.length,
      required: documents.filter(doc => doc.obligatoire).length,
      optional: documents.filter(doc => !doc.obligatoire).length,
      byAxis: {} as Record<string, number>,
      byType: {} as Record<string, number>
    }

    // Count by axis
    documents.forEach(doc => {
      const axis = doc.axe_principal
      stats.byAxis[axis] = (stats.byAxis[axis] || 0) + 1
    })

    // Count by type
    documents.forEach(doc => {
      const type = doc.type_document
      stats.byType[type] = (stats.byType[type] || 0) + 1
    })

    return stats
  }
}