/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ZodPatientProfileSchema } from '../engine/formSchemas';
import { calculateBMRAndGET, calculateEnergyTarget } from '../engine/nutritionMath';
import { PatientNutritionInput } from '../engine/types';

interface PatientProfileFormProps {
  patient: PatientNutritionInput;
  onChange: (updated: PatientNutritionInput) => void;
  onNext: () => void;
}

export function PatientProfileForm({ patient, onChange, onNext }: PatientProfileFormProps) {
  const { bmrKcal, getKcal } = calculateBMRAndGET(patient);

  // REAL-TIME ZOD SCHEMA VALIDATION
  const zodValidation = ZodPatientProfileSchema.safeParse({ ...patient, getKcal });
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

  let energyCalculationResult = null;
  let calculationError = null;
  try {
    energyCalculationResult = calculateEnergyTarget({ ...patient, getKcal });
  } catch (err: any) {
    calculationError = err.message;
  }

  const handleChange = (field: keyof PatientNutritionInput, value: any) => {
    const updated = { ...patient, [field]: value };
    if (field === 'weightKg' || field === 'heightCm' || field === 'age' || field === 'activityLevel' || field === 'calculationFormula') {
      const calc = calculateBMRAndGET(updated);
      updated.getKcal = calc.getKcal;
    }
    onChange(updated);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">1. Cadastro Antropométrico & Gasto Energético (GET)</h2>
          <p className="text-sm text-slate-500 mt-1">
            Validação em tempo real com Zod Schema e cálculo determinístico da TMB/GET.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> Validação Zod Ativa
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Identificação */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Nome do Paciente *
          </label>
          <input
            type="text"
            value={patient.name || ''}
            onChange={e => handleChange('name', e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-hidden ${
              zodErrors.name
                ? 'border-red-500 focus:ring-red-400 bg-red-50/20'
                : 'border-slate-300 focus:ring-emerald-500'
            }`}
            placeholder="Ex: Maria Silva"
          />
          {zodErrors.name && (
            <span className="text-[11px] font-semibold text-red-600 mt-1 block">{zodErrors.name}</span>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Idade (Anos) *
          </label>
          <input
            type="number"
            min="1"
            max="120"
            value={patient.age || ''}
            onChange={e => handleChange('age', Number(e.target.value))}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-hidden tabular-nums ${
              zodErrors.age
                ? 'border-red-500 focus:ring-red-400 bg-red-50/20'
                : 'border-slate-300 focus:ring-emerald-500'
            }`}
          />
          {zodErrors.age && (
            <span className="text-[11px] font-semibold text-red-600 mt-1 block">{zodErrors.age}</span>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Sexo Biológico *
          </label>
          <select
            value={patient.sex}
            onChange={e => handleChange('sex', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="female">Feminino</option>
            <option value="male">Masculino</option>
          </select>
        </div>

        {/* Antropometria */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Peso Atual (kg) *
          </label>
          <input
            type="number"
            step="0.1"
            value={patient.weightKg || ''}
            onChange={e => handleChange('weightKg', Number(e.target.value))}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-hidden tabular-nums ${
              zodErrors.weightKg
                ? 'border-red-500 focus:ring-red-400 bg-red-50/20'
                : 'border-slate-300 focus:ring-emerald-500'
            }`}
          />
          {zodErrors.weightKg && (
            <span className="text-[11px] font-semibold text-red-600 mt-1 block">{zodErrors.weightKg}</span>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Altura (cm) *
          </label>
          <input
            type="number"
            value={patient.heightCm || ''}
            onChange={e => handleChange('heightCm', Number(e.target.value))}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-hidden tabular-nums ${
              zodErrors.heightCm
                ? 'border-red-500 focus:ring-red-400 bg-red-50/20'
                : 'border-slate-300 focus:ring-emerald-500'
            }`}
          />
          {zodErrors.heightCm && (
            <span className="text-[11px] font-semibold text-red-600 mt-1 block">{zodErrors.heightCm}</span>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Gordura Corporal % (Opcional)
          </label>
          <input
            type="number"
            step="0.1"
            value={patient.bodyFatPercentage || ''}
            onChange={e => handleChange('bodyFatPercentage', e.target.value ? Number(e.target.value) : undefined)}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-hidden tabular-nums ${
              zodErrors.bodyFatPercentage
                ? 'border-red-500 focus:ring-red-400 bg-red-50/20'
                : 'border-slate-300 focus:ring-emerald-500'
            }`}
            placeholder="Ex: 22.5"
          />
          {zodErrors.bodyFatPercentage && (
            <span className="text-[11px] font-semibold text-red-600 mt-1 block">{zodErrors.bodyFatPercentage}</span>
          )}
        </div>

        {/* Fórmulas e Nível de Atividade */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Fórmula da TMB
          </label>
          <select
            value={patient.calculationFormula}
            onChange={e => handleChange('calculationFormula', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="mifflin_st_jeor">Mifflin-St Jeor (Recomendado)</option>
            <option value="harris_benedict">Harris-Benedict</option>
            <option value="cunningham">Cunningham (LBM)</option>
            <option value="katch_mcardle">Katch-McArdle (LBM)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Nível de Atividade Física (PAL)
          </label>
          <select
            value={patient.activityLevel}
            onChange={e => handleChange('activityLevel', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="sedentary">Sedentário (x 1.20)</option>
            <option value="light">Levemente Ativo (x 1.375)</option>
            <option value="moderate">Moderadamente Ativo (x 1.55)</option>
            <option value="heavy">Altamente Ativo (x 1.725)</option>
            <option value="extreme">Extremamente Ativo (x 1.90)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Objetivo Nutricional
          </label>
          <select
            value={patient.goal}
            onChange={e => handleChange('goal', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="weight_loss">Emagrecimento / Déficit Calórico</option>
            <option value="maintenance">Manutenção do Peso</option>
            <option value="hypertrophy">Hipertrofia / Ganho de Massa Magra</option>
            <option value="clinical_rehab">Reabilitação Clínica</option>
          </select>
        </div>
      </div>

      {/* RESULTADOS ENERGÉTICOS DETERMINÍSTICOS */}
      <div className="mt-6 p-4 rounded-xl bg-slate-900 text-white grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="text-xs text-slate-400 font-medium">TMB Calculada (Metabolismo Basal)</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
            {bmrKcal.toLocaleString()} kcal/dia
          </div>
          <div className="text-xs text-slate-400 mt-1">Fórmula: {patient.calculationFormula}</div>
        </div>

        <div>
          <div className="text-xs text-slate-400 font-medium">GET Estimado (Gasto Total)</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1 tabular-nums">
            {getKcal.toLocaleString()} kcal/dia
          </div>
          <div className="text-xs text-slate-400 mt-1">Gasto total diário com atividade</div>
        </div>

        <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
          <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1">
            VET Prescrito pelo Nutricionista (kcal) *
          </label>
          <input
            type="number"
            step="10"
            value={patient.prescribedVETKcal || ''}
            onChange={e => handleChange('prescribedVETKcal', Number(e.target.value))}
            className={`w-full px-3 py-1.5 bg-slate-950 text-white font-mono font-bold text-lg border rounded-md focus:ring-2 focus:outline-hidden tabular-nums ${
              zodErrors.prescribedVETKcal ? 'border-red-500 focus:ring-red-400' : 'border-slate-600 focus:ring-emerald-400'
            }`}
          />
          {zodErrors.prescribedVETKcal && (
            <span className="text-[11px] font-semibold text-red-400 mt-1 block">{zodErrors.prescribedVETKcal}</span>
          )}
          {energyCalculationResult && !zodErrors.prescribedVETKcal && (
            <div className="text-xs mt-1.5 flex items-center justify-between">
              <span className="text-slate-300">Variação vs GET:</span>
              <span className={`font-mono font-bold ${energyCalculationResult.isDeficit ? 'text-amber-400' : 'text-emerald-400'}`}>
                {energyCalculationResult.caloricDeltaKcal > 0 ? '+' : ''}
                {energyCalculationResult.caloricDeltaKcal} kcal ({energyCalculationResult.deltaPercentage}%)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ERROS E ALERTAS CLÍNICOS */}
      {calculationError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{calculationError}</span>
        </div>
      )}

      {energyCalculationResult && energyCalculationResult.warnings.length > 0 && (
        <div className="space-y-2">
          {energyCalculationResult.warnings.map((warn, i) => (
            <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{warn}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="text-xs text-slate-500">
          {!isFormValid ? (
            <span className="text-red-600 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Por favor, corrija os erros nos campos antes de avançar.
            </span>
          ) : (
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Dados validados pelo Zod Schema.
            </span>
          )}
        </div>

        <button
          onClick={onNext}
          disabled={!isFormValid}
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          <span>Avançar para Distribuição de Macronutrientes</span>
          <CheckCircle2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
