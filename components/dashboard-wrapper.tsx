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
          
          // Vérifier le statut d'onboarding depuis la base de données
          const userProfile = await UserProfileManager.getUserProfile();
          
          // Forcer l'onboarding si pas complété
          if (!userProfile || !userProfile.isOnboardingCompleted) {
            console.log('Onboarding required for user:', currentUser.id);
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

  const handleOnboardingComplete = async (profileData: UserProfileData) => {
    if (user) {
      try {
        // Sauvegarder le profil dans Supabase
        await UserProfileManager.saveUserProfile(user.id, profileData);
        
        // Fermer la modale
        setShowOnboarding(false);
        
        // Optionnel: afficher une notification de succès
        console.log('Profil utilisateur enregistré avec succès');
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du profil:', error);
        // Vous pourriez afficher une notification d'erreur ici
      }
    }
  };

  const handleOnboardingClose = () => {
    // ONBOARDING OBLIGATOIRE : Empêcher la fermeture
    // L'utilisateur ne peut pas accéder à la plateforme sans compléter
    console.log('Onboarding is mandatory - cannot close without completing');
    // Ne pas fermer la modale
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