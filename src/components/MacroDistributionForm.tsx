/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ZodMacroInputSchema } from '../engine/formSchemas';
import { calculateMacroTargets } from '../engine/nutritionMath';
import { MacroInput, MacroTargets } from '../engine/types';

interface MacroDistributionFormProps {
  vetKcal: number;
  patientWeightKg: number;
  macroInput: MacroInput;
  onChange: (updated: MacroInput) => void;
  onNext: () => void;
  onBack: () => void;
}

export function MacroDistributionForm({
  vetKcal,
  patientWeightKg,
  macroInput,
  onChange,
  onNext,
  onBack
}: MacroDistributionFormProps) {
  // REAL-TIME ZOD VALIDATION
  const zodValidation = ZodMacroInputSchema.safeParse(macroInput);
  const zodErrors: Record<string, string> = {};

  if (!zodValidation.success) {
    for (const issue of zodValidation.error.issues) {
      if (issue.path.length > 0) {
        const fieldName = String(issue.path[0]);
        if (!zodErrors[fieldName]) {
          zodErrors[fieldName] = issue.message;
        }
      }
    }
  }

  const isFormValid = zodValidation.success;

  let macroTargets: MacroTargets | null = null;
  let calcError = null;

  try {
    macroTargets = calculateMacroTargets(vetKcal, macroInput, patientWeightKg);
  } catch (err: any) {
    calcError = err.message;
  }

  const handleUpdate = (updates: Partial<MacroInput>) => {
    onChange({ ...macroInput, ...updates });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">2. Distribuição de Macronutrientes</h2>
          <p className="text-sm text-slate-500 mt-1">
            Validação Zod da soma (100%) e conversão pelos fatores Atwater: Carboidratos (4 kcal/g), Proteínas (4 kcal/g) e Lipídios (9 kcal/g).
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500">VET Prescrito</span>
          <div className="text-lg font-mono font-bold text-slate-900 tabular-nums">{vetKcal} kcal</div>
        </div>
      </div>

      {/* Tipo de Prescrição */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Método de Prescrição de Macronutrientes
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleUpdate({ calculationType: 'percentage' })}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                macroInput.calculationType === 'percentage'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Percentual do VET (%)
            </button>
            <button
              type="button"
              onClick={() => handleUpdate({ calculationType: 'grams_per_kg' })}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                macroInput.calculationType === 'grams_per_kg'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Proteína em g/kg + Lipídios %
            </button>
          </div>
        </div>

        {macroInput.calculationType === 'grams_per_kg' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Peso de Referência para Cálculo (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={macroInput.referenceWeightKg || patientWeightKg}
              onChange={e => handleUpdate({ referenceWeightKg: Number(e.target.value) })}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-hidden tabular-nums bg-white ${
                zodErrors.referenceWeightKg ? 'border-red-500 focus:ring-red-400' : 'border-slate-300 focus:ring-emerald-500'
              }`}
            />
            {zodErrors.referenceWeightKg && (
              <span className="text-[11px] font-semibold text-red-600 mt-1 block">{zodErrors.referenceWeightKg}</span>
            )}
            <span className="text-xs text-slate-500 mt-1 block">
              Peso atual do paciente: {patientWeightKg} kg
            </span>
          </div>
        )}
      </div>

      {/* INPUTS DE MACRONUTRIENTES */}
      {macroInput.calculationType === 'percentage' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Carboidratos (%)
                </label>
                <span className="text-xs text-emerald-700 font-mono">4 kcal/g</span>
              </div>
              <input
                type="number"
                value={macroInput.carbsPercentage ?? 50}
                onChange={e => handleUpdate({ carbsPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 text-lg font-bold font-mono border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white tabular-nums"
              />
            </div>

            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Proteínas (%)
                </label>
                <span className="text-xs text-blue-700 font-mono">4 kcal/g</span>
              </div>
              <input
                type="number"
                value={macroInput.proteinPercentage ?? 20}
                onChange={e => handleUpdate({ proteinPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 text-lg font-bold font-mono border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white tabular-nums"
              />
            </div>

            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Lipídios (%)
                </label>
                <span className="text-xs text-amber-700 font-mono">9 kcal/g</span>
              </div>
              <input
                type="number"
                value={macroInput.lipidsPercentage ?? 30}
                onChange={e => handleUpdate({ lipidsPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 text-lg font-bold font-mono border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white tabular-nums"
              />
            </div>
          </div>

          {/* SOMA PERCENTUAL ZOD ERROR */}
          {zodErrors.percentageSum && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="font-semibold">{zodErrors.percentageSum}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Proteína Prescrita (g/kg)
              </label>
              <span className="text-xs text-blue-700 font-mono">4 kcal/g</span>
            </div>
            <input
              type="number"
              step="0.1"
              value={macroInput.proteinGramsPerKg ?? 2.0}
              onChange={e => handleUpdate({ proteinGramsPerKg: Number(e.target.value) })}
              className={`w-full px-3 py-2 text-lg font-bold font-mono border rounded-lg focus:ring-2 bg-white tabular-nums ${
                zodErrors.proteinGramsPerKg ? 'border-red-500 focus:ring-red-400' : 'border-blue-300 focus:ring-blue-500'
              }`}
            />
            {zodErrors.proteinGramsPerKg && (
              <span className="text-[11px] font-semibold text-red-600 mt-1 block">{zodErrors.proteinGramsPerKg}</span>
            )}
          </div>

          <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Lipídios (% do VET)
              </label>
              <span className="text-xs text-amber-700 font-mono">9 kcal/g</span>
            </div>
            <input
              type="number"
              value={macroInput.lipidsPercentage ?? 25}
              onChange={e => handleUpdate({ lipidsPercentage: Number(e.target.value) })}
              className="w-full px-3 py-2 text-lg font-bold font-mono border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white tabular-nums"
            />
          </div>
        </div>
      )}

      {/* PAINEL DE METAS DETERMINÍSTICAS CALCULADAS */}
      {macroTargets && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30">
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Carboidratos Meta</div>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
                {macroTargets.carbohydratesG} g
              </div>
              <div className="text-xs text-emerald-600 mt-1 flex justify-between">
                <span>{macroTargets.carbohydratesKcal} kcal</span>
                <span>{macroTargets.carbohydratesPct}% do VET</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30">
              <div className="text-xs font-bold text-blue-800 uppercase tracking-wider">Proteínas Meta</div>
              <div className="text-2xl font-bold font-mono text-blue-700 mt-1 tabular-nums">
                {macroTargets.proteinG} g
              </div>
              <div className="text-xs text-blue-600 mt-1 flex justify-between">
                <span>{macroTargets.proteinKcal} kcal</span>
                <span>{macroTargets.proteinGramsPerKg} g/kg ({macroTargets.proteinPct}%)</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30">
              <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Lipídios Meta</div>
              <div className="text-2xl font-bold font-mono text-amber-700 mt-1 tabular-nums">
                {macroTargets.lipidsG} g
              </div>
              <div className="text-xs text-amber-600 mt-1 flex justify-between">
                <span>{macroTargets.lipidsKcal} kcal</span>
                <span>{macroTargets.lipidsPct}% do VET</span>
              </div>
            </div>
          </div>

          {/* Alertas de Macronutrientes */}
          {macroTargets.warnings.map((warn, i) => (
            <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{warn}</span>
            </div>
          ))}
        </div>
      )}

      {calcError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{calcError}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={onNext}
          disabled={!isFormValid || !macroTargets || !!calcError}
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:cursor-not-allowed"
        >
          <span>Avançar para Distribuição de Refeições</span>
          <CheckCircle2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
