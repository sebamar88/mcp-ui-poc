import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { fetchPosts } from '#src/services/postService'
import type { Post } from '#src/types/jsonPlaceholder'
import { extractErrorMessage } from '#src/utils/errorHandling'

interface UsePostsOptions {
  limit?: number
}

export function usePosts({ limit = 6 }: UsePostsOptions = {}) {
  const query = useQuery<Post[], Error>({
    queryKey: ['posts', limit],
    queryFn: () => fetchPosts({ limit }),
  })

  const errorMessage = useMemo(
    () =>
      query.error
        ? extractErrorMessage(query.error, 'No pudimos obtener la lista de posts.')
        : null,
    [query.error],
  )

  return {
    posts: query.data ?? [],
    isLoading: query.isPending,
    isFetching: query.isFetching,
    error: errorMessage,
    refresh: query.refetch,
  }
}
