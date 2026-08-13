import { DecisionBadge, Panel, SectionHeader, traceStyles } from './ui'

function TrustMeter({ score }) {
  const tone = score >= 70 ? 'from-cyan-400 to-emerald-300' : score >= 40 ? 'from-amber-400 to-orange-300' : 'from-rose-500 to-fuchsia-400'
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Calculated trust</p>
          <p className="mt-1 text-4xl font-semibold text-white">{score}<span className="text-base text-slate-500">/100</span></p>
        </div>
        <p className="text-right text-xs leading-5 text-slate-400">Recomputed for this request<br />No standing session trust</p>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/5" role="meter" aria-label="Calculated trust score" aria-valuemin="0" aria-valuemax="100" aria-valuenow={score}>
        <div className={`h-full rounded-full bg-gradient-to-r ${tone}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

export default function DecisionPanel({ decision }) {
  return (
    <Panel id="decision" aria-live="polite">
      <SectionHeader
        eyebrow="Policy Decision Point"
        title="Explainable Guardian Decision"
        description="The deterministic engine is authoritative. The analyst brief explains the result but cannot grant access."
        action={<DecisionBadge decision={decision.decision} />}
      />

      <div className="rounded-[24px] border border-white/10 bg-slate-950/55 p-5">
        <TrustMeter score={decision.trustScore ?? 0} />
        <div className="mt-5 border-t border-white/10 pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Plain-language result</p>
          <p className="mt-2 text-sm leading-7 text-slate-200">{decision.explanation}</p>
        </div>
      </div>

      {decision.analystBrief ? (
        <article className="mt-4 rounded-[24px] border border-cyan-300/15 bg-cyan-400/[0.06] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Advisory analyst brief</p>
            <span className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-1 text-[11px] text-slate-300">Cannot override policy</span>
          </div>
          <h3 className="mt-3 font-semibold text-white">{decision.analystBrief.headline}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{decision.analystBrief.summary}</p>
          <p className="mt-3 text-sm leading-6 text-cyan-100"><strong>Next step:</strong> {decision.analystBrief.nextStep}</p>
        </article>
      ) : null}

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-white">Policy evaluation trace</h3>
        <ol className="mt-3 space-y-2">
          {(decision.policyTrace || []).map((item, index) => (
            <li key={item.id} className={`rounded-2xl border px-4 py-3 ${traceStyles[item.outcome] ?? traceStyles.warn}`}>
              <div className="flex gap-3">
                <span className="font-mono text-xs opacity-70">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 opacity-80">{item.detail}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {decision.riskFactors?.length ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-white">Trust deductions</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {decision.riskFactors.map((factor) => (
              <article key={factor.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-slate-100">{factor.label}</p>
                  <span className="font-mono text-sm text-rose-200">{factor.impact}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-400">{factor.detail}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </Panel>
  )
}
