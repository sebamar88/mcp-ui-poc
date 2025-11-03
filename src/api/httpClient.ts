export type QueryParamValue = string | number | boolean | null | undefined

export interface HttpClientConfig {
  baseUrl: string
  defaultHeaders?: HeadersInit
  fetchImpl?: typeof fetch
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  searchParams?: Record<string, QueryParamValue>
  body?: Record<string, unknown> | FormData | string
}

export class HttpError extends Error {
  readonly status: number
  readonly statusText: string
  readonly body?: unknown

  constructor(
    status: number,
    statusText: string,
    message: string,
    body?: unknown,
  ) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.statusText = statusText
    this.body = body
  }
}

export class HttpClient {
  private readonly baseUrl: URL
  private readonly headers: HeadersInit
  private readonly fetchImpl: typeof fetch

  constructor({ baseUrl, defaultHeaders, fetchImpl }: HttpClientConfig) {
    this.baseUrl = new URL(baseUrl)
    this.headers = defaultHeaders ?? {}
    const resolvedFetch = fetchImpl ?? globalThis.fetch
    this.fetchImpl =
      resolvedFetch === fetchImpl ? resolvedFetch : resolvedFetch.bind(globalThis)
  }

  async get<T>(path: string, options: RequestOptions = {}) {
    return this.request<T>(path, { ...options, method: 'GET' })
  }

  async post<T>(path: string, options: RequestOptions = {}) {
    return this.request<T>(path, { ...options, method: 'POST' })
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, options.searchParams)
    const { headers: overrideHeaders, body, ...rest } = options

    const headers = new Headers(this.headers)

    if (overrideHeaders) {
      const override = new Headers(overrideHeaders)
      override.forEach((value, key) => {
        headers.set(key, value)
      })
    }

    if (body && !(body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }

    const response = await this.fetchImpl(url.toString(), {
      ...rest,
      headers,
      body:
        body instanceof FormData
          ? body
          : typeof body === 'string'
            ? body
            : body
              ? JSON.stringify(body)
              : undefined,
    })

    if (!response.ok) {
      throw await this.toHttpError(response)
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      return (await response.json()) as T
    }

    return (await response.text()) as T
  }

  private buildUrl(path: string, params: RequestOptions['searchParams']) {
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path
    const url = new URL(normalizedPath, this.baseUrl)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          return
        }
        url.searchParams.set(key, String(value))
      })
    }

    return url
  }

  private async toHttpError(response: Response) {
    let body: unknown
    try {
      const contentType = response.headers.get('content-type') ?? ''
      if (contentType.includes('application/json')) {
        body = await response.json()
      } else {
        body = await response.text()
      }
    } catch {
      body = null
    }

    const message = this.resolveErrorMessage(response.status, response.statusText)
    return new HttpError(response.status, response.statusText, message, body)
  }

  private resolveErrorMessage(status: number, statusText: string) {
    const messages: Record<number, string> = {
      400: 'La solicitud es inválida. Verifica los datos enviados.',
      401: 'Necesitas iniciar sesión para continuar.',
      403: 'No tienes permisos para realizar esta acción.',
      404: 'El recurso solicitado no fue encontrado.',
      408: 'La solicitud tardó demasiado en responder.',
      429: 'Demasiadas solicitudes. Intenta nuevamente más tarde.',
      500: 'Ocurrió un error interno en el servidor.',
      502: 'El servidor respondió con una puerta de enlace inválida.',
      503: 'Servicio no disponible temporalmente.',
      504: 'Tiempo de espera agotado al contactar el servidor.',
    }

    return messages[status] ?? `Solicitud fallida (${status} ${statusText})`
  }
}
