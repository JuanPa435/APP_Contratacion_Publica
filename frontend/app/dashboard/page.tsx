'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import { FiFileText, FiAlertTriangle, FiTrendingUp, FiUsers } from 'react-icons/fi'
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

export default function DashboardPage() {
  const router = useRouter()
  const { token, user, getMe } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }
    getMe()
  }, [token, router, getMe])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [contractRes, adminRes] = await Promise.all([
          api.get('/contratos/resumen'),
          user?.rol === 'admin' ? api.get('/admin/resumen') : null,
        ])
        setStats(contractRes.data)
        if (adminRes) setAdminStats(adminRes.data)
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) fetchStats()
  }, [user])

  if (!token || !user) return null

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Navbar />

        <main className="flex-1 p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800">
              Bienvenido, {user.nombre}
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
              {/* Tarjetas principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Total Contratos</p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">
                        {stats?.total_contratos || 0}
                      </p>
                    </div>
                    <FiFileText className="text-blue-500" size={32} />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Anomalías Detectadas</p>
                      <p className="text-3xl font-bold text-red-600 mt-2">
                        {stats?.total_anomalos || 0}
                      </p>
                    </div>
                    <FiTrendingUp className="text-red-500" size={32} />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Alertas Activas</p>
                      <p className="text-3xl font-bold text-yellow-600 mt-2">
                        {stats?.alertas || 0}
                      </p>
                    </div>
                    <FiAlertTriangle className="text-yellow-500" size={32} />
                  </div>
                </div>

                {user.rol === 'admin' && (
                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">Usuarios Activos</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">
                          {adminStats?.usuarios || 0}
                        </p>
                      </div>
                      <FiUsers className="text-green-500" size={32} />
                    </div>
                  </div>
                )}
              </div>

              {/* Acciones rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Acciones Rápidas</h3>
                  <div className="space-y-2">
                    <Link
                      href="/contratos"
                      className="block p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                    >
                      ➜ Ver Contratos
                    </Link>
                    <Link
                      href="/alertas"
                      className="block p-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition"
                    >
                      ➜ Ver Alertas
                    </Link>
                    <Link
                      href="/analisis"
                      className="block p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition"
                    >
                      ➜ Ejecutar Análisis
                    </Link>
                    {user.rol === 'admin' && (
                      <Link
                        href="/admin"
                        className="block p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition"
                      >
                        ➜ Panel de Administración
                      </Link>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Información</h3>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Tu Rol:</span>
                      <span className="font-semibold text-gray-800 capitalize">{user.rol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Correo:</span>
                      <span className="font-semibold text-gray-800">{user.email}</span>
                    </div>
                    <div className="pt-3 border-t">
                      <p className="text-xs text-gray-500">
                        La plataforma analiza contratos del SECOP para detectar irregularidades
                        usando machine learning.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
