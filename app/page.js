import Dashboard from '@/components/dashboard'
import { getDecisionSummary, getLabyrinthEvents, getRecentLogs } from '@/lib/db'
import { actionOptions, getResourceLabel, policyMatrix, resourceOptions, roleOptions } from '@/lib/policies'
import { defaultVaultOwner, getVaultOwners, getVaultSimulation } from '@/lib/vault'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  const initialVault = getVaultSimulation({
    requesterRole: 'Employee',
    requesterName: defaultVaultOwner,
    vaultOwner: defaultVaultOwner,
    allowed: true,
  })

  return (
    <Dashboard
      initialData={{
        logs: getRecentLogs(12),
        labyrinthEvents: getLabyrinthEvents(6),
        summary: getDecisionSummary(),
        vault: initialVault,
        roles: roleOptions,
        actions: actionOptions,
        resources: resourceOptions.map((item) => ({
          ...item,
          description: getResourceLabel(item.value),
        })),
        policies: policyMatrix,
        vaultOwners: getVaultOwners(),
      }}
    />
  )
}
