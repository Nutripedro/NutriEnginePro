/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  checkDietaryPatternSafety,
  checkFoodAllergySafety,
  checkFoodIntoleranceSafety,
  generateClinicalSafetyAlerts
} from './allergyRules';
import { getFoodById, INITIAL_FOOD_CATALOG } from './foodCatalog';
import {
  EnergyTargets,
  FoodItem,
  FoodRestriction,
  FoodSubstitutionRequest,
  FoodSubstitutionResult,
  MacroInput,
  MacroTargets,
  MealDistributionResult,
  MealFoodItem,
  MealPlan,
  MealPlanMeal,
  NutritionValidationResult,
  PatientNutritionInput,
  SingleMealDistributionInput
} from './types';

// =========================================================================
// MOTOR 1: NUTRITION CALCULATION ENGINE (DETERMINISTIC MATH & CLINICAL)
// =========================================================================

// Fatores de conversão energética oficiais (Atwater System)
export const ENERGY_FACTORS = {
  CARBS_KCAL_PER_G: 4.0,
  PROTEIN_KCAL_PER_G: 4.0,
  LIPIDS_KCAL_PER_G: 9.0
} as const;

// Nível de Atividade Física (PAL - Physical Activity Level)
export const PAL_FACTORS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  heavy: 1.725,
  extreme: 1.9
};

/**
 * Calcula a Taxa Metabólica Basal (TMB) e Gasto Energético Total (GET)
 * utilizando fórmulas clínicas validadas.
 */
export function calculateBMRAndGET(input: PatientNutritionInput): { bmrKcal: number; getKcal: number } {
  let bmrKcal = 0;
  const { weightKg, heightCm, age, sex, activityLevel, calculationFormula, bodyFatPercentage } = input;

  if (calculationFormula === 'mifflin_st_jeor') {
    // Mifflin-St Jeor (1990)
    // Homens: (10 × peso) + (6.25 × altura) - (5 × idade) + 5
    // Mulheres: (10 × peso) + (6.25 × altura) - (5 × idade) - 161
    bmrKcal = 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161);
  } else if (calculationFormula === 'cunningham' && bodyFatPercentage !== undefined) {
    // Cunningham (1980) baseada em Massa Magra (LBM)
    const lbmKg = weightKg * (1 - bodyFatPercentage / 100);
    bmrKcal = 500 + 22 * lbmKg;
  } else if (calculationFormula === 'katch_mcardle' && bodyFatPercentage !== undefined) {
    // Katch-McArdle
    const lbmKg = weightKg * (1 - bodyFatPercentage / 100);
    bmrKcal = 370 + 21.6 * lbmKg;
  } else {
    // Harris-Benedict Padrão (1919/1984)
    if (sex === 'male') {
      bmrKcal = 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age;
    } else {
      bmrKcal = 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age;
    }
  }

  const pal = PAL_FACTORS[activityLevel] || 1.2;
  const getKcal = Math.round(bmrKcal * pal);

  return {
    bmrKcal: Math.round(bmrKcal),
    getKcal
  };
}

/**
 * 1. calculateEnergyTarget()
 * Avalia a meta de energia (VET) em relação ao GET do paciente.
 */
export function calculateEnergyTarget(input: PatientNutritionInput): EnergyTargets {
  if (input.weightKg <= 0 || input.heightCm <= 0 || input.age <= 0) {
    throw new Error('Dados antropométricos inválidos: Peso, Altura e Idade devem ser maiores que zero.');
  }

  const getKcal = input.getKcal > 0 ? input.getKcal : calculateBMRAndGET(input).getKcal;
  const prescribedVETKcal = input.prescribedVETKcal;

  if (prescribedVETKcal <= 0) {
    throw new Error('VET prescrito deve ser maior que zero.');
  }

  const caloricDeltaKcal = prescribedVETKcal - getKcal;
  const deltaPercentage = (caloricDeltaKcal / getKcal) * 100;

  const warnings = generateClinicalSafetyAlerts({ ...input, getKcal });

  return {
    getKcal: Math.round(getKcal),
    prescribedVETKcal: Math.round(prescribedVETKcal),
    caloricDeltaKcal: Math.round(caloricDeltaKcal),
    deltaPercentage: Number(deltaPercentage.toFixed(2)),
    isDeficit: caloricDeltaKcal < 0,
    isSurplus: caloricDeltaKcal > 0,
    warnings
  };
}

/**
 * 2. calculateMacroTargets()
 * Calcula metas determinísticas de Carboidratos, Proteínas e Lipídios em gramas e kcal.
 */
export function calculateMacroTargets(
  vetKcal: number,
  macroInput: MacroInput,
  patientWeightKg: number
): MacroTargets {
  if (vetKcal <= 0) {
    throw new Error('VET prescrito inválido para cálculo de macronutrientes.');
  }

  const warnings: string[] = [];
  const refWeight = macroInput.referenceWeightKg || patientWeightKg;

  let carbsPct = 0;
  let proteinPct = 0;
  let lipidsPct = 0;

  let proteinG = 0;
  let carbsG = 0;
  let lipidsG = 0;

  if (macroInput.calculationType === 'grams_per_kg') {
    const proteinGPerKg = macroInput.proteinGramsPerKg ?? 2.0;
    proteinG = proteinGPerKg * refWeight;
    const proteinKcal = proteinG * ENERGY_FACTORS.PROTEIN_KCAL_PER_G;
    proteinPct = (proteinKcal / vetKcal) * 100;

    lipidsPct = macroInput.lipidsPercentage ?? 25;
    const lipidsKcal = (vetKcal * lipidsPct) / 100;
    lipidsG = lipidsKcal / ENERGY_FACTORS.LIPIDS_KCAL_PER_G;

    carbsPct = 100 - (proteinPct + lipidsPct);
    if (carbsPct < 0) {
      warnings.push(`Atenção: A proteína em g/kg (${proteinGPerKg} g/kg) somada aos lipídios ultrapassou 100% do VET prescrito.`);
      carbsPct = 0;
    }
    const carbsKcal = (vetKcal * carbsPct) / 100;
    carbsG = carbsKcal / ENERGY_FACTORS.CARBS_KCAL_PER_G;
  } else {
    // Cálculo por Percentual (100% split)
    carbsPct = macroInput.carbsPercentage ?? 50;
    proteinPct = macroInput.proteinPercentage ?? 20;
    lipidsPct = macroInput.lipidsPercentage ?? 30;

    const totalPct = carbsPct + proteinPct + lipidsPct;
    if (Math.abs(totalPct - 100) > 0.1) {
      throw new Error(`A soma dos percentuais de macronutrientes deve ser 100%. Soma atual: ${totalPct.toFixed(1)}%.`);
    }

    const proteinKcal = (vetKcal * proteinPct) / 100;
    proteinG = proteinKcal / ENERGY_FACTORS.PROTEIN_KCAL_PER_G;

    const carbsKcal = (vetKcal * carbsPct) / 100;
    carbsG = carbsKcal / ENERGY_FACTORS.CARBS_KCAL_PER_G;

    const lipidsKcal = (vetKcal * lipidsPct) / 100;
    lipidsG = lipidsKcal / ENERGY_FACTORS.LIPIDS_KCAL_PER_G;
  }

  const proteinGramsPerKg = refWeight > 0 ? proteinG / refWeight : 0;

  // Validações clínicas de limites
  if (proteinGramsPerKg > 3.5) {
    warnings.push(`ALERTA: Proteína elevada (${proteinGramsPerKg.toFixed(2)} g/kg). Avaliar função renal.`);
  }
  if (lipidsPct < 15) {
    warnings.push(`ALERTA: Lipídios baixos (${lipidsPct.toFixed(1)}%). Risco de deficiência de ácidos graxos essenciais e absorção de vitaminas lipossolúveis.`);
  }
  if (carbsPct < 10) {
    warnings.push(`ALERTA: Dieta com baixíssimo carboidrato (${carbsPct.toFixed(1)}%). Monitorar cetose e glicemia.`);
  }

  return {
    carbohydratesG: Number(carbsG.toFixed(2)),
    carbohydratesKcal: Number((carbsG * ENERGY_FACTORS.CARBS_KCAL_PER_G).toFixed(2)),
    carbohydratesPct: Number(carbsPct.toFixed(2)),

    proteinG: Number(proteinG.toFixed(2)),
    proteinKcal: Number((proteinG * ENERGY_FACTORS.PROTEIN_KCAL_PER_G).toFixed(2)),
    proteinPct: Number(proteinPct.toFixed(2)),
    proteinGramsPerKg: Number(proteinGramsPerKg.toFixed(2)),

    lipidsG: Number(lipidsG.toFixed(2)),
    lipidsKcal: Number((lipidsG * ENERGY_FACTORS.LIPIDS_KCAL_PER_G).toFixed(2)),
    lipidsPct: Number(lipidsPct.toFixed(2)),

    totalEnergyKcal: Math.round(vetKcal),
    warnings
  };
}

/**
 * 3. calculateMealDistribution()
 * Distribui a energia diária e macronutrientes pelas refeições configuradas.
 */
export function calculateMealDistribution(
  vetKcal: number,
  macroTargets: MacroTargets,
  mealInputs: SingleMealDistributionInput[]
): MealDistributionResult {
  if (mealInputs.length === 0) {
    return {
      totalPercentage: 0,
      isValid: false,
      meals: [],
      errors: ['Nenhuma refeição foi informada para distribuição.']
    };
  }

  const totalPercentage = mealInputs.reduce((sum, m) => sum + m.percentage, 0);
  const isValid = Math.abs(totalPercentage - 100) < 0.1;
  const errors: string[] = [];

  if (!isValid) {
    errors.push(`A distribuição percentual das refeições deve somar 100%. Soma atual: ${totalPercentage.toFixed(1)}%.`);
  }

  const meals = mealInputs.map(m => {
    const factor = m.percentage / 100;
    return {
      id: m.id,
      name: m.name,
      time: m.time || '08:00',
      percentage: m.percentage,
      targetKcal: Math.round(vetKcal * factor),
      targetCarbsG: Number((macroTargets.carbohydratesG * factor).toFixed(2)),
      targetProteinG: Number((macroTargets.proteinG * factor).toFixed(2)),
      targetLipidsG: Number((macroTargets.lipidsG * factor).toFixed(2))
    };
  });

  return {
    totalPercentage: Number(totalPercentage.toFixed(2)),
    isValid,
    meals,
    errors
  };
}

/**
 * 4. calculateFoodQuantity()
 * Cálculo proporcional rigoroso de gramagem do alimento.
 * Quantidade (g) = Meta nutricional do alimento / Nutriente por 100g * 100
 */
export function calculateFoodQuantity(targetNutrient: number, nutrientPer100g: number): number {
  if (nutrientPer100g <= 0) {
    throw new Error('Valor nutricional de referência por 100g deve ser maior que zero.');
  }
  if (targetNutrient < 0) {
    throw new Error('Meta nutricional não pode ser negativa.');
  }
  const quantityGrams = (targetNutrient / nutrientPer100g) * 100;
  return Number(quantityGrams.toFixed(1));
}

/**
 * 5. calculateMealNutrition()
 * Soma determinística exata de todos os nutrientes dos alimentos contidos em uma refeição.
 */
export function calculateMealNutrition(foods: MealFoodItem[]): MealPlanMeal['totals'] {
  const totals = {
    energyKcal: 0,
    carbohydratesG: 0,
    proteinG: 0,
    lipidsG: 0,
    fiberG: 0,
    sodiumMg: 0
  };

  for (const item of foods) {
    totals.energyKcal += item.calculatedNutrition.energyKcal;
    totals.carbohydratesG += item.calculatedNutrition.carbohydratesG;
    totals.proteinG += item.calculatedNutrition.proteinG;
    totals.lipidsG += item.calculatedNutrition.lipidsG;
    totals.fiberG += item.calculatedNutrition.fiberG;
    totals.sodiumMg += item.calculatedNutrition.sodiumMg;
  }

  return {
    energyKcal: Math.round(totals.energyKcal),
    carbohydratesG: Number(totals.carbohydratesG.toFixed(2)),
    proteinG: Number(totals.proteinG.toFixed(2)),
    lipidsG: Number(totals.lipidsG.toFixed(2)),
    fiberG: Number(totals.fiberG.toFixed(2)),
    sodiumMg: Math.round(totals.sodiumMg)
  };
}

/**
 * 6. calculateDailyNutrition()
 * Soma determinística de todas as refeições do cardápio diário.
 */
export function calculateDailyNutrition(meals: MealPlanMeal[]): MealPlan['recalculatedTotals'] {
  const totals = {
    energyKcal: 0,
    carbohydratesG: 0,
    proteinG: 0,
    lipidsG: 0,
    fiberG: 0,
    sodiumMg: 0
  };

  for (const meal of meals) {
    totals.energyKcal += meal.totals.energyKcal;
    totals.carbohydratesG += meal.totals.carbohydratesG;
    totals.proteinG += meal.totals.proteinG;
    totals.lipidsG += meal.totals.lipidsG;
    totals.fiberG += meal.totals.fiberG;
    totals.sodiumMg += meal.totals.sodiumMg;
  }

  return {
    energyKcal: Math.round(totals.energyKcal),
    carbohydratesG: Number(totals.carbohydratesG.toFixed(2)),
    proteinG: Number(totals.proteinG.toFixed(2)),
    lipidsG: Number(totals.lipidsG.toFixed(2)),
    fiberG: Number(totals.fiberG.toFixed(2)),
    sodiumMg: Math.round(totals.sodiumMg)
  };
}

/**
 * 7. calculateFoodSubstitution()
 * Calcula a gramagem equivalente exata para substituir um alimento por outro,
 * baseando-se no critério nutricional desejado (ex: carboidratos em arroz vs batata doce).
 */
export function calculateFoodSubstitution(
  req: FoodSubstitutionRequest,
  catalog: FoodItem[] = INITIAL_FOOD_CATALOG
): FoodSubstitutionResult {
  const originalFood = getFoodById(req.originalFoodId, catalog);
  const substituteFood = getFoodById(req.substituteFoodId, catalog);

  if (!originalFood) throw new Error(`Alimento original não encontrado: ${req.originalFoodId}`);
  if (!substituteFood) throw new Error(`Alimento substituto não encontrado: ${req.substituteFoodId}`);

  const criterion = req.targetNutrientCriterion || 'carbohydratesG';

  // Obter o nutriente fornecido pela quantidade original
  const origNutrientPer100g = (originalFood[criterion] as number) || 0;
  const subNutrientPer100g = (substituteFood[criterion] as number) || 0;

  if (origNutrientPer100g === 0) {
    throw new Error(`Alimento original ${originalFood.name} possui valor 0 para o critério ${criterion}.`);
  }
  if (subNutrientPer100g === 0) {
    throw new Error(`Alimento substituto ${substituteFood.name} não possui ${criterion} significativo para substituição equivalente.`);
  }

  const originalNutrientValue = (req.originalQuantityGrams / 100) * origNutrientPer100g;
  const calculatedQuantityGrams = calculateFoodQuantity(originalNutrientValue, subNutrientPer100g);

  // Sugestão em medida caseira se disponível
  let householdMeasureSuggestion = `${calculatedQuantityGrams}g`;
  if (substituteFood.householdMeasures && substituteFood.householdMeasures.length > 0) {
    const firstMeasure = substituteFood.householdMeasures[0];
    const count = (calculatedQuantityGrams / firstMeasure.grams).toFixed(1);
    householdMeasureSuggestion = `aprox. ${count} x ${firstMeasure.name} (${calculatedQuantityGrams}g)`;
  }

  const substituteNutrientValue = (calculatedQuantityGrams / 100) * subNutrientPer100g;
  const variancePct = Math.abs(((substituteNutrientValue - originalNutrientValue) / originalNutrientValue) * 100);

  return {
    originalFood,
    originalQuantityGrams: req.originalQuantityGrams,
    substituteFood,
    calculatedQuantityGrams,
    householdMeasureSuggestion,
    nutrientCriterionUsed: criterion,
    originalNutrientValue: Number(originalNutrientValue.toFixed(2)),
    substituteNutrientValue: Number(substituteNutrientValue.toFixed(2)),
    variancePct: Number(variancePct.toFixed(2))
  };
}

/**
 * 8. validateNutritionPlan()
 * Auditoria determinística pós-geração ou pós-edição:
 * 1. Schema / Campos válidos
 * 2. Existência de todos os foodIds no catálogo
 * 3. Recálculo integral de todos os nutrientes
 * 4. Tolerâncias clínicas: Energia ±3% (configurável), Macronutrientes ±5% (configurável)
 * 5. Checagem rígida de alérgenos e restrições alimentares
 */
export function validateNutritionPlan(
  plan: MealPlan,
  targets: {
    dailyTarget: MealPlan['dailyTarget'];
    restrictions?: FoodRestriction;
  },
  catalog: FoodItem[] = INITIAL_FOOD_CATALOG,
  customTolerances?: { energyPct?: number; macroPct?: number }
): NutritionValidationResult {
  const energyTolerancePct = customTolerances?.energyPct ?? 3.0;
  const macroTolerancePct = customTolerances?.macroPct ?? 5.0;

  const errors: string[] = [];
  const warnings: string[] = [];
  const unknownFoodIds: string[] = [];
  const missingNutrientDataIds: string[] = [];
  const allergensViolated: string[] = [];
  const intolerancesViolated: string[] = [];
  const crossContaminationAlerts: string[] = [];
  let dietaryPatternViolated = false;

  // Recálculo completo determinístico
  const recalculatedMeals: MealPlanMeal[] = [];

  for (const meal of plan.meals) {
    const recalculatedFoods: MealFoodItem[] = [];

    for (const foodRef of meal.foods) {
      const dbFood = getFoodById(foodRef.foodId, catalog);

      if (!dbFood) {
        unknownFoodIds.push(foodRef.foodId);
        errors.push(`foodId inexistente no catálogo oficial: ${foodRef.foodId} (Refeição: ${meal.mealName}).`);
        continue;
      }

      if (foodRef.quantityGrams <= 0) {
        errors.push(`Quantidade inválida (${foodRef.quantityGrams}g) para o alimento ${dbFood.name} em ${meal.mealName}.`);
      }

      // Validação de alérgenos
      if (targets.restrictions?.allergies && targets.restrictions.allergies.length > 0) {
        const allergySafety = checkFoodAllergySafety(dbFood, targets.restrictions.allergies);
        if (!allergySafety.safe) {
          for (const viol of allergySafety.violatedAllergens) {
            if (!allergensViolated.includes(viol)) allergensViolated.push(viol);
          }
          errors.push(`VIOLAÇÃO CRÍTICA DE SEGURANÇA: Alimento "${dbFood.name}" contém alérgeno proibido para este paciente! (${allergySafety.warningDetails.join('; ')})`);
        }
      }

      // Validação de intolerâncias
      if (targets.restrictions?.intolerances && targets.restrictions.intolerances.length > 0) {
        const intoleranceSafety = checkFoodIntoleranceSafety(dbFood, targets.restrictions.intolerances);
        if (!intoleranceSafety.safe) {
          for (const viol of intoleranceSafety.violatedIntolerances) {
            if (!intolerancesViolated.includes(viol)) intolerancesViolated.push(viol);
          }
          errors.push(`INCOMPATIBILIDADE DE INTOLERÂNCIA: Alimento "${dbFood.name}" não tolerado pelo paciente.`);
        }
      }

      // Validação de padrão alimentar
      if (targets.restrictions?.dietaryPattern) {
        const patternSafety = checkDietaryPatternSafety(dbFood, targets.restrictions.dietaryPattern);
        if (!patternSafety.safe) {
          dietaryPatternViolated = true;
          errors.push(patternSafety.warning || `Alimento "${dbFood.name}" viola o padrão ${targets.restrictions.dietaryPattern}.`);
        }
      }

      // Calcular nutrientes exatos
      const factor = foodRef.quantityGrams / 100;
      const calculatedNutrition = {
        energyKcal: Number((dbFood.energyKcal * factor).toFixed(2)),
        carbohydratesG: Number((dbFood.carbohydratesG * factor).toFixed(2)),
        proteinG: Number((dbFood.proteinG * factor).toFixed(2)),
        lipidsG: Number((dbFood.lipidsG * factor).toFixed(2)),
        fiberG: Number((dbFood.fiberG * factor).toFixed(2)),
        sodiumMg: Number((dbFood.sodiumMg * factor).toFixed(2))
      };

      recalculatedFoods.push({
        ...foodRef,
        name: dbFood.name,
        calculatedNutrition
      });
    }

    const mealTotals = calculateMealNutrition(recalculatedFoods);
    recalculatedMeals.push({
      ...meal,
      foods: recalculatedFoods,
      totals: mealTotals
    });
  }

  const dailyTotals = calculateDailyNutrition(recalculatedMeals);

  // Comparação com as metas prescritas
  const targetEnergy = targets.dailyTarget.energyKcal;
  const targetCarbs = targets.dailyTarget.carbohydratesG;
  const targetProtein = targets.dailyTarget.proteinG;
  const targetLipids = targets.dailyTarget.lipidsG;

  const energyDeltaKcal = dailyTotals.energyKcal - targetEnergy;
  const energyDeltaPct = (energyDeltaKcal / targetEnergy) * 100;

  const carbsDeltaG = dailyTotals.carbohydratesG - targetCarbs;
  const carbsDeltaPct = targetCarbs > 0 ? (carbsDeltaG / targetCarbs) * 100 : 0;

  const proteinDeltaG = dailyTotals.proteinG - targetProtein;
  const proteinDeltaPct = targetProtein > 0 ? (proteinDeltaG / targetProtein) * 100 : 0;

  const lipidsDeltaG = dailyTotals.lipidsG - targetLipids;
  const lipidsDeltaPct = targetLipids > 0 ? (lipidsDeltaG / targetLipids) * 100 : 0;

  const energyWithinTolerance = Math.abs(energyDeltaPct) <= energyTolerancePct;
  const carbsWithinTolerance = Math.abs(carbsDeltaPct) <= macroTolerancePct;
  const proteinWithinTolerance = Math.abs(proteinDeltaPct) <= macroTolerancePct;
  const lipidsWithinTolerance = Math.abs(lipidsDeltaPct) <= macroTolerancePct;

  if (!energyWithinTolerance) {
    errors.push(`Tolerância de Energia ultrapassada: Fornecido ${dailyTotals.energyKcal} kcal (Meta: ${targetEnergy} kcal). Variação: ${energyDeltaPct.toFixed(2)}% (Limite: ±${energyTolerancePct}%).`);
  }
  if (!carbsWithinTolerance) {
    warnings.push(`Variação de Carboidratos: ${carbsDeltaG.toFixed(1)}g (${carbsDeltaPct.toFixed(2)}%). Limite: ±${macroTolerancePct}%.`);
  }
  if (!proteinWithinTolerance) {
    warnings.push(`Variação de Proteínas: ${proteinDeltaG.toFixed(1)}g (${proteinDeltaPct.toFixed(2)}%). Limite: ±${macroTolerancePct}%.`);
  }
  if (!lipidsWithinTolerance) {
    warnings.push(`Variação de Lipídios: ${lipidsDeltaG.toFixed(1)}g (${lipidsDeltaPct.toFixed(2)}%). Limite: ±${macroTolerancePct}%.`);
  }

  const isValid =
    errors.length === 0 &&
    energyWithinTolerance &&
    carbsWithinTolerance &&
    proteinWithinTolerance &&
    lipidsWithinTolerance &&
    allergensViolated.length === 0;

  return {
    isValid,
    energyDeltaKcal: Math.round(energyDeltaKcal),
    energyDeltaPct: Number(energyDeltaPct.toFixed(2)),
    carbsDeltaG: Number(carbsDeltaG.toFixed(2)),
    carbsDeltaPct: Number(carbsDeltaPct.toFixed(2)),
    proteinDeltaG: Number(proteinDeltaG.toFixed(2)),
    proteinDeltaPct: Number(proteinDeltaPct.toFixed(2)),
    lipidsDeltaG: Number(lipidsDeltaG.toFixed(2)),
    lipidsDeltaPct: Number(lipidsDeltaPct.toFixed(2)),
    energyWithinTolerance,
    carbsWithinTolerance,
    proteinWithinTolerance,
    lipidsWithinTolerance,
    allergensViolated,
    intolerancesViolated,
    dietaryPatternViolated,
    unknownFoodIds,
    missingNutrientDataIds,
    crossContaminationAlerts,
    errors,
    warnings
  };
}
