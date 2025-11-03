interface ErrorCalloutProps {
  message: string
  title?: string
  onRetry?: () => void
}

export function ErrorCallout({
  message,
  title = 'Algo salió mal',
  onRetry,
}: ErrorCalloutProps) {
  return (
    <div className="error-callout" role="alert">
      <div>
        <h3 className="error-callout__title">{title}</h3>
        <p className="error-callout__message">{message}</p>
      </div>
      {onRetry ? (
        <button type="button" className="error-callout__retry" onClick={onRetry}>
          Reintentar
        </button>
      ) : null}
    </div>
  )
}

