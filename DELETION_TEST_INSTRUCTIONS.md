# Test de Suppression des Audits - Instructions

## ✅ Politiques RLS DELETE Créées

Les politiques suivantes ont été ajoutées pour permettre aux utilisateurs de supprimer leurs propres données :

### Audit Tables
```sql
✓ audit_sessions: "Users can delete own audit sessions"
✓ audit_documents: "Users can delete audit documents" 
✓ audit_results: "Users can delete audit results"
```

### Generation Tables
```sql
✓ generation_sessions: "Users can delete own generation sessions"
✓ generated_documents: "Users can delete generated documents"
```

## 🧪 Tests à Effectuer

### Test 1: Suppression via Corbeille Rouge (Carte Bleue)
1. Aller sur http://localhost:3001/dashboard/mase-checker
2. Hover sur la carte bleue pour voir la corbeille rouge
3. Cliquer sur la corbeille rouge
4. Confirmer la suppression
5. **Vérifier** : Carte bleue disparaît et retour à l'état "Aucun audit"

### Test 2: Suppression via Corbeille Rouge (Carte Verte)
1. Aller sur http://localhost:3001/dashboard/mase-generator  
2. Hover sur la carte verte pour voir la corbeille rouge
3. Cliquer sur la corbeille rouge
4. Confirmer la suppression
5. **Vérifier** : Carte verte disparaît

### Test 3: Vérification Console
Lors des tests, ouvrir la console pour voir les logs :
```
✓ Current user for deletion: [user-id]
✓ Deleted X audit_results records
✓ Deleted X audit_documents records  
✓ Deleted X audit_sessions records
✓ AUDIT HISTORY CLEANUP COMPLETED SUCCESSFULLY
```

## 🔍 Diagnostic d'Erreurs

Si la suppression échoue, chercher dans la console :

### Erreurs Potentielles
- **Authentication required** : Utilisateur non connecté
- **Failed to delete audit results** : Problème RLS sur audit_results
- **Failed to delete audit documents** : Problème RLS sur audit_documents  
- **Failed to delete audit sessions** : Problème RLS sur audit_sessions

### Debugging
```javascript
// Dans la console navigateur pour test manuel :
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user?.id);

// Test simple de suppression
const { error } = await supabase
  .from('audit_sessions') 
  .delete()
  .eq('id', 'session-id-here');
console.log('Delete error:', error);
```

## 📊 État de la Base Avant Test

Actuellement dans la base :
- 1 audit_session avec 3 documents
- 24 audit_results détaillés
- Toutes les politiques RLS en place

**La suppression devrait maintenant fonctionner !** 🎯