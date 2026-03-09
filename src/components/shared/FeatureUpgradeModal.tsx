'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface FeatureUpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  featureName: string
  requiredPlan: 'basic' | 'pro'
}

export function FeatureUpgradeModal({
  open,
  onOpenChange,
  featureName,
  requiredPlan,
}: FeatureUpgradeModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    onOpenChange(false)
    router.push('/settings#billing')
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Upgrade required</DialogTitle>
          <DialogDescription>
            {`"${featureName}" requires the ${requiredPlan === 'basic' ? 'Basic' : 'Pro'} plan.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Maybe later
          </Button>
          <Button onClick={handleUpgrade} disabled={loading}>
            {loading
              ? 'Redirecting...'
              : `Upgrade to ${requiredPlan === 'basic' ? 'Basic' : 'Pro'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
