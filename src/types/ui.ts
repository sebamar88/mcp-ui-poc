import type { UIActionResult } from '@mcp-ui/client'

export type MCPResourceMimeType =
  | 'text/html'
  | 'text/uri-list'
  | 'application/vnd.mcp-ui.remote-dom'

export interface UIResource {
  type: 'resource'
  resource: {
    uri: string
    mimeType: MCPResourceMimeType
    text?: string
    blob?: string
  }
}

export type UIAction = UIActionResult

export interface UIActionLogEntry {
  id: string
  action: UIAction
  receivedAt: Date
}

export function isUIResource(input: unknown): input is UIResource {
  if (
    typeof input !== 'object' ||
    input === null ||
    (input as UIResource).type !== 'resource'
  ) {
    return false
  }

  const resource = (input as UIResource).resource
  return Boolean(
    resource &&
      typeof resource === 'object' &&
      'uri' in resource &&
      typeof resource.uri === 'string' &&
      'mimeType' in resource &&
      typeof resource.mimeType === 'string',
  )
}
