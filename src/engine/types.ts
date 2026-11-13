/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ==========================================
// MOTOR 1 & MOTOR 2 TYPED DOMAIN CONTRACTS
// ==========================================

export type BiologicalSex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'heavy' | 'extreme';
export type NutritionalGoal = 'weight_loss' | 'maintenance' | 'hypertrophy' | 'clinical_rehab';
export type CalculationFormula = 'harris_benedict' | 'mifflin_st_jeor' | 'cunningham' | 'katch_mcardle';

export interface PatientNutritionInput {
  patientId: string;
  tenantId: string;
  name?: string;
  age: number;
  sex: BiologicalSex;
  weightKg: number;
  heightCm: number;
  bodyFatPercentage?: number;
  activityLevel: ActivityLevel;
  goal: NutritionalGoal;
  calculationFormula: CalculationFormula;
  getKcal: number;
  prescribedVETKcal: number;
  referenceWeightType?: 'current' | 'ideal' | 'adjusted';
  referenceWeightKg?: number;
}

export interface EnergyTargets {
  getKcal: number;
  prescribedVETKcal: number;
  caloricDeltaKcal: number;
  deltaPercentage: number;
  isDeficit: boolean;
  isSurplus: boolean;
  warnings: string[];
}

export type MacroCalculationType = 'percentage' | 'grams_per_kg';

export interface MacroInput {
  calculationType: MacroCalculationType;
  carbsPercentage?: number;
  proteinPercentage?: number;
  proteinGramsPerKg?: number;
  lipidsPercentage?: number;
  referenceWeightKg?: number;
}

export interface MacroTargets {
  carbohydratesG: number;
  carbohydratesKcal: number;
  carbohydratesPct: number;
  proteinG: number;
  proteinKcal: number;
  proteinPct: number;
  proteinGramsPerKg: number;
  lipidsG: number;
  lipidsKcal: number;
  lipidsPct: number;
  totalEnergyKcal: number;
  warnings: string[];
}

export interface SingleMealDistributionInput {
  id: string;
  name: string;
  time?: string;
  percentage: number;
}

export interface MealDistributionTarget {
  id: string;
  name: string;
  time: string;
  percentage: number;
  targetKcal: number;
  targetCarbsG: number;
  targetProteinG: number;
  targetLipidsG: number;
}

export interface MealDistributionResult {
  totalPercentage: number;
  isValid: boolean;
  meals: MealDistributionTarget[];
  errors: string[];
}

// ------------------------------------------
// FOOD CATALOG & RESTRICTION CONTRACTS
// ------------------------------------------

export type AllergenType =
  | 'milk'
  | 'egg'
  | 'peanut'
  | 'tree_nuts'
  | 'soy'
  | 'wheat_gluten'
  | 'fish'
  | 'crustaceans';

export type IntoleranceType = 'lactose' | 'fructose' | 'histamine' | 'fodmap';

export type DietaryPattern =
  | 'omnivore'
  | 'vegetarian'
  | 'vegan'
  | 'lacto_ovo_vegetarian'
  | 'pescatarian'
  | 'mediterranean'
  | 'low_carb';

export interface FoodRestriction {
  allergies: AllergenType[];
  intolerances: IntoleranceType[];
  dietaryPattern: DietaryPattern;
  dislikedFoods: string[]; // food names or tags
  favoriteFoods: string[];
  maxPrepTimeMinutes?: number;
  budgetCategory?: 'low' | 'medium' | 'high';
}

export interface HouseholdMeasure {
  name: string; // e.g. "Colher de sopa", "Xícara de chá", "Unidade média", "Fatia"
  grams: number;
}

export interface FoodItem {
  foodId: string;
  name: string;
  source: 'TACO' | 'TBCA' | 'USDA' | 'CLINIC_CUSTOM';
  category: string;
  referenceWeightGrams: number;
  energyKcal: number;
  carbohydratesG: number;
  proteinG: number;
  lipidsG: number;
  fiberG: number;
  sodiumMg: number;
  calciumMg?: number;
  ironMg?: number;
  potassiumMg?: number;
  allergens: AllergenType[];
  containsGluten: boolean;
  containsLactose: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  householdMeasures: HouseholdMeasure[];
  ingredientsList?: string[];
  preparationTips?: string;
}

// ------------------------------------------
// MEAL PLAN & NUTRITION CALCULATION CONTRACTS
// ------------------------------------------

export interface MealFoodItem {
  foodId: string;
  name: string;
  quantityGrams: number;
  householdMeasureSelected?: string; // e.g. "2 Colheres de sopa"
  preparation?: string;
  calculatedNutrition: {
    energyKcal: number;
    carbohydratesG: number;
    proteinG: number;
    lipidsG: number;
    fiberG: number;
    sodiumMg: number;
  };
}

export interface MealPlanMeal {
  mealId: string;
  mealName: string;
  time?: string;
  targetKcal?: number;
  foods: MealFoodItem[];
  totals: {
    energyKcal: number;
    carbohydratesG: number;
    proteinG: number;
    lipidsG: number;
    fiberG: number;
    sodiumMg: number;
  };
}

export interface MealPlan {
  id: string;
  patientId: string;
  tenantId: string;
  planName: string;
  version: number;
  status: 'draft' | 'approved' | 'archived';
  createdAt: string;
  updatedAt: string;
  dailyTarget: {
    energyKcal: number;
    carbohydratesG: number;
    proteinG: number;
    lipidsG: number;
  };
  recalculatedTotals: {
    energyKcal: number;
    carbohydratesG: number;
    proteinG: number;
    lipidsG: number;
    fiberG: number;
    sodiumMg: number;
  };
  meals: MealPlanMeal[];
  clinicalObservations?: string[];
}

export interface NutritionValidationResult {
  isValid: boolean;
  energyDeltaKcal: number;
  energyDeltaPct: number;
  carbsDeltaG: number;
  carbsDeltaPct: number;
  proteinDeltaG: number;
  proteinDeltaPct: number;
  lipidsDeltaG: number;
  lipidsDeltaPct: number;
  energyWithinTolerance: boolean;
  carbsWithinTolerance: boolean;
  proteinWithinTolerance: boolean;
  lipidsWithinTolerance: boolean;
  allergensViolated: string[];
  intolerancesViolated: string[];
  dietaryPatternViolated: boolean;
  unknownFoodIds: string[];
  missingNutrientDataIds: string[];
  crossContaminationAlerts: string[];
  errors: string[];
  warnings: string[];
}

export interface FoodSubstitutionRequest {
  originalFoodId: string;
  originalQuantityGrams: number;
  substituteFoodId: string;
  targetNutrientCriterion?: 'energyKcal' | 'carbohydratesG' | 'proteinG' | 'lipidsG';
}

export interface FoodSubstitutionResult {
  originalFood: FoodItem;
  originalQuantityGrams: number;
  substituteFood: FoodItem;
  calculatedQuantityGrams: number;
  householdMeasureSuggestion: string;
  nutrientCriterionUsed: string;
  originalNutrientValue: number;
  substituteNutrientValue: number;
  variancePct: number;
}

export interface AiGenerationLog {
  id: string;
  tenantId: string;
  patientId: string;
  timestamp: string;
  promptTokens?: number;
  completionTokens?: number;
  modelUsed: string;
  attemptNumber: number;
  status: 'success' | 'validation_failed' | 'error';
  errorMessage?: string;
  validationDetails?: NutritionValidationResult;
}

// ==========================================
// PROFESSIONAL, RBAC & PERMISSION CONTRACTS
// ==========================================

export type UserRole =
  | 'admin'
  | 'senior_nutritionist'
  | 'junior_nutritionist'
  | 'intern'
  | 'receptionist';

export type PermissionKey =
  | 'manage_clinic'
  | 'manage_professionals'
  | 'manage_permissions'
  | 'create_patient'
  | 'edit_patient'
  | 'delete_patient'
  | 'prescribe_vet'
  | 'generate_ai_plan'
  | 'approve_prescription'
  | 'export_pdf'
  | 'view_audit_logs';

export interface Professional {
  id: string;
  tenantId: string;
  name: string;
  crn: string;
  email: string;
  phone: string;
  role: UserRole;
  specialization: string;
  active: boolean;
  createdAt: string;
}

export interface RolePermissionsMap {
  role: UserRole;
  label: string;
  description: string;
  permissions: PermissionKey[];
}

