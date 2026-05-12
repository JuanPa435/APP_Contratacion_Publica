import api from '@/lib/api'

export interface ExportOptions {
  format?: 'excel' | 'pdf'
  soloAnomalos?: boolean
}

export async function downloadFile(
  url: string,
  filename: string,
  options?: ExportOptions
) {
  try {
    const response = await api.get(url, {
      params: options,
      responseType: 'blob',
    })

    const blob = new Blob([response.data])
    const urlBlob = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = urlBlob
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(urlBlob)
  } catch (error: any) {
    const errorMsg = error.response?.data?.detail || error.message || 'Error descargando archivo'
    throw new Error(errorMsg)
  }
}

export function exportContratos(soloAnomalos: boolean = false) {
  const filename = soloAnomalos ? 'contratos_anomalos.xlsx' : 'contratos.xlsx'
  return downloadFile('/reportes/contratos', filename, { soloAnomalos })
}

export function exportAlertas() {
  return downloadFile('/reportes/alertas', 'alertas.xlsx')
}

export function exportAuditorias() {
  return downloadFile('/reportes/auditorias', 'auditorias.pdf')
}
