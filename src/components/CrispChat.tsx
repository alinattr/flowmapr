'use client'
import { useEffect } from 'react'

declare global {
  interface Window {
    $crisp: unknown[]
    CRISP_WEBSITE_ID: string
  }
}

export function CrispChat() {
  useEffect(() => {
    window.$crisp = []
    window.CRISP_WEBSITE_ID = 'e164a0a7-7d70-4c79-9219-f2571ef93f7b'
    window.$crisp.push(['config', 'color:theme', 'purple'])
    window.$crisp.push(['config', 'color:scheme', 'dark'])
    window.$crisp.push(['safe', true])

    const script = document.createElement('script')
    script.src = 'https://client.crisp.chat/l.js'
    script.async = true
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) document.head.removeChild(script)
    }
  }, [])

  return null
}
