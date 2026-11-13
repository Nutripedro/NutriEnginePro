/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shield, Trash2, UserPlus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Professional, UserRole } from '../engine/types';

interface ProfessionalsDirectoryViewProps {
  canManageProfessionals: boolean;
}

export function ProfessionalsDirectoryView({ canManageProfessionals }: ProfessionalsDirectoryViewProps) {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [newProf, setNewProf] = useState({
    name: '',
    crn: '',
    email: '',
    phone: '',
    role: 'senior_nutritionist' as UserRole,
    specialization: 'Nutrição Clínica Geral',
    active: true
  });

  const roleLabels: Record<UserRole, string> = {
    admin: 'Administrador / Gestor',
    senior_nutritionist: 'Nutricionista Sênior',
    junior_nutritionist: 'Nutricionista Júnior',
    intern: 'Estagiário de Nutrição',
    receptionist: 'Recepção / Secretariado'
  };

  const fetchProfessionals = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/nutrition/professionals', {
        headers: { 'x-tenant-id': 'CLINIC_DEFAULT' }
      });
      const data = await response.json();
      if (data.success) {
        setProfessionals(data.professionals);
      }
    } catch (err: any) {
      console.error('Erro ao buscar profissionais:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const handleCreateProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageProfessionals) {
      alert('Acesso Negado: Seu perfil atual não possui a permissão para gerenciar a equipe de profissionais.');
      return;
    }

    try {
      const response = await fetch('/api/nutrition/professionals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'CLINIC_DEFAULT'
        },
        body: JSON.stringify(newProf)
      });
      const data = await response.json();
      if (data.success) {
        setModalOpen(false);
        fetchProfessionals();
        alert('Profissional cadastrado com sucesso!');
      }
    } catch (err: any) {
      alert(`Erro ao cadastrar profissional: ${err.message}`);
    }
  };

  const handleDeleteProfessional = async (id: string) => {
    if (!canManageProfessionals) {
      alert('Acesso Negado: Seu perfil não possui permissão para remover profissionais.');
      return;
    }
    if (!confirm('Deseja realmente remover este profissional da equipe?')) return;

    try {
      const response = await fetch(`/api/nutrition/professionals/${id}`, {
        method: 'DELETE',
        headers: { 'x-tenant-id': 'CLINIC_DEFAULT' }
      });
      const data = await response.json();
      if (data.success) {
        fetchProfessionals();
      }
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Cadastro de Profissionais & Equipe Clínica
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestão de nutricionistas, médicos, estagiários e secretariado da clínica com controle de atribuições.
          </p>
        </div>

        <button
          onClick={() => {
            if (!canManageProfessionals) {
              alert('Acesso Negado: Seu perfil atual não possui a permissão "manage_professionals".');
              return;
            }
            setModalOpen(true);
          }}
          className={`px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center gap-1.5 shrink-0 ${
            !canManageProfessionals ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800 cursor-pointer'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Profissional</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Carregando lista de profissionais...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {professionals.map(prof => (
            <div key={prof.id} className="p-5 border border-slate-200 rounded-xl bg-white space-y-3 shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{prof.name}</h3>
                  <span className="text-xs font-mono font-semibold text-emerald-600 block">{prof.crn}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                  prof.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {prof.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-900">{roleLabels[prof.role] || prof.role}</span>
                </div>
                <div className="text-slate-500">{prof.specialization}</div>
                <div className="text-slate-500 font-mono text-[11px]">{prof.email} · {prof.phone}</div>
              </div>

              {canManageProfessionals && (
                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => handleDeleteProfessional(prof.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                    title="Excluir profissional"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL NOVO PROFISSIONAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateProfessional} className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Cadastrar Novo Profissional</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={newProf.name}
                  onChange={e => setNewProf({ ...newProf, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: Dra. Juliana Lima"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Inscrição Profissional (CRN/CRM)</label>
                <input
                  type="text"
                  required
                  value={newProf.crn}
                  onChange={e => setNewProf({ ...newProf, crn: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  placeholder="Ex: CRN-3 / 51204"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cargo / Perfil RBAC</label>
                <select
                  value={newProf.role}
                  onChange={e => setNewProf({ ...newProf, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="admin">Administrador / Gestor</option>
                  <option value="senior_nutritionist">Nutricionista Sênior</option>
                  <option value="junior_nutritionist">Nutricionista Júnior</option>
                  <option value="intern">Estagiário de Nutrição</option>
                  <option value="receptionist">Recepção / Secretariado</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">E-mail Profissional</label>
                <input
                  type="email"
                  value={newProf.email}
                  onChange={e => setNewProf({ ...newProf, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="juliana@nutriengine.com"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={newProf.phone}
                  onChange={e => setNewProf({ ...newProf, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="(11) 97654-3210"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Especialização / Área de Atuação</label>
                <input
                  type="text"
                  value={newProf.specialization}
                  onChange={e => setNewProf({ ...newProf, specialization: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Ex: Nutrição Esportiva e Esportes de Alta Performance"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Salvar Profissional
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
