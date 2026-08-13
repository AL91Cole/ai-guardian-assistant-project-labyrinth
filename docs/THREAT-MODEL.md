# Threat Model

## Scope

This model covers Project Labyrinth itself: a local educational Next.js app processing synthetic access requests and storing simulated decisions in SQLite. It does not claim to model every control required by a production zero-trust platform.

## Assets

- Correctness of deterministic authorization outcomes
- Integrity and availability of simulated audit evidence
- Separation of decoy content from protected-resource concepts
- Privacy boundary represented by owner-only vault behavior
- Analyst case state and explanatory context
- Source code and dependency supply chain

There are no intended real secrets, production identities, customer records, or live protected resources.

## Adversaries and failure modes

| Threat | Example | v0.2 control | Residual risk / production need |
|---|---|---|---|
| Input confusion | Unknown action becomes a read | Enumerated validation fails closed | Schema versioning and contract tests across clients |
| Authorization bypass | Missing MFA still receives access | MFA is required for all Allow outcomes | Real identity-provider assertion validation |
| Privileged privacy bypass | Admin opens another user's vault | Admin/Executive block; owner and key signal required | Real client-side cryptography and key recovery design |
| Owner enumeration/fallback | Unknown owner reveals default records | Unknown owners return no entries | Consistent authentication-aware error behavior |
| Context spoofing | Caller claims a compliant device | Lab labels all context as simulated | Signed telemetry from authoritative control planes |
| Audit modification | Historical decision is edited | Hash-chain verification detects changes | External immutable anchor, write separation, retention controls |
| Spreadsheet injection | Exported requester begins with `=` | CSV cells are quoted and formula prefixes neutralized | Export consumer policy and content scanning |
| Resource exhaustion | Rapid repeated simulations | Bounded process-local rate limit and input sizes | Shared quotas, WAF, backpressure, load testing |
| Dependency compromise | Vulnerable framework package | Lockfile, audit gate, CI, Dependabot/CodeQL compatibility | Review cadence, provenance, artifact signing, SBOM |
| Analyst overreach | Advisory text changes access | Explanation is downstream and advisory only | Role separation, approval workflow, analyst action audit |

## Security invariants

1. Unknown or malformed request fields do not silently map to a more permissive request.
2. An Allow requires standing entitlement, successful MFA, adequate trust, and an active identity.
3. A private-vault Allow additionally requires a known matching owner, eligible role, healthy device context, and the simulated owner-key signal.
4. Administrative capability does not imply access to user content.
5. Routed sessions expose only hard-coded synthetic decoy paths.
6. Analyst explanation and case updates cannot modify the recorded policy outcome.
7. Runtime databases, environment files, and credentials do not enter version control.

The automated tests encode the first six invariants where applicable. CI runs linting, the regression suite, a production build, and a high-severity production dependency audit.

## Explicit non-goals

- Production authentication or authorization enforcement
- Real honeypot operation or collection from third-party systems
- Real encryption, secret storage, or key custody
- Autonomous containment or offensive countermeasures
- Compliance certification
- Multi-user, multi-tenant, or internet-facing deployment

Any work that crosses these boundaries should begin with a new threat model and explicit authorization from the system owner.
