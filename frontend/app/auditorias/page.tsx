'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import ErrorAlert from '@/components/ErrorAlert'
import api from '@/lib/api'
import { FiPlus, FiFilter, FiCheckCircle, FiClock, FiAlertCircle, FiChevronDown, FiChevronUp, FiEdit2 } from 'react-icons/fi'

interface Contrato {
  id: number
  codigo_proceso: string
  entidad: string
  titulo: string
  valor: number | null
}

interface SolicitudAuditoria {
  id: number
  contrato_id: number
  usuario_id: number
  motivo: string
  evidencia: string | null
  prioridad: string
  estado: string
  comentarios: string | null
  assigned_to: number | null
  created_at: string
  updated_at: string
  contrato?: Contrato
}

interface Resumen {
  total_solicitudes: number
  pendientes: number
  en_proceso: number
  completadas: number
  prioridad_alta: number
}

export default function AuditoriasPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudAuditoria[]>([])
  const [contratosMap, setContratosMap] = useState<Map<number, Contrato>>(new Map())
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newEstado, setNewEstado] = useState<string>('')
  const [newComentarios, setNewComentarios] = useState<string>('')

  const [contratoId, setContratoId] = useState<string>('')
  const [motivo, setMotivo] = useState<string>('')
  const [evidencia, setEvidencia] = useState<string>('')
  const [prioridad, setPrioridad] = useState<string>('media')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [filtroEstado, filtroPrioridad])

  const cargarDatos = async () => {
    try {
      setError(null)
      setLoading(true)
      const params: any = {}
      if (filtroEstado) params.estado = filtroEstado
      if (filtroPrioridad) params.prioridad = filtroPrioridad

      const [solicitudesRes, resumenRes, contratosRes] = await Promise.all([
        api.get('/auditorias/solicitudes', { params }),
        api.get('/auditorias/resumen'),
        api.get('/contratos'),
      ])

      setSolicitudes(solicitudesRes.data)
      setResumen(resumenRes.data)

      const map = new Map()
      contratosRes.data.forEach((c: Contrato) => map.set(c.id, c))
      setContratosMap(map)
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Error al cargar datos'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleCrearSolicitud = async () => {
    if (!contratoId || !motivo) {
      setError('Por favor completa los campos obligatorios')
      return
    }

    try {
      setError(null)
      setEnviando(true)
      await api.post('/auditorias/solicitudes', {
        contrato_id: parseInt(contratoId),
        motivo,
        evidencia: evidencia || null,
        prioridad,
      })

      setContratoId('')
      setMotivo('')
      setEvidencia('')
      setPrioridad('media')
      setShowForm(false)
      cargarDatos()
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Error al crear solicitud'
      setError(errorMsg)
    } finally {
      setEnviando(false)
    }
  }

  const handleActualizarEstado = async (id: number) => {
    try {
      setError(null)
      await api.patch(`/auditorias/solicitudes/${id}`, {
        estado: newEstado,
        comentarios: newComentarios,
      })
      setEditingId(null)
      cargarDatos()
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Error al actualizar'
      setError(errorMsg)
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <FiAlertCircle className="text-orange-600" />
      case 'en_proceso':
        return <FiClock className="text-blue-600" />
      case 'completada':
        return <FiCheckCircle className="text-green-600" />
      default:
        return null
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-orange-50 text-orange-800 border-orange-200'
      case 'en_proceso':
        return 'bg-blue-50 text-blue-800 border-blue-200'
      case 'completada':
        return 'bg-green-50 text-green-800 border-green-200'
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200'
    }
  }

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'media':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'baja':
        return 'bg-green-100 text-green-700 border-green-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const chartDataEstados = resumen ? [
    { name: 'Pendientes', value: resumen.pendientes },
    { name: 'En Proceso', value: resumen.en_proceso },
    { name: 'Completadas', value: resumen.completadas },
  ] : []

  const COLORS = ['#f97316', '#3b82f6', '#22c55e']

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Navbar />

        <main className="flex-1 p-8 space-y-8">
          <ErrorAlert
            error={error}
            onDismiss={() => setError(null)}
            onRetry={cargarDatos}
          />

          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Auditorías</h2>
              <p className="text-gray-600 text-sm mt-1">Gestiona auditorías de contratos con anomalías</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              <FiPlus size={20} />
              Nueva Solicitud
            </button>
          </div>

          {resumen && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-600 uppercase font-semibold">Total</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{resumen.total_solicitudes}</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 shadow-sm">
                <p className="text-xs text-orange-600 uppercase font-semibold">Pendientes</p>
                <p className="text-2xl font-bold text-orange-700 mt-2">{resumen.pendientes}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                <p className="text-xs text-blue-600 uppercase font-semibold">En Proceso</p>
                <p className="text-2xl font-bold text-blue-700 mt-2">{resumen.en_proceso}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
                <p className="text-xs text-green-600 uppercase font-semibold">Completadas</p>
                <p className="text-2xl font-bold text-green-700 mt-2">{resumen.completadas}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
                <p className="text-xs text-red-600 uppercase font-semibold">Prioridad Alta</p>
                <p className="text-2xl font-bold text-red-700 mt-2">{resumen.prioridad_alta}</p>
              </div>
            </div>
          )}

          {resumen && solicitudes.length > 0 && (
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Por Estado</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={chartDataEstados}
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
                <h3 className="text-lg font-semibold mb-4">Por Prioridad</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { name: 'Alta', value: resumen.prioridad_alta },
                    { name: 'Media', value: Math.max(0, resumen.total_solicitudes - resumen.prioridad_alta - 10) },
                    { name: 'Baja', value: Math.max(0, 10) },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {showForm && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Crear Nueva Solicitud de Auditoría</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID del Contrato *</label>
                  <input
                    type="number"
                    value={contratoId}
                    onChange={(e) => setContratoId(e.target.value)}
                    placeholder="Ej: 1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Describe el motivo de la auditoría..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Evidencia</label>
                <textarea
                  value={evidencia}
                  onChange={(e) => setEvidencia(e.target.value)}
                  placeholder="Adjunta evidencia o referencias..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleCrearSolicitud}
                  disabled={enviando}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
                >
                  {enviando ? 'Enviando...' : 'Crear Solicitud'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiFilter size={20} />
              <h3 className="font-semibold text-gray-800">Filtros</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los Estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En Proceso</option>
                <option value="completada">Completada</option>
              </select>
              <select
                value={filtroPrioridad}
                onChange={(e) => setFiltroPrioridad(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las Prioridades</option>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Cargando solicitudes...</div>
            ) : solicitudes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No hay solicitudes de auditoría</div>
            ) : (
              <div className="divide-y">
                {solicitudes.map((solicitud) => {
                  const contrato = contratosMap.get(solicitud.contrato_id)
                  const isExpanded = expandedId === solicitud.id
                  const isEditing = editingId === solicitud.id

                  return (
                    <div key={solicitud.id} className="border-b">
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : solicitud.id)}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-gray-800">#{solicitud.id}</span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPrioridadColor(
                                solicitud.prioridad
                              )}`}
                            >
                              {solicitud.prioridad.toUpperCase()}
                            </span>
                            <div
                              className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-2 ${getEstadoColor(
                                solicitud.estado
                              )}`}
                            >
                              {getEstadoIcon(solicitud.estado)}
                              {solicitud.estado}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {contrato ? `${contrato.titulo} - ${contrato.entidad}` : `Contrato #${solicitud.contrato_id}`}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{solicitud.motivo}</p>
                        </div>
                        <div className="ml-4">
                          {isExpanded ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="bg-gray-50 p-4 border-t">
                          {contrato && (
                            <div className="mb-4 p-3 bg-white rounded border border-gray-200">
                              <p className="text-sm font-semibold text-gray-800">Información del Contrato</p>
                              <p className="text-xs text-gray-600 mt-1"><strong>Código:</strong> {contrato.codigo_proceso}</p>
                              <p className="text-xs text-gray-600"><strong>Entidad:</strong> {contrato.entidad}</p>
                              <p className="text-xs text-gray-600"><strong>Valor:</strong> ${contrato.valor?.toLocaleString('es-CO') || 'N/A'}</p>
                            </div>
                          )}
                          <div className="mb-4 p-3 bg-white rounded border border-gray-200">
                            <p className="text-sm font-semibold text-gray-800">Detalles</p>
                            <p className="text-xs text-gray-600 mt-2"><strong>Motivo:</strong> {solicitud.motivo}</p>
                            {solicitud.evidencia && (
                              <p className="text-xs text-gray-600 mt-2"><strong>Evidencia:</strong> {solicitud.evidencia}</p>
                            )}
                            {solicitud.comentarios && (
                              <p className="text-xs text-gray-600 mt-2"><strong>Comentarios:</strong> {solicitud.comentarios}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Creada: {new Date(solicitud.created_at).toLocaleDateString('es-CO')}
                            </p>
                          </div>

                          {!isEditing && (
                            <button
                              onClick={() => {
                                setEditingId(solicitud.id)
                                setNewEstado(solicitud.estado)
                                setNewComentarios(solicitud.comentarios || '')
                              }}
                              className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition font-semibold text-sm"
                            >
                              <FiEdit2 size={16} />
                              Actualizar Estado
                            </button>
                          )}

                          {isEditing && (
                            <div className="space-y-3 p-3 bg-white rounded border border-blue-200">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Nuevo Estado</label>
                                <select
                                  value={newEstado}
                                  onChange={(e) => setNewEstado(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="pendiente">Pendiente</option>
                                  <option value="en_proceso">En Proceso</option>
                                  <option value="completada">Completada</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Comentarios</label>
                                <textarea
                                  value={newComentarios}
                                  onChange={(e) => setNewComentarios(e.target.value)}
                                  placeholder="Agrega comentarios..."
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleActualizarEstado(solicitud.id)}
                                  className="flex-1 bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 transition font-semibold text-sm"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="flex-1 bg-gray-300 text-gray-800 px-3 py-2 rounded hover:bg-gray-400 transition font-semibold text-sm"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
