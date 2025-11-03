import { describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

import { usePosts } from '#src/hooks/usePosts'
import { usePostResource } from '#src/hooks/usePostResource'
import type { PostDetails } from '#src/services/postService'
import { HttpError } from '#src/api/httpClient'

const mocks = vi.hoisted(() => ({
  fetchPosts: vi.fn(),
  fetchPostDetails: vi.fn(),
}))

vi.mock('#src/services/postService', () => mocks)

function renderHookWithClient<T>(callback: () => T) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return renderHook(callback, { wrapper })
}

describe('usePosts', () => {
  it('devuelve posts ordenados y sin errores', async () => {
    mocks.fetchPosts.mockResolvedValueOnce([
      { id: 3, userId: 1, title: 'c title', body: 'body c' },
      { id: 1, userId: 1, title: 'a title', body: 'body a' },
    ])

    const { result } = renderHookWithClient(() => usePosts({ limit: 5 }))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.posts.map((post) => post.title)).toEqual(['c title', 'a title'])
    expect(result.current.error).toBeNull()
  })

  it('expone mensaje de error cuando la carga falla', async () => {
    mocks.fetchPosts.mockRejectedValueOnce(new HttpError(500, 'Server', 'fallo'))

    const { result } = renderHookWithClient(() => usePosts({ limit: 5 }))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.posts).toHaveLength(0)
    expect(result.current.error).toContain('fallo')
  })
})

describe('usePostResource', () => {
  const details: PostDetails = {
    post: { id: 7, userId: 1, title: 'Demo', body: 'Linea 1\nLinea 2' },
    user: {
      id: 1,
      name: 'User Demo',
      username: 'demo',
      email: 'demo@example.com',
      phone: '',
      website: '',
      company: { name: 'Demo Inc', catchPhrase: '', bs: '' },
    },
    comments: [
      { id: 10, postId: 7, email: 'one@example.com', name: 'uno', body: 'primer comentario' },
    ],
  }

  it('construye recursos HTML y remote-dom a partir del post', async () => {
    mocks.fetchPostDetails.mockResolvedValueOnce(details)

    const { result } = renderHookWithClient(() => usePostResource(7))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.htmlResource?.resource.mimeType).toBe('text/html')
    expect(result.current.remoteDomResource?.resource.mimeType).toContain('remote-dom')
    expect(result.current.hasResource).toBe(true)
  })

  it('propaga errores en la carga de detalles', async () => {
    mocks.fetchPostDetails.mockRejectedValueOnce(
      new HttpError(404, 'Not Found', 'No se encontró el post'),
    )

    const { result } = renderHookWithClient(() => usePostResource(999))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.htmlResource).toBeNull()
    expect(result.current.error).toContain('No se encontró el post')
  })
})
