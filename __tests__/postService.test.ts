import { afterEach, describe, expect, it, vi } from 'vitest'

const clientMocks = vi.hoisted(() => ({
  get: vi.fn(),
}))

vi.mock('#src/api/jsonPlaceholderClient', () => clientMocks)

const getMock = clientMocks.get

afterEach(() => {
  getMock.mockReset()
})

import { fetchPostDetails, fetchPosts } from '#src/services/postService'

describe('postService', () => {
  it('fetchPosts ordena los posts por título y respeta el límite', async () => {
    getMock.mockResolvedValueOnce([
      { id: 2, userId: 1, title: 'B título', body: 'Body B' },
      { id: 1, userId: 1, title: 'A título', body: 'Body A' },
      { id: 3, userId: 1, title: 'C título', body: 'Body C' },
    ])

    const posts = await fetchPosts({ limit: 3 })

    expect(getMock).toHaveBeenCalledWith('posts', { _limit: 3, userId: undefined })
    expect(posts.map((post) => post.title)).toEqual(['A título', 'B título', 'C título'])
  })

  it('fetchPostDetails compone post, usuario y comentarios', async () => {
    getMock.mockImplementation((path: string) => {
      if (path === 'posts/1') {
        return Promise.resolve({
          id: 1,
          userId: 7,
          title: 'Post principal',
          body: 'Contenido del post',
        })
      }

      if (path === 'posts/1/comments') {
        return Promise.resolve([
          { id: 11, postId: 1, email: 'demo@example.com', name: 'Demo', body: 'Comentario 1' },
        ])
      }

      if (path === 'users/7') {
        return Promise.resolve({
          id: 7,
          name: 'Usuario Demo',
          username: 'demo',
          email: 'demo@example.com',
          phone: '123',
          website: 'demo.dev',
        })
      }

      return Promise.reject(new Error(`Ruta no soportada: ${path}`))
    })

    const details = await fetchPostDetails(1)

    expect(details.post.title).toBe('Post principal')
    expect(details.user.name).toBe('Usuario Demo')
    expect(details.comments).toHaveLength(1)
  })
})
