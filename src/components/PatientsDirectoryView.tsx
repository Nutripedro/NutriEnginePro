/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Activity, ArrowRight, Plus, Search, Trash2, UserPlus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PatientRecord } from '../db/prismaClientMock';
import { PatientNutritionInput } from '../engine/types';

interface PatientsDirectoryViewProps {
  onLoadPatientIntoPrescription: (patient: PatientNutritionInput) => void;
  canCreatePatient: boolean;
  canEditPatient: boolean;
  canDeletePatient: boolean;
}

export function PatientsDirectoryView({
  onLoadPatientIntoPrescription,
  canCreatePatient,
  canEditPatient,
  canDeletePatient
}: PatientsDirectoryViewProps) {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [goalFilter, setGoalFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [newPatient, setNewPatient] = useState({
    name: '',
    email: '',
    phone: '',
    age: 30,
    sex: 'female' as 'female' | 'male',
    weightKg: 68,
    heightCm: 165,
    activityLevel: 'moderate',
    goal: 'weight_loss',
    prescribedVETKcal: 1850,
    clinicalNotes: ''
  });

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/nutrition/patients', {
        headers: { 'x-tenant-id': 'CLINIC_DEFAULT' }
      });
      const data = await response.json();
      if (data.success) {
        setPatients(data.patients);
      }
    } catch (err: any) {
      console.error('Erro ao carregar lista de pacientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreatePatient) {
      alert('Acesso Negado: Seu perfil atual não possui permissão para cadastrar pacientes.');
      return;
    }

    try {
      const response = await fetch('/api/nutrition/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'CLINIC_DEFAULT'
        },
        body: JSON.stringify(newPatient)
      });
      const data = await response.json();
      if (data.success) {
        setModalOpen(false);
        fetchPatients();
        alert('Paciente cadastrado com sucesso!');
      }
    } catch (err: any) {
      alert(`Erro ao cadastrar paciente: ${err.message}`);
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (!canDeletePatient) {
      alert('Acesso Negado: Seu perfil não possui permissão para excluir pacientes.');
      return;
    }
    if (!confirm('Deseja realmente remover este paciente?')) return;

    try {
      const response = await fetch(`/api/nutrition/patients/${id}`, {
        method: 'DELETE',
        headers: { 'x-tenant-id': 'CLINIC_DEFAULT' }
      });
      const data = await response.json();
      if (data.success) {
        fetchPatients();
      }
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
    }
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesGoal = goalFilter === 'all' || p.goal === goalFilter;
    return matchesSearch && matchesGoal;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* HEADER DO DIRETÓRIO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Cadastro & Diretório de Pacientes
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestão do cadastro único de pacientes com histórico antropométrico e prescritivo.
          </p>
        </div>

        <button
          onClick={() => {
            if (!canCreatePatient) {
              alert('Acesso Negado: Seu perfil atual não possui permissão para cadastrar pacientes.');
              return;
            }
            setModalOpen(true);
          }}
          className={`px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center gap-1.5 shrink-0 ${
            !canCreatePatient ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800 cursor-pointer'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Novo Paciente</span>
        </button>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'weight_loss', label: 'Emagrecimento' },
            { id: 'hypertrophy', label: 'Hipertrofia' },
            { id: 'clinical_rehab', label: 'Reabilitação' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setGoalFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                goalFilter === tab.id ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABELA DE PACIENTES */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Carregando lista de pacientes...</div>
      ) : filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map(patient => (
            <div key={patient.id} className="p-5 border border-slate-200 rounded-xl bg-white hover:border-emerald-300 transition-all shadow-xs space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{patient.name}</h3>
                  <span className="text-xs text-slate-500 block">{patient.email || 'Sem e-mail cadastrado'}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md uppercase">
                  {patient.goal === 'weight_loss' ? 'Emagrecimento' : patient.goal === 'hypertrophy' ? 'Hipertrofia' : 'Clínico'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg text-center text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Peso</span>
                  <span className="font-bold text-slate-900">{patient.weightKg} kg</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Altura</span>
                  <span className="font-bold text-slate-900">{patient.heightCm} cm</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">VET</span>
                  <span className="font-bold text-emerald-600">{patient.prescribedVETKcal} kcal</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <button
                  onClick={() => {
                    onLoadPatientIntoPrescription({
                      patientId: patient.id,
                      tenantId: patient.tenantId,
                      name: patient.name,
                      age: patient.age,
                      sex: patient.sex,
                      weightKg: patient.weightKg,
                      heightCm: patient.heightCm,
                      activityLevel: patient.activityLevel as any,
                      goal: patient.goal as any,
                      calculationFormula: 'mifflin_st_jeor',
                      getKcal: patient.getKcal,
                      prescribedVETKcal: patient.prescribedVETKcal
                    });
                    alert(`Paciente ${patient.name} carregado no Motor de Prescrição!`);
                  }}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Carregar no Motor 1</span>
                  <ArrowRight className="w-3 h-3 text-emerald-600" />
                </button>

                {canDeletePatient && (
                  <button
                    onClick={() => handleDeletePatient(patient.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                    title="Excluir paciente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2 text-slate-500 text-xs">
          Nenhum paciente encontrado com os filtros selecionados.
        </div>
      )}

      {/* MODAL NOVO PACIENTE */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreatePatient} className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Cadastrar Novo Paciente</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={newPatient.name}
                  onChange={e => setNewPatient({ ...newPatient, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: Ana Clara Souza"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">E-mail</label>
                <input
                  type="email"
                  value={newPatient.email}
                  onChange={e => setNewPatient({ ...newPatient, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="ana@email.com"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={newPatient.phone}
                  onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="(11) 98888-7777"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Idade (Anos)</label>
                <input
                  type="number"
                  required
                  value={newPatient.age}
                  onChange={e => setNewPatient({ ...newPatient, age: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sexo Biológico</label>
                <select
                  value={newPatient.sex}
                  onChange={e => setNewPatient({ ...newPatient, sex: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="female">Feminino</option>
                  <option value="male">Masculino</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newPatient.weightKg}
                  onChange={e => setNewPatient({ ...newPatient, weightKg: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Altura (cm)</label>
                <input
                  type="number"
                  required
                  value={newPatient.heightCm}
                  onChange={e => setNewPatient({ ...newPatient, heightCm: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Objetivo Nutricional</label>
                <select
                  value={newPatient.goal}
                  onChange={e => setNewPatient({ ...newPatient, goal: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="weight_loss">Emagrecimento</option>
                  <option value="hypertrophy">Hipertrofia</option>
                  <option value="clinical_rehab">Reabilitação Clínica</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">VET Prescrito Inicial (kcal)</label>
                <input
                  type="number"
                  value={newPatient.prescribedVETKcal}
                  onChange={e => setNewPatient({ ...newPatient, prescribedVETKcal: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
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
                Salvar Paciente
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
