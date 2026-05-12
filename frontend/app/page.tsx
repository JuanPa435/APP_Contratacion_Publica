'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Auth temporalmente deshabilitado - ir directo al dashboard
    router.push('/dashboard')
  }, [router])

  return null
}
