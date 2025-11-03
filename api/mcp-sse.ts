import type { IncomingMessage, ServerResponse } from 'http'

import {
  buildPostRemoteDomResource,
  buildPostSummaryResource,
} from '#src/services/uiResourceService'
import { fetchPostDetails } from '#src/services/postService'

type VercelRequest = IncomingMessage & {
  query: Record<string, string | string[] | undefined>
}

type VercelResponse = ServerResponse & {
  json: (body: unknown) => void
  status: (code: number) => VercelResponse
  write: (chunk: string) => void
  end: () => void
}

function parsePostId(queryValue: string | string[] | undefined): number {
  const raw = Array.isArray(queryValue) ? queryValue[0] : queryValue
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function parseMode(queryValue: string | string[] | undefined): 'html' | 'remote' {
  const raw = (Array.isArray(queryValue) ? queryValue[0] : queryValue)?.toLowerCase()
  return raw === 'remote' ? 'remote' : 'html'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar headers para SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control')

  const postId = parsePostId(req.query?.postId)
  const mode = parseMode(req.query?.mode)

  try {
    // Enviar evento de inicio
    res.write(`event: connected\n`)
    res.write(`data: {"message": "Conectado al servidor MCP", "timestamp": "${new Date().toISOString()}"}\n\n`)

    // Simular carga de datos
    res.write(`event: loading\n`)
    res.write(`data: {"message": "Cargando datos del post ${postId}...", "postId": ${postId}}\n\n`)

    // Obtener los datos
    const details = await fetchPostDetails(postId)
    
    // Enviar el recurso solicitado
    const resource = mode === 'remote'
      ? buildPostRemoteDomResource(details)
      : buildPostSummaryResource(details)

    res.write(`event: resource\n`)
    res.write(`data: ${JSON.stringify(resource)}\n\n`)

    // Enviar evento de finalización
    res.write(`event: completed\n`)
    res.write(`data: {"message": "Recurso MCP generado exitosamente", "mode": "${mode}"}\n\n`)

    // Mantener la conexión abierta por un tiempo antes de cerrar
    setTimeout(() => {
      res.write(`event: close\n`)
      res.write(`data: {"message": "Cerrando conexión"}\n\n`)
      res.end()
    }, 1000)

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido al generar el recurso MCP.'
    
    res.write(`event: error\n`)
    res.write(`data: ${JSON.stringify({
      error: 'MCP_UI_RESOURCE_ERROR',
      message,
      timestamp: new Date().toISOString()
    })}\n\n`)
    
    setTimeout(() => {
      res.end()
    }, 500)
  }
}