// Utility pour la gestion des profils utilisateur

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  companyName: string;
  sector: string;
  companySize: string;
  mainActivities: string;
  isOnboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileData {
  fullName: string;
  companyName: string;
  sector: string;
  companySize: string;
  mainActivities: string;
}

const USER_PROFILE_KEY = 'mase_user_profile';
const ONBOARDING_COMPLETED_KEY = 'mase_onboarding_completed';

export class UserProfileManager {
  // Sauvegarder le profil utilisateur
  static saveUserProfile(userId: string, email: string, profileData: UserProfileData): UserProfile {
    const profile: UserProfile = {
      id: userId,
      email: email,
      ...profileData,
      isOnboardingCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Sauvegarder dans localStorage (temporaire, en attendant la vraie DB)
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');

    return profile;
  }

  // Récupérer le profil utilisateur
  static getUserProfile(): UserProfile | null {
    try {
      const profileData = localStorage.getItem(USER_PROFILE_KEY);
      if (profileData) {
        return JSON.parse(profileData);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
    }
    return null;
  }

  // Mettre à jour le profil utilisateur
  static updateUserProfile(profileData: Partial<UserProfileData>): UserProfile | null {
    const currentProfile = this.getUserProfile();
    if (!currentProfile) return null;

    const updatedProfile: UserProfile = {
      ...currentProfile,
      ...profileData,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
    return updatedProfile;
  }

  // Vérifier si l'onboarding est terminé
  static isOnboardingCompleted(): boolean {
    const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
    const profile = this.getUserProfile();
    return completed === 'true' && profile !== null;
  }

  // Marquer l'onboarding comme terminé
  static markOnboardingCompleted(): void {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
  }

  // Réinitialiser l'onboarding (pour les tests)
  static resetOnboarding(): void {
    localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    localStorage.removeItem(USER_PROFILE_KEY);
  }

  // Récupérer les données pour MASE GENERATOR (format compatible)
  static getCompanyProfileForGenerator() {
    const profile = this.getUserProfile();
    if (!profile) {
      return {
        name: 'Mon Entreprise',
        sector: 'Non défini',
        size: 'Non défini',
        activities: 'Non défini'
      };
    }

    return {
      name: profile.companyName,
      sector: profile.sector,
      size: profile.companySize,
      activities: profile.mainActivities
    };
  }

  // Vérifier si c'est la première visite après inscription
  static isFirstVisitAfterSignup(userEmail: string): boolean {
    // Dans un vrai projet, cela serait géré côté serveur
    // Ici on simule en vérifiant si le profil existe
    const profile = this.getUserProfile();
    
    // Si aucun profil n'existe, c'est probablement la première visite
    if (!profile) return true;
    
    // Si le profil existe mais avec un email différent, c'est un nouvel utilisateur
    if (profile.email !== userEmail) return true;
    
    // Si onboarding pas terminé, considérer comme première visite
    return !this.isOnboardingCompleted();
  }
}