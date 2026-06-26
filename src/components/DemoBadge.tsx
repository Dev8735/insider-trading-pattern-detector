import { WifiOff } from 'lucide-react'
import { Pill } from './RiskPill'

// Shown near any section whose data fell back to local mock data.
export function DemoBadge({ className }: { className?: string }) {
  return (
    <Pill color="gray" className={className}>
      <WifiOff size={12} strokeWidth={1.75} />
      Demo data — backend offline
    </Pill>
  )
}
