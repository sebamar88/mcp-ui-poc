import { QueryClient } from '@tanstack/react-query'

const DEFAULT_OPTIONS = {
  queries: {
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 60 * 1000,
  },
}

export function createQueryClient() {
  return new QueryClient({ defaultOptions: DEFAULT_OPTIONS })
}

export const queryClient = createQueryClient()

