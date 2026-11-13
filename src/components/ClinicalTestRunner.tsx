/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CheckCircle2, Play, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react';
import { useState } from 'react';
import { TestResult } from '../engine/testSuite';

export function ClinicalTestRunner() {
  const [loading, setLoading] = useState(false);
  const [testReport, setTestReport] = useState<{
    passedCount: number;
    failedCount: number;
    results: TestResult[];
  } | null>(null);

  const handleRunTests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/nutrition/run-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        setTestReport(data.testReport);
      }
    } catch (err: any) {
      alert(`Erro ao executar a suíte de testes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            7. Suíte de Testes Automatizados (15 Cenários Clínicos Obrigatórios)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Validação automatizada de cálculos de 2000 kcal, 1800 kcal, restrições APLV, vegetariano, vegano, multi-tenant e tolerâncias.
          </p>
        </div>

        <button
          onClick={handleRunTests}
          disabled={loading}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{loading ? 'Executando Suíte de Testes...' : 'Executar Todos os 15 Testes'}</span>
        </button>
      </div>

      {testReport ? (
        <div className="space-y-6">
          {/* PAINEL DE SUMMARY */}
          <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 font-medium">Resultado da Suíte de Testes</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
                {testReport.passedCount} / {testReport.results.length} Testes Aprovados
              </div>
            </div>

            <div className="flex gap-3">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 rounded-md">
                {testReport.passedCount} Passaram
              </span>
              <span className="px-3 py-1 bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/30 rounded-md">
                {testReport.failedCount} Falharam
              </span>
            </div>
          </div>

          {/* LISTA DE RESULTADOS DE TESTE */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
            {testReport.results.map(res => (
              <div key={res.scenarioId} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">Cenário {res.scenarioId}:</span>
                    <span className="text-sm font-bold text-slate-900">{res.scenarioName}</span>
                  </div>
                  <p className="text-xs text-slate-600">{res.message}</p>
                </div>

                {res.passed ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-md shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Aprovado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-md shrink-0">
                    <XCircle className="w-3.5 h-3.5" /> Reprovado
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-3">
          <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Nenhum Teste Executado Ainda</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Clique no botão acima para rodar instantaneamente os 15 cenários de testes unitários e de integração no Motor 1 e Motor 2.
          </p>
        </div>
      )}
    </div>
  );
}
