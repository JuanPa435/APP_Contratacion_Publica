'use client'

import { FormEvent, useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import ErrorAlert from '@/components/ErrorAlert'
import api from '@/lib/api'
import { FiCopy, FiPlus, FiAlertCircle, FiCheckCircle, FiEdit2, FiCheck, FiX } from 'react-icons/fi'

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
  activo: boolean
  created_at: string
}

interface Resumen {
  usuarios: number
  codigos: number
  codigos_activos: number
  admins: number
}

export default function AdminPage() {
  const [tab, setTab] = useState<'codigos' | 'usuarios'>('codigos')
  const [codigos, setCodeigos] = useState<Code[]>([])
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newRol, setNewRol] = useState<'auditor' | 'empleado' | 'analista'>('auditor')
  const [copied, setCopied] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editRol, setEditRol] = useState<string>('')
  const [editActivo, setEditActivo] = useState<boolean>(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setError(null)
      setLoading(true)
      const [codesRes, usersRes, resumenRes] = await Promise.all([
        api.get('/admin/codigos'),
        api.get('/admin/usuarios'),
        api.get('/admin/resumen'),
      ])
      setCodeigos(codesRes.data)
      setUsuarios(usersRes.data)
      setResumen(resumenRes.data)
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Error al cargar datos'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCode = async () => {
    try {
      setError(null)
      const { data } = await api.post('/admin/codigos', {
        rol: newRol,
        descripcion: '',
      })
      setCodeigos([data, ...codigos])
      setNewRol('auditor')
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Error al crear código'
      setError(errorMsg)
    }
  }

  const handleUpdateUser = async (id: number) => {
    try {
      setError(null)
      setSaving(true)
      const { data } = await api.patch(`/admin/usuarios/${id}`, {
        rol: editRol,
        activo: editActivo,
      })
      setUsuarios(usuarios.map(u => u.id === id ? data : u))
      setEditingId(null)
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Error al actualizar'
      setError(errorMsg)
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(''), 2000)
  }

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'admin':
        return 'bg-purple-100 text-purple-700'
      case 'auditor':
        return 'bg-blue-100 text-blue-700'
      case 'empleado':
        return 'bg-green-100 text-green-700'
      case 'analista':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
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
            onRetry={cargarDatos}
          />

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Administración</h2>
            <p className="text-gray-600 text-sm mt-1">Gestiona usuarios y códigos de registro</p>
          </div>

          {/* Resumen */}
          {resumen && (
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-600 uppercase font-semibold">Total Usuarios</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{resumen.usuarios}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-600 uppercase font-semibold">Total Códigos</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{resumen.codigos}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
                <p className="text-xs text-green-600 uppercase font-semibold">Códigos Activos</p>
                <p className="text-2xl font-bold text-green-700 mt-2">{resumen.codigos_activos}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 shadow-sm">
                <p className="text-xs text-purple-600 uppercase font-semibold">Admins</p>
                <p className="text-2xl font-bold text-purple-700 mt-2">{resumen.admins}</p>
              </div>
            </div>
          )}

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
              Usuarios ({usuarios.length})
            </button>
          </div>

          {/* Códigos Tab */}
          {tab === 'codigos' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Crear Nuevo Código de Invitación</h3>
                <p className="text-sm text-gray-600 mb-4">Genera códigos para que nuevos usuarios puedan registrarse</p>
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
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-semibold"
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Código</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Rol</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Estado</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Creado</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {codigos.map((code) => (
                          <tr key={code.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-mono font-semibold text-gray-800">
                              {code.codigo}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getRolColor(code.rol)}`}>
                                {code.rol}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {code.activo ? (
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                                  <FiCheckCircle size={14} /> Activo
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                                  <FiCheck size={14} /> Usado
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(code.creado_en).toLocaleDateString('es-CO')}
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => copyToClipboard(code.codigo)}
                                className="text-blue-600 hover:text-blue-700 transition flex items-center gap-1 font-semibold text-sm"
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Rol</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Creado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {usuarios.map((usuario) => (
                        <tr key={usuario.id} className={editingId === usuario.id ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-800">{usuario.nombre}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{usuario.email}</td>
                          <td className="px-6 py-4 text-sm">
                            {editingId === usuario.id ? (
                              <select
                                value={editRol}
                                onChange={(e) => setEditRol(e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="auditor">Auditor</option>
                                <option value="empleado">Empleado</option>
                                <option value="analista">Analista</option>
                                <option value="admin">Admin</option>
                              </select>
                            ) : (
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getRolColor(usuario.rol)}`}>
                                {usuario.rol}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {editingId === usuario.id ? (
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editActivo}
                                  onChange={(e) => setEditActivo(e.target.checked)}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm">{editActivo ? 'Activo' : 'Inactivo'}</span>
                              </label>
                            ) : (
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${
                                  usuario.activo
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {usuario.activo ? (
                                  <>
                                    <FiCheckCircle size={14} /> Activo
                                  </>
                                ) : (
                                  <>
                                    <FiX size={14} /> Inactivo
                                  </>
                                )}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(usuario.created_at).toLocaleDateString('es-CO')}
                          </td>
                          <td className="px-6 py-4">
                            {editingId === usuario.id ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUpdateUser(usuario.id)}
                                  disabled={saving}
                                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition disabled:opacity-50 font-semibold"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="px-3 py-1 bg-gray-300 text-gray-800 rounded text-sm hover:bg-gray-400 transition font-semibold"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingId(usuario.id)
                                  setEditRol(usuario.rol)
                                  setEditActivo(usuario.activo)
                                }}
                                className="text-blue-600 hover:text-blue-700 transition flex items-center gap-1 font-semibold text-sm"
                              >
                                <FiEdit2 size={16} />
                                Editar
                              </button>
                            )}
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
