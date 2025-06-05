"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { UserProfileManager, UserProfile, UserProfileData } from "@/utils/user-profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Shield, Building2, Briefcase, Users, Activity, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

const SECTORS = [
  "BTP - Bâtiment et Travaux Publics",
  "Industrie manufacturière", 
  "Énergie et Utilities",
  "Transport et Logistique",
  "Agriculture et Agroalimentaire",
  "Services aux entreprises",
  "Santé et Social",
  "Chimie et Pétrochimie",
  "Métallurgie et Sidérurgie",
  "Automobile",
  "Aéronautique et Spatial",
  "Technologies de l'information",
  "Commerce et Distribution",
  "Hôtellerie et Restauration",
  "Autre"
];

const COMPANY_SIZES = [
  "1-10 salariés (TPE)",
  "11-50 salariés (Petite entreprise)",
  "51-250 salariés (Moyenne entreprise)",
  "251-500 salariés (Grande entreprise)",
  "500+ salariés (Très grande entreprise)"
];

export default function SettingsPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [formData, setFormData] = useState<UserProfileData>({
    fullName: '',
    companyName: '',
    sector: '',
    companySize: '',
    mainActivities: ''
  });

  useEffect(() => {
    const loadUserData = async () => {
      const supabase = createClient();
      
      try {
        // Récupérer l'email de l'utilisateur connecté
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || '');
        }

        // Récupérer le profil sauvegardé
        const profile = UserProfileManager.getUserProfile();
        if (profile) {
          setUserProfile(profile);
          setFormData({
            fullName: profile.fullName,
            companyName: profile.companyName,
            sector: profile.sector,
            companySize: profile.companySize,
            mainActivities: profile.mainActivities
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
      }
    };

    loadUserData();
  }, []);

  const handleInputChange = (field: keyof UserProfileData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);

    try {
      // Simuler un délai de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (userProfile) {
        // Mettre à jour le profil existant
        const updatedProfile = UserProfileManager.updateUserProfile(formData);
        if (updatedProfile) {
          setUserProfile(updatedProfile);
        }
      } else {
        // Créer un nouveau profil
        const newProfile = UserProfileManager.saveUserProfile('user-temp-id', userEmail, formData);
        setUserProfile(newProfile);
      }

      setIsEditing(false);
      setShowSuccessMessage(true);
      
      // Cacher le message de succès après 3 secondes
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Restaurer les données originales
    if (userProfile) {
      setFormData({
        fullName: userProfile.fullName,
        companyName: userProfile.companyName,
        sector: userProfile.sector,
        companySize: userProfile.companySize,
        mainActivities: userProfile.mainActivities
      });
    }
    setIsEditing(false);
  };

  const isFormValid = () => {
    return formData.fullName.trim() !== '' && 
           formData.companyName.trim() !== '' && 
           formData.sector !== '' && 
           formData.companySize !== '' && 
           formData.mainActivities.trim() !== '';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez vos informations personnelles et les paramètres de votre compte
        </p>
      </div>

      {/* Message de succès */}
      {showSuccessMessage && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Vos informations ont été sauvegardées avec succès !
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profil Entreprise */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <CardTitle>Profil Entreprise</CardTitle>
            </div>
            <CardDescription>
              Informations sur votre entreprise utilisées pour la génération de documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!userProfile && !isEditing ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Aucun profil configuré. Cliquez sur "Modifier" pour saisir vos informations.
                </AlertDescription>
              </Alert>
            ) : null}

            {/* Nom complet */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Prénom et Nom
              </Label>
              {isEditing ? (
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Ex: Jean Dupont"
                />
              ) : (
                <div className="p-3 bg-muted/50 rounded-md">
                  {userProfile?.fullName || 'Non défini'}
                </div>
              )}
            </div>

            {/* Email (lecture seule) */}
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="p-3 bg-muted/30 rounded-md text-muted-foreground">
                {userEmail || 'Non défini'}
              </div>
            </div>

            {/* Nom de l'entreprise */}
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Nom de l'entreprise
              </Label>
              {isEditing ? (
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="Ex: ACME Corporation"
                />
              ) : (
                <div className="p-3 bg-muted/50 rounded-md">
                  {userProfile?.companyName || 'Non défini'}
                </div>
              )}
            </div>

            {/* Secteur d'activité */}
            <div className="space-y-2">
              <Label htmlFor="sector" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Secteur d'activité
              </Label>
              {isEditing ? (
                <select
                  id="sector"
                  value={formData.sector}
                  onChange={(e) => handleInputChange('sector', e.target.value)}
                  className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Sélectionnez votre secteur</option>
                  {SECTORS.map((sector) => (
                    <option key={sector} value={sector}>
                      {sector}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-muted/50 rounded-md">
                  {userProfile?.sector || 'Non défini'}
                </div>
              )}
            </div>

            {/* Taille de l'entreprise */}
            <div className="space-y-2">
              <Label htmlFor="companySize" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Taille de l'entreprise
              </Label>
              {isEditing ? (
                <select
                  id="companySize"
                  value={formData.companySize}
                  onChange={(e) => handleInputChange('companySize', e.target.value)}
                  className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Sélectionnez la taille</option>
                  {COMPANY_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-muted/50 rounded-md">
                  {userProfile?.companySize || 'Non défini'}
                </div>
              )}
            </div>

            {/* Activités principales */}
            <div className="space-y-2">
              <Label htmlFor="mainActivities" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activités principales
              </Label>
              {isEditing ? (
                <Textarea
                  id="mainActivities"
                  value={formData.mainActivities}
                  onChange={(e) => handleInputChange('mainActivities', e.target.value)}
                  placeholder="Décrivez les principales activités de votre entreprise..."
                  rows={3}
                />
              ) : (
                <div className="p-3 bg-muted/50 rounded-md min-h-[4rem]">
                  {userProfile?.mainActivities || 'Non défini'}
                </div>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={!isFormValid() || isSaving}
                    className="flex-1"
                  >
                    {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="w-full"
                >
                  Modifier
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sécurité */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Sécurité</CardTitle>
            </div>
            <CardDescription>
              Gérez la sécurité de votre compte et votre mot de passe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Modifiez votre mot de passe pour maintenir la sécurité de votre compte
              </p>
              <Button asChild className="w-full">
                <Link href="/dashboard/reset-password">
                  Changer le mot de passe
                </Link>
              </Button>
            </div>

            {/* Debug: Reset onboarding (à supprimer en production) */}
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Debug (développement)</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  UserProfileManager.resetOnboarding();
                  window.location.reload();
                }}
                className="w-full text-xs"
              >
                Réinitialiser l'onboarding (test)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}