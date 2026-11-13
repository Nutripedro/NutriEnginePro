/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AllergenType,
  FoodItem,
  FoodRestriction,
  IntoleranceType,
  PatientNutritionInput
} from './types';

// ==========================================
// CLINICAL SAFETY & ALLERGY VALIDATION RULES
// ==========================================

export const ALLERGEN_LABELS: Record<AllergenType, string> = {
  milk: 'Proteína do Leite (APLV)',
  egg: 'Ovo',
  peanut: 'Amendoim',
  tree_nuts: 'Castanhas e Nozes',
  soy: 'Soja',
  wheat_gluten: 'Trigo e Glúten',
  fish: 'Peixes',
  crustaceans: 'Crustáceos e Frutos do Mar'
};

export const INTOLERANCE_LABELS: Record<IntoleranceType, string> = {
  lactose: 'Intolerância à Lactose',
  fructose: 'Intolerância à Frutose',
  histamine: 'Intolerância à Histamina',
  fodmap: 'Sensibilidade a FODMAPs'
};

// Ingredients or hidden sources keywords for cross-contamination safety checks
export const PROHIBITED_INGREDIENT_KEYWORDS: Record<AllergenType, string[]> = {
  milk: ['leite', 'soro de leite', 'whey', 'caseína', 'caseinato', 'lactalbumina', 'manteiga', 'queijo', 'creme de leite', 'iogurte', 'lactose'],
  egg: ['ovo', 'gema', 'clara', 'albumina', 'ovomucina', 'lysozyme', 'maionese'],
  peanut: ['amendoim', 'pasta de amendoim', 'óleo de amendoim', 'peanut'],
  tree_nuts: ['castanha', 'nozes', 'amêndoa', 'avelã', 'pistache', 'macadâmia', 'pecã'],
  soy: ['soja', 'tofu', 'proteína de soja', 'lecitina de soja', 'shoyu', 'misso', 'edamame'],
  wheat_gluten: ['trigo', 'glúten', 'farinha de trigo', 'cevada', 'centeio', 'aveia comum', 'pão tradicional', 'macarrão tradicional'],
  fish: ['peixe', 'tilápia', 'salmão', 'atum', 'bacalhau', 'sardinha', 'pescada', 'anchova'],
  crustaceans: ['camarão', 'lagosta', 'caranguejo', 'siri', 'lula', 'polvo', 'ostra']
};

export function checkFoodAllergySafety(
  food: FoodItem,
  patientAllergies: AllergenType[]
): { safe: boolean; violatedAllergens: AllergenType[]; warningDetails: string[] } {
  const violatedAllergens: AllergenType[] = [];
  const warningDetails: string[] = [];

  for (const allergen of patientAllergies) {
    // 1. Direct tag check
    if (food.allergens.includes(allergen)) {
      violatedAllergens.push(allergen);
      warningDetails.push(`Alimento ${food.name} possui marcador direto de alergia: ${ALLERGEN_LABELS[allergen] || allergen}.`);
    }

    // 2. Specific wheat / gluten check
    if (allergen === 'wheat_gluten' && food.containsGluten) {
      if (!violatedAllergens.includes(allergen)) violatedAllergens.push(allergen);
      warningDetails.push(`Alimento ${food.name} contém Glúten.`);
    }

    // 3. Ingredients list cross-matching (safety fallback)
    if (food.ingredientsList && food.ingredientsList.length > 0) {
      const keywords = PROHIBITED_INGREDIENT_KEYWORDS[allergen] || [];
      for (const ingredient of food.ingredientsList) {
        const lowerIng = ingredient.toLowerCase();
        if (keywords.some(kw => lowerIng.includes(kw))) {
          if (!violatedAllergens.includes(allergen)) violatedAllergens.push(allergen);
          warningDetails.push(`Ingrediente suspeiito em ${food.name}: "${ingredient}" coincide com o alérgeno ${ALLERGEN_LABELS[allergen] || allergen}.`);
        }
      }
    }
  }

  return {
    safe: violatedAllergens.length === 0,
    violatedAllergens,
    warningDetails
  };
}

export function checkFoodIntoleranceSafety(
  food: FoodItem,
  intolerances: IntoleranceType[]
): { safe: boolean; violatedIntolerances: IntoleranceType[]; warningDetails: string[] } {
  const violatedIntolerances: IntoleranceType[] = [];
  const warningDetails: string[] = [];

  for (const intolerance of intolerances) {
    if (intolerance === 'lactose' && food.containsLactose) {
      violatedIntolerances.push(intolerance);
      warningDetails.push(`Alimento ${food.name} contém Lactose.`);
    }
  }

  return {
    safe: violatedIntolerances.length === 0,
    violatedIntolerances,
    warningDetails
  };
}

export function checkDietaryPatternSafety(
  food: FoodItem,
  pattern: FoodRestriction['dietaryPattern']
): { safe: boolean; warning?: string } {
  if (pattern === 'vegan' && !food.isVegan) {
    return {
      safe: false,
      warning: `Alimento ${food.name} não é adequado para o padrão Vegano.`
    };
  }

  if (
    (pattern === 'vegetarian' || pattern === 'lacto_ovo_vegetarian') &&
    !food.isVegetarian
  ) {
    return {
      safe: false,
      warning: `Alimento ${food.name} contém proteína animal e não é adequado para o padrão Vegetariano.`
    };
  }

  if (pattern === 'pescatarian') {
    if (!food.isVegetarian && !food.allergens.includes('fish') && !food.allergens.includes('crustaceans')) {
      return {
        safe: false,
        warning: `Alimento ${food.name} contém carne vermelha ou ave, incompatível com Pescetariano.`
      };
    }
  }

  return { safe: true };
}

export function generateClinicalSafetyAlerts(input: PatientNutritionInput): string[] {
  const alerts: string[] = [];

  if (input.weightKg <= 0) alerts.push('ALERTA CLÍNICO: Peso do paciente deve ser um número positivo.');
  if (input.heightCm <= 0) alerts.push('ALERTA CLÍNICO: Altura do paciente deve ser um número positivo.');
  if (input.age <= 0 || input.age > 120) alerts.push('ALERTA CLÍNICO: Idade fora dos limites fisiológicos normais.');

  // Check VET extreme bounds
  if (input.prescribedVETKcal < 1200 && input.sex === 'female') {
    alerts.push('ALERTA CLÍNICO: VET prescrito < 1.200 kcal para sexo feminino exige acompanhamento médico estrito.');
  }
  if (input.prescribedVETKcal < 1500 && input.sex === 'male') {
    alerts.push('ALERTA CLÍNICO: VET prescrito < 1.500 kcal para sexo masculino exige acompanhamento médico estrito.');
  }

  // Energy deficit checks
  if (input.getKcal > 0) {
    const deficitPct = ((input.getKcal - input.prescribedVETKcal) / input.getKcal) * 100;
    if (deficitPct > 30) {
      alerts.push(`ALERTA CLÍNICO: Déficit calórico elevado (${deficitPct.toFixed(1)}%). Risco de perda de massa magra e queda de taxa metabólica basal.`);
    }
    if (deficitPct < -30) {
      alerts.push(`ALERTA CLÍNICO: Superávit calórico elevado (${Math.abs(deficitPct).toFixed(1)}%). Monitorar ganho de gordura.`);
    }
  }

  return alerts;
}
