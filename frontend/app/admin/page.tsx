'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import { FiCopy, FiPlus, FiAlertCircle, FiCheckCircle } from 'react-icons/fi'

interface Code {
  id: number
  codigo: string
  rol: string
  descripcion?: string
  activo: boolean
  creado_en: string
  usado_en?: string
}

interface UsuarioItem {
  id: number
  nombre: string
  email: string
  rol: string
}

export default function AdminPage() {
  const router = useRouter()
  const { token, user, getMe } = useAuth()
  const [tab, setTab] = useState<'codigos' | 'usuarios'>('codigos')
  const [codigos, setCodeigos] = useState<Code[]>([])
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newCode, setNewCode] = useState('')
  const [newRol, setNewRol] = useState<'auditor' | 'empleado' | 'analista'>('auditor')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }
    getMe()
  }, [token, router, getMe])

  useEffect(() => {
    if (user?.rol !== 'admin') {
      router.push('/dashboard')
      return
    }

    const fetchData = async () => {
      try {
        const [codesRes, usersRes] = await Promise.all([
          api.get('/admin/codigos'),
          api.get('/admin/usuarios'),
        ])
        setCodeigos(codesRes.data)
        setUsuarios(usersRes.data)
      } catch (error) {
        console.error('Error fetching admin data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, router])

  const handleCreateCode = async () => {
    if (!newRol) return

    try {
      const { data } = await api.post('/admin/codigos', {
        rol: newRol,
        descripcion: '',
      })
      setCodeigos([data, ...codigos])
      setNewCode('')
      setNewRol('auditor')
    } catch (error) {
      console.error('Error creating code:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(''), 2000)
  }

  if (!token || user?.rol !== 'admin') return null

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Navbar />

        <main className="flex-1 p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Administración</h2>
            <p className="text-gray-600 text-sm mt-1">Gestiona usuarios y códigos de registro</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b">
            <button
              onClick={() => setTab('codigos')}
              className={`px-6 py-3 font-medium border-b-2 transition ${
                tab === 'codigos'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Códigos de Invitación
            </button>
            <button
              onClick={() => setTab('usuarios')}
              className={`px-6 py-3 font-medium border-b-2 transition ${
                tab === 'usuarios'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Usuarios
            </button>
          </div>

          {/* Códigos Tab */}
          {tab === 'codigos' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Crear Nuevo Código</h3>
                <div className="flex gap-3">
                  <select
                    value={newRol}
                    onChange={(e) => setNewRol(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="auditor">Auditor</option>
                    <option value="empleado">Empleado</option>
                    <option value="analista">Analista</option>
                  </select>
                  <button
                    onClick={handleCreateCode}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <FiPlus size={18} />
                    Generar Código
                  </button>
                </div>
              </div>

              {/* Códigos List */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">Cargando...</div>
                ) : codigos.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No hay códigos</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Código
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Rol
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Creado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Acción
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {codigos.map((code) => (
                          <tr key={code.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-mono font-semibold text-gray-800">
                              {code.codigo}
                            </td>
                            <td className="px-6 py-4 text-sm capitalize text-gray-600">
                              {code.rol}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {code.activo ? (
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                  Activo
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                                  Usado
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(code.creado_en).toLocaleDateString('es-CO')}
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => copyToClipboard(code.codigo)}
                                className="text-blue-600 hover:text-blue-700 transition flex items-center gap-1"
                              >
                                <FiCopy size={16} />
                                {copied === code.codigo ? 'Copiado!' : 'Copiar'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Usuarios Tab */}
          {tab === 'usuarios' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Cargando...</div>
              ) : usuarios.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No hay usuarios</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Rol
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {usuarios.map((usuario) => (
                        <tr key={usuario.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-800">
                            {usuario.nombre}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{usuario.email}</td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                                usuario.rol === 'admin'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {usuario.rol}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
