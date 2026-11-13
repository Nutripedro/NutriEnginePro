/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Activity, ShieldCheck, Sparkles, User, Utensils } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  approvedStatus?: boolean;
  onOpenPdf?: () => void;
}

export function Header({ activeTab, setActiveTab, approvedStatus, onOpenPdf }: HeaderProps) {
  const navItems = [
    { id: 'patient', label: '1. Paciente & GET', icon: User },
    { id: 'macros', label: '2. Macronutrientes', icon: Activity },
    { id: 'meals', label: '3. Refeições', icon: Utensils },
    { id: 'restrictions', label: '4. Alergias & Filtros', icon: ShieldCheck },
    { id: 'generator', label: '5. Gerador IA & Auditoria', icon: Sparkles },
    { id: 'editor', label: '6. Editor & Cardápio', icon: Utensils },
    { id: 'tests', label: '7. Suíte de Testes (15)', icon: ShieldCheck }
  ];

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              N
            </div>
            <div className="whitespace-nowrap shrink-0">
              <span className="text-lg font-bold text-slate-900 tracking-tight">NutriEngine</span>
              <span className="text-xs font-semibold text-emerald-600 ml-1.5 uppercase tracking-wider">Pro</span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            {approvedStatus && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" /> Prescrição Aprovada
              </span>
            )}

            <button
              onClick={onOpenPdf}
              className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm flex items-center gap-1.5"
            >
              Imprimir Prescrição PDF
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="lg:hidden flex items-center gap-1 px-4 py-2 bg-slate-50 border-t border-slate-200 overflow-x-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0 ${
              activeTab === item.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
}
