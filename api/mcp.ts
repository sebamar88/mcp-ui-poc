import type { IncomingMessage, ServerResponse } from 'http'

import { buildPostSummaryResource } from '#src/services/uiResourceService'
import { fetchPostDetails } from '#src/services/postService'

type VercelRequest = IncomingMessage & {
  query: Record<string, string | string[] | undefined>
}

type VercelResponse = ServerResponse & {
  json: (body: unknown) => void
  status: (code: number) => VercelResponse
}

function parsePostId(queryValue: string | string[] | undefined): number {
  const raw = Array.isArray(queryValue) ? queryValue[0] : queryValue
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const postId = parsePostId(req.query?.postId)

  try {
    const details = await fetchPostDetails(postId)
    const resource = buildPostSummaryResource(details)

    res.status(200).json(resource)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error desconocido al generar el recurso MCP.'
    res.status(500).json({
      error: 'MCP_UI_RESOURCE_ERROR',
      message,
    })
  }
}

