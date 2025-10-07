// types/food-profile.types.ts
import type {
  BudgetConsideration,
  CookingEquipment,
  CookingSkillLevel,
  CookingTime,
  CuisineType,
  FoodAllergy,
  SpicinessLevel,
  TastePalette,
} from "./food-profile.enums";

// Keep the original complex interfaces for API responses
export interface FoodConstrain<T> {
  food: T;
  isRequired: boolean;
}

// Simplified interfaces for form handling (using string arrays)
export interface FoodPreferencesForm {
  foodAllergies: string[];
  ingredientsToPrefer: FoodConstrain<string>[];
  ingredientsToAvoid: FoodConstrain<string>[];
}

export interface CookingProfileForm {
  cookingSkillLevel?: string;
  cookingEquipment: string[];
  cookingTimePreference: string[];
  budgetConsideration?: string;
}

export interface AdvancedOptionsForm {
  nutritionalGoals: string[];
}

export interface FlavorProfileForm {
  cuisinePreferences: string[];
  spicinessLevel: string;
  tastePreferences: string[];
}

export interface FoodProfileForm {
  id: string;
  foodPreferences: FoodPreferencesForm;
  cookingProfile: CookingProfileForm;
  advancedOptions: AdvancedOptionsForm;
  flavorProfile: FlavorProfileForm;
}

// Original complex interfaces for API responses
export interface FoodPreferences {
  foodAllergies: FoodAllergy[];
  ingredientsToPrefer: FoodConstrain<string>[];
  ingredientsToAvoid: FoodConstrain<string>[];
}

export interface CookingProfile {
  cookingSkillLevel: CookingSkillLevel;
  cookingEquipment: CookingEquipment[];
  cookingTimePreference: CookingTime[];
  budgetConsideration?: BudgetConsideration;
}

export interface AdvancedOptions {
  nutritionalGoals: string[];
}

export interface FlavorProfile {
  cuisinePreferences: CuisineType[];
  spicinessLevel: SpicinessLevel;
  tastePreferences: TastePalette[];
}

export interface FoodProfileDTO {
  id: string;
  foodPreferences: FoodPreferences;
  cookingProfile: CookingProfile;
  advancedOptions: AdvancedOptions;
  flavorProfile: FlavorProfile;
}
