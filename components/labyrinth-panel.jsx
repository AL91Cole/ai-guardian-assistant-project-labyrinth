import { Panel, SectionHeader, SeverityBadge, formatTimestamp } from './ui'

function TechniqueLinks({ label, techniques, tone }) {
  if (!techniques?.length) return null
  const color = tone === 'rose' ? 'border-rose-300/20 bg-rose-500/10 text-rose-100' : 'border-cyan-300/20 bg-cyan-500/10 text-cyan-100'
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {techniques.map((technique) => (
          <a key={technique.id} href={technique.url} target="_blank" rel="noreferrer" className={`rounded-full border px-3 py-1 text-xs hover:brightness-125 ${color}`}>
            {technique.id} · {technique.name}
          </a>
        ))}
      </div>
    </div>
  )
}

export default function LabyrinthPanel({ events }) {
  return (
    <Panel id="labyrinth">
      <SectionHeader
        eyebrow="Defensive Deception"
        title="The Labyrinth"
        description="High-risk sessions are diverted into a simulated decoy environment. Production data stays outside the route."
        tone="rose"
      />
      <div className="space-y-4">
        {events.length ? events.map((event) => (
          <article key={event.id} className="rounded-[24px] border border-rose-300/15 bg-slate-950/55 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">{formatTimestamp(event.timestamp)} · Event #{event.id}</p>
                <h3 className="mt-1 font-semibold text-white">{event.requesterName} ({event.requesterRole}) → {event.resourceLabel}</h3>
              </div>
              <SeverityBadge severity={event.severity} />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{event.explanation}</p>
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Observed indicators</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-200">
                  {event.indicators.map((indicator) => <li key={indicator}>• {indicator}</li>)}
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Decoy assets</p>
                <ul className="mt-3 space-y-2 font-mono text-xs text-cyan-100">
                  {event.fakeAssetsVisited.map((asset) => <li key={asset} className="break-all">{asset}</li>)}
                </ul>
              </div>
            </div>
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <TechniqueLinks label="MITRE ATT&CK hypothesis" techniques={event.attackTechniques} tone="rose" />
              <TechniqueLinks label="MITRE D3FEND controls" techniques={event.defensiveTechniques} tone="cyan" />
            </div>
            {event.containment ? <p className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-100">{event.containment}</p> : null}
          </article>
        )) : (
          <p className="rounded-2xl border border-white/10 bg-slate-950/50 p-5 text-sm text-slate-400">No session has been routed into The Labyrinth.</p>
        )}
      </div>
    </Panel>
  )
}
