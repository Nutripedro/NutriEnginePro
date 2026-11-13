/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { ClinicalTestRunner } from './components/ClinicalTestRunner';
import { Header } from './components/Header';
import { MacroDistributionForm } from './components/MacroDistributionForm';
import { MealDistributionForm } from './components/MealDistributionForm';
import { MealPlanEditor } from './components/MealPlanEditor';
import { MealPlanGeneratorView } from './components/MealPlanGeneratorView';
import { PatientProfileForm } from './components/PatientProfileForm';
import { PatientsDirectoryView } from './components/PatientsDirectoryView';
import { PdfPrescriptionModal } from './components/PdfPrescriptionModal';
import { PermissionsConfigView } from './components/PermissionsConfigView';
import { ProfessionalsDirectoryView } from './components/ProfessionalsDirectoryView';
import { RestrictionsForm } from './components/RestrictionsForm';
import { Sidebar } from './components/Sidebar';
import { calculateBMRAndGET, calculateMacroTargets, calculateMealDistribution } from './engine/nutritionMath';
import {
  FoodRestriction,
  MacroInput,
  MealPlan,
  NutritionValidationResult,
  PatientNutritionInput,
  PermissionKey,
  RolePermissionsMap,
  SingleMealDistributionInput,
  UserRole
} from './engine/types';

export default function App() {
  const [activeSection, setActiveSection] = useState<string>('patient');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // RBAC State
  const [activeRole, setActiveRole] = useState<UserRole>('admin');
  const [permissionsMaps, setPermissionsMaps] = useState<RolePermissionsMap[]>([]);

  // Fetch permissions from API
  const fetchPermissionsMap = async () => {
    try {
      const response = await fetch('/api/nutrition/permissions');
      const data = await response.json();
      if (data.success) {
        setPermissionsMaps(data.permissionsMap);
      }
    } catch (err: any) {
      console.error('Error fetching permissions:', err);
    }
  };

  useEffect(() => {
    fetchPermissionsMap();
  }, []);

  // Helper check permission
  const hasPermission = (permKey: PermissionKey): boolean => {
    const roleMap = permissionsMaps.find(m => m.role === activeRole);
    if (!roleMap) return activeRole === 'admin'; // fallback
    return roleMap.permissions.includes(permKey);
  };

  // State 1: Paciente Ativo no Motor de Prescrição
  const [patient, setPatient] = useState<PatientNutritionInput>({
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

  // State 2: Macronutrientes
  const [macroInput, setMacroInput] = useState<MacroInput>({
    calculationType: 'percentage',
    carbsPercentage: 50,
    proteinPercentage: 20,
    lipidsPercentage: 30
  });

  // State 3: Distribuição de Refeições
  const [meals, setMeals] = useState<SingleMealDistributionInput[]>([
    { id: 'm1', name: 'Café da Manhã', percentage: 20, time: '08:00' },
    { id: 'm2', name: 'Lanche da Manhã', percentage: 10, time: '10:30' },
    { id: 'm3', name: 'Almoço', percentage: 35, time: '13:00' },
    { id: 'm4', name: 'Lanche da Tarde', percentage: 15, time: '16:30' },
    { id: 'm5', name: 'Jantar', percentage: 20, time: '20:00' }
  ]);

  // State 4: Restrições & Alergias
  const [restrictions, setRestrictions] = useState<FoodRestriction>({
    allergies: [],
    intolerances: [],
    dietaryPattern: 'omnivore',
    dislikedFoods: [],
    favoriteFoods: []
  });

  // State 5 & 6: Cardápio Gerado & Validação
  const [currentPlan, setCurrentPlan] = useState<MealPlan | null>(null);
  const [validationResult, setValidationResult] = useState<NutritionValidationResult | null>(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  // Computes
  const { getKcal } = calculateBMRAndGET(patient);
  const macroTargets = calculateMacroTargets(patient.prescribedVETKcal, macroInput, patient.weightKg);
  const mealDistributions = calculateMealDistribution(patient.prescribedVETKcal, macroTargets, meals).meals;

  const handlePlanGenerated = (plan: MealPlan, validation: NutritionValidationResult) => {
    setCurrentPlan(plan);
    setValidationResult(validation);
  };

  const handleUpdatePlanInEditor = (updatedPlan: MealPlan, validation: NutritionValidationResult) => {
    setCurrentPlan(updatedPlan);
    setValidationResult(validation);
  };

  const handleApprovePlan = async (planId: string) => {
    if (!hasPermission('approve_prescription')) {
      alert('Acesso Negado: O seu perfil atual não possui permissão para aprovar prescrições técnicas.');
      return;
    }

    try {
      const response = await fetch(`/api/nutrition/meal-plans/${planId}/approve`, {
        method: 'POST',
        headers: { 'x-tenant-id': patient.tenantId }
      });
      const data = await response.json();
      if (data.success) {
        setCurrentPlan(data.plan);
        alert('Prescrição Aprovada com Sucesso!');
      }
    } catch (err: any) {
      alert(`Erro ao aprovar: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row font-sans text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* SIDEBAR MOBILE & DESKTOP RETRÁTIL */}
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        hasPermission={hasPermission}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER SUPERIOR */}
        <Header
          activeTab={activeSection}
          setActiveTab={setActiveSection}
          approvedStatus={currentPlan?.status === 'approved'}
          onOpenPdf={() => {
            if (!currentPlan) {
              alert('Por favor, gere ou edite um cardápio primeiro para visualizar a prescrição em PDF.');
              return;
            }
            if (!hasPermission('export_pdf')) {
              alert('Acesso Negado: O seu perfil não possui a permissão "export_pdf".');
              return;
            }
            setPdfModalOpen(true);
          }}
        />

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeSection === 'patient' && (
            <PatientProfileForm
              patient={patient}
              onChange={setPatient}
              onNext={() => setActiveSection('macros')}
            />
          )}

          {activeSection === 'macros' && (
            <MacroDistributionForm
              vetKcal={patient.prescribedVETKcal}
              patientWeightKg={patient.weightKg}
              macroInput={macroInput}
              onChange={setMacroInput}
              onNext={() => setActiveSection('meals')}
              onBack={() => setActiveSection('patient')}
            />
          )}

          {activeSection === 'meals' && (
            <MealDistributionForm
              vetKcal={patient.prescribedVETKcal}
              macroTargets={macroTargets}
              meals={meals}
              onChange={setMeals}
              onNext={() => setActiveSection('restrictions')}
              onBack={() => setActiveSection('macros')}
            />
          )}

          {activeSection === 'restrictions' && (
            <RestrictionsForm
              restrictions={restrictions}
              onChange={setRestrictions}
              onNext={() => setActiveSection('generator')}
              onBack={() => setActiveSection('meals')}
            />
          )}

          {activeSection === 'generator' && (
            <MealPlanGeneratorView
              dailyTarget={{
                energyKcal: patient.prescribedVETKcal,
                carbohydratesG: macroTargets.carbohydratesG,
                proteinG: macroTargets.proteinG,
                lipidsG: macroTargets.lipidsG
              }}
              mealDistributions={mealDistributions}
              restrictions={restrictions}
              patientId={patient.patientId}
              onPlanGenerated={handlePlanGenerated}
              onGoToEditor={() => setActiveSection('editor')}
            />
          )}

          {activeSection === 'editor' && (
            currentPlan ? (
              <MealPlanEditor
                plan={currentPlan}
                onUpdatePlan={handleUpdatePlanInEditor}
                onApprove={handleApprovePlan}
                onOpenPdf={() => {
                  if (!hasPermission('export_pdf')) {
                    alert('Acesso Negado: O seu perfil não possui a permissão "export_pdf".');
                    return;
                  }
                  setPdfModalOpen(true);
                }}
              />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4">
                <h3 className="text-base font-bold text-slate-800">Nenhum Cardápio Gerado Ainda</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Acesse a aba 5 ("Gerador IA & Auditoria") para compor o cardápio automaticamente com o Motor 2 e Motor 1.
                </p>
                <button
                  onClick={() => setActiveSection('generator')}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Ir para o Gerador de Cardápios
                </button>
              </div>
            )
          )}

          {activeSection === 'patients_directory' && (
            <PatientsDirectoryView
              onLoadPatientIntoPrescription={loaded => {
                setPatient(loaded);
                setActiveSection('patient');
              }}
              canCreatePatient={hasPermission('create_patient')}
              canEditPatient={hasPermission('edit_patient')}
              canDeletePatient={hasPermission('delete_patient')}
            />
          )}

          {activeSection === 'professionals_directory' && (
            <ProfessionalsDirectoryView
              canManageProfessionals={hasPermission('manage_professionals')}
            />
          )}

          {activeSection === 'permissions_config' && (
            <PermissionsConfigView
              activeRole={activeRole}
              setActiveRole={setActiveRole}
              canManagePermissions={hasPermission('manage_permissions')}
            />
          )}

          {activeSection === 'tests' && <ClinicalTestRunner />}
        </main>
      </div>

      {/* PDF Modal */}
      {currentPlan && (
        <PdfPrescriptionModal
          plan={currentPlan}
          patient={patient}
          isOpen={pdfModalOpen}
          onClose={() => setPdfModalOpen(false)}
        />
      )}
    </div>
  );
}
