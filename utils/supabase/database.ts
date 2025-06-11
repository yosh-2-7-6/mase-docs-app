import { createClient } from '@/utils/supabase/client'

// Types for database tables
export interface MaseChapter {
  id: string
  axe_numero: string
  axe_nom: string
  chapitre_numero: string
  chapitre_titre: string
  chapitre_description: string
  score: number
  created_at: string
  updated_at: string
}

export interface MaseCriterion {
  id: string
  numero_critere: string
  description: string
  chapitre_numero: string
  score_max: number
  type_scoring: 'Binary' | 'Variable' | 'Variable Doubled'
  created_at: string
}

export interface DocumentCle {
  id: string
  nom_document: string
  axe_principal: string
  axes_secondaires: string[]
  obligatoire: boolean
  type_document: string
  description_attendue: string
  criteres_lies: string[]
  questions_liees: string[]
  frequence_maj: string
  created_at: string
}

export interface ContenuDocumentCle {
  id: string
  document_cle_id: string
  section_nom: string
  contenu_attendu: string
  elements_obligatoires: string[]
  elements_recommandes: string[]
  exemples_conformes: string[]
  criteres_validation: string
  ordre_section: number
  created_at: string
}

export interface UserProfile {
  id: string
  user_id: string | null
  full_name: string | null
  company_name: string | null
  sector: string | null
  company_size: string | null
  main_activities: string | null
  is_onboarding_completed: boolean | null
  created_at: string
  updated_at: string
}

export interface AuditSession {
  id: string
  user_id: string | null
  company_profile: any | null
  status: 'upload' | 'analysis' | 'completed' | null
  global_score: number | null
  scores_by_axis: any | null
  created_at: string
  completed_at: string | null
}

export interface AuditDocument {
  id: string
  audit_session_id: string | null
  document_name: string
  document_type: string | null
  file_path: string | null
  file_size: number | null
  conformity_score: number | null
  status: 'uploaded' | 'analyzing' | 'analyzed' | 'error' | null
  analysis_results: any | null
  created_at: string
}

export interface AuditResult {
  id: string
  audit_session_id: string | null
  audit_document_id: string | null
  critere_id: string | null
  score_obtenu: number | null
  score_max: number | null
  conformite_percentage: number | null
  ecarts_identifies: string[] | null
  recommandations: string[] | null
  created_at: string
}

export interface GenerationSession {
  id: string
  user_id: string | null
  audit_session_id: string | null
  generation_mode: 'standard' | 'post-audit'
  generation_type: 'standard' | 'personalized'
  company_profile: any | null
  selected_documents: string[] | null
  personalized_instructions: string | null
  status: 'configuration' | 'generating' | 'completed' | 'error' | null
  created_at: string
  completed_at: string | null
}

export interface GeneratedDocument {
  id: string
  generation_session_id: string | null
  document_cle_id: string | null
  document_name: string
  document_type: string
  content: any | null
  file_formats: string[] | null
  status: 'generating' | 'completed' | 'error' | null
  created_at: string
}

// Database utility class
export class MaseDatabase {
  private supabase

  constructor() {
    this.supabase = createClient()
  }

  // MASE Referential Data
  async getChapters(): Promise<MaseChapter[]> {
    const { data, error } = await this.supabase
      .from('chapitres_mase')
      .select('*')
      .order('axe_numero', { ascending: true })
      .order('chapitre_numero', { ascending: true })

    if (error) throw error
    return data || []
  }

  async getCriteria(chapterNumber?: string): Promise<MaseCriterion[]> {
    console.log('MaseDatabase.getCriteria() called');
    
    // Check current user session
    const { data: { user }, error: userError } = await this.supabase.auth.getUser();
    console.log('Current user in getCriteria:', user ? user.id : 'No user');
    if (userError) {
      console.error('User authentication error in getCriteria:', userError);
    }
    
    let query = this.supabase
      .from('criteres_mase')
      .select('*')

    if (chapterNumber) {
      console.log(`Filtering by chapter number: ${chapterNumber}`);
      query = query.eq('chapitre_numero', chapterNumber)
    }

    console.log('Executing criteria query...');
    const { data, error } = await query.order('numero_critere', { ascending: true })

    if (error) {
      console.error('❌ Error fetching criteria:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      throw error;
    }
    
    console.log(`✓ Successfully fetched ${(data || []).length} criteria`);
    return data || []
  }

  async getDocumentsCles(): Promise<DocumentCle[]> {
    const { data, error } = await this.supabase
      .from('documents_cles')
      .select('*')
      .order('axe_principal', { ascending: true })

    if (error) throw error
    return data || []
  }

  async getDocumentContent(documentId: string): Promise<ContenuDocumentCle[]> {
    const { data, error } = await this.supabase
      .from('contenu_documents_cles')
      .select('*')
      .eq('document_cle_id', documentId)
      .order('ordre_section', { ascending: true })

    if (error) throw error
    return data || []
  }

  // User Profiles
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async createUserProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserProfile> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .insert({
        ...profile,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Audit Sessions
  async createAuditSession(session: Omit<AuditSession, 'id' | 'created_at' | 'completed_at'>): Promise<AuditSession> {
    const { data, error } = await this.supabase
      .from('audit_sessions')
      .insert(session)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getAuditSessions(userId: string): Promise<AuditSession[]> {
    const { data, error } = await this.supabase
      .from('audit_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getAuditSession(sessionId: string): Promise<AuditSession | null> {
    const { data, error } = await this.supabase
      .from('audit_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async updateAuditSession(sessionId: string, updates: Partial<AuditSession>): Promise<AuditSession> {
    const { data, error } = await this.supabase
      .from('audit_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Audit Documents
  async createAuditDocument(document: Omit<AuditDocument, 'id' | 'created_at'>): Promise<AuditDocument> {
    const { data, error } = await this.supabase
      .from('audit_documents')
      .insert(document)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getAuditDocuments(sessionId: string): Promise<AuditDocument[]> {
    const { data, error } = await this.supabase
      .from('audit_documents')
      .select(`
        id,
        audit_session_id,
        document_name,
        document_type,
        file_path,
        file_size,
        conformity_score,
        status,
        analysis_results,
        created_at
      `)
      .eq('audit_session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  async updateAuditDocument(documentId: string, updates: Partial<AuditDocument>): Promise<AuditDocument> {
    const { data, error } = await this.supabase
      .from('audit_documents')
      .update(updates)
      .eq('id', documentId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Audit Results
  async createAuditResults(results: Omit<AuditResult, 'id' | 'created_at'>[]): Promise<AuditResult[]> {
    const { data, error } = await this.supabase
      .from('audit_results')
      .insert(results)
      .select()

    if (error) throw error
    return data || []
  }

  async getAuditResults(documentId: string): Promise<AuditResult[]> {
    const { data, error } = await this.supabase
      .from('audit_results')
      .select('*')
      .eq('audit_document_id', documentId)

    if (error) throw error
    return data || []
  }

  async getAuditResultsCount(sessionId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('audit_results')
      .select('*', { count: 'exact', head: true })
      .eq('audit_session_id', sessionId)

    if (error) throw error
    return count || 0
  }

  // Generation Sessions
  async createGenerationSession(session: Omit<GenerationSession, 'id' | 'created_at' | 'completed_at'>): Promise<GenerationSession> {
    const { data, error } = await this.supabase
      .from('generation_sessions')
      .insert(session)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getGenerationSessions(userId: string): Promise<GenerationSession[]> {
    const { data, error } = await this.supabase
      .from('generation_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async updateGenerationSession(sessionId: string, updates: Partial<GenerationSession>): Promise<GenerationSession> {
    const { data, error } = await this.supabase
      .from('generation_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Generated Documents
  async createGeneratedDocument(document: Omit<GeneratedDocument, 'id' | 'created_at'>): Promise<GeneratedDocument> {
    const { data, error } = await this.supabase
      .from('generated_documents')
      .insert(document)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getGeneratedDocuments(sessionId: string): Promise<GeneratedDocument[]> {
    const { data, error } = await this.supabase
      .from('generated_documents')
      .select('*')
      .eq('generation_session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  // Dashboard Analytics
  async getDashboardStats(userId: string) {
    const [auditSessions, generationSessions] = await Promise.all([
      this.getAuditSessions(userId),
      this.getGenerationSessions(userId)
    ])

    const completedAudits = auditSessions.filter(s => s.status === 'completed')
    // For now, count documents from audit_documents table
    const totalDocumentsAnalyzed = 0 // Will be implemented with proper joins
    const totalDocumentsGenerated = generationSessions.reduce((sum, s) => sum + (s.selected_documents?.length || 0), 0)

    const averageScore = completedAudits.length > 0
      ? completedAudits.reduce((sum, s) => sum + (s.global_score || 0), 0) / completedAudits.length
      : 0

    return {
      totalAudits: auditSessions.length,
      completedAudits: completedAudits.length,
      totalDocumentsAnalyzed,
      totalDocumentsGenerated,
      averageScore: Math.round(averageScore),
      recentAudits: auditSessions.slice(0, 5),
      recentGenerations: generationSessions.slice(0, 5)
    }
  }

  // File upload helper
  async uploadFile(file: File, path: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from('documents')
      .upload(path, file)

    if (error) throw error
    return data.path
  }

  async getFileUrl(path: string): Promise<string> {
    const { data } = this.supabase.storage
      .from('documents')
      .getPublicUrl(path)

    return data.publicUrl
  }

  // User Profile Management methods are defined earlier in the class (around line 205)
}

// Export singleton instance
export const maseDB = new MaseDatabase()