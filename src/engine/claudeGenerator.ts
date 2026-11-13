/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { checkFoodAllergySafety, checkFoodIntoleranceSafety } from './allergyRules';
import { getFoodById, INITIAL_FOOD_CATALOG } from './foodCatalog';
import { calculateDailyNutrition, calculateMealNutrition, validateNutritionPlan } from './nutritionMath';
import {
  AiGenerationLog,
  FoodItem,
  FoodRestriction,
  MealDistributionTarget,
  MealFoodItem,
  MealPlan,
  MealPlanMeal,
  NutritionValidationResult
} from './types';

// =========================================================================
// MOTOR 2: AI MEAL PLAN GENERATOR & STRICT ZOD VALIDATION PIPELINE
// =========================================================================

// Zod Schema para Validação da Resposta Estruturada da IA
export const ZodMealFoodSchema = z.object({
  foodId: z.string().min(1, 'foodId é obrigatório'),
  quantityGrams: z.number().positive('Quantidade em gramas deve ser positiva'),
  preparation: z.string().default('Preparação conforme orientação.')
});

export const ZodMealSchema = z.object({
  mealName: z.string().min(1, 'Nome da refeição é obrigatório'),
  time: z.string().optional(),
  foods: z.array(ZodMealFoodSchema).min(1, 'Refeição deve conter ao menos 1 alimento')
});

export const ZodDailyTargetSchema = z.object({
  energyKcal: z.number().positive(),
  carbohydratesG: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  lipidsG: z.number().nonnegative()
});

export const ZodMealPlanResponseSchema = z.object({
  planName: z.string().default('Plano Alimentar Personalizado'),
  dailyTarget: ZodDailyTargetSchema,
  meals: z.array(ZodMealSchema).min(1, 'Cardápio deve conter ao menos 1 refeição'),
  clinicalObservations: z.array(z.string()).optional()
});

export type AiMealPlanResponse = z.infer<typeof ZodMealPlanResponseSchema>;

// Initialize Gemini SDK on server-side
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

/**
 * Prepara o catálogo de alimentos filtrado por segurança prévia (LGPD & Alérgenos)
 * para enviar para o prompt da IA.
 */
export function prepareAllowedCatalogForAi(
  catalog: FoodItem[] = INITIAL_FOOD_CATALOG,
  restrictions?: FoodRestriction
): FoodItem[] {
  if (!restrictions) return catalog;

  return catalog.filter(food => {
    // Filtrar alérgenos bloqueantes
    if (restrictions.allergies && restrictions.allergies.length > 0) {
      const allergyCheck = checkFoodAllergySafety(food, restrictions.allergies);
      if (!allergySafetyCheck(allergyCheck.safe)) return false;
    }
    // Filtrar intolerâncias
    if (restrictions.intolerances && restrictions.intolerances.length > 0) {
      const intoleranceCheck = checkFoodIntoleranceSafety(food, restrictions.intolerances);
      if (!intoleranceCheck.safe) return false;
    }
    return true;
  });
}

function allergySafetyCheck(safe: boolean): boolean {
  return safe;
}

/**
 * Função Principal do Motor 2:
 * Gera o cardápio via IA e submete IMEDIATAMENTE ao Motor 1 para recálculo determinístico e validação.
 */
export async function generateAndValidateMealPlan(params: {
  tenantId: string;
  patientId: string;
  planName?: string;
  dailyTarget: {
    energyKcal: number;
    carbohydratesG: number;
    proteinG: number;
    lipidsG: number;
  };
  mealDistributions: MealDistributionTarget[];
  restrictions?: FoodRestriction;
  catalog?: FoodItem[];
  maxAttempts?: number;
}): Promise<{
  plan: MealPlan;
  validation: NutritionValidationResult;
  logs: AiGenerationLog[];
}> {
  const catalog = params.catalog || INITIAL_FOOD_CATALOG;
  const allowedCatalog = prepareAllowedCatalogForAi(catalog, params.restrictions);
  const maxAttempts = params.maxAttempts || 3;
  const logs: AiGenerationLog[] = [];

  let currentAttempt = 1;
  let lastValidation: NutritionValidationResult | null = null;
  let generatedPlan: MealPlan | null = null;
  let feedbackText = '';

  const ai = getGeminiClient();

  while (currentAttempt <= maxAttempts) {
    const timestamp = new Date().toISOString();

    try {
      let rawJsonResponse: string;

      if (ai) {
        // Chamada real Gemini API com Structured Outputs JSON Schema
        const systemInstruction = `
Você é um Arquiteto e Nutricionista Clínico Sênior integrado ao Motor Determinístico de Prescrição.
Sua missão é selecionar alimentos da BASE DE DADOS AUTORIZADA e sugerir gramagens para compor as refeições solicitadas.

REGRAS RÍGIDAS DE ENGENHARIA DE PROMPT:
1. NUNCA invente ou crie um foodId que não exista na lista abaixo. Use EXCLUSIVAMENTE os IDs listados.
2. NUNCA invente calorias, gramas de proteína ou carboidratos no texto. O Motor 1 calculará os valores exatos a partir da sua seleção.
3. Respeite as metas de cada refeição (energia e macros propostos).
4. Forneça o resultado EXCLUSIVAMENTE em formato JSON estrito aderente ao Schema.

BASE DE DADOS AUTORIZADA (FOOD CATALOG):
${JSON.stringify(
  allowedCatalog.map(f => ({
    foodId: f.foodId,
    name: f.name,
    category: f.category,
    per100g: {
      kcal: f.energyKcal,
      carbsG: f.carbohydratesG,
      proteinG: f.proteinG,
      lipidsG: f.lipidsG,
      fiberG: f.fiberG
    },
    measures: f.householdMeasures
  })),
  null,
  2
)}
`;

        const prompt = `
METAS DIÁRIAS PRESCRITAS:
- Energia: ${params.dailyTarget.energyKcal} kcal
- Carboidratos: ${params.dailyTarget.carbohydratesG} g
- Proteínas: ${params.dailyTarget.proteinG} g
- Lipídios: ${params.dailyTarget.lipidsG} g

REFEIÇÕES A COMPOR:
${JSON.stringify(params.mealDistributions, null, 2)}

RESTRIÇÕES E PREFERÊNCIAS:
${JSON.stringify(params.restrictions || {}, null, 2)}

${feedbackText ? `ATENÇÃO - AJUSTE DA TENTATIVA ANTERIOR:\n${feedbackText}` : ''}

Gere o JSON estrito com as refeições, selecionando alimentos coerentes para atingir as metas.
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                planName: { type: Type.STRING },
                dailyTarget: {
                  type: Type.OBJECT,
                  properties: {
                    energyKcal: { type: Type.NUMBER },
                    carbohydratesG: { type: Type.NUMBER },
                    proteinG: { type: Type.NUMBER },
                    lipidsG: { type: Type.NUMBER }
                  },
                  required: ['energyKcal', 'carbohydratesG', 'proteinG', 'lipidsG']
                },
                meals: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      mealName: { type: Type.STRING },
                      time: { type: Type.STRING },
                      foods: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            foodId: { type: Type.STRING },
                            quantityGrams: { type: Type.NUMBER },
                            preparation: { type: Type.STRING }
                          },
                          required: ['foodId', 'quantityGrams', 'preparation']
                        }
                      }
                    },
                    required: ['mealName', 'foods']
                  }
                },
                clinicalObservations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ['planName', 'dailyTarget', 'meals']
            }
          }
        });

        rawJsonResponse = response.text || '';
      } else {
        // Fallback determinístico inteligente quando GEMINI_API_KEY não estiver configurada no ambiente
        rawJsonResponse = generateFallbackAiMealPlanJson(params, allowedCatalog);
      }

      // 1. Validação do JSON Schema com Zod
      const cleanedJson = rawJsonResponse.replace(/```json|```/g, '').trim();
      const parsedAiData = ZodMealPlanResponseSchema.parse(JSON.parse(cleanedJson));

      // 2. Construção do MealPlan no Motor 1 (Com recálculo determinístico integral)
      const constructedMeals: MealPlanMeal[] = parsedAiData.meals.map((m, idx) => {
        const mealFoods: MealFoodItem[] = m.foods.map(f => {
          const dbFood = getFoodById(f.foodId, catalog);
          const foodName = dbFood ? dbFood.name : 'Alimento não identificado';
          const factor = f.quantityGrams / 100;
          const calculatedNutrition = dbFood
            ? {
                energyKcal: Number((dbFood.energyKcal * factor).toFixed(2)),
                carbohydratesG: Number((dbFood.carbohydratesG * factor).toFixed(2)),
                proteinG: Number((dbFood.proteinG * factor).toFixed(2)),
                lipidsG: Number((dbFood.lipidsG * factor).toFixed(2)),
                fiberG: Number((dbFood.fiberG * factor).toFixed(2)),
                sodiumMg: Number((dbFood.sodiumMg * factor).toFixed(2))
              }
            : { energyKcal: 0, carbohydratesG: 0, proteinG: 0, lipidsG: 0, fiberG: 0, sodiumMg: 0 };

          let householdMeasureSelected = `${f.quantityGrams}g`;
          if (dbFood && dbFood.householdMeasures.length > 0) {
            const hm = dbFood.householdMeasures[0];
            const count = (f.quantityGrams / hm.grams).toFixed(1);
            householdMeasureSelected = `${count} x ${hm.name} (${f.quantityGrams}g)`;
          }

          return {
            foodId: f.foodId,
            name: foodName,
            quantityGrams: f.quantityGrams,
            householdMeasureSelected,
            preparation: f.preparation,
            calculatedNutrition
          };
        });

        const mealTotals = calculateMealNutrition(mealFoods);
        return {
          mealId: `MEAL_${idx + 1}`,
          mealName: m.mealName,
          time: m.time || '08:00',
          foods: mealFoods,
          totals: mealTotals
        };
      });

      const dailyTotals = calculateDailyNutrition(constructedMeals);

      generatedPlan = {
        id: `PLAN_${Date.now()}`,
        patientId: params.patientId,
        tenantId: params.tenantId,
        planName: params.planName || parsedAiData.planName,
        version: 1,
        status: 'draft',
        createdAt: timestamp,
        updatedAt: timestamp,
        dailyTarget: params.dailyTarget,
        recalculatedTotals: dailyTotals,
        meals: constructedMeals,
        clinicalObservations: parsedAiData.clinicalObservations || [
          'Prescrição gerada com recálculo determinístico do Motor 1.',
          'Substituições equivalentes disponíveis para consulta.'
        ]
      };

      // 3. Submeter ao Motor 1 para auditoria determinística de tolerâncias e alérgenos
      lastValidation = validateNutritionPlan(
        generatedPlan,
        { dailyTarget: params.dailyTarget, restrictions: params.restrictions },
        catalog
      );

      logs.push({
        id: `LOG_${Date.now()}_${currentAttempt}`,
        tenantId: params.tenantId,
        patientId: params.patientId,
        timestamp,
        modelUsed: ai ? 'gemini-3.8-flash' : 'fallback-deterministic-ai-engine',
        attemptNumber: currentAttempt,
        status: lastValidation.isValid ? 'success' : 'validation_failed',
        validationDetails: lastValidation
      });

      if (lastValidation.isValid) {
        return {
          plan: generatedPlan,
          validation: lastValidation,
          logs
        };
      }

      // Preparar texto de feedback de erro para a próxima tentativa da IA
      feedbackText = `Erro na tentativa ${currentAttempt}: ${lastValidation.errors.join(' | ')}.
Variação calórica atual: ${lastValidation.energyDeltaPct}% (${lastValidation.energyDeltaKcal} kcal).
Ajuste as gramagens dos alimentos proporcionalmente para atingir a meta prescrita exata.`;
    } catch (err: any) {
      logs.push({
        id: `LOG_ERR_${Date.now()}_${currentAttempt}`,
        tenantId: params.tenantId,
        patientId: params.patientId,
        timestamp,
        modelUsed: 'gemini-3.8-flash',
        attemptNumber: currentAttempt,
        status: 'error',
        errorMessage: err.message || 'Erro desconhecido na geração do cardápio'
      });
      feedbackText = `Erro de schema/processamento: ${err.message}`;
    }

    currentAttempt++;
  }

  // Se exceder as tentativas, retornar o último plano gerado com os logs de validação
  if (!generatedPlan) {
    throw new Error('Falha crítica no Motor 2: Não foi possível gerar uma estrutura de cardápio válida.');
  }

  return {
    plan: generatedPlan,
    validation: lastValidation || validateNutritionPlan(generatedPlan, { dailyTarget: params.dailyTarget }, catalog),
    logs
  };
}

/**
 * Motor Algorítmico Determinístico de composição de alimentos
 * Utilizado quando a chave da API não estiver injetada no ambiente.
 */
function generateFallbackAiMealPlanJson(
  params: {
    dailyTarget: { energyKcal: number; carbohydratesG: number; proteinG: number; lipidsG: number };
    mealDistributions: MealDistributionTarget[];
    restrictions?: FoodRestriction;
  },
  allowedCatalog: FoodItem[]
): string {
  const mealsJson = params.mealDistributions.map(dist => {
    const targetKcal = dist.targetKcal;
    const targetProtein = dist.targetProteinG;
    const targetCarbs = dist.targetCarbsG;

    // Selecionar proteína principal
    let proteinFood = allowedCatalog.find(f => f.category === 'Carnes e ovos' || f.category === 'Pescados e frutos do mar') || allowedCatalog[4];
    if (params.restrictions?.dietaryPattern === 'vegan') {
      proteinFood = allowedCatalog.find(f => f.foodId === 'FOOD_030' || f.foodId === 'FOOD_036') || allowedCatalog[0];
    }

    // Selecionar carboidrato principal
    let carbFood = allowedCatalog.find(f => f.category === 'Cereais e derivados' || f.category === 'Tubérculos e derivados') || allowedCatalog[0];
    if (params.restrictions?.allergies?.includes('wheat_gluten')) {
      carbFood = allowedCatalog.find(f => f.foodId === 'FOOD_001' || f.foodId === 'FOOD_021' || f.foodId === 'FOOD_020') || allowedCatalog[0];
    }

    // Calcular gramagens determinísticas exatas para o meal target
    const proteinGrams = Math.max(30, Math.round((targetProtein * 0.75 / (proteinFood.proteinG || 25)) * 100));
    const carbsGrams = Math.max(40, Math.round((targetCarbs * 0.75 / (carbFood.carbohydratesG || 25)) * 100));

    return {
      mealName: dist.name,
      time: dist.time,
      foods: [
        {
          foodId: carbFood.foodId,
          quantityGrams: carbsGrams,
          preparation: 'Cozido ao vapor ou preparado com ervas naturais.'
        },
        {
          foodId: proteinFood.foodId,
          quantityGrams: proteinGrams,
          preparation: 'Grelhado com azeite de oliva e temperos secos.'
        }
      ]
    };
  });

  return JSON.stringify({
    planName: 'Plano Alimentar Prescrito (Motor Determinístico)',
    dailyTarget: params.dailyTarget,
    meals: mealsJson,
    clinicalObservations: [
      'Cardápio estruturado com alimentos validados da base TACO/TBCA.',
      'Alérgenos e restrições clínicas checados.'
    ]
  });
}
