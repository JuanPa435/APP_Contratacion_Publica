'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import { FiSearch, FiFilter, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi'

interface Contrato {
  id: number
  codigo_proceso: string
  entidad: string
  titulo: string
  valor: number | null
  score_anomalia: number | null
  es_anomalo: boolean
}

export default function ContratosPage() {
  const router = useRouter()
  const { token, user, getMe } = useAuth()
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [soloAnomalos, setSoloAnomalos] = useState(false)

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }
    getMe()
  }, [token, router, getMe])

  useEffect(() => {
    const fetchContratos = async () => {
      try {
        const { data } = await api.get('/contratos/', {
          params: { solo_anomalos: soloAnomalos },
        })
        setContratos(data)
      } catch (error) {
        console.error('Error fetching contratos:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) fetchContratos()
  }, [user, soloAnomalos])

  const filtered = contratos.filter((c) =>
    search === ''
      ? true
      : c.titulo.toLowerCase().includes(search.toLowerCase()) ||
        c.codigo_proceso.toLowerCase().includes(search.toLowerCase()) ||
        c.entidad.toLowerCase().includes(search.toLowerCase())
  )

  if (!token || !user) return null

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Navbar />

        <main className="flex-1 p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Contratos</h2>
            <p className="text-gray-600 text-sm mt-1">Gestiona y monitorea contratos SECOP</p>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por código, título o entidad..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setSoloAnomalos(!soloAnomalos)}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  soloAnomalos
                    ? 'bg-red-100 text-red-700 border-2 border-red-300'
                    : 'bg-gray-100 text-gray-600 border-2 border-gray-300'
                }`}
              >
                <FiFilter size={16} />
                {soloAnomalos ? 'Solo Anomalías' : 'Mostrar Todos'}
              </button>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Cargando contratos...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No se encontraron contratos</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        Entidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        Título
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map((contrato) => (
                      <tr
                        key={contrato.id}
                        className="hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => router.push(`/contratos/${contrato.id}`)}
                      >
                        <td className="px-6 py-4 text-sm font-mono text-gray-600">
                          {contrato.codigo_proceso.substring(0, 20)}...
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                          {contrato.entidad.substring(0, 30)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {contrato.titulo.substring(0, 40)}...
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {contrato.valor ? `$${contrato.valor.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-sm font-semibold ${
                              contrato.score_anomalia !== null && contrato.score_anomalia < -0.1
                                ? 'text-red-600'
                                : 'text-green-600'
                            }`}
                          >
                            {contrato.score_anomalia ? contrato.score_anomalia.toFixed(3) : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {contrato.es_anomalo ? (
                            <div className="flex items-center gap-2 text-red-600">
                              <FiAlertTriangle size={16} />
                              <span className="text-sm font-medium">Anomalía</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-green-600">
                              <FiCheckCircle size={16} />
                              <span className="text-sm font-medium">Normal</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 text-sm text-gray-500 text-center">
            Mostrando {filtered.length} de {contratos.length} contratos
          </div>
        </main>
      </div>
    </div>
  )
}
