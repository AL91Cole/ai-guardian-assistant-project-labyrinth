export const decisionStyles = {
  'Awaiting Request': 'border-slate-500/30 bg-slate-500/10 text-slate-200',
  Allow: 'border-emerald-300/30 bg-emerald-500/10 text-emerald-100',
  Deny: 'border-amber-300/30 bg-amber-500/10 text-amber-100',
  'Route to Labyrinth': 'border-rose-300/30 bg-rose-500/10 text-rose-100',
}

export const severityStyles = {
  Medium: 'border-amber-300/30 bg-amber-500/10 text-amber-100',
  High: 'border-orange-300/30 bg-orange-500/10 text-orange-100',
  Critical: 'border-rose-300/30 bg-rose-500/10 text-rose-100',
}

export const traceStyles = {
  pass: 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100',
  warn: 'border-amber-300/20 bg-amber-500/10 text-amber-100',
  fail: 'border-rose-300/20 bg-rose-500/10 text-rose-100',
}

export function Panel({ as: Element = 'section', id, className = '', children, ...props }) {
  return (
    <Element id={id} className={`section-anchor glass rounded-[28px] p-5 md:p-6 ${className}`} {...props}>
      {children}
    </Element>
  )
}

export function SectionHeader({ eyebrow, title, description, tone = 'cyan', action = null }) {
  const toneClass =
    tone === 'rose'
      ? 'border-rose-300/20 bg-rose-500/10 text-rose-100'
      : tone === 'fuchsia'
        ? 'border-fuchsia-300/20 bg-fuchsia-500/10 text-fuchsia-100'
        : tone === 'emerald'
          ? 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100'
          : 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100'

  return (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${toneClass}`}>
          {eyebrow}
        </div>
        <h2 className="mt-2 text-xl font-semibold text-white md:text-2xl">{title}</h2>
        {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function MetricCard({ label, value, caption, tone = 'cyan' }) {
  const valueTone =
    tone === 'rose' ? 'text-rose-200' : tone === 'emerald' ? 'text-emerald-200' : 'text-cyan-100'
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${valueTone}`}>{value}</p>
      <p className="mt-1 text-sm leading-5 text-slate-400">{caption}</p>
    </div>
  )
}

export function Field({ id, label, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p> : null}
    </div>
  )
}

export function ToggleField({ id, checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
      <div>
        <p id={`${id}-label`} className="text-sm font-medium text-slate-100">{label}</p>
        {description ? <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 shrink-0 rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
          checked ? 'border-cyan-300/60 bg-cyan-400/25' : 'border-white/15 bg-slate-900'
        }`}
      >
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${checked ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  )
}

export function DecisionBadge({ decision }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${decisionStyles[decision] ?? decisionStyles['Awaiting Request']}`}>
      {decision}
    </span>
  )
}

export function SeverityBadge({ severity }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${severityStyles[severity] ?? severityStyles.Medium}`}>
      {severity || 'Medium'}
    </span>
  )
}

export function formatTimestamp(value) {
  if (!value) return 'Unknown time'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function permissionLabel(value) {
  if (value === 'full') return 'Full Control'
  if (value === 'read') return 'Read'
  if (value === 'owner only') return 'Owner Only'
  return 'No Access'
}

export const controlClass =
  'w-full rounded-2xl border border-white/10 bg-slate-950/75 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/20'

export const primaryButtonClass =
  'rounded-2xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-60'

export const secondaryButtonClass =
  'rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-60'
