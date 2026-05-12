'use client'

export const dynamic = 'force-dynamic'

import { FormEvent, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import api from '@/lib/api'
import { FiUser, FiMail, FiLock, FiKey, FiAlertCircle, FiCheckCircle } from 'react-icons/fi'

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading, error } = useAuth()

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [codigo_registro, setCodigo] = useState('')

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code') || ''
      setCodigo(code.toUpperCase())
    } catch (e) {
      // ignore
    }
  }, [])
  const [success, setSuccess] = useState(false)
  const [codigoValido, setCodigoValido] = useState<any>(null)
  const [validandoCodigo, setValidandoCodigo] = useState(false)

  useEffect(() => {
    if (codigo_registro) {
      validarCodigo(codigo_registro)
    }
  }, [codigo_registro])

  const validarCodigo = async (code: string) => {
    if (!code || code.length < 4) {
      setCodigoValido(null)
      return
    }

    try {
      setValidandoCodigo(true)
      const response = await api.get('/admin/codigos')
      const codigoEncontrado = response.data.find(
        (c: any) => c.codigo === code.toUpperCase() && c.activo
      )
      setCodigoValido(codigoEncontrado || false)
    } catch (error) {
      setCodigoValido(false)
    } finally {
      setValidandoCodigo(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!codigoValido) {
      alert('Por favor usa un código de invitación válido y activo')
      return
    }

    try {
      await register(nombre, email, password, codigo_registro.toUpperCase())
      setSuccess(true)
      setTimeout(() => router.push('/auth/login'), 2000)
    } catch (err) {
      // Error manejado por Zustand
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 text-center">
          <FiCheckCircle className="text-green-600 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Registro Exitoso!</h2>
          <p className="text-gray-600">Tu cuenta ha sido creada. Redirigiendo al login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Crear Cuenta</h1>
            <p className="text-gray-500 text-sm mt-2">APP Contratación Pública</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
                <FiAlertCircle />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código de Invitación *</label>
              <div className="relative">
                <FiKey className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={codigo_registro}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  placeholder="ABC123XYZ"
                  required
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    validandoCodigo
                      ? 'border-gray-300'
                      : codigoValido === null
                      ? 'border-gray-300'
                      : codigoValido
                      ? 'border-green-300 focus:ring-green-500'
                      : 'border-red-300 focus:ring-red-500'
                  }`}
                />
                {validandoCodigo && (
                  <div className="absolute right-3 top-3 text-gray-400 text-sm">
                    Validando...
                  </div>
                )}
                {!validandoCodigo && codigoValido && (
                  <FiCheckCircle className="absolute right-3 top-3 text-green-500" />
                )}
                {!validandoCodigo && codigoValido === false && (
                  <FiAlertCircle className="absolute right-3 top-3 text-red-500" />
                )}
              </div>
              {codigoValido && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <FiCheckCircle size={14} /> Código válido - Rol: <span className="font-semibold capitalize">{codigoValido.rol}</span>
                </p>
              )}
              {codigoValido === false && codigo_registro && (
                <p className="text-xs text-red-600 mt-1">Código inválido o ya ha sido usado</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Solicita un código válido al administrador</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Juan Pérez"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !codigoValido || validandoCodigo}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition mt-6"
            >
              {isLoading ? 'Registrando...' : 'Crear Cuenta'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:underline font-semibold">
              Inicia sesión aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

