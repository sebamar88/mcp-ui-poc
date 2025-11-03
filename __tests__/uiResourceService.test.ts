import { describe, expect, it } from 'vitest'

import { buildPostRemoteDomResource, buildPostSummaryResource } from '#src/services/uiResourceService'
import type { PostDetails } from '#src/services/postService'

const baseDetails: PostDetails = {
  post: {
    id: 42,
    userId: 9,
    title: '<script>alert("x")</script> demo',
    body: 'Linea uno\nLinea <b>dos</b>',
  },
  user: {
    id: 9,
    name: 'Usuario <Test>',
    username: 'tester',
    email: 'tester@example.com',
    phone: '',
    website: '',
    company: { name: 'Testers SA', catchPhrase: '', bs: '' },
  },
  comments: [
    {
      id: 1,
      postId: 42,
      email: 'comment@example.com',
      name: 'Tester',
      body: 'Buen trabajo',
    },
    {
      id: 2,
      postId: 42,
      email: 'second@example.com',
      name: 'Otro',
      body: 'Segundo comentario',
    },
    {
      id: 3,
      postId: 42,
      email: 'third@example.com',
      name: 'Tercero',
      body: 'Se debería truncar',
    },
  ],
}

describe('buildPostSummaryResource', () => {
  it('escapa HTML y limita comentarios', () => {
    const { resource } = buildPostSummaryResource(baseDetails)

    expect(resource.mimeType).toBe('text/html')
    expect(resource.text).toBeDefined()

    const html = resource.text ?? ''
    expect(html).not.toContain('<script>alert')
    expect(html).toMatch(/Usuario &lt;Test&gt;/)
    expect(html).toContain('Linea uno')
    expect(html).toContain('Linea &lt;b&gt;dos&lt;/b&gt;')
    expect(html).toContain('comment@example.com')
    expect(html).toContain('second@example.com')
    expect(html).not.toContain('third@example.com')
  })
})

describe('buildPostRemoteDomResource', () => {
  it('genera script remote-dom con acciones de notify y tool', () => {
    const { resource } = buildPostRemoteDomResource(baseDetails)

    expect(resource.mimeType).toContain('remote-dom')
    const script = resource.text ?? ''

    expect(script).toContain('window.parent?.postMessage')
    expect(script).toContain('toolName: \'loadExtendedProfile\'')
    expect(script).toContain('Remote DOM – Perfil de')
  })
})
