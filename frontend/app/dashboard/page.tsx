'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import ErrorAlert from '@/components/ErrorAlert'
import api from '@/lib/api'
import {
  FiFileText,
  FiAlertTriangle,
  FiTrendingUp,
  FiUsers,
  FiClipboard,
  FiSearch,
  FiShield,
  FiCheckSquare,
  FiBookOpen,
  FiClock,
  FiTarget,
  FiAward,
} from 'react-icons/fi'
import Link from 'next/link'

interface Stats {
  total_contratos: number
  total_anomalos: number
  alertas: number
}

interface AdminStats {
  usuarios: number
  codigos: number
  codigos_activos: number
  admins: number
}

const auditSteps = [
  {
    title: '1. Verificar origen',
    description: 'Confirma que el contrato proviene del SECOP y que los campos principales estén completos.',
    icon: FiSearch,
  },
  {
    title: '2. Revisar fechas',
    description: 'Valida publicación, adjudicación y vigencia para detectar procesos fuera de tiempo o inconsistentes.',
    icon: FiClipboard,
  },
  {
    title: '3. Cruzar señales',
    description: 'Compara valor, número de ofertas, proponentes y modificaciones con el comportamiento esperado.',
    icon: FiShield,
  },
  {
    title: '4. Documentar hallazgos',
    description: 'Registra el motivo del hallazgo, evidencia y prioridad para trazabilidad y seguimiento.',
    icon: FiCheckSquare,
  },
]

const auditTips = [
  'Revisa contratos con pocos oferentes y valores altos.',
  'Prioriza procesos con múltiples modificaciones o ejecución acelerada.',
  'Contrasta el objeto contractual con el proveedor y la entidad.',
  'No cierres hallazgos sin evidencia de soporte o trazabilidad.',
]

const trainingModules = [
  {
    title: '1. Detección temprana',
    description: 'Aprende a reconocer señales como concentración de proveedores, baja competencia y valores atípicos.',
    icon: FiSearch,
  },
  {
    title: '2. Documentación y evidencia',
    description: 'Registra hallazgos con soporte, capturas, fechas y observaciones para evitar reprocesos.',
    icon: FiClipboard,
  },
  {
    title: '3. Control de riesgos',
    description: 'Define umbrales y criterios de alerta para priorizar procesos con mayor probabilidad de irregularidad.',
    icon: FiTarget,
  },
  {
    title: '4. Seguimiento continuo',
    description: 'Haz revisiones periódicas, mide hallazgos repetidos y ajusta la estrategia de control.',
    icon: FiAward,
  },
]

const weeklyRoutine = [
  'Lunes: revisar nuevos contratos cargados y filtrar por rango temporal.',
  'Miércoles: validar procesos con bajas ofertas, modificaciones o valores altos.',
  'Viernes: registrar hallazgos, actualizar alertas y preparar acciones preventivas.',
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null)
        const [contractRes, adminRes] = await Promise.all([
          api.get('/contratos/resumen'),
          user?.rol === 'admin' ? api.get('/admin/resumen') : Promise.resolve(null),
        ])
        setStats(contractRes.data)
        if (adminRes) setAdminStats(adminRes.data)
      } catch (error: any) {
        const errorMsg = error.response?.data?.detail || error.message || 'Error al cargar estadísticas'
        setError(errorMsg)
      } finally {
        setLoading(false)
      }
    }

    if (user) fetchStats()
  }, [user])

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
            <h2 className="text-3xl font-bold text-gray-800">
              Bienvenido, {user?.nombre}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {new Date().toLocaleDateString('es-CO', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-200 h-32 rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Total Contratos */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Contratos</p>
                      <p className="text-3xl font-bold text-gray-800 mt-1">
                        {stats?.total_contratos.toLocaleString('es-CO')}
                      </p>
                    </div>
                    <FiFileText className="text-blue-600" size={40} />
                  </div>
                </div>

                {/* Total Anómalos */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Detectadas Anomalías</p>
                      <p className="text-3xl font-bold text-red-600 mt-1">
                        {stats?.total_anomalos.toLocaleString('es-CO')}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {stats
                          ? (
                              ((stats.total_anomalos / stats.total_contratos) * 100) ||
                              0
                            ).toFixed(1)
                          : 0}
                        % de tasa de anomalía
                      </p>
                    </div>
                    <FiAlertTriangle className="text-red-600" size={40} />
                  </div>
                </div>

                {/* Alertas */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Alertas Activas</p>
                      <p className="text-3xl font-bold text-orange-600 mt-1">
                        {stats?.alertas.toLocaleString('es-CO')}
                      </p>
                    </div>
                    <FiTrendingUp className="text-orange-600" size={40} />
                  </div>
                </div>

                {/* Admin Stats */}
                {user?.rol === 'admin' && adminStats && (
                  <>
                    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm">Usuarios</p>
                          <p className="text-3xl font-bold text-green-600 mt-1">
                            {adminStats.usuarios}
                          </p>
                        </div>
                        <FiUsers className="text-green-600" size={40} />
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm">Códigos Activos</p>
                          <p className="text-3xl font-bold text-purple-600 mt-1">
                            {adminStats.codigos_activos}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            de {adminStats.codigos} totales
                          </p>
                        </div>
                        <FiClipboard className="text-purple-600" size={40} />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Section: Pasos de Auditoría */}
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <FiShield className="text-blue-600" size={28} />
                  <h3 className="text-2xl font-bold text-gray-800">Proceso de Auditoría</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {auditSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 hover:shadow-md transition"
                    >
                      <step.icon className="text-blue-600 mb-3" size={24} />
                      <h4 className="font-semibold text-gray-800 mb-2">{step.title}</h4>
                      <p className="text-sm text-gray-700">{step.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section: Consejos de Auditoría */}
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <FiBookOpen className="text-green-600" size={28} />
                  <h3 className="text-2xl font-bold text-gray-800">Consejos de Auditoría</h3>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-600 rounded-lg p-6">
                  <ul className="space-y-2">
                    {auditTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-700">
                        <span className="text-green-600 font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Section: Módulos de Capacitación */}
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <FiAward className="text-purple-600" size={28} />
                  <h3 className="text-2xl font-bold text-gray-800">Módulos de Capacitación</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {trainingModules.map((module, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6 hover:shadow-md transition"
                    >
                      <module.icon className="text-purple-600 mb-3" size={24} />
                      <h4 className="font-semibold text-gray-800 mb-2">{module.title}</h4>
                      <p className="text-sm text-gray-700">{module.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section: Rutina Semanal */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <FiClock className="text-orange-600" size={28} />
                  <h3 className="text-2xl font-bold text-gray-800">Rutina Semanal Recomendada</h3>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-600 rounded-lg p-6">
                  <ul className="space-y-3">
                    {weeklyRoutine.map((day, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-700">
                        <span className="text-orange-600 font-bold">▪</span>
                        <span>{day}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* User Info Section */}
              {user && (
                <section className="mt-12 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-8 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Información del Usuario</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Rol</p>
                      <span className="font-semibold text-gray-800 capitalize">{user.rol}</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email</p>
                      <span className="font-semibold text-gray-800">{user.email}</span>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
