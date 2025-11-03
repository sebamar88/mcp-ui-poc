import { useEffect, useState } from 'react'

import { ActionLog } from '#src/components/mcp/ActionLog'
import { ResourceViewer } from '#src/components/mcp/ResourceViewer'
import type { UIResourceRendererProps } from '@mcp-ui/client'
import { PostList } from '#src/components/posts/PostList'
import { usePostResource } from '#src/hooks/usePostResource'
import { usePosts } from '#src/hooks/usePosts'
import type { UIAction, UIActionLogEntry } from '#src/types/ui'

import './homePage.css'

function createLogEntry(action: UIAction): UIActionLogEntry {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  return {
    id,
    action,
    receivedAt: new Date(),
  }
}

interface HomePageProps {
  resourceRenderer?: (props: UIResourceRendererProps) => JSX.Element
}

export function HomePage({ resourceRenderer }: HomePageProps = {}) {
  const {
    posts,
    isLoading,
    isFetching: isFetchingPosts,
    error,
    refresh,
  } = usePosts({ limit: 8 })
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [actionLog, setActionLog] = useState<UIActionLogEntry[]>([])

  useEffect(() => {
    if (!selectedPostId && posts.length) {
      setSelectedPostId(posts[0].id)
    }
  }, [posts, selectedPostId])

  const {
    details,
    resource,
    isLoading: resourceLoading,
    isFetching: resourceFetching,
    error: resourceError,
    hasResource,
    refresh: refreshResource,
  } = usePostResource(selectedPostId)

  const handleAction = (action: UIAction) => {
    setActionLog((prev) => {
      const next = [createLogEntry(action), ...prev]
      return next.slice(0, 10)
    })
  }

  return (
    <section className="home-grid">
      <article className="panel">
        <div>
          <h2 className="panel__title">Explorador de posts</h2>
          <p className="panel__description">
            Datos mockeados desde JSONPlaceholder. Al seleccionar un item se
            construye un recurso compatible con MCP-UI.
          </p>
        </div>
        <PostList
          posts={posts}
          selectedId={selectedPostId}
          onSelect={setSelectedPostId}
          isLoading={isLoading}
          isFetching={isFetchingPosts}
          error={error}
          onRetry={() => {
            void refresh()
          }}
        />
      </article>

      <article className="panel">
        <div>
          <h2 className="panel__title">UI Resource Renderer</h2>
          <p className="panel__description">
            Demostración del componente <code>UIResourceRenderer</code> del SDK
            de MCP-UI.
          </p>
        </div>

        <ResourceViewer
          resource={resource}
          isLoading={resourceLoading}
          isFetching={resourceFetching}
          error={resourceError}
          onAction={handleAction}
          onRetry={() => {
            void refreshResource()
          }}
          renderer={resourceRenderer}
        />

        {hasResource && details ? (
          <section>
            <h3 style={{ marginTop: 0 }}>Resumen del post</h3>
            <ul className="post-summary">
              <li>
                Autor: <strong>{details.user.name}</strong> (
                {details.user.email})
              </li>
              <li>Comentarios analizados: {details.comments.length}</li>
            </ul>
          </section>
        ) : null}

        <section>
          <h3 style={{ marginBottom: 12 }}>Bitácora de acciones</h3>
          <ActionLog entries={actionLog} />
        </section>
      </article>
    </section>
  )
}
