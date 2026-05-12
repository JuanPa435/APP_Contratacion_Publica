'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import ErrorAlert from '@/components/ErrorAlert'
import ExportButtons from '@/components/ExportButtons'
import api from '@/lib/api'
import { exportAlertas } from '@/lib/export'
import { FiAlertTriangle, FiAlertCircle, FiCheckCircle } from 'react-icons/fi'

interface Alert {
  id: number
  contrato_id: number
  nivel: string
  mensaje: string
  score: number | null
  created_at: string
}

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'todos' | 'alta' | 'media' | 'baja'>('todos')

  useEffect(() => {
    const fetchAlertas = async () => {
      try {
        setError(null)
        const { data } = await api.get('/contratos/alertas')
        setAlertas(data)
      } catch (error: any) {
        const errorMsg = error.response?.data?.detail || error.message || 'Error al cargar alertas'
        setError(errorMsg)
      } finally {
        setLoading(false)
      }
    }

    fetchAlertas()
  }, [])

  const filtered = alertas.filter((a) => (filter === 'todos' ? true : a.nivel === filter))

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'alta':
        return 'bg-red-50 border-red-300 text-red-700'
      case 'media':
        return 'bg-yellow-50 border-yellow-300 text-yellow-700'
      case 'baja':
        return 'bg-green-50 border-green-300 text-green-700'
      default:
        return 'bg-gray-50 border-gray-300 text-gray-700'
    }
  }

  const getNivelIcon = (nivel: string) => {
    switch (nivel) {
      case 'alta':
        return <FiAlertTriangle size={20} />
      case 'media':
        return <FiAlertCircle size={20} />
      case 'baja':
        return <FiCheckCircle size={20} />
      default:
        return null
    }
  }


  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Navbar />

        <main className="flex-1 p-8">
          <ErrorAlert
            error={error}
            onDismiss={() => setError(null)}
          />

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Alertas</h2>
            <p className="text-gray-600 text-sm mt-1">Irregularidades detectadas en contratos</p>
          </div>

          {/* Filtros por nivel */}
          <div className="flex gap-4 mb-6 items-center justify-between">
            <div className="flex gap-4">
              {(['todos', 'alta', 'media', 'baja'] as const).map((nivel) => (
                <button
                  key={nivel}
                  onClick={() => setFilter(nivel)}
                  className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                    filter === nivel
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {nivel}
                </button>
              ))}
            </div>
            <ExportButtons
              onExportExcel={exportAlertas}
              showExcel={true}
            />
          </div>

          {/* Alertas */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center text-gray-500 py-8">Cargando alertas...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {alertas.length === 0 ? 'No hay alertas registradas' : 'No hay alertas con este filtro'}
              </div>
            ) : (
              filtered.map((alerta) => (
                <div
                  key={alerta.id}
                  className={`border-l-4 rounded-lg p-6 ${getNivelColor(alerta.nivel)}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">{getNivelIcon(alerta.nivel)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold capitalize">{alerta.nivel} Prioridad</h3>
                          <p className="text-sm opacity-75 mt-1">ID Contrato: {alerta.contrato_id}</p>
                        </div>
                        <span className="text-xs opacity-75">
                          {new Date(alerta.created_at).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                      <p className="mb-3">{alerta.mensaje}</p>
                      {alerta.score !== null && (
                        <div className="text-sm opacity-75">
                          Score Anomalía: <span className="font-mono font-semibold">{alerta.score.toFixed(3)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 text-sm text-gray-500 text-center">
            Total: {filtered.length} de {alertas.length} alertas
          </div>
        </main>
      </div>
    </div>
  )
}
