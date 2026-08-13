'use client'

import { useState } from 'react'
import { Panel, SectionHeader, SeverityBadge, controlClass, formatTimestamp, secondaryButtonClass } from './ui'

const statusOptions = ['New', 'Investigating', 'Contained', 'Closed']
const dispositionOptions = ['Unreviewed', 'True Positive', 'Benign', 'False Positive']

function AlertCard({ alert, onUpdate }) {
  const [assignee, setAssignee] = useState(alert.assignee)
  const [notes, setNotes] = useState(alert.notes)
  const [saving, setSaving] = useState(false)

  async function update(changes) {
    setSaving(true)
    try {
      await onUpdate(alert.id, changes)
    } catch {
      // The dashboard owns the user-facing error notice.
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="rounded-[24px] border border-white/10 bg-slate-950/55 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">Alert #{alert.id} · {formatTimestamp(alert.updatedAt)}</p>
          <h3 className="mt-1 font-semibold text-white">{alert.event.requesterName} → {alert.event.resourceLabel}</h3>
          <p className="mt-1 text-xs text-slate-400">Event #{alert.auditLogId} · {alert.event.scenarioId || 'Ad hoc request'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SeverityBadge severity={alert.severity} />
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-200">{alert.status}</span>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-300">{alert.event.analystBrief?.summary || alert.event.explanation}</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor={`alert-${alert.id}-assignee`} className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Assignee</label>
          <input id={`alert-${alert.id}-assignee`} maxLength={80} value={assignee} onChange={(event) => setAssignee(event.target.value)} className={controlClass} />
        </div>
        <div>
          <label htmlFor={`alert-${alert.id}-disposition`} className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Disposition</label>
          <select id={`alert-${alert.id}-disposition`} value={alert.disposition} disabled={saving} onChange={(event) => update({ disposition: event.target.value })} className={controlClass}>
            {dispositionOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor={`alert-${alert.id}-notes`} className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Analyst notes</label>
        <textarea id={`alert-${alert.id}-notes`} rows="3" maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} className={controlClass} placeholder="Record simulated investigation evidence and reasoning." />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {statusOptions.map((status) => (
          <button key={status} type="button" disabled={saving || alert.status === status} onClick={() => update({ status })} className={secondaryButtonClass}>
            {status}
          </button>
        ))}
        <button type="button" disabled={saving || !assignee.trim()} onClick={() => update({ assignee, notes })} className={secondaryButtonClass}>
          {saving ? 'Saving…' : 'Save case details'}
        </button>
      </div>
    </article>
  )
}

export default function AlertTriage({ alerts, onUpdate }) {
  const openAlerts = alerts.filter((alert) => alert.status !== 'Closed')
  return (
    <Panel id="alerts">
      <SectionHeader
        eyebrow="Analyst Workflow"
        title="Alert Triage Queue"
        description="Route events become simulated cases that can be assigned, investigated, contained, dispositioned, and closed."
        tone="rose"
        action={<span className="rounded-full border border-rose-300/20 bg-rose-500/10 px-3 py-1 text-sm font-semibold text-rose-100">{openAlerts.length} open</span>}
      />
      <div className="space-y-4">
        {alerts.length ? alerts.map((alert) => <AlertCard key={alert.id} alert={alert} onUpdate={onUpdate} />) : (
          <p className="rounded-2xl border border-white/10 bg-slate-950/50 p-5 text-sm text-slate-400">No Labyrinth alerts have been generated.</p>
        )}
      </div>
    </Panel>
  )
}
