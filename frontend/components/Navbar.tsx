'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { FiLogOut, FiUser } from 'react-icons/fi'
import { useEffect } from 'react'

export default function Navbar() {
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  if (!user) {
    return (
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">APP Contratación</h1>
          <p className="text-xs text-gray-500 mt-1">Detección de Irregularidades SECOP</p>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-blue-600">APP Contratación</h1>
        <p className="text-xs text-gray-500 mt-1">Detección de Irregularidades SECOP</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <FiUser size={18} className="text-gray-600" />
            <div>
              <p className="text-sm font-semibold text-gray-800">{user.nombre}</p>
              <p className="text-xs text-gray-600">
                {user.rol === 'admin' && '👤 Administrador'}
                {user.rol === 'auditor' && '📋 Auditor'}
                {user.rol === 'empleado' && '👨‍💼 Empleado'}
                {user.rol === 'analista' && '📊 Analista'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-semibold text-sm"
          title="Cerrar sesión"
        >
          <FiLogOut size={18} />
          Salir
        </button>
      </div>
    </nav>
  )
}

