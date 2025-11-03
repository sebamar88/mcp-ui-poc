import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { fetchPostDetails } from '#src/services/postService'
import type { PostDetails } from '#src/services/postService'
import { buildPostSummaryResource } from '#src/services/uiResourceService'
import type { UIResource } from '#src/types/ui'
import { extractErrorMessage } from '#src/utils/errorHandling'

export function usePostResource(postId: number | null) {
  const query = useQuery<PostDetails, Error>({
    queryKey: ['postDetails', postId],
    enabled: Boolean(postId),
    queryFn: () => fetchPostDetails(postId as number),
  })

  const resource = useMemo<UIResource | null>(() => {
    if (!query.data) {
      return null
    }
    return buildPostSummaryResource(query.data)
  }, [query.data])

  const errorMessage = useMemo(
    () =>
      query.error
        ? extractErrorMessage(
            query.error,
            'No se pudo construir la UI del post seleccionado.',
          )
        : null,
    [query.error],
  )

  return {
    details: query.data ?? null,
    resource,
    isLoading: query.isPending,
    isFetching: query.isFetching,
    error: errorMessage,
    hasResource: Boolean(resource && query.data),
    refresh: query.refetch,
  }
}
