import { DecisionBadge, MetricCard, Panel, SectionHeader, formatTimestamp, primaryButtonClass, secondaryButtonClass } from './ui'

export default function AuditPanel({ logs, summary, integrity }) {
  return (
    <Panel id="audit-log">
      <SectionHeader
        eyebrow="Tamper-Evident Evidence"
        title="Audit and Threat Intelligence Log"
        description="Every decision records its policy trace, risk signals, framework mappings, and SHA-256 link to the previous event."
        tone="emerald"
        action={
          <div className="flex flex-wrap gap-2">
            <a href="/api/audit/export?format=json" className={secondaryButtonClass}>Export JSON</a>
            <a href="/api/audit/export?format=csv" className={primaryButtonClass}>Export CSV</a>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Requests" value={summary.totalRequests} caption="All recorded decisions" />
        <MetricCard label="Allowed" value={summary.allowCount} caption={`${summary.allowRate}% allow rate`} tone="emerald" />
        <MetricCard label="Denied" value={summary.denyCount} caption="Blocked without decoys" />
        <MetricCard label="Labyrinth" value={summary.labyrinthCount} caption="Diverted sessions" tone="rose" />
        <MetricCard label="Chain status" value={integrity.valid ? 'Verified' : 'Broken'} caption={`${integrity.checked} events checked`} tone={integrity.valid ? 'emerald' : 'rose'} />
      </div>

      <div className={`mt-4 break-all rounded-2xl border px-4 py-3 text-sm ${integrity.valid ? 'border-emerald-300/20 bg-emerald-500/[0.07] text-emerald-100' : 'border-rose-300/20 bg-rose-500/[0.07] text-rose-100'}`}>
        {integrity.valid
          ? `Audit chain verified. Head hash: ${integrity.headHash}`
          : `Audit-chain verification failed at event #${integrity.brokenEventId}. This is tamper-evident, not tamper-proof.`}
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm">
          <caption className="sr-only">Recent zero-trust access decisions and audit hashes</caption>
          <thead>
            <tr className="text-slate-400">
              <th scope="col" className="px-4">Time</th>
              <th scope="col" className="px-4">Identity</th>
              <th scope="col" className="px-4">Request</th>
              <th scope="col" className="px-4">Trust</th>
              <th scope="col" className="px-4">Decision</th>
              <th scope="col" className="px-4">Policy</th>
              <th scope="col" className="px-4">Hash</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="bg-white/[0.035] align-top">
                <td className="rounded-l-2xl px-4 py-4 text-slate-300">{formatTimestamp(log.timestamp)}</td>
                <td className="px-4 py-4"><p className="font-medium text-white">{log.requesterName}</p><p className="text-xs text-slate-500">{log.requesterRole} · {log.identityStatus}</p></td>
                <td className="px-4 py-4"><p className="text-slate-200">{log.resourceLabel}</p><p className="text-xs text-slate-500">{log.action} · {log.resourceClassification}</p></td>
                <td className="px-4 py-4 font-mono text-slate-200">{log.trustScore}</td>
                <td className="px-4 py-4"><DecisionBadge decision={log.decision} /></td>
                <td className="px-4 py-4 text-xs text-slate-400">{log.policyVersion}<br />{log.scenarioId || 'Ad hoc'}</td>
                <td className="rounded-r-2xl px-4 py-4 font-mono text-xs text-cyan-200" title={log.eventHash}>{log.eventHash?.slice(0, 12)}…</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
