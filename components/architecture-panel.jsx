import { Panel, SectionHeader } from './ui'

const components = [
  { label: 'Policy Information', title: 'Identity, device, and behavior signals', copy: 'Lifecycle status, MFA, endpoint compliance, network zone, session age, failed attempts, and anomaly score supply request context.' },
  { label: 'Policy Engine', title: 'Deterministic, fail-closed decision', copy: 'Entitlement and context produce Allow, Deny, or Route to Labyrinth. Unknown roles, resources, actions, and owners are rejected.' },
  { label: 'Policy Administrator', title: 'Single-request authorization', copy: 'The result applies only to the evaluated request. It does not create permanent trust or silently change standing policy.' },
  { label: 'Policy Enforcement', title: 'Production or isolated decoy route', copy: 'The enforcement layer keeps suspicious sessions away from production and records the exact defensive route.' },
  { label: 'Analyst Assistance', title: 'Explanation without authorization power', copy: 'The analyst brief summarizes evidence and next steps. Any future model integration remains advisory and cannot grant access.' },
  { label: 'Audit Evidence', title: 'Hash-linked decisions and case state', copy: 'Events are chained for tamper evidence, while alert status and analyst notes remain separately updateable case metadata.' },
]

export default function ArchitecturePanel() {
  return (
    <Panel id="architecture">
      <SectionHeader
        eyebrow="Architecture and Ethics"
        title="Standards-Aligned Defensive Design"
        description="Project Labyrinth is a teaching and portfolio simulation—not production IAM, encryption, SIEM, or autonomous containment."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {components.map((component) => (
          <article key={component.label} className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">{component.label}</p>
            <h3 className="mt-2 font-semibold text-white">{component.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">{component.copy}</p>
          </article>
        ))}
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <a href="https://doi.org/10.6028/NIST.SP.800-207" target="_blank" rel="noreferrer" className="rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.05] p-4 text-sm text-cyan-100 hover:bg-cyan-400/10">
          NIST SP 800-207 · Zero Trust Architecture
        </a>
        <a href="https://www.cisa.gov/resources-tools/resources/zero-trust-maturity-model" target="_blank" rel="noreferrer" className="rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.05] p-4 text-sm text-cyan-100 hover:bg-cyan-400/10">
          CISA · Zero Trust Maturity Model 2.0
        </a>
        <a href="https://d3fend.mitre.org/" target="_blank" rel="noreferrer" className="rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.05] p-4 text-sm text-cyan-100 hover:bg-cyan-400/10">
          MITRE D3FEND · Defensive techniques
        </a>
      </div>
    </Panel>
  )
}
