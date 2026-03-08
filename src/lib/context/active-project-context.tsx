'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

interface ActiveProjectContextType {
  activeProjectId: string | null
  activeProjectName: string | null
  activeProjectIsDefault: boolean
  setActiveProject: (id: string | null, name: string | null, isDefault?: boolean) => void
}

const ActiveProjectContext = createContext<ActiveProjectContextType>({
  activeProjectId: null,
  activeProjectName: null,
  activeProjectIsDefault: false,
  setActiveProject: () => {},
})

export function ActiveProjectProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeProjectName, setActiveProjectName] = useState<string | null>(null)
  const [activeProjectIsDefault, setActiveProjectIsDefault] = useState(false)

  const setActiveProject = useCallback(
    (id: string | null, name: string | null, isDefault = false) => {
      setActiveProjectId(id)
      setActiveProjectName(name)
      setActiveProjectIsDefault(isDefault)
    },
    [],
  )

  return (
    <ActiveProjectContext.Provider
      value={{ activeProjectId, activeProjectName, activeProjectIsDefault, setActiveProject }}
    >
      {children}
    </ActiveProjectContext.Provider>
  )
}

export const useActiveProject = () => useContext(ActiveProjectContext)
