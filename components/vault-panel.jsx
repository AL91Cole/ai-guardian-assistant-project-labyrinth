import { Panel, SectionHeader, primaryButtonClass } from './ui'

export default function VaultPanel({ vault, onPreview, isPreviewing }) {
  return (
    <Panel id="vault">
      <SectionHeader
        eyebrow="Owner-Controlled Privacy"
        title="Private Vault Simulation"
        description="No real secrets or cryptography are present. This lab demonstrates owner matching, simulated key possession, and administrative separation."
        tone="fuchsia"
        action={
          <button type="button" onClick={onPreview} disabled={isPreviewing} className={primaryButtonClass}>
            {isPreviewing ? 'Checking…' : 'Evaluate vault'}
          </button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="rounded-[24px] border border-white/10 bg-slate-950/55 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Vault owner</p>
          <p className="mt-2 text-xl font-semibold text-white">{vault.owner}</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Requester</p>
          <p className="mt-2 text-sm text-slate-200">{vault.requesterName} · {vault.requesterRole}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${vault.decrypted ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-100' : 'border-fuchsia-300/30 bg-fuchsia-500/10 text-fuchsia-100'}`}>
              {vault.decrypted ? 'Simulated decrypt open' : 'Ciphertext only'}
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${vault.ownerKeyPresent ? 'border-cyan-300/30 bg-cyan-500/10 text-cyan-100' : 'border-slate-400/20 bg-slate-500/10 text-slate-300'}`}>
              {vault.ownerKeyPresent ? 'Owner-key signal present' : 'Owner-key signal absent'}
            </span>
          </div>
        </div>
        <div className="rounded-[24px] border border-fuchsia-300/15 bg-fuchsia-500/[0.05] p-5">
          <p className="text-sm leading-7 text-fuchsia-50">{vault.banner}</p>
          <p className="mt-4 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-xs leading-6 text-slate-300">{vault.encryptionMode}</p>
        </div>
      </div>
      {vault.entries.length ? (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {vault.entries.map((entry) => (
            <article key={entry.alias} className="rounded-[24px] border border-white/10 bg-white/[0.035] p-4">
              <h3 className="font-semibold text-white">{entry.alias}</h3>
              <p className="mt-3 break-all rounded-2xl border border-cyan-300/10 bg-slate-950/70 p-3 font-mono text-xs leading-5 text-cyan-100">{entry.ciphertext}</p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-slate-500">Integrity tag</p>
              <p className="mt-1 font-mono text-xs text-slate-300">{entry.integrityTag}</p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-slate-500">Local preview</p>
              <p className="mt-1 text-sm leading-6 text-slate-200">{entry.plaintext ?? 'Sealed—policy did not authorize simulated decryption.'}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-400">No fixture is exposed for an unknown vault owner.</p>
      )}
    </Panel>
  )
}
