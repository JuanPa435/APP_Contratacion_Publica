'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '@/lib/api'
import { FiArrowLeft, FiDownload, FiRefreshCw, FiAlertTriangle, FiCheckCircle, FiBarChart3 } from 'react-icons/fi'

interface Estadisticas {
  total_contratos: number
  contratos_secop: number
  valor_total_contratos: number
  total_ofertas: number
}

interface Contrato {
  id: number
  codigo_proceso: string
  entidad: string
  titulo: string
  valor: number | null
  num_ofertas: number | null
  num_proponentes: number | null
  es_anomalo: boolean
  score_anomalia: number | null
}

interface Informe {
  fecha_generacion: string
  total_contratos: number
  total_anomalias: number
  porcentaje_anomalias: number
  valor_total: number
  valor_anomalias: number
  entidades_afectadas: number
  contratos_anomalos: Contrato[]
}

export default function SecopPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Estadisticas | null>(null)
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [informe, setInforme] = useState<Informe | null>(null)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [analizando, setAnalizando] = useState(false)
  const [error, setError] = useState('')
  const [showInforme, setShowInforme] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [statsRes, contratosRes] = await Promise.all([
        api.get('/api/secop/estadisticas'),
        api.get('/contratos'),
      ])
      setStats(statsRes.data)
      setContratos(contratosRes.data)
      generarInforme(contratosRes.data)
    } catch (err) {
      console.error('Error cargando datos:', err)
      setError('Error al cargar datos')
    }
  }

  const generarInforme = (contractList: Contrato[]) => {
    const anomalias = contractList.filter(c => c.es_anomalo)
    const entidades = new Set(anomalias.map(c => c.entidad))
    const valorAnomalias = anomalias.reduce((sum, c) => sum + (c.valor || 0), 0)

    const newInforme: Informe = {
      fecha_generacion: new Date().toLocaleString('es-CO'),
      total_contratos: contractList.length,
      total_anomalias: anomalias.length,
      porcentaje_anomalias: ((anomalias.length / contractList.length) * 100) || 0,
      valor_total: stats?.valor_total_contratos || 0,
      valor_anomalias: valorAnomalias,
      entidades_afectadas: entidades.size,
      contratos_anomalos: anomalias.slice(0, 10),
    }
    setInforme(newInforme)
  }

  const handleImportarSecop = async () => {
    try {
      setImporting(true)
      setError('')
      const response = await api.post('/api/secop/importar', {})
      setError(`✓ Importación exitosa: ${response.data.creados} creados, ${response.data.actualizados} actualizados`)
      cargarDatos()
    } catch (err: any) {
      setError(`Error: ${err.response?.data?.detail || 'Error al importar'}`)
    } finally {
      setImporting(false)
    }
  }

  const handleAnalisisCompleto = async () => {
    try {
      setAnalizando(true)
      setError('')
      await api.post('/analisis/ejecutar', { contamination: 0.1 })
      setError('✓ Análisis completado')
      cargarDatos()
    } catch (err: any) {
      setError(`Error: ${err.response?.data?.detail || 'Error al ejecutar análisis'}`)
    } finally {
      setAnalizando(false)
    }
  }

  const descargarInforme = () => {
    if (!informe) return

    const contenido = `
INFORME DE ANÁLISIS SECOP
Fecha: ${informe.fecha_generacion}

RESUMEN GENERAL
===============
Total de Contratos: ${informe.total_contratos}
Total de Anomalías Detectadas: ${informe.total_anomalias}
Porcentaje de Anomalías: ${informe.porcentaje_anomalias.toFixed(2)}%

VALORES ECONÓMICOS
==================
Valor Total de Contratos: $${informe.valor_total.toLocaleString('es-CO')}
Valor en Contratos Anómalos: $${informe.valor_anomalias.toLocaleString('es-CO')}

ESTADÍSTICAS
============
Entidades Afectadas: ${informe.entidades_afectadas}

TOP 10 CONTRATOS CON ANOMALÍAS
==============================
${informe.contratos_anomalos
  .map(
    (c, i) =>
      `${i + 1}. ${c.titulo}
   Código: ${c.codigo_proceso}
   Entidad: ${c.entidad}
   Valor: $${c.valor?.toLocaleString('es-CO') || 'N/A'}
   Score de Anomalía: ${c.score_anomalia?.toFixed(4) || 'N/A'}
`
  )
  .join('\n')}
    `

    const blob = new Blob([contenido], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `informe-secop-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const anomalasCount = contratos.filter(c => c.es_anomalo).length
  const chartData = [
    { name: 'Normales', value: contratos.length - anomalasCount },
    { name: 'Anomalías', value: anomalasCount },
  ]

  const COLORS = ['#22c55e', '#ef4444']

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              <FiArrowLeft size={20} />
              Volver
            </button>
          </div>
          <h1 className="text-4xl font-bold">SECOP - Importación y Análisis</h1>
          <p className="text-gray-600 mt-2">Gestión completa de contratos públicos</p>
        </div>
      </div>

      {error && (
        <div
          className={`p-4 rounded-lg ${
            error.startsWith('✓')
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {error}
        </div>
      )}

      {/* Botones de Acción */}
      <div className="flex gap-4">
        <button
          onClick={handleImportarSecop}
          disabled={importing}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-semibold"
        >
          <FiRefreshCw size={20} />
          {importing ? 'Importando...' : 'Importar SECOP'}
        </button>
        <button
          onClick={handleAnalisisCompleto}
          disabled={analizando || contratos.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition font-semibold"
        >
          <FiBarChart3 size={20} />
          {analizando ? 'Analizando...' : 'Análisis Completo'}
        </button>
        <button
          onClick={() => setShowInforme(!showInforme)}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
        >
          <FiDownload size={20} />
          Ver Informe
        </button>
        {informe && (
          <button
            onClick={descargarInforme}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold"
          >
            <FiDownload size={20} />
            Descargar
          </button>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Contratos</div>
          <div className="text-3xl font-bold mt-2">{stats?.total_contratos || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Contratos SECOP</div>
          <div className="text-3xl font-bold mt-2">{stats?.contratos_secop || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Valor Total</div>
          <div className="text-3xl font-bold mt-2">
            ${(stats?.valor_total_contratos || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Anomalías Detectadas</div>
          <div className="text-3xl font-bold mt-2 text-red-600">{anomalasCount}</div>
        </div>
      </div>

      {/* Informe Completo */}
      {showInforme && informe && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-8 space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Informe de Análisis SECOP</h2>
          <p className="text-sm text-gray-600">Generado: {informe.fecha_generacion}</p>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Contratos</p>
              <p className="text-2xl font-bold text-gray-800">{informe.total_contratos}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg shadow">
              <p className="text-sm text-red-600">Anomalías</p>
              <p className="text-2xl font-bold text-red-800">{informe.total_anomalias}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg shadow">
              <p className="text-sm text-orange-600">Porcentaje Anomalías</p>
              <p className="text-2xl font-bold text-orange-800">{informe.porcentaje_anomalias.toFixed(2)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Valor Total Contratos</p>
              <p className="text-xl font-bold text-gray-800">
                ${informe.valor_total.toLocaleString('es-CO')}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg shadow">
              <p className="text-sm text-red-600">Valor Contratos Anómalos</p>
              <p className="text-xl font-bold text-red-800">
                ${informe.valor_anomalias.toLocaleString('es-CO')}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Distribución de Contratos</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Top 10 Contratos con Anomalías</h3>
            <div className="space-y-3">
              {informe.contratos_anomalos.map((contrato, idx) => (
                <div key={contrato.id} className="border-l-4 border-red-500 pl-4 py-2">
                  <p className="font-semibold text-gray-800">
                    {idx + 1}. {contrato.titulo}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Código:</strong> {contrato.codigo_proceso}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Entidad:</strong> {contrato.entidad}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Valor:</strong> ${contrato.valor?.toLocaleString('es-CO') || 'N/A'} |
                    <strong> Score Anomalía:</strong> {contrato.score_anomalia?.toFixed(4) || 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gráficos */}
      {contratos.length > 0 && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Estado de Contratos</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Valor por Contrato (Top 10)</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {contratos
                .filter(c => c.valor)
                .sort((a, b) => (b.valor || 0) - (a.valor || 0))
                .slice(0, 10)
                .map((contrato, idx) => (
                  <div key={contrato.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">{idx + 1}. {contrato.titulo.substring(0, 30)}...</span>
                    <span className="text-sm font-semibold">${(contrato.valor || 0).toLocaleString('es-CO')}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Contratos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Contratos Importados ({contratos.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Código</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Entidad</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Título</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Valor</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ofertas</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contratos.slice(0, 20).map((contrato) => (
                <tr key={contrato.id} className={contrato.es_anomalo ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 text-sm text-gray-900 font-mono">{contrato.codigo_proceso}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 truncate">{contrato.entidad}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 truncate">{contrato.titulo}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {contrato.valor ? `$${contrato.valor.toLocaleString('es-CO')}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{contrato.num_ofertas || '—'}</td>
                  <td className="px-6 py-4 text-sm">
                    {contrato.es_anomalo ? (
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                        <FiAlertTriangle size={14} /> Anomalía
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                        <FiCheckCircle size={14} /> Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {contratos.length > 20 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
            Mostrando 20 de {contratos.length} contratos
          </div>
        )}
      </div>
    </div>
  )
}
