/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileText, Printer, ShieldCheck, X } from 'lucide-react';
import { MealPlan, PatientNutritionInput } from '../engine/types';

interface PdfPrescriptionModalProps {
  plan: MealPlan;
  patient: PatientNutritionInput;
  isOpen: boolean;
  onClose: () => void;
}

export function PdfPrescriptionModal({ plan, patient, isOpen, onClose }: PdfPrescriptionModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 relative print:shadow-none print:border-none print:max-w-none print:p-0">
        {/* Action bar for screen */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Documento Oficial de Prescrição Nutricional</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Imprimir ou Salvar PDF
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRESCRIPTION DOCUMENT BODY */}
        <div className="space-y-6 font-sans text-slate-900">
          {/* Header da Clínica */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">NUTRIENGINE CLINICAL SAAS</h1>
              <p className="text-xs text-slate-500 font-medium">Clínica de Nutrição Clínica & Esportiva · Dr. Responsável CRN-3 / 48291</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Prescrição Auditada pelo Motor 1
              </span>
              <div className="text-[11px] text-slate-400 mt-1">Data: {new Date().toLocaleDateString('pt-BR')}</div>
            </div>
          </div>

          {/* Dados do Paciente e Antropometria */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Paciente:</span>
              <span className="font-bold text-slate-900 text-sm">{patient.name || 'Maria Silva'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Idade / Sexo:</span>
              <span className="font-semibold text-slate-900">{patient.age} anos · {patient.sex === 'female' ? 'Feminino' : 'Masculino'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Peso / Altura:</span>
              <span className="font-semibold text-slate-900">{patient.weightKg} kg · {patient.heightCm} cm</span>
            </div>
            <div>
              <span className="text-slate-500 block">VET Prescrito:</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">{plan.dailyTarget.energyKcal} kcal</span>
            </div>
          </div>

          {/* Resumo de Macronutrientes Prescritos */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-900 uppercase block">Carboidratos Meta</span>
              <span className="text-lg font-mono font-bold text-emerald-700">{plan.dailyTarget.carbohydratesG} g</span>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-[11px] font-bold text-blue-900 uppercase block">Proteínas Meta</span>
              <span className="text-lg font-mono font-bold text-blue-700">{plan.dailyTarget.proteinG} g</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <span className="text-[11px] font-bold text-amber-900 uppercase block">Lipídios Meta</span>
              <span className="text-lg font-mono font-bold text-amber-700">{plan.dailyTarget.lipidsG} g</span>
            </div>
          </div>

          {/* REFEIÇÕES DO PLANO */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
              Plano Alimentar Individualizado ({plan.planName})
            </h3>

            {plan.meals.map((meal, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 flex justify-between items-center text-xs font-bold text-slate-900">
                  <span>{meal.mealName} ({meal.time || '08:00'})</span>
                  <span className="font-mono text-emerald-700">{meal.totals.energyKcal} kcal</span>
                </div>
                <div className="p-3 divide-y divide-slate-100 text-xs">
                  {meal.foods.map((food, fIdx) => (
                    <div key={fIdx} className="py-1.5 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-slate-900">{food.name}</span>
                        <span className="text-slate-500 text-[11px] block">{food.householdMeasureSelected} · {food.preparation}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-800">{food.quantityGrams} g</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Observações Clínicas e Assinatura */}
          {plan.clinicalObservations && plan.clinicalObservations.length > 0 && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
              <span className="font-bold block text-slate-900">Orientação Clínica Nutricional:</span>
              {plan.clinicalObservations.map((obs, i) => (
                <p key={i}>• {obs}</p>
              ))}
            </div>
          )}

          <div className="pt-8 border-t border-slate-300 flex justify-between items-end text-xs text-slate-500">
            <div>
              <span>NutriEngine Pro · Motor Determinístico Nutricional</span>
              <span className="block text-[10px]">Documento gerado e validado matematicamente.</span>
            </div>
            <div className="text-center border-t border-slate-400 pt-2 min-w-[200px]">
              <span className="font-bold text-slate-900 block">Assinatura do Nutricionista</span>
              <span className="text-[10px]">CRN-3 / Validação Eletrônica</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
