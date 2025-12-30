import * as SecureStore from 'expo-secure-store';

interface PersonalInfo {
  name: string;
  age: string;
  gender: string;
  weight: string;
  height: string;
  activityLevel: string;
  goal: string;
  dietaryRestrictions: string[];
  allergies: string[];
  targetCalories: string; // Calculated automatically based on user data
}

interface Meal {
  id: string;
  title: string;
  time: string;
  food?: any;
  hasFood: boolean;
}

class StorageService {
  private static instance: StorageService;

  // Storage keys
  private readonly PERSONAL_INFO_KEY = 'personal_info';
  private readonly MEALS_KEY = 'meals_data';
  private readonly GEMINI_API_KEY = 'gemini_api_key';
  private readonly FIRST_TIME_USER = 'first_time_user';
  private readonly THEME_PREFERENCE_KEY = 'theme_preference';

  private constructor() { }

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Personal Information Storage
  async savePersonalInfo(personalInfo: PersonalInfo): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.PERSONAL_INFO_KEY, JSON.stringify(personalInfo));
    } catch (error) {
      console.error('Error saving personal info:', error);
    }
  }

  async getPersonalInfo(): Promise<PersonalInfo | null> {
    try {
      const data = await SecureStore.getItemAsync(this.PERSONAL_INFO_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting personal info:', error);
      return null;
    }
  }

  async clearPersonalInfo(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.PERSONAL_INFO_KEY);
    } catch (error) {
      console.error('Error clearing personal info:', error);
    }
  }

  // Meals Data Storage
  async saveMeals(meals: Meal[]): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.MEALS_KEY, JSON.stringify(meals));
    } catch (error) {
      console.error('Error saving meals:', error);
    }
  }

  async getMeals(): Promise<Meal[] | null> {
    try {
      const data = await SecureStore.getItemAsync(this.MEALS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting meals:', error);
      return null;
    }
  }

  async clearMeals(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.MEALS_KEY);
    } catch (error) {
      console.error('Error clearing meals:', error);
    }
  }

  // Gemini API Key Storage
  async saveGeminiApiKey(apiKey: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.GEMINI_API_KEY, apiKey);
    } catch (error) {
      console.error('Error saving Gemini API key:', error);
    }
  }

  async getGeminiApiKey(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.GEMINI_API_KEY);
    } catch (error) {
      console.error('Error getting Gemini API key:', error);
      return null;
    }
  }

  async clearGeminiApiKey(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.GEMINI_API_KEY);
    } catch (error) {
      console.error('Error clearing Gemini API key:', error);
    }
  }

  // First Time User Flag
  async setFirstTimeUser(isFirstTime: boolean): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.FIRST_TIME_USER, JSON.stringify(isFirstTime));
    } catch (error) {
      console.error('Error setting first time user flag:', error);
    }
  }

  async isFirstTimeUser(): Promise<boolean> {
    try {
      const data = await SecureStore.getItemAsync(this.FIRST_TIME_USER);
      return data ? JSON.parse(data) : true;
    } catch (error) {
      console.error('Error getting first time user flag:', error);
      return true;
    }
  }

  // Theme Preference Storage
  async saveThemePreference(theme: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.THEME_PREFERENCE_KEY, theme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }

  async getThemePreference(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.THEME_PREFERENCE_KEY);
    } catch (error) {
      console.error('Error getting theme preference:', error);
      return null;
    }
  }

  async clearThemePreference(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.THEME_PREFERENCE_KEY);
    } catch (error) {
      console.error('Error clearing theme preference:', error);
    }
  }

  // Clear All Data
  async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        this.clearPersonalInfo(),
        this.clearMeals(),
        this.clearGeminiApiKey(),
        this.clearThemePreference(),
        SecureStore.deleteItemAsync(this.FIRST_TIME_USER),
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }

  // Export Data (for backup purposes)
  async exportData(): Promise<{
    personalInfo: PersonalInfo | null;
    meals: Meal[] | null;
    hasApiKey: boolean;
  }> {
    try {
      const [personalInfo, meals, apiKey] = await Promise.all([
        this.getPersonalInfo(),
        this.getMeals(),
        this.getGeminiApiKey(),
      ]);

      return {
        personalInfo,
        meals,
        hasApiKey: !!apiKey,
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      return {
        personalInfo: null,
        meals: null,
        hasApiKey: false,
      };
    }
  }

  // Import Data (for restore purposes)
  async importData(data: {
    personalInfo?: PersonalInfo;
    meals?: Meal[];
    apiKey?: string;
  }): Promise<void> {
    try {
      const promises: Promise<void>[] = [];

      if (data.personalInfo) {
        promises.push(this.savePersonalInfo(data.personalInfo));
      }

      if (data.meals) {
        promises.push(this.saveMeals(data.meals));
      }

      if (data.apiKey) {
        promises.push(this.saveGeminiApiKey(data.apiKey));
      }

      await Promise.all(promises);
    } catch (error) {
      console.error('Error importing data:', error);
    }
  }

  // Check if user has completed setup
  async hasCompletedSetup(): Promise<boolean> {
    try {
      const personalInfo = await this.getPersonalInfo();
      return !!personalInfo;
    } catch (error) {
      console.error('Error checking setup completion:', error);
      return false;
    }
  }

  // Get storage statistics
  async getStorageStats(): Promise<{
    hasPersonalInfo: boolean;
    hasMeals: boolean;
    hasApiKey: boolean;
    isFirstTime: boolean;
  }> {
    try {
      const [personalInfo, meals, apiKey, isFirstTime] = await Promise.all([
        this.getPersonalInfo(),
        this.getMeals(),
        this.getGeminiApiKey(),
        this.isFirstTimeUser(),
      ]);

      return {
        hasPersonalInfo: !!personalInfo,
        hasMeals: !!meals,
        hasApiKey: !!apiKey,
        isFirstTime,
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        hasPersonalInfo: false,
        hasMeals: false,
        hasApiKey: false,
        isFirstTime: true,
      };
    }
  }
}

export default StorageService.getInstance(); 