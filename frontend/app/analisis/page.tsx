'use client'

import { FormEvent, useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import { FiPlay, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi'

interface AnalysisResult {
  total_contratos: number
  total_anomalias: number
  contamination: number
}

export default function AnalisisPage() {
  const [contamination, setContamination] = useState(0.12)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const { data } = await api.post('/analisis/ejecutar', { contamination })
      setResult(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error ejecutando análisis')
    } finally {
      setLoading(false)
    }
  }

  // Auth deshabilitado temporalmente

  const anomalyPercentage = result
    ? ((result.total_anomalias / result.total_contratos) * 100).toFixed(1)
    : 0

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Navbar />

        <main className="flex-1 p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Análisis de Anomalías</h2>
            <p className="text-gray-600 text-sm mt-1">
              Ejecuta modelo Isolation Forest para detección de irregularidades
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel de configuración */}
            <div className="lg:col-span-1">
              <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
                <div>
                  <label htmlFor="contamination" className="block text-sm font-medium text-gray-700 mb-2">
                    Tasa de Contaminación
                  </label>
                  <input
                    id="contamination"
                    type="range"
                    min="0.01"
                    max="0.49"
                    step="0.01"
                    value={contamination}
                    onChange={(e) => setContamination(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-center mt-2">
                    <span className="text-2xl font-bold text-blue-600">{(contamination * 100).toFixed(1)}%</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Porcentaje esperado de anomalías
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs text-blue-700">
                    <strong>Tip:</strong> Valores comunes: 10-15% para datos financieros normales,
                    5-10% para datos limpios, 20%+ para datos con muchas anomalías.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <FiPlay size={20} />
                  {loading ? 'Analizando...' : 'Ejecutar Análisis'}
                </button>
              </form>
            </div>

            {/* Resultados */}
            <div className="lg:col-span-2">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                  <div className="flex gap-3">
                    <FiAlertTriangle className="text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-red-800">Error</h3>
                      <p className="text-red-700 text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <FiCheckCircle className="text-green-600" size={24} />
                      <h3 className="text-lg font-semibold text-gray-800">Análisis Completado</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600 text-sm">Total de Contratos</p>
                        <p className="text-3xl font-bold text-gray-800 mt-2">
                          {result.total_contratos}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Anomalías Detectadas</p>
                        <p className="text-3xl font-bold text-red-600 mt-2">
                          {result.total_anomalias}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Porcentaje de Anomalías</span>
                        <span className="font-semibold text-lg">{anomalyPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${anomalyPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-800 mb-4">Resumen del Análisis</h4>
                    <ul className="space-y-3 text-sm text-gray-600">
                      <li>✓ Modelo utilizado: Isolation Forest</li>
                      <li>✓ Tasa de contaminación: {(result.contamination * 100).toFixed(1)}%</li>
                      <li>✓ Proporciones ajustes: 100 árboles de aislamiento</li>
                      <li>✓ Contratos analizados: {result.total_contratos}</li>
                      <li>✓ Anomalías encontradas: {result.total_anomalias}</li>
                    </ul>
                  </div>
                </div>
              )}

              {!result && !error && (
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center text-gray-500">
                  <p>Ejecuta el análisis para ver los resultados aquí</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
