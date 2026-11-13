/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MealPlan, PatientNutritionInput, PermissionKey, Professional, RolePermissionsMap, UserRole } from '../engine/types';

// =========================================================================
// RUNTIME MULTI-TENANT REPOSITORY & PERSISTENCE ENGINE
// Suporte a Pacientes, Profissionais, Permissões RBAC e Cardápios
// =========================================================================

export interface PatientRecord {
  id: string;
  tenantId: string;
  name: string;
  cpf?: string;
  email?: string;
  phone?: string;
  age: number;
  sex: 'male' | 'female';
  weightKg: number;
  heightCm: number;
  activityLevel: string;
  goal: string;
  getKcal: number;
  prescribedVETKcal: number;
  clinicalNotes?: string;
  createdAt: string;
  deletedAt?: string;
}

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, { label: string; description: string; permissions: PermissionKey[] }> = {
  admin: {
    label: 'Administrador / Gestor',
    description: 'Acesso total à gestão da clínica, profissionais, permissões e auditoria.',
    permissions: [
      'manage_clinic',
      'manage_professionals',
      'manage_permissions',
      'create_patient',
      'edit_patient',
      'delete_patient',
      'prescribe_vet',
      'generate_ai_plan',
      'approve_prescription',
      'export_pdf',
      'view_audit_logs'
    ]
  },
  senior_nutritionist: {
    label: 'Nutricionista Sênior',
    description: 'Pode prescrever VET, gerar cardápios com IA, aprovar prescrições e gerenciar pacientes.',
    permissions: [
      'create_patient',
      'edit_patient',
      'prescribe_vet',
      'generate_ai_plan',
      'approve_prescription',
      'export_pdf'
    ]
  },
  junior_nutritionist: {
    label: 'Nutricionista Júnior',
    description: 'Pode criar pacientes, calcular VET e gerar cardápios rascunho. Aprovação exige supervisor.',
    permissions: [
      'create_patient',
      'edit_patient',
      'prescribe_vet',
      'generate_ai_plan',
      'export_pdf'
    ]
  },
  intern: {
    label: 'Estagiário de Nutrição',
    description: 'Pode visualizar pacientes e elaborar rascunhos sob supervisão.',
    permissions: ['create_patient', 'edit_patient', 'prescribe_vet']
  },
  receptionist: {
    label: 'Recepção / Secretariado',
    description: 'Acesso exclusivo para cadastrar pacientes e agendar consultas.',
    permissions: ['create_patient', 'edit_patient']
  }
};

class NutritionRepository {
  private patients: Map<string, PatientRecord> = new Map();
  private professionals: Map<string, Professional> = new Map();
  private mealPlans: Map<string, MealPlan> = new Map();
  private rolePermissions: Record<UserRole, PermissionKey[]> = {
    admin: [...DEFAULT_ROLE_PERMISSIONS.admin.permissions],
    senior_nutritionist: [...DEFAULT_ROLE_PERMISSIONS.senior_nutritionist.permissions],
    junior_nutritionist: [...DEFAULT_ROLE_PERMISSIONS.junior_nutritionist.permissions],
    intern: [...DEFAULT_ROLE_PERMISSIONS.intern.permissions],
    receptionist: [...DEFAULT_ROLE_PERMISSIONS.receptionist.permissions]
  };
  private auditLogs: Array<{ id: string; tenantId: string; action: string; timestamp: string }> = [];

  constructor() {
    // Seed initial demo patient for Tenant 'CLINIC_DEFAULT'
    this.savePatient({
      patientId: 'PATIENT_001',
      tenantId: 'CLINIC_DEFAULT',
      name: 'Maria Silva',
      age: 32,
      sex: 'female',
      weightKg: 68,
      heightCm: 165,
      activityLevel: 'moderate',
      goal: 'weight_loss',
      calculationFormula: 'mifflin_st_jeor',
      getKcal: 2150,
      prescribedVETKcal: 1850
    });

    this.savePatient({
      patientId: 'PATIENT_002',
      tenantId: 'CLINIC_DEFAULT',
      name: 'Carlos Eduardo Oliveira',
      age: 28,
      sex: 'male',
      weightKg: 82,
      heightCm: 178,
      activityLevel: 'heavy',
      goal: 'hypertrophy',
      calculationFormula: 'mifflin_st_jeor',
      getKcal: 2850,
      prescribedVETKcal: 3100
    });

    this.savePatient({
      patientId: 'PATIENT_003',
      tenantId: 'CLINIC_DEFAULT',
      name: 'Fernanda Santos',
      age: 45,
      sex: 'female',
      weightKg: 74,
      heightCm: 160,
      activityLevel: 'light',
      goal: 'clinical_rehab',
      calculationFormula: 'mifflin_st_jeor',
      getKcal: 1900,
      prescribedVETKcal: 1650
    });

    // Seed initial professionals
    this.saveProfessional({
      id: 'PROF_001',
      tenantId: 'CLINIC_DEFAULT',
      name: 'Dr. André Pedro',
      crn: 'CRN-3 / 48291',
      email: 'a.pedro@nutriengine.com',
      phone: '(11) 98765-4321',
      role: 'admin',
      specialization: 'Nutrição Esportiva e Metabólica',
      active: true,
      createdAt: new Date().toISOString()
    });

    this.saveProfessional({
      id: 'PROF_002',
      tenantId: 'CLINIC_DEFAULT',
      name: 'Dra. Juliana Lima',
      crn: 'CRN-3 / 51204',
      email: 'j.lima@nutriengine.com',
      phone: '(11) 97654-3210',
      role: 'senior_nutritionist',
      specialization: 'Nutrição Clínica & APLV',
      active: true,
      createdAt: new Date().toISOString()
    });

    this.saveProfessional({
      id: 'PROF_003',
      tenantId: 'CLINIC_DEFAULT',
      name: 'Lucas Santos',
      crn: 'Estagiário CRN-3',
      email: 'l.santos@nutriengine.com',
      phone: '(11) 96543-2109',
      role: 'intern',
      specialization: 'Estágio em Nutrição Clínica',
      active: true,
      createdAt: new Date().toISOString()
    });
  }

  // --- PATIENT DIRECTORY CRUD ---
  public savePatient(input: Partial<PatientNutritionInput> & { name?: string; patientId?: string; tenantId: string; email?: string; phone?: string; clinicalNotes?: string }): PatientRecord {
    const id = input.patientId || `PATIENT_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const existing = this.getPatient(input.tenantId, id);

    const record: PatientRecord = {
      id,
      tenantId: input.tenantId,
      name: input.name || existing?.name || 'Paciente Cadastrado',
      email: input.email || existing?.email,
      phone: input.phone || existing?.phone,
      age: input.age ?? existing?.age ?? 30,
      sex: input.sex || existing?.sex || 'female',
      weightKg: input.weightKg ?? existing?.weightKg ?? 70,
      heightCm: input.heightCm ?? existing?.heightCm ?? 165,
      activityLevel: input.activityLevel || existing?.activityLevel || 'moderate',
      goal: input.goal || existing?.goal || 'weight_loss',
      getKcal: input.getKcal ?? existing?.getKcal ?? 2000,
      prescribedVETKcal: input.prescribedVETKcal ?? existing?.prescribedVETKcal ?? 1800,
      clinicalNotes: input.clinicalNotes || existing?.clinicalNotes,
      createdAt: existing?.createdAt || new Date().toISOString()
    };

    this.patients.set(`${input.tenantId}:${id}`, record);
    this.logAudit(input.tenantId, `PATIENT_SAVE:${id}`);
    return record;
  }

  public getPatient(tenantId: string, patientId: string): PatientRecord | undefined {
    const record = this.patients.get(`${tenantId}:${patientId}`);
    if (record && record.deletedAt) return undefined;
    return record;
  }

  public listPatients(tenantId: string): PatientRecord[] {
    const results: PatientRecord[] = [];
    for (const [key, val] of this.patients.entries()) {
      if (key.startsWith(`${tenantId}:`) && !val.deletedAt) {
        results.push(val);
      }
    }
    return results;
  }

  public deletePatient(tenantId: string, patientId: string): boolean {
    const record = this.getPatient(tenantId, patientId);
    if (!record) return false;
    record.deletedAt = new Date().toISOString();
    this.patients.set(`${tenantId}:${patientId}`, record);
    this.logAudit(tenantId, `PATIENT_DELETE:${patientId}`);
    return true;
  }

  // --- PROFESSIONALS DIRECTORY CRUD ---
  public saveProfessional(prof: Partial<Professional> & { tenantId: string; name: string }): Professional {
    const id = prof.id || `PROF_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const record: Professional = {
      id,
      tenantId: prof.tenantId,
      name: prof.name,
      crn: prof.crn || 'CRN Pendente',
      email: prof.email || '',
      phone: prof.phone || '',
      role: prof.role || 'junior_nutritionist',
      specialization: prof.specialization || 'Nutrição Geral',
      active: prof.active !== undefined ? prof.active : true,
      createdAt: prof.createdAt || new Date().toISOString()
    };

    this.professionals.set(`${prof.tenantId}:${id}`, record);
    this.logAudit(prof.tenantId, `PROFESSIONAL_SAVE:${id}`);
    return record;
  }

  public getProfessional(tenantId: string, id: string): Professional | undefined {
    return this.professionals.get(`${tenantId}:${id}`);
  }

  public listProfessionals(tenantId: string): Professional[] {
    const results: Professional[] = [];
    for (const [key, val] of this.professionals.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        results.push(val);
      }
    }
    return results;
  }

  public deleteProfessional(tenantId: string, id: string): boolean {
    const key = `${tenantId}:${id}`;
    if (!this.professionals.has(key)) return false;
    this.professionals.delete(key);
    this.logAudit(tenantId, `PROFESSIONAL_DELETE:${id}`);
    return true;
  }

  // --- RBAC PERMISSIONS MATRIX ---
  public getRolePermissions(): RolePermissionsMap[] {
    const roles: UserRole[] = ['admin', 'senior_nutritionist', 'junior_nutritionist', 'intern', 'receptionist'];
    return roles.map(role => ({
      role,
      label: DEFAULT_ROLE_PERMISSIONS[role].label,
      description: DEFAULT_ROLE_PERMISSIONS[role].description,
      permissions: this.rolePermissions[role] || []
    }));
  }

  public updateRolePermissions(role: UserRole, permissions: PermissionKey[]): PermissionKey[] {
    this.rolePermissions[role] = permissions;
    return permissions;
  }

  public checkPermission(role: UserRole, permission: PermissionKey): boolean {
    const current = this.rolePermissions[role] || [];
    return current.includes(permission);
  }

  // --- MEAL PLAN ENGINES & VERSION CONTROL ---
  public saveMealPlan(plan: MealPlan): MealPlan {
    const existing = this.getMealPlan(plan.tenantId, plan.id);
    let version = plan.version || 1;

    if (existing) {
      version = existing.version + 1;
    }

    const updatedPlan: MealPlan = {
      ...plan,
      version,
      updatedAt: new Date().toISOString()
    };

    this.mealPlans.set(`${plan.tenantId}:${plan.id}`, updatedPlan);
    this.logAudit(plan.tenantId, `MEAL_PLAN_UPSERT:${plan.id}:v${version}`);
    return updatedPlan;
  }

  public getMealPlan(tenantId: string, planId: string): MealPlan | undefined {
    return this.mealPlans.get(`${tenantId}:${planId}`);
  }

  public approveMealPlan(tenantId: string, planId: string): MealPlan {
    const plan = this.getMealPlan(tenantId, planId);
    if (!plan) {
      throw new Error(`Plano alimentar não encontrado para a clínica ${tenantId}.`);
    }

    const approvedPlan: MealPlan = {
      ...plan,
      status: 'approved',
      updatedAt: new Date().toISOString()
    };

    this.mealPlans.set(`${tenantId}:${planId}`, approvedPlan);
    this.logAudit(tenantId, `MEAL_PLAN_APPROVE:${planId}`);
    return approvedPlan;
  }

  private logAudit(tenantId: string, action: string) {
    this.auditLogs.push({
      id: `AUDIT_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tenantId,
      action,
      timestamp: new Date().toISOString()
    });
  }

  public getAuditLogs(tenantId: string) {
    return this.auditLogs.filter(log => log.tenantId === tenantId);
  }
}

export const dbRepository = new NutritionRepository();
