/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Check, KeyRound, Lock, ShieldCheck, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PermissionKey, RolePermissionsMap, UserRole } from '../engine/types';

interface PermissionsConfigViewProps {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  canManagePermissions: boolean;
}

const ALL_PERMISSIONS: { key: PermissionKey; label: string; description: string }[] = [
  { key: 'create_patient', label: 'Cadastrar Pacientes', description: 'Permite incluir novos pacientes no diretório da clínica' },
  { key: 'edit_patient', label: 'Editar Dados de Pacientes', description: 'Permite alterar ficha antropométrica e contatos' },
  { key: 'delete_patient', label: 'Excluir Pacientes', description: 'Permite remover registros do banco de dados' },
  { key: 'prescribe_vet', label: 'Calcular & Prescrever VET/Macros', description: 'Permite usar o Motor 1 para definir metas energéticas' },
  { key: 'generate_ai_plan', label: 'Gerar Cardápios com IA (Motor 2)', description: 'Permite acionar a geração e auditoria automática' },
  { key: 'approve_prescription', label: 'Aprovar Prescrição Oficial', description: 'Permite validar o cardápio como prescrição clínica final' },
  { key: 'export_pdf', label: 'Exportar PDF de Prescrição', description: 'Permite gerar o documento oficial de prescrição' },
  { key: 'manage_professionals', label: 'Gerenciar Equipe de Profissionais', description: 'Permite cadastrar e remover membros da equipe' },
  { key: 'manage_permissions', label: 'Configurar Matriz de Permissões (RBAC)', description: 'Permite alterar a matriz de direitos da clínica' },
  { key: 'view_audit_logs', label: 'Visualizar Logs de Auditoria LGPD', description: 'Permite consultar logs de ações multi-tenant' },
  { key: 'manage_clinic', label: 'Gestão da Clínica & Faturamento', description: 'Acesso às configurações gerais da empresa' }
];

export function PermissionsConfigView({ activeRole, setActiveRole, canManagePermissions }: PermissionsConfigViewProps) {
  const [permissionsMaps, setPermissionsMaps] = useState<RolePermissionsMap[]>([]);
  const [loading, setLoading] = useState(true);

  const roleLabels: Record<UserRole, string> = {
    admin: 'Administrador',
    senior_nutritionist: 'Nutri Sênior',
    junior_nutritionist: 'Nutri Júnior',
    intern: 'Estagiário',
    receptionist: 'Recepção'
  };

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/nutrition/permissions');
      const data = await response.json();
      if (data.success) {
        setPermissionsMaps(data.permissionsMap);
      }
    } catch (err: any) {
      console.error('Erro ao buscar permissões:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleTogglePermission = async (role: UserRole, permKey: PermissionKey) => {
    if (!canManagePermissions) {
      alert('Acesso Negado: Seu perfil atual não possui a permissão "manage_permissions" para alterar a matriz de segurança.');
      return;
    }

    const currentRoleMap = permissionsMaps.find(m => m.role === role);
    if (!currentRoleMap) return;

    const currentPerms = currentRoleMap.permissions;
    const isGranted = currentPerms.includes(permKey);
    const updatedPerms = isGranted ? currentPerms.filter(p => p !== permKey) : [...currentPerms, permKey];

    // Atualização otimista
    setPermissionsMaps(prev =>
      prev.map(m => (m.role === role ? { ...m, permissions: updatedPerms } : m))
    );

    try {
      await fetch('/api/nutrition/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, permissions: updatedPerms })
      });
    } catch (err: any) {
      alert(`Erro ao salvar permissão: ${err.message}`);
      fetchPermissions();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-600" />
            Configuração de Permissões & Matriz RBAC
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Controle de Acesso Baseado em Funções (RBAC) com granularidade por ação e perfil de usuário.
          </p>
        </div>

        {/* TESTADOR DE CARGO EM TEMPO REAL */}
        <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center gap-3 shrink-0">
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <div className="text-xs">
            <span className="text-slate-400 block text-[10px]">Testar Interface Como:</span>
            <select
              value={activeRole}
              onChange={e => setActiveRole(e.target.value as UserRole)}
              className="bg-slate-950 text-white font-bold border border-slate-700 rounded-md px-2 py-1 text-xs focus:ring-2 focus:ring-emerald-400"
            >
              <option value="admin">Administrador / Gestor</option>
              <option value="senior_nutritionist">Nutricionista Sênior</option>
              <option value="junior_nutritionist">Nutricionista Júnior</option>
              <option value="intern">Estagiário de Nutrição</option>
              <option value="receptionist">Recepção / Secretariado</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Carregando matriz de permissões...</div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white border-b border-slate-800">
                <th className="p-3 font-bold uppercase tracking-wider text-[11px] w-1/3">Ação / Permissão Granular</th>
                {(['admin', 'senior_nutritionist', 'junior_nutritionist', 'intern', 'receptionist'] as UserRole[]).map(role => (
                  <th key={role} className="p-3 text-center font-bold uppercase tracking-wider text-[10px]">
                    <div className="whitespace-nowrap">{roleLabels[role]}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ALL_PERMISSIONS.map(perm => (
                <tr key={perm.key} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{perm.label}</div>
                    <div className="text-[10px] text-slate-500">{perm.description}</div>
                  </td>

                  {(['admin', 'senior_nutritionist', 'junior_nutritionist', 'intern', 'receptionist'] as UserRole[]).map(role => {
                    const roleMap = permissionsMaps.find(m => m.role === role);
                    const isChecked = roleMap?.permissions.includes(perm.key) ?? false;

                    return (
                      <td key={role} className="p-3 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(role, perm.key)}
                          disabled={!canManagePermissions}
                          className={`w-6 h-6 rounded-md inline-flex items-center justify-center transition-all ${
                            isChecked
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                          } ${!canManagePermissions ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                          title={isChecked ? 'Permissão Concedida' : 'Permissão Negada'}
                        >
                          {isChecked ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3 text-slate-400" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
