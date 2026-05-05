import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiHome, FiFileText, FiBarChart2, FiSettings, FiAlertTriangle } from 'react-icons/fi'
import { useAuth } from '@/lib/auth'
import clsx from 'clsx'

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: FiHome, show: true },
    { href: '/contratos', label: 'Contratos', icon: FiFileText, show: true },
    { href: '/alertas', label: 'Alertas', icon: FiAlertTriangle, show: true },
    { href: '/analisis', label: 'Análisis', icon: FiBarChart2, show: true },
    { href: '/admin', label: 'Administración', icon: FiSettings, show: user?.rol === 'admin' },
  ]

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white h-screen fixed left-0 top-0 pt-24 overflow-y-auto">
      <nav className="px-4 space-y-2">
        {menuItems.map(
          (item) =>
            item.show && (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition',
                  pathname === item.href
                    ? 'bg-primary text-white font-semibold'
                    : 'text-gray-300 hover:bg-slate-700'
                )}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
        )}
      </nav>
    </aside>
  )
}
