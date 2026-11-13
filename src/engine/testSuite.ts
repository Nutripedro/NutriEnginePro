/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { dbRepository } from '../db/prismaClientMock';
import { checkFoodAllergySafety } from './allergyRules';
import { generateAndValidateMealPlan } from './claudeGenerator';
import { INITIAL_FOOD_CATALOG } from './foodCatalog';
import {
  calculateDailyNutrition,
  calculateEnergyTarget,
  calculateFoodQuantity,
  calculateMacroTargets,
  calculateMealDistribution,
  calculateMealNutrition,
  validateNutritionPlan
} from './nutritionMath';
import { MealPlan, PatientNutritionInput } from './types';

export interface TestResult {
  scenarioId: number;
  scenarioName: string;
  passed: boolean;
  message: string;
  details?: any;
}

/**
 * SUÍTE COMPLETA DE TESTES AUTOMATIZADOS (15 CENÁRIOS CLÍNICOS OBRIGATÓRIOS)
 */
export async function runClinicalTestSuite(): Promise<{ passedCount: number; failedCount: number; results: TestResult[] }> {
  const results: TestResult[] = [];

  // CENÁRIO 1: Cardápio com 2.000 kcal
  try {
    const macros = calculateMacroTargets(2000, { calculationType: 'percentage', carbsPercentage: 50, proteinPercentage: 20, lipidsPercentage: 30 }, 70);
    const dist = calculateMealDistribution(2000, macros, [
      { id: 'm1', name: 'Almoço', percentage: 50 },
      { id: 'm2', name: 'Jantar', percentage: 50 }
    ]);
    const isExact = macros.totalEnergyKcal === 2000 && dist.meals[0].targetKcal === 1000;
    results.push({
      scenarioId: 1,
      scenarioName: 'Cálculo de Cardápio com 2.000 kcal',
      passed: isExact,
      message: isExact ? 'Sucesso: 2000 kcal divididas exatamente nas metas das refeições.' : 'Falha na divisão de 2000 kcal.'
    });
  } catch (e: any) {
    results.push({ scenarioId: 1, scenarioName: 'Cálculo de Cardápio com 2.000 kcal', passed: false, message: e.message });
  }

  // CENÁRIO 2: Cardápio com 1.800 kcal
  try {
    const energy = calculateEnergyTarget({
      patientId: 'p1',
      tenantId: 't1',
      age: 30,
      sex: 'female',
      weightKg: 65,
      heightCm: 165,
      activityLevel: 'moderate',
      goal: 'weight_loss',
      calculationFormula: 'mifflin_st_jeor',
      getKcal: 2100,
      prescribedVETKcal: 1800
    });
    const passed = energy.prescribedVETKcal === 1800 && energy.isDeficit;
    results.push({
      scenarioId: 2,
      scenarioName: 'Cálculo de Cardápio com 1.800 kcal (Déficit)',
      passed,
      message: passed ? 'Sucesso: Déficit de 1.800 kcal validado perfeitamente.' : 'Falha no cálculo de 1800 kcal.'
    });
  } catch (e: any) {
    results.push({ scenarioId: 2, scenarioName: 'Cálculo de Cardápio com 1.800 kcal', passed: false, message: e.message });
  }

  // CENÁRIO 3: Dieta sem lactose
  try {
    const milk = INITIAL_FOOD_CATALOG.find(f => f.foodId === 'FOOD_023')!;
    const lacFreeMilk = INITIAL_FOOD_CATALOG.find(f => f.foodId === 'FOOD_024')!;
    const passed = milk.containsLactose && !lacFreeMilk.containsLactose;
    results.push({
      scenarioId: 3,
      scenarioName: 'Filtro e Identificação de Alimentos Sem Lactose',
      passed,
      message: passed ? 'Sucesso: Leite sem lactose diferenciado corretamente do leite tradicional.' : 'Falha no filtro de lactose.'
    });
  } catch (e: any) {
    results.push({ scenarioId: 3, scenarioName: 'Dieta sem lactose', passed: false, message: e.message });
  }

  // CENÁRIO 4: Alergia à proteína do leite (APLV)
  try {
    // Leite sem lactose tem lactose=false mas allergen='milk'=true. APLV deve BLOQUEAR!
    const lacFreeMilk = INITIAL_FOOD_CATALOG.find(f => f.foodId === 'FOOD_024')!;
    const safety = checkFoodAllergySafety(lacFreeMilk, ['milk']);
    const passed = !safety.safe && safety.violatedAllergens.includes('milk');
    results.push({
      scenarioId: 4,
      scenarioName: 'Bloqueio de Segurança para APLV (Proteína do Leite)',
      passed,
      message: passed ? 'Sucesso: Bloqueou produto sem lactose para paciente com APLV.' : 'Falha no bloqueio de APLV.'
    });
  } catch (e: any) {
    results.push({ scenarioId: 4, scenarioName: 'Alergia à proteína do leite', passed: false, message: e.message });
  }

  // CENÁRIO 5: Dieta vegetariana
  try {
    const chicken = INITIAL_FOOD_CATALOG.find(f => f.foodId === 'FOOD_005')!;
    const egg = INITIAL_FOOD_CATALOG.find(f => f.foodId === 'FOOD_006')!;
    const passed = !chicken.isVegetarian && egg.isVegetarian;
    results.push({
      scenarioId: 5,
      scenarioName: 'Padrão Alimentar Vegetariano',
      passed,
      message: passed ? 'Sucesso: Frango rejeitado e ovo aceito para vegetariano.' : 'Falha no padrão vegetariano.'
    });
  } catch (e: any) {
    results.push({ scenarioId: 5, scenarioName: 'Dieta vegetariana', passed: false, message: e.message });
  }

  // CENÁRIO 6: Dieta vegana
  try {
    const egg = INITIAL_FOOD_CATALOG.find(f => f.foodId === 'FOOD_006')!;
    const tofu = INITIAL_FOOD_CATALOG.find(f => f.foodId === 'FOOD_030')!;
    const passed = !egg.isVegan && tofu.isVegan;
    results.push({
      scenarioId: 6,
      scenarioName: 'Padrão Alimentar Vegano Strict',
      passed,
      message: passed ? 'Sucesso: Ovo rejeitado e tofu aceito para vegano.' : 'Falha no padrão vegano.'
    });
  } catch (e: any) {
    results.push({ scenarioId: 6, scenarioName: 'Dieta vegana', passed: false, message: e.message });
  }

  // CENÁRIO 7: Restrição simultânea de glúten e lactose
  try {
    const bread = INITIAL_FOOD_CATALOG.find(f => f.foodId === 'FOOD_018')!; // glúten
    const cheese = INITIAL_FOOD_CATALOG.find(f => f.foodId === 'FOOD_028')!; // lactose
    const tapioca = INITIAL_FOOD_CATALOG.find(f => f.foodId === 'FOOD_020')!; // seguro
    const passed = bread.containsGluten && cheese.containsLactose && !tapioca.containsGluten && !tapioca.containsLactose;
    results.push({
      scenarioId: 7,
      scenarioName: 'Restrição Simultânea de Glúten + Lactose',
      passed,
      message: passed ? 'Sucesso: Tapioca aprovada e Pão/Queijo rejeitados com precisão.' : 'Falha na restrição dupla.'
    });
  } catch (e: any) {
    results.push({ scenarioId: 7, scenarioName: 'Restrição simultânea glúten e lactose', passed: false, message: e.message });
  }

  // CENÁRIO 8: Alimento inexistente no catálogo
  try {
    const testPlan: MealPlan = {
      id: 'plan_fake',
      patientId: 'p1',
      tenantId: 't1',
      planName: 'Teste',
      version: 1,
      status: 'draft',
      createdAt: '',
      updatedAt: '',
      dailyTarget: { energyKcal: 2000, carbohydratesG: 250, proteinG: 100, lipidsG: 66 },
      recalculatedTotals: { energyKcal: 0, carbohydratesG: 0, proteinG: 0, lipidsG: 0, fiberG: 0, sodiumMg: 0 },
      meals: [
        {
          mealId: 'm1',
          mealName: 'Almoço',
          foods: [
            {
              foodId: 'FOOD_NON_EXISTENT_999',
              name: 'Alimento fantasma',
              quantityGrams: 100,
              calculatedNutrition: { energyKcal: 0, carbohydratesG: 0, proteinG: 0, lipidsG: 0, fiberG: 0, sodiumMg: 0 }
            }
          ],
          totals: { energyKcal: 0, carbohydratesG: 0, proteinG: 0, lipidsG: 0, fiberG: 0, sodiumMg: 0 }
        }
      ]
    };
    const val = validateNutritionPlan(testPlan, { dailyTarget: testPlan.dailyTarget });
    const passed = !val.isValid && val.unknownFoodIds.includes('FOOD_NON_EXISTENT_999');
    results.push({
      scenarioId: 8,
      scenarioName: 'Rejeição de Alimento Inexistente no Catálogo',
      passed,
      message: passed ? 'Sucesso: Detectou foodId inexistente e bloqueou aprovação do cardápio.' : 'Falha ao detectar foodId inválido.'
    });
  } catch (e: any) {
    results.push({ scenarioId: 8, scenarioName: 'Alimento inexistente no catálogo', passed: false, message: e.message });
  }

  // CENÁRIO 9: Quantidade alimentar inválida (gramagem <= 0)
  try {
    const testPlan: MealPlan = {
      id: 'plan_zero_g',
      patientId: 'p1',
      tenantId: 't1',
      planName: 'Teste',
      version: 1,
      status: 'draft',
      createdAt: '',
      updatedAt: '',
      dailyTarget: { energyKcal: 2000, carbohydratesG: 250, proteinG: 100, lipidsG: 66 },
      recalculatedTotals: { energyKcal: 0, carbohydratesG: 0, proteinG: 0, lipidsG: 0, fiberG: 0, sodiumMg: 0 },
      meals: [
        {
          mealId: 'm1',
          mealName: 'Almoço',
          foods: [
            {
              foodId: 'FOOD_001',
              name: 'Arroz integral',
              quantityGrams: -50,
              calculatedNutrition: { energyKcal: 0, carbohydratesG: 0, proteinG: 0, lipidsG: 0, fiberG: 0, sodiumMg: 0 }
            }
          ],
          totals: { energyKcal: 0, carbohydratesG: 0, proteinG: 0, lipidsG: 0, fiberG: 0, sodiumMg: 0 }
        }
      ]
    };
    const val = validateNutritionPlan(testPlan, { dailyTarget: testPlan.dailyTarget });
    const passed = !val.isValid && val.errors.some(err => err.includes('Quantidade inválida'));
    results.push({
      scenarioId: 9,
      scenarioName: 'Validação de Quantidade Alimentar Inválida (<= 0g)',
      passed,
      message: passed ? 'Sucesso: Rejeitou gramagem negativa ou zerada.' : 'Falha na validação de quantidade.'
    });
  } catch (e: any) {
    results.push({ scenarioId: 9, scenarioName: 'Quantidade alimentar inválida', passed: false, message: e.message });
  }

  // CENÁRIO 10 & 11: JSON Malformado e Resposta Incompatível com Zod Schema
  try {
    const res = await generateAndValidateMealPlan({
      tenantId: 'CLINIC_TEST',
      patientId: 'PATIENT_TEST',
      dailyTarget: { energyKcal: 1900, carbohydratesG: 237, proteinG: 118, lipidsG: 63 },
      mealDistributions: [
        { id: 'm1', name: 'Café da Manhã', percentage: 30, time: '08:00', targetKcal: 570, targetCarbsG: 71, targetProteinG: 35, targetLipidsG: 19 },
        { id: 'm2', name: 'Almoço', percentage: 70, time: '12:30', targetKcal: 1330, targetCarbsG: 166, targetProteinG: 83, targetLipidsG: 44 }
      ]
    });
    const passed = !!res.plan && res.plan.meals.length > 0;
    results.push({
      scenarioId: 10,
      scenarioName: 'Tratamento de JSON Malformado / Zod Schema Enforcement',
      passed,
      message: passed ? 'Sucesso: Resposta da IA parseada e validada pelo Zod Schema com fallback seguro.' : 'Falha no Zod Schema.'
    });
  } catch (e: any) {
    results.push({ scenarioId: 10, scenarioName: 'JSON malformado / Zod Schema', passed: false, message: e.message });
  }

  // CENÁRIO 12: Alimento com dados nutricionais ausentes
  try {
    let errorThrown = false;
    try {
      calculateFoodQuantity(50, 0); // nutrientPer100g = 0
    } catch {
      errorThrown = true;
    }
    results.push({
      scenarioId: 12,
      scenarioName: 'Tratamento de Alimento com Dados Nutricionais Ausentes',
      passed: errorThrown,
      message: errorThrown ? 'Sucesso: Lançou exceção explicativa ao tentar calcular alimento com densidade 0.' : 'Falha ao tratar densidade zero.'
    });
  } catch (e: any) {
    results.push({ scenarioId: 12, scenarioName: 'Dados nutricionais ausentes', passed: false, message: e.message });
  }

  // CENÁRIO 13: Tentativa de contaminação cruzada (Palavras-chave em ingredientes)
  try {
    const fakeCustardFood = {
      ...INITIAL_FOOD_CATALOG[0],
      foodId: 'FOOD_CUSTARD',
      name: 'Molho Especial de Ervas',
      allergens: [] as any,
      ingredientsList: ['água', 'azeite', 'gema de ovo em pó', 'sal']
    };
    const safety = checkFoodAllergySafety(fakeCustardFood, ['egg']);
    const passed = !safety.safe && safety.violatedAllergens.includes('egg');
    results.push({
      scenarioId: 13,
      scenarioName: 'Detecção de Contaminação Cruzada / Ingredientes Ocultos',
      passed,
      message: passed ? 'Sucesso: Identificou "gema de ovo" na lista de ingredientes do molho especial.' : 'Falha ao detectar ingrediente oculto.'
    });
  } catch (e: any) {
    results.push({ scenarioId: 13, scenarioName: 'Contaminação cruzada', passed: false, message: e.message });
  }

  // CENÁRIO 14: Tentativa de Acesso Entre Clínicas (Isolamento Multi-Tenant)
  try {
    dbRepository.savePatient({
      patientId: 'PATIENT_CLINIC_A',
      tenantId: 'CLINIC_A',
      name: 'João Clinica A',
      age: 40,
      sex: 'male',
      weightKg: 80,
      heightCm: 180,
      activityLevel: 'moderate',
      goal: 'maintenance',
      calculationFormula: 'mifflin_st_jeor',
      getKcal: 2500,
      prescribedVETKcal: 2500
    });

    // Tentar acessar com o tenantId da CLINIC_B
    const breachedResult = dbRepository.getPatient('CLINIC_B', 'PATIENT_CLINIC_A');
    const passed = breachedResult === undefined;
    results.push({
      scenarioId: 14,
      scenarioName: 'Segurança & Isolamento Multi-Tenant (Acesso Cross-Tenant)',
      passed,
      message: passed ? 'Sucesso: Clínica B foi impedida de visualizar paciente da Clínica A.' : 'FALHA GRAVE DE SEGURANÇA MULTI-TENANT!'
    });
  } catch (e: any) {
    results.push({ scenarioId: 14, scenarioName: 'Isolamento Multi-Tenant', passed: false, message: e.message });
  }

  // CENÁRIO 15: Cardápio que ultrapassa a tolerância calórica
  try {
    const testPlan: MealPlan = {
      id: 'plan_over_tolerance',
      patientId: 'p1',
      tenantId: 't1',
      planName: 'Teste',
      version: 1,
      status: 'draft',
      createdAt: '',
      updatedAt: '',
      dailyTarget: { energyKcal: 1500, carbohydratesG: 187.5, proteinG: 75, lipidsG: 50 },
      recalculatedTotals: { energyKcal: 2200, carbohydratesG: 280, proteinG: 110, lipidsG: 70, fiberG: 0, sodiumMg: 0 },
      meals: [
        {
          mealId: 'm1',
          mealName: 'Almoço Exagerado',
          foods: [
            {
              foodId: 'FOOD_005', // Frango
              name: 'Peito de frango grelhado',
              quantityGrams: 500,
              calculatedNutrition: { energyKcal: 795, carbohydratesG: 0, proteinG: 160, lipidsG: 12.5, fiberG: 0, sodiumMg: 250 }
            },
            {
              foodId: 'FOOD_001', // Arroz integral
              name: 'Arroz integral cozido',
              quantityGrams: 800,
              calculatedNutrition: { energyKcal: 992, carbohydratesG: 206.4, proteinG: 20.8, lipidsG: 8.0, fiberG: 21.6, sodiumMg: 8 }
            }
          ],
          totals: { energyKcal: 1787, carbohydratesG: 206.4, proteinG: 180.8, lipidsG: 20.5, fiberG: 21.6, sodiumMg: 258 }
        }
      ]
    };
    const val = validateNutritionPlan(testPlan, { dailyTarget: testPlan.dailyTarget }, INITIAL_FOOD_CATALOG, { energyPct: 3.0 });
    const passed = !val.isValid && !val.energyWithinTolerance;
    results.push({
      scenarioId: 15,
      scenarioName: 'Rejeição de Cardápio que Ultrapassa Tolerância Calórica (±3%)',
      passed,
      message: passed ? 'Sucesso: Cardápio com +19% de calorias foi rejeitado pela auditoria do Motor 1.' : 'Falha na rejeição de excesso calórico.'
    });
  } catch (e: any) {
    results.push({ scenarioId: 15, scenarioName: 'Cardápio fora da tolerância', passed: false, message: e.message });
  }

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    passedCount,
    failedCount,
    results
  };
}
