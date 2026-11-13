/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

// ==========================================
// ZOD FORM VALIDATION SCHEMAS WITH REAL-TIME CLINICAL MESSAGES
// ==========================================

export const ZodPatientProfileSchema = z.object({
  patientId: z.string(),
  tenantId: z.string(),
  name: z.string().min(2, 'Nome do paciente deve ter pelo menos 2 caracteres'),
  age: z
    .number()
    .int('Idade deve ser um número inteiro')
    .min(1, 'Idade deve ser maior que 0')
    .max(120, 'Idade deve ser menor que 120 anos'),
  sex: z.enum(['male', 'female']),
  weightKg: z
    .number()
    .positive('Peso deve ser maior que 0 kg')
    .max(500, 'Peso deve ser menor que 500 kg'),
  heightCm: z
    .number()
    .positive('Altura deve ser maior que 0 cm')
    .max(250, 'Altura deve ser menor que 250 cm'),
  bodyFatPercentage: z
    .number()
    .min(1, 'Gordura corporal deve ser ao menos 1%')
    .max(70, 'Gordura corporal deve ser no máximo 70%')
    .optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'heavy', 'extreme']),
  goal: z.enum(['weight_loss', 'maintenance', 'hypertrophy', 'clinical_rehab']),
  calculationFormula: z.enum(['harris_benedict', 'mifflin_st_jeor', 'cunningham', 'katch_mcardle']),
  getKcal: z.number().positive(),
  prescribedVETKcal: z
    .number()
    .min(500, 'VET prescrito deve ser no mínimo 500 kcal')
    .max(10000, 'VET prescrito deve ser no máximo 10.000 kcal')
});

export const ZodMacroInputSchema = z
  .object({
    calculationType: z.enum(['percentage', 'grams_per_kg']),
    carbsPercentage: z
      .number()
      .min(0, 'Percentual não pode ser negativo')
      .max(100, 'Percentual máximo é 100%')
      .optional(),
    proteinPercentage: z
      .number()
      .min(0, 'Percentual não pode ser negativo')
      .max(100, 'Percentual máximo é 100%')
      .optional(),
    proteinGramsPerKg: z
      .number()
      .min(0.1, 'Proteína em g/kg deve ser no mínimo 0.1 g/kg')
      .max(5.0, 'Proteína em g/kg não deve ultrapassar 5.0 g/kg (risco renal)')
      .optional(),
    lipidsPercentage: z
      .number()
      .min(0, 'Percentual não pode ser negativo')
      .max(100, 'Percentual máximo é 100%')
      .optional(),
    referenceWeightKg: z
      .number()
      .positive('Peso de referência deve ser positivo')
      .optional()
  })
  .superRefine((data, ctx) => {
    if (data.calculationType === 'percentage') {
      const carbs = data.carbsPercentage ?? 50;
      const protein = data.proteinPercentage ?? 20;
      const lipids = data.lipidsPercentage ?? 30;
      const sum = carbs + protein + lipids;

      if (Math.abs(sum - 100) > 0.1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['percentageSum'],
          message: `A soma dos percentuais (${carbs}% + ${protein}% + ${lipids}%) deve ser exatamente 100%. Soma atual: ${sum.toFixed(1)}%.`
        });
      }
    }
  });

export type PatientProfileFormValues = z.infer<typeof ZodPatientProfileSchema>;
export type MacroInputFormValues = z.infer<typeof ZodMacroInputSchema>;
