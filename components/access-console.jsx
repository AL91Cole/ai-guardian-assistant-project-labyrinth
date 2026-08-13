import {
  Field,
  Panel,
  SectionHeader,
  ToggleField,
  controlClass,
  primaryButtonClass,
  secondaryButtonClass,
} from './ui'

export default function AccessConsole({ form, setForm, options, onSubmit, onPreviewVault, isSubmitting, isPreviewing }) {
  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value, scenarioId: null }))

  return (
    <Panel id="console" as="form" onSubmit={onSubmit}>
      <SectionHeader
        eyebrow="Policy Enforcement Point"
        title="Access Request Console"
        description="Change the identity, entitlement target, and live security signals evaluated for this single request."
      />

      <fieldset>
        <legend className="mb-4 text-sm font-semibold text-cyan-100">1. Identity and request</legend>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field id="requester-role" label="User role">
            <select id="requester-role" value={form.requesterRole} onChange={(event) => setValue('requesterRole', event.target.value)} className={controlClass}>
              {options.roles.map((role) => <option key={role}>{role}</option>)}
            </select>
          </Field>
          <Field id="requester-name" label="Requester name">
            <input id="requester-name" value={form.requesterName} maxLength={80} onChange={(event) => setValue('requesterName', event.target.value)} className={controlClass} />
          </Field>
          <Field id="identity-status" label="Identity status">
            <select id="identity-status" value={form.identityStatus} onChange={(event) => setValue('identityStatus', event.target.value)} className={controlClass}>
              {options.identityStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </Field>
          <Field id="resource" label="Protected resource">
            <select id="resource" value={form.resource} onChange={(event) => setValue('resource', event.target.value)} className={controlClass}>
              {options.resources.map((resource) => (
                <option key={resource.value} value={resource.value}>{resource.label} · {resource.classification}</option>
              ))}
            </select>
          </Field>
          <Field id="action" label="Requested action">
            <select id="action" value={form.action} onChange={(event) => setValue('action', event.target.value)} className={controlClass}>
              {options.actions.map((action) => <option key={action}>{action}</option>)}
            </select>
          </Field>
          <Field id="vault-owner" label="Vault owner" hint="Used only when evaluating the private vault.">
            <select id="vault-owner" value={form.vaultOwner} onChange={(event) => setValue('vaultOwner', event.target.value)} className={controlClass}>
              {options.vaultOwners.map((owner) => <option key={owner}>{owner}</option>)}
            </select>
          </Field>
        </div>
      </fieldset>

      <fieldset className="mt-7">
        <legend className="mb-4 text-sm font-semibold text-cyan-100">2. Device and session context</legend>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field id="device-compliance" label="Device compliance">
            <select id="device-compliance" value={form.deviceCompliance} onChange={(event) => setValue('deviceCompliance', event.target.value)} className={controlClass}>
              {options.deviceCompliance.map((status) => <option key={status}>{status}</option>)}
            </select>
          </Field>
          <Field id="network-zone" label="Network zone">
            <select id="network-zone" value={form.networkZone} onChange={(event) => setValue('networkZone', event.target.value)} className={controlClass}>
              {options.networkZones.map((zone) => <option key={zone}>{zone}</option>)}
            </select>
          </Field>
          <Field id="session-age" label="Session age (minutes)">
            <input id="session-age" type="number" min="0" max="1440" value={form.sessionAgeMinutes} onChange={(event) => setValue('sessionAgeMinutes', Number(event.target.value))} className={controlClass} />
          </Field>
          <Field id="failed-attempts" label="Recent failed attempts">
            <input id="failed-attempts" type="number" min="0" max="50" value={form.failedAttempts} onChange={(event) => setValue('failedAttempts', Number(event.target.value))} className={controlClass} />
          </Field>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ToggleField id="mfa-passed" label="MFA passed" checked={form.mfaPassed} onChange={(value) => setValue('mfaPassed', value)} description="Mandatory before any Allow decision." />
          <ToggleField id="trusted-device" label="Trusted device" checked={form.trustedDevice} onChange={(value) => setValue('trustedDevice', value)} description="Registration signal from device inventory." />
          <ToggleField id="unusual-location" label="Unusual location" checked={form.unusualLocation} onChange={(value) => setValue('unusualLocation', value)} description="Represents impossible travel or new geography." />
          <ToggleField id="owner-key" label="Owner key present" checked={form.ownerKeyPresent} onChange={(value) => setValue('ownerKeyPresent', value)} description="Simulation signal required for vault decrypt." />
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/55 p-4">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="anomaly-score" className="text-sm font-medium text-slate-100">Behavioral anomaly score</label>
            <output htmlFor="anomaly-score" className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-100">{form.anomalyScore}</output>
          </div>
          <input id="anomaly-score" type="range" min="0" max="100" value={form.anomalyScore} onChange={(event) => setValue('anomalyScore', Number(event.target.value))} className="mt-4 w-full accent-cyan-300" />
          <div className="mt-1 flex justify-between text-xs text-slate-500"><span>Normal</span><span>Highly anomalous</span></div>
        </div>
      </fieldset>

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" className={secondaryButtonClass} disabled={isPreviewing} onClick={onPreviewVault}>
          {isPreviewing ? 'Checking vault…' : 'Preview vault policy'}
        </button>
        <button type="submit" className={primaryButtonClass} disabled={isSubmitting}>
          {isSubmitting ? 'Evaluating…' : 'Run zero-trust decision'}
        </button>
      </div>
    </Panel>
  )
}
