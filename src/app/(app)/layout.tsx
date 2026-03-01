import { CrispIdentify } from '@/components/CrispIdentify'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <CrispIdentify />
    </>
  )
}
