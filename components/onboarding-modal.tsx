"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, User, Briefcase, Users, Activity } from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: UserProfileData) => void;
}

export interface UserProfileData {
  fullName: string;
  companyName: string;
  sector: string;
  companySize: string;
  mainActivities: string;
}

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

export default function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [formData, setFormData] = useState<UserProfileData>({
    fullName: '',
    companyName: '',
    sector: '',
    companySize: '',
    mainActivities: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof UserProfileData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // The actual save will be handled by the parent component (DashboardWrapper)
      // which has access to the user ID from Supabase
      await onComplete(formData);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return formData.fullName.trim() !== '' && 
           formData.companyName.trim() !== '' && 
           formData.sector !== '' && 
           formData.companySize !== '' && 
           formData.mainActivities.trim() !== '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal={true}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Bienvenue sur Mase Docs ! 👋
          </DialogTitle>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardHeader className="text-center pb-6">
            <CardDescription className="text-base">
              Pour personnaliser votre expérience et générer des documents adaptés à votre entreprise, 
              nous avons besoin de quelques informations.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nom complet */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4" />
                  Prénom et Nom *
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Ex: Jean Dupont"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="h-11"
                />
              </div>

              {/* Nom de l'entreprise */}
              <div className="space-y-2">
                <Label htmlFor="companyName" className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4" />
                  Nom de l'entreprise *
                </Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Ex: ACME Corporation"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="h-11"
                />
              </div>

              {/* Secteur d'activité */}
              <div className="space-y-2">
                <Label htmlFor="sector" className="flex items-center gap-2 text-sm font-medium">
                  <Briefcase className="h-4 w-4" />
                  Secteur d'activité *
                </Label>
                <select
                  id="sector"
                  value={formData.sector}
                  onChange={(e) => handleInputChange('sector', e.target.value)}
                  className="w-full h-11 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="">Sélectionnez votre secteur</option>
                  {SECTORS.map((sector) => (
                    <option key={sector} value={sector}>
                      {sector}
                    </option>
                  ))}
                </select>
              </div>

              {/* Taille de l'entreprise */}
              <div className="space-y-2">
                <Label htmlFor="companySize" className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4" />
                  Taille de l'entreprise *
                </Label>
                <select
                  id="companySize"
                  value={formData.companySize}
                  onChange={(e) => handleInputChange('companySize', e.target.value)}
                  className="w-full h-11 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="">Sélectionnez la taille</option>
                  {COMPANY_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              {/* Activités principales */}
              <div className="space-y-2">
                <Label htmlFor="mainActivities" className="flex items-center gap-2 text-sm font-medium">
                  <Activity className="h-4 w-4" />
                  Activités principales *
                </Label>
                <Textarea
                  id="mainActivities"
                  placeholder="Décrivez brièvement les principales activités de votre entreprise..."
                  value={formData.mainActivities}
                  onChange={(e) => handleInputChange('mainActivities', e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Ex: Construction et rénovation de bâtiments commerciaux et résidentiels
                </p>
              </div>

              {/* Boutons d'action - ONBOARDING OBLIGATOIRE */}
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={!isFormValid() || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? 'Enregistrement...' : 'Compléter l\'inscription'}
                </Button>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-4">
                <p className="text-xs text-amber-800 dark:text-amber-200 text-center">
                  ⚠️ <strong>Inscription obligatoire</strong><br/>
                  Ces informations sont nécessaires pour accéder à la plateforme MASE Docs. 
                  Vous pourrez les modifier à tout moment dans vos paramètres.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}