import { ErrorCallout } from '#src/components/feedback/ErrorCallout'
import type { Post } from '#src/types/jsonPlaceholder'

interface PostListProps {
  posts: Post[]
  selectedId: number | null
  onSelect: (postId: number) => void
  isLoading: boolean
  isFetching: boolean
  error?: string | null
  onRetry?: () => void
}

export function PostList({
  posts,
  selectedId,
  onSelect,
  isLoading,
  isFetching,
  error,
  onRetry,
}: PostListProps) {
  if (isLoading) {
    return <p>Cargando posts…</p>
  }

  if (error) {
    return <ErrorCallout message={error} onRetry={onRetry} />
  }

  if (!posts.length) {
    return <p>No hay posts disponibles.</p>
  }

  return (
    <ul className="post-list">
      {isFetching ? (
        <li>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Actualizando lista…
          </span>
        </li>
      ) : null}
      {posts.map((post) => {
        const isActive = post.id === selectedId
        return (
          <li key={post.id}>
            <button
              type="button"
              className={`post-list__item ${isActive ? 'post-list__item--active' : ''}`}
              onClick={() => onSelect(post.id)}
            >
              <span className="post-list__title">{post.title}</span>
              <span className="post-list__excerpt">{post.body}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
