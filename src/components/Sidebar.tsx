/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Activity,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  UserPlus,
  Users,
  Utensils,
  X
} from 'lucide-react';
import { PermissionKey, UserRole } from '../engine/types';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  hasPermission: (perm: PermissionKey) => boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({
  activeSection,
  setActiveSection,
  activeRole,
  setActiveRole,
  hasPermission,
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed
}: SidebarProps) {
  const roleLabels: Record<UserRole, string> = {
    admin: 'Administrador / Gestor',
    senior_nutritionist: 'Nutricionista Sênior',
    junior_nutritionist: 'Nutricionista Júnior',
    intern: 'Estagiário de Nutrição',
    receptionist: 'Recepção / Secretariado'
  };

  const navGroups = [
    {
      title: 'MOTOR DE PRESCRIÇÃO',
      items: [
        { id: 'patient', label: '1. Paciente & GET', icon: User, perm: 'create_patient' as PermissionKey },
        { id: 'macros', label: '2. Macronutrientes', icon: Activity, perm: 'prescribe_vet' as PermissionKey },
        { id: 'meals', label: '3. Refeições', icon: Utensils, perm: 'prescribe_vet' as PermissionKey },
        { id: 'restrictions', label: '4. Alergias & Filtros', icon: ShieldCheck, perm: 'prescribe_vet' as PermissionKey },
        { id: 'generator', label: '5. Gerador IA & Auditoria', icon: Sparkles, perm: 'generate_ai_plan' as PermissionKey },
        { id: 'editor', label: '6. Editor de Cardápio', icon: Utensils, perm: 'prescribe_vet' as PermissionKey }
      ]
    },
    {
      title: 'DIRETÓRIO & GESTÃO DA CLÍNICA',
      items: [
        { id: 'patients_directory', label: 'Cadastro de Pacientes', icon: UserPlus, perm: 'create_patient' as PermissionKey },
        { id: 'professionals_directory', label: 'Cadastro de Profissionais', icon: Users, perm: 'manage_professionals' as PermissionKey },
        { id: 'permissions_config', label: 'Configuração de Permissões', icon: KeyRound, perm: 'manage_permissions' as PermissionKey },
        { id: 'tests', label: 'Suíte de Testes (15)', icon: ShieldCheck, perm: null }
      ]
    }
  ];

  return (
    <>
      {/* BOTÃO MOBILE HAMBÚRGUER */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2.5 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-slate-800 transition-colors"
        aria-label="Abrir Menu Lateral"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* OVERLAY BACKDROP EM DISPOSITIVOS MÓVEIS */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* SIDEBAR RETRÁTIL & REPULSIVA */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-50 bg-slate-950 text-slate-100 flex flex-col border-r border-slate-800 transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-72'} w-72 shrink-0`}
      >
        {/* HEADER DA SIDEBAR */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shrink-0">
              N
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="font-bold text-white text-base tracking-tight block">NutriEngine</span>
                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block">Clinical SaaS Pro</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Botão para encolher/expandir no desktop */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title={isCollapsed ? 'Expandir Menu' : 'Encolher Menu'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Fechar no mobile */}
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SELETOR DE PERFIL / CARGO RBAC (SIMULAÇÃO DE PERMISSÕES) */}
        {!isCollapsed && (
          <div className="p-3 bg-slate-900/80 mx-3 my-3 rounded-xl border border-slate-800">
            <label className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Perfil de Usuário Ativo
            </label>
            <select
              value={activeRole}
              onChange={e => setActiveRole(e.target.value as UserRole)}
              className="w-full bg-slate-950 text-white text-xs font-semibold px-2.5 py-1.5 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="admin">Administrador / Gestor</option>
              <option value="senior_nutritionist">Nutricionista Sênior</option>
              <option value="junior_nutritionist">Nutricionista Júnior</option>
              <option value="intern">Estagiário de Nutrição</option>
              <option value="receptionist">Recepção / Secretariado</option>
            </select>
          </div>
        )}

        {/* LISTA DE NAVEGAÇÃO */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {group.title}
                </div>
              )}

              {group.items.map(item => {
                const Icon = item.icon;
                const isSelected = activeSection === item.id;
                const isAllowed = item.perm === null || hasPermission(item.perm);

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (!isAllowed) {
                        alert(`Acesso Restrito: O seu perfil atual (${roleLabels[activeRole]}) não possui a permissão '${item.perm}' para acessar esta seção.`);
                        return;
                      }
                      setActiveSection(item.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                        : isAllowed
                        ? 'text-slate-300 hover:bg-slate-900 hover:text-white'
                        : 'text-slate-600 bg-slate-900/30 opacity-60 cursor-not-allowed'
                    }`}
                    title={!isAllowed ? `Bloqueado para ${roleLabels[activeRole]}` : item.label}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                    {!isAllowed && !isCollapsed && (
                      <span className="ml-auto text-[9px] font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md">
                        Bloqueado
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* FOOTER DA SIDEBAR */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400">
          {!isCollapsed ? (
            <div className="flex items-center justify-between">
              <span>Tenant: <strong className="text-white">CLINIC_DEFAULT</strong></span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                LGPD OK
              </span>
            </div>
          ) : (
            <div className="text-center font-bold text-slate-500 text-[10px]">v2.0</div>
          )}
        </div>
      </aside>
    </>
  );
}
