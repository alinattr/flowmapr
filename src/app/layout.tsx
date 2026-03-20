import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/lib/theme/ThemeProvider'
import { CrispChat } from '@/components/CrispChat'
import { SpeedInsights } from "@vercel/speed-insights/next"
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: {
    default: 'Flowmapr — AI Diagram Generator | BPMN, UML, C4, ERD',
    template: '%s | Flowmapr',
  },
  description: 'Generate professional BPMN, UML Sequence, ERD, Flowchart and C4 diagrams from plain text in seconds. No Visio, no draw.io. Try free — no credit card required.',
  keywords: ['AI diagram generator', 'BPMN generator', 'UML sequence diagram', 'C4 diagram tool', 'ERD generator', 'flowchart maker', 'diagram from text', 'API documentation generator'],
  authors: [{ name: 'Flowmapr' }],
  creator: 'Flowmapr',
  metadataBase: new URL('https://app.flowmapr.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://app.flowmapr.com',
    title: 'Flowmapr — AI Diagram Generator',
    description: 'Generate professional BPMN, UML, C4, ERD diagrams from plain text. No code. No Visio.',
    siteName: 'Flowmapr',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Flowmapr — AI Diagram Generator' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flowmapr — AI Diagram Generator',
    description: 'Generate professional BPMN, UML, C4, ERD diagrams from plain text in seconds.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster position="bottom-right" richColors closeButton />
        </ThemeProvider>
        <CrispChat />
        <SpeedInsights />
      </body>
    </html>
  )
}
