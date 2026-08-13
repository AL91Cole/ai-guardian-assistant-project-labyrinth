import { DecisionBadge, Panel, SectionHeader, primaryButtonClass, secondaryButtonClass } from './ui'

export default function ScenarioLab({ scenarios, selectedScenarioId, onSelect, onLoad, onRun, isSubmitting }) {
  const selected = scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? scenarios[0]

  return (
    <Panel id="scenarios">
      <SectionHeader
        eyebrow="Guided Training"
        title="Detection Scenario Lab"
        description="Load a curated incident, inspect the signals, and compare the actual policy decision with the expected defensive outcome."
      />
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <label htmlFor="scenario-selector" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Scenario
          </label>
          <select
            id="scenario-selector"
            value={selected?.id || ''}
            onChange={(event) => onSelect(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/75 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/20"
          >
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>{scenario.title}</option>
            ))}
          </select>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className={secondaryButtonClass} onClick={() => onLoad(selected)}>
              Load into console
            </button>
            <button type="button" className={primaryButtonClass} disabled={isSubmitting} onClick={() => onRun(selected)}>
              {isSubmitting ? 'Running…' : 'Run scenario'}
            </button>
          </div>
        </div>
        {selected ? (
          <article className="rounded-[24px] border border-white/10 bg-slate-950/55 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">{selected.category}</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{selected.title}</h3>
              </div>
              <div className="text-right">
                <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-slate-500">Expected</p>
                <DecisionBadge decision={selected.expectedDecision} />
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{selected.summary}</p>
            <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-cyan-400/5 px-4 py-3 text-sm leading-6 text-cyan-100">
              <strong>Learning objective:</strong> {selected.objective}
            </div>
            {selected.attackTechniques.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {selected.attackTechniques.map((technique) => (
                  <a key={technique.id} href={technique.url} target="_blank" rel="noreferrer" className="rounded-full border border-rose-300/20 bg-rose-500/10 px-3 py-1 text-xs text-rose-100 hover:bg-rose-500/20">
                    MITRE {technique.id} · {technique.name}
                  </a>
                ))}
              </div>
            ) : null}
          </article>
        ) : null}
      </div>
    </Panel>
  )
}
