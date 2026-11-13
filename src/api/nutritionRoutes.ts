/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { dbRepository } from '../db/prismaClientMock';
import { generateAndValidateMealPlan } from '../engine/claudeGenerator';
import { INITIAL_FOOD_CATALOG, searchFoods } from '../engine/foodCatalog';
import {
  calculateDailyNutrition,
  calculateEnergyTarget,
  calculateFoodSubstitution,
  calculateMacroTargets,
  calculateMealDistribution,
  calculateMealNutrition,
  validateNutritionPlan
} from '../engine/nutritionMath';
import { runClinicalTestSuite } from '../engine/testSuite';
import { MealPlan } from '../engine/types';

export const nutritionRouter = Router();

// Middleware de verificação de Tenant (Header 'x-tenant-id' ou fallback 'CLINIC_DEFAULT')
const getTenantId = (req: any): string => {
  return (req.headers['x-tenant-id'] as string) || 'CLINIC_DEFAULT';
};

// 1. POST /api/nutrition/calculate
nutritionRouter.post('/calculate', (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const input = { ...req.body, tenantId };
    const energy = calculateEnergyTarget(input);

    // Salvar/atualizar perfil do paciente no repositório multi-tenant
    if (input.patientId) {
      dbRepository.savePatient(input);
    }

    res.json({ success: true, energy });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 2. POST /api/nutrition/macros
nutritionRouter.post('/macros', (req, res) => {
  try {
    const { vetKcal, macroInput, patientWeightKg } = req.body;
    const macros = calculateMacroTargets(vetKcal, macroInput, patientWeightKg);
    res.json({ success: true, macros });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 3. POST /api/nutrition/meal-distribution
nutritionRouter.post('/meal-distribution', (req, res) => {
  try {
    const { vetKcal, macroTargets, meals } = req.body;
    const distribution = calculateMealDistribution(vetKcal, macroTargets, meals);
    res.json({ success: true, distribution });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 4. POST /api/nutrition/generate-meal-plan (Motor 2 + Motor 1 Loop)
nutritionRouter.post('/generate-meal-plan', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { patientId, planName, dailyTarget, mealDistributions, restrictions } = req.body;

    if (!patientId || !dailyTarget || !mealDistributions) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: patientId, dailyTarget e mealDistributions.'
      });
    }

    const result = await generateAndValidateMealPlan({
      tenantId,
      patientId,
      planName,
      dailyTarget,
      mealDistributions,
      restrictions
    });

    // Salvar no repositório multi-tenant
    dbRepository.saveMealPlan(result.plan);

    res.json({
      success: true,
      plan: result.plan,
      validation: result.validation,
      logs: result.logs
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. POST /api/nutrition/validate-meal-plan
nutritionRouter.post('/validate-meal-plan', (req, res) => {
  try {
    const { plan, dailyTarget, restrictions, customTolerances } = req.body;
    const validation = validateNutritionPlan(
      plan,
      { dailyTarget, restrictions },
      INITIAL_FOOD_CATALOG,
      customTolerances
    );
    res.json({ success: true, validation });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. POST /api/nutrition/substitutions
nutritionRouter.post('/substitutions', (req, res) => {
  try {
    const reqBody = req.body;
    const substitution = calculateFoodSubstitution(reqBody, INITIAL_FOOD_CATALOG);
    res.json({ success: true, substitution });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 7. GET /api/nutrition/foods
nutritionRouter.get('/foods', (req, res) => {
  try {
    const q = (req.query.q as string) || '';
    const category = (req.query.category as string) || '';
    let results = searchFoods(q, INITIAL_FOOD_CATALOG);

    if (category) {
      results = results.filter(f => f.category === category);
    }

    res.json({ success: true, count: results.length, foods: results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. GET /api/nutrition/meal-plans/:id
nutritionRouter.get('/meal-plans/:id', (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const plan = dbRepository.getMealPlan(tenantId, req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: `Cardápio ${req.params.id} não foi encontrado para esta clínica.`
      });
    }

    res.json({ success: true, plan });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. PUT /api/nutrition/meal-plans/:id (Atualizar/Recalcular Cardápio)
nutritionRouter.put('/meal-plans/:id', (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const planInput: MealPlan = { ...req.body, id: req.params.id, tenantId };

    // DISPARO OBRIGATÓRIO DO MOTOR 1: Recálculo integral de todos os alimentos e refeições
    const recalculatedMeals = planInput.meals.map(meal => {
      const recalculatedFoods = meal.foods.map(food => {
        const dbFood = INITIAL_FOOD_CATALOG.find(f => f.foodId === food.foodId);
        if (!dbFood) return food;

        const factor = food.quantityGrams / 100;
        return {
          ...food,
          calculatedNutrition: {
            energyKcal: Number((dbFood.energyKcal * factor).toFixed(2)),
            carbohydratesG: Number((dbFood.carbohydratesG * factor).toFixed(2)),
            proteinG: Number((dbFood.proteinG * factor).toFixed(2)),
            lipidsG: Number((dbFood.lipidsG * factor).toFixed(2)),
            fiberG: Number((dbFood.fiberG * factor).toFixed(2)),
            sodiumMg: Number((dbFood.sodiumMg * factor).toFixed(2))
          }
        };
      });

      const totals = calculateMealNutrition(recalculatedFoods);
      return {
        ...meal,
        foods: recalculatedFoods,
        totals
      };
    });

    const recalculatedTotals = calculateDailyNutrition(recalculatedMeals);

    const updatedPlan: MealPlan = {
      ...planInput,
      recalculatedTotals,
      meals: recalculatedMeals
    };

    const savedPlan = dbRepository.saveMealPlan(updatedPlan);
    const validation = validateNutritionPlan(savedPlan, { dailyTarget: savedPlan.dailyTarget });

    res.json({ success: true, plan: savedPlan, validation });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 10. POST /api/nutrition/meal-plans/:id/approve
nutritionRouter.post('/meal-plans/:id/approve', (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const approvedPlan = dbRepository.approveMealPlan(tenantId, req.params.id);
    res.json({ success: true, plan: approvedPlan });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// --- PATIENT DIRECTORY ENDPOINTS ---
nutritionRouter.get('/patients', (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const list = dbRepository.listPatients(tenantId);
    res.json({ success: true, patients: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

nutritionRouter.post('/patients', (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const record = dbRepository.savePatient({ ...req.body, tenantId });
    res.json({ success: true, patient: record });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

nutritionRouter.delete('/patients/:id', (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const deleted = dbRepository.deletePatient(tenantId, req.params.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// --- PROFESSIONALS ENDPOINTS ---
nutritionRouter.get('/professionals', (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const list = dbRepository.listProfessionals(tenantId);
    res.json({ success: true, professionals: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

nutritionRouter.post('/professionals', (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const record = dbRepository.saveProfessional({ ...req.body, tenantId });
    res.json({ success: true, professional: record });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

nutritionRouter.delete('/professionals/:id', (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const deleted = dbRepository.deleteProfessional(tenantId, req.params.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// --- RBAC PERMISSIONS ENDPOINTS ---
nutritionRouter.get('/permissions', (_req, res) => {
  try {
    const maps = dbRepository.getRolePermissions();
    res.json({ success: true, permissionsMap: maps });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

nutritionRouter.put('/permissions', (req, res) => {
  try {
    const { role, permissions } = req.body;
    const updated = dbRepository.updateRolePermissions(role, permissions);
    res.json({ success: true, role, permissions: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 11. POST /api/nutrition/run-tests
nutritionRouter.post('/run-tests', async (_req, res) => {
  try {
    const testReport = await runClinicalTestSuite();
    res.json({ success: true, testReport });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
