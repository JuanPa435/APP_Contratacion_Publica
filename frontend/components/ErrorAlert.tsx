'use client'

interface ErrorAlertProps {
  error: string | null
  onDismiss?: () => void
  onRetry?: () => void
}

export default function ErrorAlert({ error, onDismiss, onRetry }: ErrorAlertProps) {
  if (!error) return null

  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-red-500 text-xl mt-0.5">✕</span>
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={onDismiss || (() => {})}
          className="text-red-400 hover:text-red-600 ml-4"
        >
          ✕
        </button>
      </div>
      {onRetry && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={onRetry}
            className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  )
}
