import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'

import { createQueryClient } from '#src/api/queryClient'

interface RenderOptions {
  client?: QueryClient
}

export function renderWithProviders(ui: ReactElement, options: RenderOptions = {}) {
  const queryClient = options.client ?? createQueryClient()

  const result = render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )

  return {
    queryClient,
    ...result,
  }
}
