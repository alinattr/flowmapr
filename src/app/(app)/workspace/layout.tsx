/**
 * Workspace layout — wraps all /workspace/* routes.
 * Intentionally minimal: auth is handled per-page to allow
 * different data fetching strategies per route.
 */
import { ActiveProjectProvider } from '@/lib/context/active-project-context'

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <ActiveProjectProvider>{children}</ActiveProjectProvider>
}
