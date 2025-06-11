// Test script pour vérifier les politiques de suppression
// Ce fichier servira de référence pour comprendre les erreurs de suppression

console.log(`
=== TEST DES POLITIQUES DE SUPPRESSION ===

Politiques créées:
1. audit_sessions: "Users can delete own audit sessions"
2. audit_documents: "Users can delete audit documents" 
3. audit_results: "Users can delete audit results"
4. generation_sessions: "Users can delete own generation sessions"
5. generated_documents: "Users can delete generated documents"

Ordre de suppression recommandé:
1. audit_results (références vers audit_documents)
2. audit_documents (références vers audit_sessions)  
3. audit_sessions (table parent)

Test manuel via console JavaScript:
===================================

// Dans la console du navigateur (avec utilisateur authentifié):

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Test de suppression d'une session
async function testDeletion() {
  try {
    // 1. Récupérer les sessions de l'utilisateur
    const { data: sessions, error: fetchError } = await supabase
      .from('audit_sessions')
      .select('id')
      .eq('user_id', supabase.auth.user()?.id);
    
    console.log('Sessions trouvées:', sessions);
    
    if (sessions && sessions.length > 0) {
      const sessionId = sessions[0].id;
      
      // 2. Tenter la suppression
      const { error: deleteError } = await supabase
        .from('audit_sessions')
        .delete()
        .eq('id', sessionId);
      
      if (deleteError) {
        console.error('Erreur de suppression:', deleteError);
      } else {
        console.log('Suppression réussie!');
      }
    }
  } catch (error) {
    console.error('Erreur générale:', error);
  }
}

testDeletion();
`);