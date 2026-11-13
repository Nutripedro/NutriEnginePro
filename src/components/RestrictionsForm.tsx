/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertOctagon, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ALLERGEN_LABELS, INTOLERANCE_LABELS } from '../engine/allergyRules';
import { AllergenType, DietaryPattern, FoodRestriction, IntoleranceType } from '../engine/types';

interface RestrictionsFormProps {
  restrictions: FoodRestriction;
  onChange: (updated: FoodRestriction) => void;
  onNext: () => void;
  onBack: () => void;
}

const ALLERGEN_OPTIONS: AllergenType[] = [
  'milk',
  'egg',
  'peanut',
  'tree_nuts',
  'soy',
  'wheat_gluten',
  'fish',
  'crustaceans'
];

const INTOLERANCE_OPTIONS: IntoleranceType[] = ['lactose', 'fructose', 'histamine', 'fodmap'];

const DIETARY_PATTERNS: { id: DietaryPattern; label: string; desc: string }[] = [
  { id: 'omnivore', label: 'Onívoro', desc: 'Sem restrições de origem animal' },
  { id: 'vegetarian', label: 'Vegetariano', desc: 'Exclui carnes e peixes' },
  { id: 'lacto_ovo_vegetarian', label: 'Ovolactovegetariano', desc: 'Permite ovos, leite e derivados' },
  { id: 'vegan', label: 'Vegano Strict', desc: 'Exclui 100% de ingredientes de origem animal' },
  { id: 'pescatarian', label: 'Pescetariano', desc: 'Exclui carnes vermelhas e aves; permite peixes' },
  { id: 'low_carb', label: 'Low Carb', desc: 'Restrição relativa de carboidratos' }
];

export function RestrictionsForm({ restrictions, onChange, onNext, onBack }: RestrictionsFormProps) {
  const toggleAllergen = (allergen: AllergenType) => {
    const current = restrictions.allergies || [];
    const updated = current.includes(allergen)
      ? current.filter(a => a !== allergen)
      : [...current, allergen];
    onChange({ ...restrictions, allergies: updated });
  };

  const toggleIntolerance = (intolerance: IntoleranceType) => {
    const current = restrictions.intolerances || [];
    const updated = current.includes(intolerance)
      ? current.filter(i => i !== intolerance)
      : [...current, intolerance];
    onChange({ ...restrictions, intolerances: updated });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">4. Alergias & Restrições Alimentares Inteligentes</h2>
          <p className="text-sm text-slate-500 mt-1">
            Regra de Segurança Rígida: Alergias declaradas bloqueiam automaticamente a seleção e acionam verificação de contaminação cruzada.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-md flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5" /> Bloqueio Obrigatório
        </span>
      </div>

      {/* SEÇÃO 1: ALERGIAS ALIMENTARES */}
      <div>
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-red-600" /> Alergias Confirmadas (Bloqueio Absoluto)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ALLERGEN_OPTIONS.map(allergen => {
            const isSelected = (restrictions.allergies || []).includes(allergen);
            return (
              <button
                type="button"
                key={allergen}
                onClick={() => toggleAllergen(allergen)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-red-500 bg-red-50/80 text-red-900 font-semibold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs">{ALLERGEN_LABELS[allergen]}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {isSelected ? '✓ Bloqueado pelo sistema' : 'Clique para marcar'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SEÇÃO 2: INTOLERÂNCIAS */}
      <div>
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          Intolerâncias & Sensibilidades Fisiológicas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {INTOLERANCE_OPTIONS.map(intolerance => {
            const isSelected = (restrictions.intolerances || []).includes(intolerance);
            return (
              <button
                type="button"
                key={intolerance}
                onClick={() => toggleIntolerance(intolerance)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/80 text-amber-900 font-semibold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs">{INTOLERANCE_LABELS[intolerance]}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SEÇÃO 3: PADRÃO ALIMENTAR */}
      <div>
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          Padrão Alimentar Prescrito
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {DIETARY_PATTERNS.map(pattern => {
            const isSelected = restrictions.dietaryPattern === pattern.id;
            return (
              <button
                type="button"
                key={pattern.id}
                onClick={() => onChange({ ...restrictions, dietaryPattern: pattern.id })}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold">{pattern.label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{pattern.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2"
        >
          <span>Avançar para Gerador IA & Auditoria</span>
          <CheckCircle2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
