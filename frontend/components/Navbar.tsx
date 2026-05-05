import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { FiLogOut, FiUser } from 'react-icons/fi'

export default function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-primary">APP Contratación</h1>
        <p className="text-xs text-gray-500 mt-1">Detección de Irregularidades SECOP</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <FiUser className="text-gray-600" />
          <span className="text-sm text-gray-700">{user?.nombre}</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
            {user?.rol}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition"
          title="Cerrar sesión"
        >
          <FiLogOut size={20} />
        </button>
      </div>
    </nav>
  )
}
