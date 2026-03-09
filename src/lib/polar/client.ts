import { Polar } from '@polar-sh/sdk'

export type PolarServer = 'production' | 'sandbox'

export function getPolarServer(): PolarServer {
  return process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
}

export function createPolarClient() {
  const accessToken = process.env.POLAR_ACCESS_TOKEN?.trim() ?? ''
  return new Polar({
    accessToken,
    server: getPolarServer(),
  })
}

export function getPolarOrganizationId(): string | null {
  const orgId = process.env.POLAR_ORGANIZATION_ID?.trim() ?? ''
  return orgId.length > 0 ? orgId : null
}
