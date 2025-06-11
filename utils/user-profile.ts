// Utility pour la gestion des profils utilisateur avec Supabase
import { maseDB, UserProfile as DBUserProfile } from '@/utils/supabase/database'
import { createClient } from '@/utils/supabase/client'

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

// Fallback keys for localStorage (backup only)
const USER_PROFILE_KEY = 'mase_user_profile';
const ONBOARDING_COMPLETED_KEY = 'mase_onboarding_completed';

export class UserProfileManager {
  // Sauvegarder le profil utilisateur
  static async saveUserProfile(userId: string, email: string, profileData: UserProfileData): Promise<UserProfile> {
    try {
      const dbProfile: Omit<DBUserProfile, 'id' | 'created_at' | 'updated_at'> = {
        email: email,
        full_name: profileData.fullName,
        company_name: profileData.companyName,
        sector: profileData.sector,
        company_size: profileData.companySize,
        main_activities: profileData.mainActivities,
        is_onboarding_completed: true
      };

      const savedProfile = await maseDB.createUserProfile(dbProfile);
      
      const profile: UserProfile = {
        id: savedProfile.id,
        email: savedProfile.email,
        fullName: savedProfile.full_name,
        companyName: savedProfile.company_name,
        sector: savedProfile.sector,
        companySize: savedProfile.company_size,
        mainActivities: savedProfile.main_activities,
        isOnboardingCompleted: savedProfile.is_onboarding_completed,
        createdAt: savedProfile.created_at,
        updatedAt: savedProfile.updated_at
      };

      // Backup to localStorage
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');

      return profile;
    } catch (error) {
      console.error('Error saving user profile to database:', error);
      
      // Fallback to localStorage only
      const profile: UserProfile = {
        id: userId,
        email: email,
        ...profileData,
        isOnboardingCompleted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');

      return profile;
    }
  }

  // Récupérer le profil utilisateur
  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      // Get current user from Supabase
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      // Try to get profile from database
      const dbProfile = await maseDB.getUserProfile(user.id);
      
      if (dbProfile) {
        const profile: UserProfile = {
          id: dbProfile.id,
          email: dbProfile.email,
          fullName: dbProfile.full_name,
          companyName: dbProfile.company_name,
          sector: dbProfile.sector,
          companySize: dbProfile.company_size,
          mainActivities: dbProfile.main_activities,
          isOnboardingCompleted: dbProfile.is_onboarding_completed,
          createdAt: dbProfile.created_at,
          updatedAt: dbProfile.updated_at
        };
        
        // Update localStorage backup
        localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
        return profile;
      }
      
      // Fallback to localStorage
      const profileData = localStorage.getItem(USER_PROFILE_KEY);
      if (profileData) {
        return JSON.parse(profileData);
      }
    } catch (error) {
      console.error('Error retrieving user profile:', error);
      
      // Final fallback to localStorage
      try {
        const profileData = localStorage.getItem(USER_PROFILE_KEY);
        if (profileData) {
          return JSON.parse(profileData);
        }
      } catch (localError) {
        console.error('Error retrieving profile from localStorage:', localError);
      }
    }
    return null;
  }

  // Mettre à jour le profil utilisateur
  static async updateUserProfile(profileData: Partial<UserProfileData>): Promise<UserProfile | null> {
    try {
      // Get current user
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      // Update in database
      const updates: Partial<DBUserProfile> = {};
      if (profileData.fullName) updates.full_name = profileData.fullName;
      if (profileData.companyName) updates.company_name = profileData.companyName;
      if (profileData.sector) updates.sector = profileData.sector;
      if (profileData.companySize) updates.company_size = profileData.companySize;
      if (profileData.mainActivities) updates.main_activities = profileData.mainActivities;

      const dbProfile = await maseDB.updateUserProfile(user.id, updates);
      
      const updatedProfile: UserProfile = {
        id: dbProfile.id,
        email: dbProfile.email,
        fullName: dbProfile.full_name,
        companyName: dbProfile.company_name,
        sector: dbProfile.sector,
        companySize: dbProfile.company_size,
        mainActivities: dbProfile.main_activities,
        isOnboardingCompleted: dbProfile.is_onboarding_completed,
        createdAt: dbProfile.created_at,
        updatedAt: dbProfile.updated_at
      };

      // Update localStorage backup
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
      return updatedProfile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      
      // Fallback to localStorage update
      const currentProfile = await this.getUserProfile();
      if (!currentProfile) return null;

      const updatedProfile: UserProfile = {
        ...currentProfile,
        ...profileData,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
      return updatedProfile;
    }
  }

  // Vérifier si l'onboarding est terminé
  static async isOnboardingCompleted(): Promise<boolean> {
    try {
      const profile = await this.getUserProfile();
      return profile !== null && profile.isOnboardingCompleted;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // Fallback to localStorage
      const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
      return completed === 'true';
    }
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
  static async getCompanyProfileForGenerator() {
    try {
      const profile = await this.getUserProfile();
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
    } catch (error) {
      console.error('Error getting company profile for generator:', error);
      return {
        name: 'Mon Entreprise',
        sector: 'Non défini',
        size: 'Non défini',
        activities: 'Non défini'
      };
    }
  }

  // Vérifier si c'est la première visite après inscription
  static async isFirstVisitAfterSignup(userEmail: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile();
      
      // Si aucun profil n'existe, c'est probablement la première visite
      if (!profile) return true;
      
      // Si le profil existe mais avec un email différent, c'est un nouvel utilisateur
      if (profile.email !== userEmail) return true;
      
      // Si onboarding pas terminé, considérer comme première visite
      const onboardingCompleted = await this.isOnboardingCompleted();
      return !onboardingCompleted;
    } catch (error) {
      console.error('Error checking first visit status:', error);
      // Fallback to assuming it's a first visit
      return true;
    }
  }
}