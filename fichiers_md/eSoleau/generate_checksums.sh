#!/bin/bash
# Script de génération des checksums pour dossier INPI
# MASE DOCS - Projet démarré le 12/04/2025 à 21:48:04 (Bolt.new)
# Date de dépôt INPI : 16/06/2025

echo "=== Génération des checksums MD5 et SHA256 ==="
echo "Date: $(date)"
echo ""

# Créer le fichier de checksums
output_file="checksums_mase_docs_$(date +%Y%m%d).txt"

echo "CHECKSUMS MASE DOCS - Protection INPI" > $output_file
echo "Généré le: $(date)" >> $output_file
echo "======================================" >> $output_file
echo "" >> $output_file

# Fonction pour calculer les checksums d'un fichier
calculate_checksums() {
    local file=$1
    if [ -f "$file" ]; then
        echo "Fichier: $file" >> $output_file
        echo "MD5:    $(md5sum "$file" | awk '{print $1}')" >> $output_file
        echo "SHA256: $(sha256sum "$file" | awk '{print $1}')" >> $output_file
        echo "" >> $output_file
    fi
}

# Fichiers principaux à protéger
echo "=== DOCUMENTS DE PROTECTION ===" >> $output_file
calculate_checksums "Dossier_Protection_MASE_DOCS_INPI.md"
calculate_checksums "Dossier_Protection_MASE_DOCS_INPI.pdf"

echo "=== FICHIERS TECHNIQUES CLÉS ===" >> $output_file
# Components principaux (depuis la racine du projet)
calculate_checksums "../../app/dashboard/mase-checker/page.tsx"
calculate_checksums "../../app/dashboard/mase-generator/page.tsx"
calculate_checksums "../../app/dashboard/page.tsx"

# Utilitaires core
calculate_checksums "../../utils/mase-state.ts"
calculate_checksums "../../utils/user-profile.ts"

# Base de données (dans le dossier actuel eSoleau)
calculate_checksums "schema_base_donnees_mase_docs.sql"
calculate_checksums "architecture_technique_mase_docs.md"

echo "=== FICHIERS DE CONFIGURATION ===" >> $output_file
calculate_checksums "../../package.json"
calculate_checksums "../../next.config.js"
calculate_checksums "../../middleware.ts"

echo ""
echo "Checksums générés dans: $output_file"
echo ""
echo "IMPORTANT: Ces checksums prouvent l'intégrité de vos fichiers"
echo "à la date de génération. Conservez ce fichier avec votre dépôt INPI."