import { Panel, SectionHeader, permissionLabel } from './ui'

const permissionTone = {
  full: 'text-emerald-200',
  read: 'text-sky-200',
  'owner only': 'text-fuchsia-200',
  none: 'text-slate-500',
}

export default function PolicyMatrix({ policies, policyVersion }) {
  const labels = Object.fromEntries(policies.map((policy) => [policy.resource, policy.label]))
  return (
    <Panel id="policy-matrix">
      <SectionHeader
        eyebrow={`Policy ${policyVersion}`}
        title="Least-Privilege Policy Matrix"
        description="Standing entitlement is one input to the decision. MFA, identity lifecycle, device posture, and behavior are evaluated separately on every request."
      />
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm">
          <caption className="sr-only">Standing permissions for each protected resource and role</caption>
          <thead>
            <tr className="text-slate-400">
              <th scope="col" className="px-4 pb-1">Resource</th>
              {['Admin', 'Executive', 'Manager', 'Employee'].map((role) => <th scope="col" key={role} className="px-4 pb-1">{role}</th>)}
            </tr>
          </thead>
          <tbody>
            {policies.map((policy) => (
              <tr key={policy.resource} className="bg-white/[0.035] align-top">
                <th scope="row" className="min-w-72 rounded-l-2xl px-4 py-4 font-normal">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white">{policy.label}</span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-slate-400">{policy.classification}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{policy.note}</p>
                  {policy.inheritsFrom ? <p className="mt-2 text-xs text-cyan-200">Inherits from {labels[policy.inheritsFrom]}</p> : null}
                </th>
                {['Admin', 'Executive', 'Manager', 'Employee'].map((role) => (
                  <td key={role} className={`px-4 py-4 font-medium ${permissionTone[policy.permissions[role]] ?? permissionTone.none}`}>
                    {permissionLabel(policy.permissions[role])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
