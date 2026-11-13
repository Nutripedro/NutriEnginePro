/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Utensils
} from 'lucide-react';
import { useState } from 'react';
import { getFoodById, INITIAL_FOOD_CATALOG, searchFoods } from '../engine/foodCatalog';
import { calculateDailyNutrition, calculateFoodSubstitution, calculateMealNutrition, validateNutritionPlan } from '../engine/nutritionMath';
import { FoodItem, FoodSubstitutionResult, MealFoodItem, MealPlan, MealPlanMeal, NutritionValidationResult } from '../engine/types';

interface MealPlanEditorProps {
  plan: MealPlan;
  onUpdatePlan: (updatedPlan: MealPlan, validation: NutritionValidationResult) => void;
  onApprove: (planId: string) => void;
  onOpenPdf: () => void;
}

export function MealPlanEditor({ plan, onUpdatePlan, onApprove, onOpenPdf }: MealPlanEditorProps) {
  const [currentPlan, setCurrentPlan] = useState<MealPlan>(plan);

  // States para busca e adição de alimentos
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMealIdForAdd, setActiveMealIdForAdd] = useState<string | null>(null);
  const [selectedFoodForAdd, setSelectedFoodForAdd] = useState<FoodItem | null>(null);
  const [addQuantityGrams, setAddQuantityGrams] = useState<number>(100);

  // States para calculadora de substituição equivalente
  const [substitutionModalOpen, setSubstitutionModalOpen] = useState(false);
  const [subTargetFoodItem, setSubTargetFoodItem] = useState<{ mealId: string; foodId: string; currentGrams: number } | null>(null);
  const [substituteSearchQuery, setSubstituteSearchQuery] = useState('');
  const [selectedSubstituteFood, setSelectedSubstituteFood] = useState<FoodItem | null>(null);
  const [subCriterion, setSubCriterion] = useState<'carbohydratesG' | 'proteinG' | 'lipidsG' | 'energyKcal'>('carbohydratesG');
  const [substitutionResult, setSubstitutionResult] = useState<FoodSubstitutionResult | null>(null);

  // Trigger Motor 1 deterministic recalculation on every change
  const triggerRecalculation = (meals: MealPlanMeal[]) => {
    const recalculatedMeals = meals.map(meal => {
      const recalculatedFoods = meal.foods.map(food => {
        const dbFood = getFoodById(food.foodId, INITIAL_FOOD_CATALOG);
        if (!dbFood) return food;

        const factor = food.quantityGrams / 100;
        const calculatedNutrition = {
          energyKcal: Number((dbFood.energyKcal * factor).toFixed(2)),
          carbohydratesG: Number((dbFood.carbohydratesG * factor).toFixed(2)),
          proteinG: Number((dbFood.proteinG * factor).toFixed(2)),
          lipidsG: Number((dbFood.lipidsG * factor).toFixed(2)),
          fiberG: Number((dbFood.fiberG * factor).toFixed(2)),
          sodiumMg: Number((dbFood.sodiumMg * factor).toFixed(2))
        };

        let householdMeasureSelected = `${food.quantityGrams}g`;
        if (dbFood.householdMeasures && dbFood.householdMeasures.length > 0) {
          const hm = dbFood.householdMeasures[0];
          const count = (food.quantityGrams / hm.grams).toFixed(1);
          householdMeasureSelected = `aprox. ${count} x ${hm.name} (${food.quantityGrams}g)`;
        }

        return {
          ...food,
          calculatedNutrition,
          householdMeasureSelected
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
      ...currentPlan,
      recalculatedTotals,
      meals: recalculatedMeals,
      updatedAt: new Date().toISOString()
    };

    const validation = validateNutritionPlan(updatedPlan, { dailyTarget: updatedPlan.dailyTarget }, INITIAL_FOOD_CATALOG);

    setCurrentPlan(updatedPlan);
    onUpdatePlan(updatedPlan, validation);
  };

  // Alterar quantidade em gramas de um alimento
  const handleQuantityChange = (mealId: string, foodId: string, newGrams: number) => {
    const newG = Math.max(1, newGrams);
    const updatedMeals = currentPlan.meals.map(m => {
      if (m.mealId !== mealId) return m;
      return {
        ...m,
        foods: m.foods.map(f => (f.foodId === foodId ? { ...f, quantityGrams: newG } : f))
      };
    });
    triggerRecalculation(updatedMeals);
  };

  // Remover alimento da refeição
  const handleRemoveFood = (mealId: string, foodId: string) => {
    const updatedMeals = currentPlan.meals.map(m => {
      if (m.mealId !== mealId) return m;
      return {
        ...m,
        foods: m.foods.filter(f => f.foodId !== foodId)
      };
    });
    triggerRecalculation(updatedMeals);
  };

  // Adicionar novo alimento do catálogo
  const handleConfirmAddFood = () => {
    if (!activeMealIdForAdd || !selectedFoodForAdd) return;

    const dbFood = selectedFoodForAdd;
    const factor = addQuantityGrams / 100;
    const calculatedNutrition = {
      energyKcal: Number((dbFood.energyKcal * factor).toFixed(2)),
      carbohydratesG: Number((dbFood.carbohydratesG * factor).toFixed(2)),
      proteinG: Number((dbFood.proteinG * factor).toFixed(2)),
      lipidsG: Number((dbFood.lipidsG * factor).toFixed(2)),
      fiberG: Number((dbFood.fiberG * factor).toFixed(2)),
      sodiumMg: Number((dbFood.sodiumMg * factor).toFixed(2))
    };

    let householdMeasureSelected = `${addQuantityGrams}g`;
    if (dbFood.householdMeasures && dbFood.householdMeasures.length > 0) {
      const hm = dbFood.householdMeasures[0];
      const count = (addQuantityGrams / hm.grams).toFixed(1);
      householdMeasureSelected = `aprox. ${count} x ${hm.name} (${addQuantityGrams}g)`;
    }

    const newFoodItem: MealFoodItem = {
      foodId: dbFood.foodId,
      name: dbFood.name,
      quantityGrams: addQuantityGrams,
      preparation: dbFood.preparationTips || 'Preparação tradicional.',
      calculatedNutrition,
      householdMeasureSelected
    };

    const updatedMeals = currentPlan.meals.map(m => {
      if (m.mealId !== activeMealIdForAdd) return m;
      return {
        ...m,
        foods: [...m.foods, newFoodItem]
      };
    });

    triggerRecalculation(updatedMeals);

    // Reset modal
    setActiveMealIdForAdd(null);
    setSelectedFoodForAdd(null);
    setSearchQuery('');
  };

  // Calcular substituição equivalente
  const handleCalculateSubstitution = (substituteFood: FoodItem) => {
    if (!subTargetFoodItem) return;
    try {
      const res = calculateFoodSubstitution(
        {
          originalFoodId: subTargetFoodItem.foodId,
          originalQuantityGrams: subTargetFoodItem.currentGrams,
          substituteFoodId: substituteFood.foodId,
          targetNutrientCriterion: subCriterion
        },
        INITIAL_FOOD_CATALOG
      );
      setSelectedSubstituteFood(substituteFood);
      setSubstitutionResult(res);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Aplicar substituição calculada na refeição
  const handleApplySubstitution = () => {
    if (!subTargetFoodItem || !substitutionResult) return;

    const { mealId, foodId } = subTargetFoodItem;
    const subFood = substitutionResult.substituteFood;
    const calcGrams = substitutionResult.calculatedQuantityGrams;

    const updatedMeals = currentPlan.meals.map(m => {
      if (m.mealId !== mealId) return m;
      return {
        ...m,
        foods: m.foods.map(f => {
          if (f.foodId !== foodId) return f;
          return {
            foodId: subFood.foodId,
            name: subFood.name,
            quantityGrams: calcGrams,
            preparation: subFood.preparationTips || 'Preparado conforme orientação.',
            calculatedNutrition: {
              energyKcal: Number(((subFood.energyKcal * calcGrams) / 100).toFixed(2)),
              carbohydratesG: Number(((subFood.carbohydratesG * calcGrams) / 100).toFixed(2)),
              proteinG: Number(((subFood.proteinG * calcGrams) / 100).toFixed(2)),
              lipidsG: Number(((subFood.lipidsG * calcGrams) / 100).toFixed(2)),
              fiberG: Number(((subFood.fiberG * calcGrams) / 100).toFixed(2)),
              sodiumMg: Number(((subFood.sodiumMg * calcGrams) / 100).toFixed(2))
            },
            householdMeasureSelected: substitutionResult.householdMeasureSuggestion
          };
        })
      };
    });

    triggerRecalculation(updatedMeals);

    setSubstitutionModalOpen(false);
    setSubTargetFoodItem(null);
    setSubstitutionResult(null);
  };

  const validation = validateNutritionPlan(currentPlan, { dailyTarget: currentPlan.dailyTarget }, INITIAL_FOOD_CATALOG);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* HEADER DO EDITOR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">6. Editor Interativo de Cardápio</h2>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
              Versão {currentPlan.version}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Qualquer alteração de gramagem ou alimento dispara automaticamente o recálculo do Motor 1.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentPlan.status === 'approved' ? (
            <span className="text-xs font-bold px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Prescrição Aprovada
            </span>
          ) : (
            <button
              onClick={() => onApprove(currentPlan.id)}
              disabled={!validation.isValid}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Aprovar Prescrição</span>
            </button>
          )}

          <button
            onClick={onOpenPdf}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* METERS DE CONFORMIDADE EM TEMPO REAL */}
      <div className="p-4 bg-slate-900 text-white rounded-xl grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-[11px] text-slate-400 font-medium">Energia Total / Meta</div>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5 tabular-nums">
            {currentPlan.recalculatedTotals.energyKcal} / {currentPlan.dailyTarget.energyKcal} kcal
          </div>
          <div className="text-[11px] text-slate-400">
            Variação: <span className={validation.energyWithinTolerance ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{validation.energyDeltaPct}%</span>
          </div>
        </div>

        <div>
          <div className="text-[11px] text-slate-400 font-medium">Carboidratos / Meta</div>
          <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5 tabular-nums">
            {currentPlan.recalculatedTotals.carbohydratesG} / {currentPlan.dailyTarget.carbohydratesG}g
          </div>
          <div className="text-[11px] text-slate-400">
            Variação: <span className={validation.carbsWithinTolerance ? 'text-cyan-400 font-bold' : 'text-amber-400 font-bold'}>{validation.carbsDeltaPct}%</span>
          </div>
        </div>

        <div>
          <div className="text-[11px] text-slate-400 font-medium">Proteínas / Meta</div>
          <div className="text-lg font-bold font-mono text-blue-400 mt-0.5 tabular-nums">
            {currentPlan.recalculatedTotals.proteinG} / {currentPlan.dailyTarget.proteinG}g
          </div>
          <div className="text-[11px] text-slate-400">
            Variação: <span className={validation.proteinWithinTolerance ? 'text-blue-400 font-bold' : 'text-amber-400 font-bold'}>{validation.proteinDeltaPct}%</span>
          </div>
        </div>

        <div>
          <div className="text-[11px] text-slate-400 font-medium">Lipídios / Meta</div>
          <div className="text-lg font-bold font-mono text-amber-400 mt-0.5 tabular-nums">
            {currentPlan.recalculatedTotals.lipidsG} / {currentPlan.dailyTarget.lipidsG}g
          </div>
          <div className="text-[11px] text-slate-400">
            Variação: <span className={validation.lipidsWithinTolerance ? 'text-amber-400 font-bold' : 'text-amber-400 font-bold'}>{validation.lipidsDeltaPct}%</span>
          </div>
        </div>
      </div>

      {/* PAINEL DE REFEIÇÕES DO CARDÁPIO */}
      <div className="space-y-6">
        {currentPlan.meals.map(meal => (
          <div key={meal.mealId} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            {/* Header da Refeição */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <Utensils className="w-4 h-4 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{meal.mealName}</h3>
                  <span className="text-xs text-slate-500 font-mono">Horário: {meal.time || '08:00'}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-slate-700">
                <span className="font-bold text-slate-900">{meal.totals.energyKcal} kcal</span>
                <span>(C: {meal.totals.carbohydratesG}g | P: {meal.totals.proteinG}g | L: {meal.totals.lipidsG}g)</span>
                <button
                  onClick={() => setActiveMealIdForAdd(meal.mealId)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-sans font-semibold rounded-md text-[11px] flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Adicionar Alimento
                </button>
              </div>
            </div>

            {/* Tabela de Alimentos da Refeição */}
            <div className="divide-y divide-slate-100 overflow-x-auto">
              {meal.foods.map(food => (
                <div key={food.foodId} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50">
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-slate-900">{food.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {food.householdMeasureSelected} · {food.preparation}
                    </div>
                  </div>

                  {/* Edição de Gramagem */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="2000"
                        value={food.quantityGrams}
                        onChange={e => handleQuantityChange(meal.mealId, food.foodId, Number(e.target.value))}
                        className="w-20 px-2.5 py-1 text-sm font-bold font-mono border border-slate-300 rounded-md text-right focus:ring-2 focus:ring-emerald-500 tabular-nums bg-white"
                      />
                      <span className="text-xs font-semibold text-slate-500">g</span>
                    </div>

                    {/* Resumo Nutricional do Item */}
                    <div className="text-right font-mono text-xs text-slate-600 min-w-[120px]">
                      <div className="font-bold text-slate-900">{food.calculatedNutrition.energyKcal} kcal</div>
                      <div className="text-[10px] text-slate-400">
                        C: {food.calculatedNutrition.carbohydratesG}g | P: {food.calculatedNutrition.proteinG}g
                      </div>
                    </div>

                    {/* Ações: Substituir / Remover */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSubTargetFoodItem({ mealId: meal.mealId, foodId: food.foodId, currentGrams: food.quantityGrams });
                          setSubstitutionModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                        title="Calcular Substituição Equivalente"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleRemoveFood(meal.mealId, food.foodId)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Remover Alimento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL ADICIONAR ALIMENTO DO CATÁLOGO TACO/TBCA */}
      {activeMealIdForAdd && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Adicionar Alimento da Base Nutricional TACO/TBCA</h3>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por alimento (ex: Arroz, Frango, Tapioca, Ovo...)"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {searchFoods(searchQuery, INITIAL_FOOD_CATALOG).map(food => (
                <button
                  key={food.foodId}
                  onClick={() => setSelectedFoodForAdd(food)}
                  className={`w-full p-2.5 text-left text-xs flex items-center justify-between transition-colors ${
                    selectedFoodForAdd?.foodId === food.foodId ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-900">{food.name}</div>
                    <div className="text-[10px] text-slate-500">Fonte: {food.source} · {food.category}</div>
                  </div>
                  <span className="font-mono">{food.energyKcal} kcal / 100g</span>
                </button>
              ))}
            </div>

            {selectedFoodForAdd && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Quantidade Desejada (g):</span>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={addQuantityGrams}
                  onChange={e => setAddQuantityGrams(Number(e.target.value))}
                  className="w-24 px-2.5 py-1 text-sm font-mono font-bold border border-slate-300 rounded-md text-right bg-white"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setActiveMealIdForAdd(null);
                  setSelectedFoodForAdd(null);
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAddFood}
                disabled={!selectedFoodForAdd}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg"
              >
                Adicionar ao Cardápio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CALCULADORA DE SUBSTITUIÇÃO EQUIVALENTE */}
      {substitutionModalOpen && subTargetFoodItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                Calculadora de Substituição Equivalente (Motor 1)
              </h3>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
              Alimento Original: <span className="font-bold text-slate-900">{getFoodById(subTargetFoodItem.foodId)?.name}</span> ({subTargetFoodItem.currentGrams}g)
            </div>

            {/* Critério Nutricional */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Critério de Equivalência
              </label>
              <select
                value={subCriterion}
                onChange={e => setSubCriterion(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              >
                <option value="carbohydratesG">Equivalência por Carboidratos (g)</option>
                <option value="proteinG">Equivalência por Proteínas (g)</option>
                <option value="lipidsG">Equivalência por Lipídios (g)</option>
                <option value="energyKcal">Equivalência por Energia (kcal)</option>
              </select>
            </div>

            {/* Buscar Alimento Substituto */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={substituteSearchQuery}
                onChange={e => setSubstituteSearchQuery(e.target.value)}
                placeholder="Buscar substituto (ex: Batata doce, Mandioca, Tofu...)"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {searchFoods(substituteSearchQuery, INITIAL_FOOD_CATALOG).map(food => (
                <button
                  key={food.foodId}
                  onClick={() => handleCalculateSubstitution(food)}
                  className={`w-full p-2.5 text-left text-xs flex items-center justify-between transition-colors ${
                    selectedSubstituteFood?.foodId === food.foodId ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="font-semibold text-slate-900">{food.name}</span>
                  <span className="font-mono text-[11px]">Selecionar</span>
                </button>
              ))}
            </div>

            {/* RESULTADO DA SUBSTITUIÇÃO EQUIVALENTE */}
            {substitutionResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="text-xs font-bold text-emerald-900 flex justify-between">
                  <span>Gramagem Equivalente Calculada:</span>
                  <span className="font-mono text-base">{substitutionResult.calculatedQuantityGrams}g</span>
                </div>
                <div className="text-xs text-emerald-800">
                  Sugestão: <span className="font-semibold">{substitutionResult.householdMeasureSuggestion}</span>
                </div>
                <div className="text-[11px] text-emerald-700 flex justify-between">
                  <span>Original ({subCriterion}): {substitutionResult.originalNutrientValue}</span>
                  <span>Substituto ({subCriterion}): {substitutionResult.substituteNutrientValue}</span>
                  <span>Variação: {substitutionResult.variancePct}%</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setSubstitutionModalOpen(false);
                  setSubTargetFoodItem(null);
                  setSubstitutionResult(null);
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplySubstitution}
                disabled={!substitutionResult}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg"
              >
                Substituir no Cardápio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
