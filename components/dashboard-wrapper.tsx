"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { UserProfileManager, UserProfileData } from "@/utils/user-profile";
import OnboardingModal from "@/components/onboarding-modal";
import { User } from "@supabase/supabase-js";

interface DashboardWrapperProps {
  children: React.ReactNode;
}

export default function DashboardWrapper({ children }: DashboardWrapperProps) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const supabase = createClient();
      
      try {
        // Récupérer l'utilisateur actuel
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (currentUser) {
          setUser(currentUser);
          
          // Vérifier si c'est la première visite après inscription
          const isFirstVisit = UserProfileManager.isFirstVisitAfterSignup(currentUser.email || '');
          
          if (isFirstVisit) {
            // Attendre un peu pour que la page se charge avant d'afficher la modale
            setTimeout(() => {
              setShowOnboarding(true);
            }, 500);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut d\'onboarding:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  const handleOnboardingComplete = (profileData: UserProfileData) => {
    if (user) {
      // Sauvegarder le profil
      UserProfileManager.saveUserProfile(user.id, user.email || '', profileData);
      
      // Fermer la modale
      setShowOnboarding(false);
      
      // Optionnel: afficher une notification de succès
      console.log('Profil utilisateur enregistré avec succès');
    }
  };

  const handleOnboardingClose = () => {
    // L'utilisateur ferme la modale sans compléter
    setShowOnboarding(false);
    
    // Optionnel: enregistrer qu'il a ignoré l'onboarding
    // mais ne pas marquer comme complété
  };

  // Ne rien afficher pendant le chargement
  if (isLoading) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      
      {/* Modale d'onboarding */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleOnboardingClose}
        onComplete={handleOnboardingComplete}
      />
    </>
  );
}