/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import {
  AiGenerationLog,
  FoodRestriction,
  MealDistributionTarget,
  MealPlan,
  NutritionValidationResult
} from '../engine/types';

interface MealPlanGeneratorViewProps {
  dailyTarget: {
    energyKcal: number;
    carbohydratesG: number;
    proteinG: number;
    lipidsG: number;
  };
  mealDistributions: MealDistributionTarget[];
  restrictions: FoodRestriction;
  patientId: string;
  onPlanGenerated: (plan: MealPlan, validation: NutritionValidationResult) => void;
  onGoToEditor: () => void;
}

export function MealPlanGeneratorView({
  dailyTarget,
  mealDistributions,
  restrictions,
  patientId,
  onPlanGenerated,
  onGoToEditor
}: MealPlanGeneratorViewProps) {
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<MealPlan | null>(null);
  const [validationResult, setValidationResult] = useState<NutritionValidationResult | null>(null);
  const [generationLogs, setGenerationLogs] = useState<AiGenerationLog[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/nutrition/generate-meal-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'CLINIC_DEFAULT'
        },
        body: JSON.stringify({
          patientId,
          planName: 'Plano Alimentar Individualizado',
          dailyTarget,
          mealDistributions,
          restrictions
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erro ao gerar o cardápio pela IA');
      }

      setGeneratedPlan(data.plan);
      setValidationResult(data.validation);
      setGenerationLogs(data.logs || []);

      onPlanGenerated(data.plan, data.validation);
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocorreu um erro durante a geração.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            5. Motor 2: Gerador de Cardápio com IA & Auditoria Determinística
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            A IA seleciona alimentos e organiza as preparações. O Motor 1 recalcula os nutrientes e audita as tolerâncias (Energia ±3%, Macros ±5%).
          </p>
        </div>
      </div>

      {/* DISPARO DA GERAÇÃO */}
      <div className="bg-slate-900 text-white rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">Pronto para Gerar o Cardápio Clínico</h3>
          <p className="text-xs text-slate-300">
            Metas: <span className="font-mono text-emerald-400 font-bold">{dailyTarget.energyKcal} kcal</span> (C: {dailyTarget.carbohydratesG}g | P: {dailyTarget.proteinG}g | L: {dailyTarget.lipidsG}g)
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 shrink-0 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Sintetizando e Auditando no Motor 1...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>Gerar Cardápio Automático</span>
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* RESULTADO DA VALIDAÇÃO E AUDITORIA DETERMINÍSTICA */}
      {validationResult && generatedPlan && (
        <div className="space-y-6 pt-2">
          {/* PAINEL DE CONFORMIDADE DE METAS (METERS) */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Auditoria de Conformidade do Motor 1
              </h4>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  validationResult.isValid
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {validationResult.isValid ? 'Conforme com as Metas' : 'Revisão Recomendada'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Energia */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500 font-medium flex justify-between">
                  <span>Energia</span>
                  <span className="font-mono">Meta: {dailyTarget.energyKcal} kcal</span>
                </div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-1 tabular-nums">
                  {generatedPlan.recalculatedTotals.energyKcal} kcal
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Variação:</span>
                  <span
                    className={`font-mono font-bold ${
                      validationResult.energyWithinTolerance ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {validationResult.energyDeltaPct}% ({validationResult.energyDeltaKcal} kcal)
                  </span>
                </div>
              </div>

              {/* Carboidratos */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500 font-medium flex justify-between">
                  <span>Carboidratos</span>
                  <span className="font-mono">{dailyTarget.carbohydratesG}g</span>
                </div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-1 tabular-nums">
                  {generatedPlan.recalculatedTotals.carbohydratesG} g
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Variação:</span>
                  <span
                    className={`font-mono font-bold ${
                      validationResult.carbsWithinTolerance ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {validationResult.carbsDeltaPct}%
                  </span>
                </div>
              </div>

              {/* Proteínas */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500 font-medium flex justify-between">
                  <span>Proteínas</span>
                  <span className="font-mono">{dailyTarget.proteinG}g</span>
                </div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-1 tabular-nums">
                  {generatedPlan.recalculatedTotals.proteinG} g
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Variação:</span>
                  <span
                    className={`font-mono font-bold ${
                      validationResult.proteinWithinTolerance ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {validationResult.proteinDeltaPct}%
                  </span>
                </div>
              </div>

              {/* Lipídios */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500 font-medium flex justify-between">
                  <span>Lipídios</span>
                  <span className="font-mono">{dailyTarget.lipidsG}g</span>
                </div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-1 tabular-nums">
                  {generatedPlan.recalculatedTotals.lipidsG} g
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Variação:</span>
                  <span
                    className={`font-mono font-bold ${
                      validationResult.lipidsWithinTolerance ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {validationResult.lipidsDeltaPct}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* LISTA DE ALERTAS E ERROS SE HOUVER */}
          {validationResult.errors.length > 0 && (
            <div className="space-y-2">
              {validationResult.errors.map((err, idx) => (
                <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          {/* VISUALIZAÇÃO RÁPIDA DAS REFEIÇÕES GERADAS */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Refeições Estruturadas ({generatedPlan.meals.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedPlan.meals.map((meal, idx) => (
                <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="font-bold text-sm text-slate-900">{meal.mealName}</span>
                    <span className="text-xs font-mono font-semibold text-emerald-600">{meal.totals.energyKcal} kcal</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {meal.foods.map((food, fIdx) => (
                      <li key={fIdx} className="flex justify-between">
                        <span>• {food.name} ({food.preparation})</span>
                        <span className="font-mono font-semibold text-slate-800">{food.quantityGrams}g</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={onGoToEditor}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span>Abrir no Editor Interativo de Cardápios</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
