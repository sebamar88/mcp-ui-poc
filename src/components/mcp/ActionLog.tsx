import type { UIActionLogEntry } from '#src/types/ui'

interface ActionLogProps {
  entries: UIActionLogEntry[]
}

const LABELS: Record<string, string> = {
  tool: 'Herramienta',
  intent: 'Intento',
  prompt: 'Prompt',
  notify: 'Notificación',
  link: 'Enlace',
}

function formatTimestamp(date: Date) {
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function ActionLog({ entries }: ActionLogProps) {
  if (!entries.length) {
    return <p>No hay acciones todavía.</p>
  }

  return (
    <div className="action-log">
      {entries.map((entry) => {
        const label = LABELS[entry.action.type] ?? 'Acción'
        return (
          <article key={entry.id} className="action-log__item">
            <div>
              <strong>{label}</strong>
            </div>
            <pre className="action-log__payload">
              {JSON.stringify(entry.action.payload, null, 2)}
            </pre>
            <span className="action-log__timestamp">
              {formatTimestamp(entry.receivedAt)}
            </span>
          </article>
        )
      })}
    </div>
  )
}
