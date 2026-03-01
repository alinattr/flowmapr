interface ApiEndpoint {
  id: string
  method: string
  path: string
  summary: string
  description?: string
  tags?: string[]
  parameters?: Array<{
    name: string
    in: string
    required: boolean
    type: string
    description?: string
  }>
  requestBody?: { contentType: string; schema: string } | null
  responses?: Array<{ status: number; description: string; schema?: string | null }>
}

interface ApiService {
  id: string
  name: string
  endpoints: ApiEndpoint[]
}

export function exportOpenApi(services: ApiService[], title = 'API Documentation'): string {
  const paths: Record<string, Record<string, unknown>> = {}

  for (const svc of services) {
    for (const ep of svc.endpoints) {
      const pathKey = ep.path
      if (!paths[pathKey]) paths[pathKey] = {}

      const method = ep.method.toLowerCase()
      const params = (ep.parameters ?? [])
        .filter(p => p.in !== 'body')
        .map(p => ({
          name: p.name,
          in: p.in,
          required: p.required,
          description: p.description ?? '',
          schema: { type: p.type || 'string' },
        }))

      const operation: Record<string, unknown> = {
        summary: ep.summary,
        description: ep.description ?? '',
        tags: ep.tags?.length ? ep.tags : [svc.name],
        parameters: params,
        responses: {},
      }

      const responses: Record<string, unknown> = {}
      for (const resp of ep.responses ?? []) {
        responses[String(resp.status)] = {
          description: resp.description,
          ...(resp.schema ? { content: { 'application/json': { schema: { type: 'object', example: resp.schema } } } } : {}),
        }
      }
      if (Object.keys(responses).length === 0) {
        responses['200'] = { description: 'Success' }
      }
      operation.responses = responses

      if (ep.requestBody) {
        operation.requestBody = {
          content: {
            [ep.requestBody.contentType || 'application/json']: {
              schema: { type: 'object', example: ep.requestBody.schema },
            },
          },
        }
      }

      paths[pathKey][method] = operation
    }
  }

  const spec = {
    openapi: '3.0.0',
    info: { title, version: '1.0.0' },
    paths,
  }

  return JSON.stringify(spec, null, 2)
}

export function downloadOpenApi(services: ApiService[], title = 'API Documentation') {
  const json = exportOpenApi(services, title)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'openapi.json'
  a.click()
  URL.revokeObjectURL(url)
}
