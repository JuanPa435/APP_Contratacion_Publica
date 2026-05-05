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
  user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', data.access_token)
      set({ token: data.access_token })
      await set({ isLoading: false })
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Login fallido', isLoading: false })
      throw error
    }
  },

  register: async (nombre, email, password, codigo_registro) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/auth/register', { nombre, email, password, codigo_registro })
      set({ user: data, isLoading: false })
      localStorage.setItem('user', JSON.stringify(data))
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Registro fallido', isLoading: false })
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  },

  getMe: async () => {
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data })
      localStorage.setItem('user', JSON.stringify(data))
    } catch (error) {
      set({ user: null, token: null })
    }
  },
}))
