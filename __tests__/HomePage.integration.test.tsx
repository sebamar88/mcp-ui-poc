import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { QueryClient } from '@tanstack/react-query'

import { HttpError } from '#src/api/httpClient'
import type { MCPUIRendererComponent } from '#src/components/mcp/ResourceViewer'
import { renderWithProviders } from './utils/renderWithProviders'

const serviceMocks = vi.hoisted(() => ({
  fetchPosts: vi.fn(),
  fetchPostDetails: vi.fn(),
}))

vi.mock('#src/services/postService', () => serviceMocks)

const fetchPostsMock = serviceMocks.fetchPosts
const fetchPostDetailsMock = serviceMocks.fetchPostDetails

import { HomePage } from '#src/pages/home/HomePage'

const MockRenderer: MCPUIRendererComponent = ({ onUIAction }) => (
  <button
    data-testid="mock-renderer"
    onClick={() => onUIAction?.({ type: 'notify', payload: { message: 'mock-notify' } })}
  >
    Mock Renderer
  </button>
)

afterEach(() => {
  fetchPostsMock.mockReset()
  fetchPostDetailsMock.mockReset()
})

describe('HomePage integration', () => {
  it('muestra el resumen y bitácora cuando la consulta es exitosa', async () => {
    fetchPostsMock.mockResolvedValue([
      { id: 1, userId: 7, title: 'Primer post', body: 'Contenido A' },
      { id: 2, userId: 3, title: 'Segundo post', body: 'Contenido B' },
    ])

    fetchPostDetailsMock.mockResolvedValue({
      post: { id: 1, userId: 7, title: 'Primer post', body: 'Texto principal' },
      user: {
        id: 7,
        name: 'Usuario Demo',
        username: 'demo',
        email: 'demo@example.com',
        phone: '123',
        website: 'demo.dev',
      },
      comments: [
        { id: 11, postId: 1, email: 'commenter@example.com', name: 'Comment 1', body: 'Contenido del comentario' },
        { id: 12, postId: 1, email: 'second@example.com', name: 'Comment 2', body: 'Otro comentario' },
      ],
    })

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    })

    renderWithProviders(<HomePage resourceRenderer={MockRenderer} />, { client })

    expect(await screen.findByRole('button', { name: /primer post/i })).toBeInTheDocument()
    expect(await screen.findByText(/Usuario Demo/i)).toBeInTheDocument()
    expect(screen.getByText(/Comentarios analizados: 2/)).toBeInTheDocument()
  })

  it('muestra control de error personalizado cuando falla el detalle del post', async () => {
    fetchPostsMock.mockResolvedValue([
      { id: 1, userId: 7, title: 'Primer post', body: 'Contenido A' },
    ])

    fetchPostDetailsMock.mockRejectedValue(
      new HttpError(500, 'Server Error', 'No se pudo construir la UI del post seleccionado.'),
    )

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    })

    renderWithProviders(<HomePage resourceRenderer={MockRenderer} />, { client })

    expect(await screen.findByText('Algo salió mal')).toBeInTheDocument()
    expect(
      screen.getByText('No se pudo construir la UI del post seleccionado.'),
    ).toBeInTheDocument()
  })

  it('registra acciones provenientes de MCP-UI en la bitácora', async () => {
    fetchPostsMock.mockResolvedValue([
      { id: 1, userId: 7, title: 'Primer post', body: 'Contenido A' },
    ])

    fetchPostDetailsMock.mockResolvedValue({
      post: { id: 1, userId: 7, title: 'Primer post', body: 'Texto principal' },
      user: {
        id: 7,
        name: 'Usuario Demo',
        username: 'demo',
        email: 'demo@example.com',
        phone: '123',
        website: 'demo.dev',
      },
      comments: [
        { id: 11, postId: 1, email: 'commenter@example.com', name: 'Comment 1', body: 'Contenido del comentario' },
      ],
    })

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    })

    renderWithProviders(<HomePage resourceRenderer={MockRenderer} />, { client })

    const renderers = await screen.findAllByTestId('mock-renderer')
    renderers.forEach((button) => {
      fireEvent.click(button)
    })

    const notifications = await screen.findAllByText('Notificación')
    expect(notifications.length).toBeGreaterThanOrEqual(1)
    const payloads = screen.getAllByText(/mock-notify/)
    expect(payloads.length).toBeGreaterThanOrEqual(1)
  })
})
