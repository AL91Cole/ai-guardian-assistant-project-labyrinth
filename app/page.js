import Dashboard from '@/components/dashboard'
import {
  getAuditIntegrity,
  getDecisionSummary,
  getLabyrinthEvents,
  getRecentAlerts,
  getRecentLogs,
} from '@/lib/db'
import {
  actionOptions,
  deviceComplianceOptions,
  identityStatusOptions,
  networkZoneOptions,
  policyMatrix,
  policyVersion,
  resourceOptions,
  roleOptions,
} from '@/lib/policies'
import { getScenarioCatalog } from '@/lib/scenarios'
import { defaultVaultOwner, getVaultOwners, getVaultSimulation } from '@/lib/vault'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  const initialVault = getVaultSimulation({
    requesterRole: 'Employee',
    requesterName: defaultVaultOwner,
    vaultOwner: defaultVaultOwner,
    ownerKeyPresent: false,
    allowed: false,
  })

  return (
    <Dashboard
      initialData={{
        logs: getRecentLogs(20),
        labyrinthEvents: getLabyrinthEvents(10),
        alerts: getRecentAlerts(20),
        summary: getDecisionSummary(),
        integrity: getAuditIntegrity(),
        vault: initialVault,
        roles: roleOptions,
        actions: actionOptions,
        resources: resourceOptions,
        policies: policyMatrix,
        policyVersion,
        vaultOwners: getVaultOwners(),
        identityStatuses: identityStatusOptions,
        deviceCompliance: deviceComplianceOptions,
        networkZones: networkZoneOptions,
        scenarios: getScenarioCatalog(),
      }}
    />
  )
}
