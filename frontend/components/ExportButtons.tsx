'use client'

import { useState } from 'react'
import { FiDownload } from 'react-icons/fi'

interface ExportButtonsProps {
  onExportExcel?: () => Promise<void>
  onExportPdf?: () => Promise<void>
  showExcel?: boolean
  showPdf?: boolean
}

export default function ExportButtons({
  onExportExcel,
  onExportPdf,
  showExcel = true,
  showPdf = false,
}: ExportButtonsProps) {
  const [loadingExcel, setLoadingExcel] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExportExcel = async () => {
    if (!onExportExcel) return
    try {
      setError(null)
      setLoadingExcel(true)
      await onExportExcel()
    } catch (err: any) {
      setError(err.message || 'Error al descargar Excel')
    } finally {
      setLoadingExcel(false)
    }
  }

  const handleExportPdf = async () => {
    if (!onExportPdf) return
    try {
      setError(null)
      setLoadingPdf(true)
      await onExportPdf()
    } catch (err: any) {
      setError(err.message || 'Error al descargar PDF')
    } finally {
      setLoadingPdf(false)
    }
  }

  return (
    <div className="flex gap-2">
      {error && (
        <div className="text-red-600 text-sm mr-2">
          {error}
        </div>
      )}
      {showExcel && onExportExcel && (
        <button
          onClick={handleExportExcel}
          disabled={loadingExcel}
          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition text-sm font-medium"
        >
          <FiDownload size={16} />
          {loadingExcel ? 'Descargando...' : 'Excel'}
        </button>
      )}
      {showPdf && onExportPdf && (
        <button
          onClick={handleExportPdf}
          disabled={loadingPdf}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition text-sm font-medium"
        >
          <FiDownload size={16} />
          {loadingPdf ? 'Descargando...' : 'PDF'}
        </button>
      )}
    </div>
  )
}
