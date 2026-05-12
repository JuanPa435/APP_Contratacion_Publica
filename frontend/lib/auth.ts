import { create } from 'zustand'
import api from './api'

interface User {
  id: number
  nombre: string
  email: string
  rol: string
}

interface AuthStore {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (nombre: string, email: string, password: string, codigo_registro: string) => Promise<void>
  logout: () => void
  getMe: () => Promise<void>
}

export const useAuth = create<AuthStore>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null })
      const response = await api.post('/auth/login', { email, password })
      const token = response.data.access_token

      localStorage.setItem('token', token)

      // Obtener datos del usuario
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const userResponse = await api.get('/auth/me')

      set({
        token,
        user: userResponse.data,
        isLoading: false
      })
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Error en el login'
      set({
        error: errorMsg,
        isLoading: false
      })
      throw err
    }
  },

  register: async (nombre, email, password, codigo_registro) => {
    try {
      set({ isLoading: true, error: null })
      await api.post('/auth/register', {
        nombre,
        email,
        password,
        codigo_registro
      })
      set({ isLoading: false })
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Error en el registro'
      set({
        error: errorMsg,
        isLoading: false
      })
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    set({ user: null, token: null })
  },

  getMe: async () => {
    try {
      const response = await api.get('/auth/me')
      set({ user: response.data })
    } catch (err) {
      set({ user: null })
    }
  },
}))

// Restaurar token y usuario al cargar la app
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token')
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    useAuth.getState().getMe()
  }
}

