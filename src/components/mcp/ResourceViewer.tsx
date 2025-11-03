import { UIResourceRenderer } from '@mcp-ui/client'

import { ErrorCallout } from '#src/components/feedback/ErrorCallout'
import type { UIAction, UIResource } from '#src/types/ui'

export type MCPUIRendererComponent = (
  props: Parameters<typeof UIResourceRenderer>[0],
) => JSX.Element

interface ResourceViewerProps {
  resource: UIResource | null
  isLoading: boolean
  isFetching?: boolean
  error: string | null
  onAction: (action: UIAction) => void
  onRetry?: () => void
  renderer?: MCPUIRendererComponent
}

export function ResourceViewer({
  resource,
  isLoading,
  isFetching = false,
  error,
  onAction,
  onRetry,
  renderer,
}: ResourceViewerProps) {
  if (isLoading && !resource) {
    return <p>Cargando recurso dinámico…</p>
  }

  if (error) {
    return <ErrorCallout message={error} onRetry={onRetry} />
  }

  if (!resource) {
    return <p>Selecciona un post para construir el recurso MCP-UI.</p>
  }

  const handleUIAction = (action: UIAction) => {
    onAction(action)
    return Promise.resolve()
  }

  const Renderer = renderer ?? (UIResourceRenderer as MCPUIRendererComponent)

  return (
    <div className="resource-wrapper">
      {isFetching ? (
        <span className="resource-wrapper__badge">Actualizando…</span>
      ) : null}
      <Renderer
        resource={resource.resource}
        onUIAction={handleUIAction}
        htmlProps={{
          autoResizeIframe: { height: true },
          style: { width: '100%', minHeight: '360px' },
        }}
      />
    </div>
  )
}
