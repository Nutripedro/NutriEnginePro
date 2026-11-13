/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertTriangle, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { calculateMealDistribution } from '../engine/nutritionMath';
import { MacroTargets, SingleMealDistributionInput } from '../engine/types';

interface MealDistributionFormProps {
  vetKcal: number;
  macroTargets: MacroTargets;
  meals: SingleMealDistributionInput[];
  onChange: (updated: SingleMealDistributionInput[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function MealDistributionForm({
  vetKcal,
  macroTargets,
  meals,
  onChange,
  onNext,
  onBack
}: MealDistributionFormProps) {
  const distributionResult = calculateMealDistribution(vetKcal, macroTargets, meals);

  const handlePercentageChange = (id: string, newPct: number) => {
    const updated = meals.map(m => (m.id === id ? { ...m, percentage: Math.max(0, newPct) } : m));
    onChange(updated);
  };

  const handleTimeChange = (id: string, time: string) => {
    const updated = meals.map(m => (m.id === id ? { ...m, time } : m));
    onChange(updated);
  };

  const handleAddMeal = () => {
    const newMeal: SingleMealDistributionInput = {
      id: `meal_${Date.now()}`,
      name: `Nova Refeição ${meals.length + 1}`,
      percentage: 10,
      time: '16:00'
    };
    onChange([...meals, newMeal]);
  };

  const handleRemoveMeal = (id: string) => {
    if (meals.length <= 1) return;
    onChange(meals.filter(m => m.id !== id));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">3. Distribuição das Refeições</h2>
          <p className="text-sm text-slate-500 mt-1">
            Defina o fracionamento calórico e os horários das refeições diárias. A soma deve ser exatamente 100%.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Soma Percentual</span>
            <span
              className={`text-lg font-mono font-bold ${
                distributionResult.isValid ? 'text-emerald-600' : 'text-red-600'
              } tabular-nums`}
            >
              {distributionResult.totalPercentage}%
            </span>
          </div>
          <button
            onClick={handleAddMeal}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Refeição
          </button>
        </div>
      </div>

      {/* REFEIÇÕES LIST */}
      <div className="space-y-4">
        {distributionResult.meals.map((m, idx) => (
          <div
            key={m.id}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
          >
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Refeição {idx + 1}
              </label>
              <input
                type="text"
                value={m.name}
                onChange={e => {
                  const name = e.target.value;
                  onChange(meals.map(item => (item.id === m.id ? { ...item, name } : item)));
                }}
                className="w-full px-2.5 py-1.5 text-sm font-semibold border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Horário
              </label>
              <input
                type="time"
                value={m.time}
                onChange={e => handleTimeChange(m.id, e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
              />
            </div>

            <div className="md:col-span-3">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Participação Calórica</span>
                <span className="font-mono">{m.percentage}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={m.percentage}
                onChange={e => handlePercentageChange(m.id, Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div className="md:col-span-3 text-right font-mono text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900 text-sm">{m.targetKcal} kcal</div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                C: {m.targetCarbsG}g | P: {m.targetProteinG}g | L: {m.targetLipidsG}g
              </div>
            </div>

            <div className="md:col-span-1 text-right">
              <button
                onClick={() => handleRemoveMeal(m.id)}
                disabled={meals.length <= 1}
                className="p-2 text-slate-400 hover:text-red-600 disabled:opacity-30 transition-colors"
                title="Remover refeição"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MENSAGENS DE ERRO DA DISTRIBUIÇÃO */}
      {distributionResult.errors.map((err, i) => (
        <div key={i} className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{err}</span>
        </div>
      ))}

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={onNext}
          disabled={!distributionResult.isValid}
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2"
        >
          <span>Avançar para Alergias & Restrições</span>
          <CheckCircle2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
