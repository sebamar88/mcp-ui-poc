import { HttpError } from '#src/api/httpClient'

export function extractErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error inesperado. Inténtalo nuevamente.',
) {
  if (error instanceof HttpError) {
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }

  return fallback
}
