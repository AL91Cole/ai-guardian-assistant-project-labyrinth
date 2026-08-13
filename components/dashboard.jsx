'use client'

import { useState } from 'react'
import AccessConsole from './access-console'
import AlertTriage from './alert-triage'
import ArchitecturePanel from './architecture-panel'
import AuditPanel from './audit-panel'
import DecisionPanel from './decision-panel'
import LabyrinthPanel from './labyrinth-panel'
import PolicyMatrix from './policy-matrix'
import ScenarioLab from './scenario-lab'
import { MetricCard } from './ui'
import VaultPanel from './vault-panel'

const navigation = [
  ['scenarios', 'Scenarios'],
  ['console', 'Console'],
  ['decision', 'Decision'],
  ['policy-matrix', 'Policies'],
  ['vault', 'Vault'],
  ['labyrinth', 'Labyrinth'],
  ['alerts', 'Alerts'],
  ['audit-log', 'Audit'],
  ['architecture', 'Architecture'],
]

const awaitingDecision = {
  decision: 'Awaiting Request',
  explanation: 'Load a scenario or configure an ad hoc request. The Policy Engine will return Allow, Deny, or Route to Labyrinth.',
  trustScore: 100,
  policyTrace: [],
  riskFactors: [],
  analystBrief: null,
}

function apiMessage(data, fallback) {
  const issue = data?.issues?.[0]
  if (issue) return `${data.message} ${issue.field}: ${issue.message}`
  return data?.message || fallback
}

export default function Dashboard({ initialData }) {
  const firstScenario = initialData.scenarios[0]
  const [selectedScenarioId, setSelectedScenarioId] = useState(firstScenario?.id || '')
  const [form, setForm] = useState({ ...firstScenario.input, scenarioId: null })
  const [decision, setDecision] = useState(awaitingDecision)
  const [logs, setLogs] = useState(initialData.logs)
  const [labyrinthEvents, setLabyrinthEvents] = useState(initialData.labyrinthEvents)
  const [alerts, setAlerts] = useState(initialData.alerts)
  const [summary, setSummary] = useState(initialData.summary)
  const [integrity, setIntegrity] = useState(initialData.integrity)
  const [vault, setVault] = useState(initialData.vault)
  const [notice, setNotice] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)

  const options = {
    roles: initialData.roles,
    actions: initialData.actions,
    resources: initialData.resources,
    vaultOwners: initialData.vaultOwners,
    identityStatuses: initialData.identityStatuses,
    deviceCompliance: initialData.deviceCompliance,
    networkZones: initialData.networkZones,
  }

  function applySimulationResponse(data) {
    setDecision(data.result)
    setLogs(data.logs)
    setLabyrinthEvents(data.labyrinthEvents)
    setAlerts(data.alerts)
    setSummary(data.summary)
    setIntegrity(data.integrity)
    if (data.result.vaultView) setVault(data.result.vaultView)
  }

  async function runPayload(payload) {
    setIsSubmitting(true)
    setNotice(null)
    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(apiMessage(data, 'The Policy Engine could not evaluate the request.'))
      applySimulationResponse(data)
      const expected = initialData.scenarios.find((scenario) => scenario.id === payload.scenarioId)?.expectedDecision
      const comparison = expected ? ` Expected ${expected}; received ${data.result.decision}.` : ''
      setNotice({ tone: 'success', text: `Decision recorded in the tamper-evident audit chain.${comparison}` })
    } catch (error) {
      setNotice({ tone: 'error', text: error.message || 'The simulation could not complete the request.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  function submitRequest(event) {
    event.preventDefault()
    return runPayload(form)
  }

  function loadScenario(scenario) {
    if (!scenario) return
    setForm({ ...scenario.input, scenarioId: scenario.id })
    setNotice({ tone: 'success', text: `${scenario.title} loaded. Review its signals or run it now.` })
  }

  async function runScenario(scenario) {
    if (!scenario) return
    const payload = { ...scenario.input, scenarioId: scenario.id }
    setForm(payload)
    await runPayload(payload)
  }

  async function previewVault() {
    setIsPreviewing(true)
    setNotice(null)
    try {
      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(apiMessage(data, 'The vault policy preview failed.'))
      setVault(data.vault)
      setNotice({ tone: 'success', text: `Vault policy returned ${data.decision} at trust ${data.trustScore}. Preview requests are not added to the audit log.` })
    } catch (error) {
      setNotice({ tone: 'error', text: error.message || 'The vault policy preview failed.' })
    } finally {
      setIsPreviewing(false)
    }
  }

  async function updateAlert(id, changes) {
    setNotice(null)
    try {
      const response = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...changes }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(apiMessage(data, 'The alert could not be updated.'))
      setAlerts(data.alerts)
      setSummary(data.summary)
      setNotice({ tone: 'success', text: `Alert #${id} updated.` })
    } catch (error) {
      setNotice({ tone: 'error', text: error.message || 'The alert could not be updated.' })
      throw error
    }
  }

  return (
    <main className="grid-line relative min-h-screen px-4 py-6 text-white sm:px-6 lg:px-8">
      <a href="#console" className="skip-link">Skip to access console</a>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="glass relative overflow-hidden rounded-[32px] p-6 md:p-8">
          <div className="orb-float absolute -right-16 -top-10 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">v0.2.0 · Detection &amp; Response Lab</div>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">AI Guardian Assistant: <span className="text-cyan-300">Project Labyrinth</span></h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">An explainable zero-trust training environment with fail-closed policy decisions, defensive deception, analyst triage, and hash-linked evidence.</p>
              </div>
              <div className="max-w-md rounded-[24px] border border-white/10 bg-slate-950/60 p-4 text-sm leading-6 text-slate-300">
                <strong className="text-white">Ethical boundary:</strong> all identities, secrets, attacks, and containment actions are simulated. The advisory layer cannot authorize access.
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Requests logged" value={summary.totalRequests} caption={`${summary.allowRate}% currently allowed`} />
              <MetricCard label="Average trust" value={`${summary.averageTrustScore}%`} caption="Across all recorded requests" />
              <MetricCard label="Open alerts" value={summary.openAlerts} caption="Awaiting or undergoing triage" tone="rose" />
              <MetricCard label="Audit chain" value={integrity.valid ? 'Verified' : 'Broken'} caption={`${integrity.checked} linked events`} tone={integrity.valid ? 'emerald' : 'rose'} />
            </div>
          </div>
        </header>

        <nav aria-label="Project Labyrinth sections" className="sticky top-3 z-30 rounded-[24px] border border-white/10 bg-slate-950/85 p-3 shadow-2xl backdrop-blur-xl">
          <div className="flex gap-2 overflow-x-auto">
            {navigation.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">{label}</a>
            ))}
          </div>
        </nav>

        {notice ? (
          <div role={notice.tone === 'error' ? 'alert' : 'status'} aria-live="polite" className={`rounded-2xl border px-4 py-3 text-sm ${notice.tone === 'error' ? 'border-rose-300/20 bg-rose-500/10 text-rose-100' : 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100'}`}>
            {notice.text}
          </div>
        ) : null}

        <ScenarioLab scenarios={initialData.scenarios} selectedScenarioId={selectedScenarioId} onSelect={setSelectedScenarioId} onLoad={loadScenario} onRun={runScenario} isSubmitting={isSubmitting} />

        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <AccessConsole form={form} setForm={setForm} options={options} onSubmit={submitRequest} onPreviewVault={previewVault} isSubmitting={isSubmitting} isPreviewing={isPreviewing} />
          <DecisionPanel decision={decision} />
        </div>

        <PolicyMatrix policies={initialData.policies} policyVersion={initialData.policyVersion} />
        <VaultPanel vault={vault} onPreview={previewVault} isPreviewing={isPreviewing} />
        <LabyrinthPanel events={labyrinthEvents} />
        <AlertTriage alerts={alerts} onUpdate={updateAlert} />
        <AuditPanel logs={logs} summary={summary} integrity={integrity} />
        <ArchitecturePanel />

        <footer className="px-2 pb-4 text-center text-xs leading-6 text-slate-500">
          Project Labyrinth v0.2.0 · Defensive simulation only · Policy {initialData.policyVersion}
        </footer>
      </div>
    </main>
  )
}
