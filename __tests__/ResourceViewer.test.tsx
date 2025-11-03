import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { ResourceViewer, type MCPUIRendererComponent } from '#src/components/mcp/ResourceViewer'
import type { UIResource } from '#src/types/ui'

const sampleResource: UIResource = {
  type: 'resource',
  resource: {
    uri: 'ui://posts/1/summary',
    mimeType: 'text/html',
    text: '<p>demo</p>',
  },
}

const MockRenderer: MCPUIRendererComponent = ({ onUIAction }) => {
  return (
    <button
      data-testid="mock-renderer"
      onClick={() => onUIAction?.({ type: 'notify', payload: { message: 'from-test' } })}
    >
      Render
    </button>
  )
}

describe('ResourceViewer', () => {
  it('invoca onAction cuando el renderer emite un evento', () => {
    const onAction = vi.fn()

    render(
      <ResourceViewer
        resource={sampleResource}
        isLoading={false}
        error={null}
        onAction={onAction}
        renderer={MockRenderer}
      />,
    )

    fireEvent.click(screen.getByTestId('mock-renderer'))

    expect(onAction).toHaveBeenCalledWith({ type: 'notify', payload: { message: 'from-test' } })
  })

  it('muestra estado de carga cuando no hay recurso aún', () => {
    render(
      <ResourceViewer
        resource={null}
        isLoading
        error={null}
        onAction={vi.fn()}
        renderer={MockRenderer}
      />,
    )

    expect(screen.getByText(/cargando recurso/i)).toBeInTheDocument()
  })
})
