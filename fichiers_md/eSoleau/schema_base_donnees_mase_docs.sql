-- MASE DOCS - Schéma complet de la base de données
-- Projet démarré le 12/04/2025 à 21:48:04 (Bolt.new)
-- Protection INPI - Date de dépôt : 16/06/2025
-- ================================================

-- 1. TABLES DU RÉFÉRENTIEL MASE
-- ================================================

-- Table des axes MASE (5 axes avec contenus préambulaires enrichis)
CREATE TABLE axes_mase (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    axe_numero TEXT UNIQUE NOT NULL,
    axe_nom TEXT NOT NULL,
    axe_description TEXT NOT NULL,
    objectif TEXT NOT NULL,
    score_total INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des chapitres MASE (24 chapitres organisés en 5 axes)
CREATE TABLE chapitres_mase (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    axe_numero TEXT NOT NULL REFERENCES axes_mase(axe_numero),
    axe_nom TEXT NOT NULL,
    chapitre_numero TEXT NOT NULL,
    chapitre_titre TEXT NOT NULL,
    chapitre_description TEXT,
    score INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des critères MASE (270+ critères d'évaluation)
CREATE TABLE criteres_mase (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chapitre_id UUID REFERENCES chapitres_mase(id),
    numero_critere TEXT NOT NULL,
    chapitre_numero TEXT NOT NULL,
    description TEXT NOT NULL,
    type_scoring TEXT CHECK (type_scoring IN ('B', 'V', 'VD')),
    score_max INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des documents clés (41 documents MASE)
CREATE TABLE documents_cles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom_document TEXT NOT NULL,
    axe_principal INTEGER NOT NULL,
    type_document TEXT NOT NULL,
    criteres_lies TEXT[],
    frequence_maj TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table du contenu structuré des documents
CREATE TABLE contenu_documents_cles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_cle_id UUID REFERENCES documents_cles(id),
    section_nom TEXT NOT NULL,
    contenu_attendu TEXT NOT NULL,
    elements_obligatoires TEXT[],
    criteres_validation TEXT[],
    ordre_affichage INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLES DE GESTION DES UTILISATEURS
-- ================================================

-- Profils utilisateurs
CREATE TABLE user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT,
    sector TEXT,
    is_onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLES DU MODULE AUDIT (MASE CHECKER)
-- ================================================

-- Sessions d'audit
CREATE TABLE audit_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'upload',
    global_score NUMERIC(5,2),
    scores_by_axis JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents uploadés pour audit
CREATE TABLE audit_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES audit_sessions(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    file_path TEXT,
    conformity_score NUMERIC(5,2),
    analysis_results JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Résultats détaillés par critère
CREATE TABLE audit_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES audit_sessions(id) ON DELETE CASCADE,
    document_id UUID REFERENCES audit_documents(id),
    critere_id UUID REFERENCES criteres_mase(id),
    score_obtenu INTEGER,
    score_max INTEGER,
    ecarts_identifies TEXT[],
    recommandations TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLES DU MODULE GÉNÉRATION (MASE GENERATOR)
-- ================================================

-- Sessions de génération
CREATE TABLE generation_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    audit_session_id UUID REFERENCES audit_sessions(id),
    generation_mode TEXT CHECK (generation_mode IN ('standard', 'post-audit')),
    selected_documents UUID[],
    personalized_instructions JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents générés
CREATE TABLE generated_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES generation_sessions(id) ON DELETE CASCADE,
    document_cle_id UUID REFERENCES documents_cles(id),
    content JSONB,
    file_formats TEXT[],
    file_urls JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. VUES CALCULÉES
-- ================================================

-- Vue des statistiques par session d'audit
CREATE VIEW audit_session_stats AS
SELECT 
    s.id,
    s.user_id,
    s.name,
    s.status,
    s.global_score,
    COUNT(DISTINCT d.id) as documents_count,
    COUNT(DISTINCT r.critere_id) as criteres_evalues,
    s.created_at
FROM audit_sessions s
LEFT JOIN audit_documents d ON s.id = d.session_id
LEFT JOIN audit_results r ON s.id = r.session_id
GROUP BY s.id;

-- Vue des scores par axe
CREATE VIEW audit_scores_by_axis AS
SELECT 
    s.id as session_id,
    c.axe_numero,
    c.axe_nom,
    SUM(r.score_obtenu) as score_obtenu,
    SUM(r.score_max) as score_max,
    CASE 
        WHEN SUM(r.score_max) > 0 
        THEN ROUND((SUM(r.score_obtenu)::numeric / SUM(r.score_max)::numeric) * 100, 2)
        ELSE 0
    END as pourcentage_conformite
FROM audit_sessions s
JOIN audit_results r ON s.id = r.session_id
JOIN criteres_mase cr ON r.critere_id = cr.id
JOIN chapitres_mase c ON cr.chapitre_id = c.id
GROUP BY s.id, c.axe_numero, c.axe_nom;

-- 6. POLITIQUES RLS (ROW LEVEL SECURITY)
-- ================================================

-- Activation RLS sur toutes les tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

-- Politiques pour user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Politiques pour audit_sessions
CREATE POLICY "Users can view own audit sessions" ON audit_sessions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own audit sessions" ON audit_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own audit sessions" ON audit_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Politiques pour les tables référentielles (lecture seule)
CREATE POLICY "Authenticated users can read MASE axes" ON axes_mase
    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read MASE chapters" ON chapitres_mase
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read MASE criteria" ON criteres_mase
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read key documents" ON documents_cles
    FOR SELECT USING (auth.role() = 'authenticated');

-- 7. FONCTIONS ET TRIGGERS
-- ================================================

-- Fonction de création automatique du profil utilisateur
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, is_onboarding_completed)
    VALUES (new.id, false);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger d'inscription
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 8. INDEX POUR OPTIMISATION
-- ================================================

CREATE INDEX idx_chapitres_axe ON chapitres_mase(axe_numero);
CREATE INDEX idx_criteres_chapitre ON criteres_mase(chapitre_id);
CREATE INDEX idx_criteres_chapitre_numero ON criteres_mase(chapitre_numero);
CREATE INDEX idx_audit_documents_session ON audit_documents(session_id);
CREATE INDEX idx_audit_results_session ON audit_results(session_id);
CREATE INDEX idx_audit_results_critere ON audit_results(critere_id);
CREATE INDEX idx_generated_documents_session ON generated_documents(session_id);

-- 9. COMMENTAIRES DE DOCUMENTATION
-- ================================================

COMMENT ON TABLE axes_mase IS 'Référentiel des 5 axes MASE avec contenus préambulaires enrichis - TOTAL 5000 points';
COMMENT ON TABLE chapitres_mase IS 'Référentiel des 24 chapitres MASE organisés en 5 axes';
COMMENT ON TABLE criteres_mase IS 'Les 270+ critères d''évaluation MASE avec leur système de scoring';
COMMENT ON TABLE documents_cles IS 'Les 41 documents clés du référentiel MASE';
COMMENT ON TABLE audit_sessions IS 'Sessions d''audit documentaire MASE';
COMMENT ON TABLE audit_results IS 'Résultats détaillés d''audit par critère MASE';
COMMENT ON COLUMN criteres_mase.type_scoring IS 'B=Binaire (0 ou max), V=Variable, VD=Variable Doublé';
COMMENT ON COLUMN axes_mase.axe_description IS 'Description détaillée et préambule de l''axe MASE';
COMMENT ON COLUMN axes_mase.objectif IS 'Objectif principal de l''axe selon le référentiel MASE 2024';