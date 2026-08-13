# Contributing

Thanks for helping improve Project Labyrinth. Keep contributions defensive, reproducible, and safe to demonstrate with synthetic data.

## Workflow

1. Create a focused branch from `main`.
2. Keep authorization outcomes deterministic and fail closed for unknown inputs.
3. Add or update tests for every policy, scenario, schema, or API behavior change.
4. Run the quality gate before opening a pull request:

   ```bash
   npm ci
   npm run check
   npm audit --omit=dev --audit-level=high
   ```

5. Explain security tradeoffs, migration effects, and manual verification in the pull request.

Do not commit generated SQLite files, `.env` files, credentials, real personal data, or real production indicators.

## Design invariants

- Only the deterministic Policy Engine issues access decisions.
- An `Allow` outcome requires MFA and sufficient standing permission.
- Suspicious high-risk activity may be isolated in The Labyrinth; low-risk unauthorized activity is denied directly.
- A private vault never falls back to another owner and has no administrator bypass.
- Decoy assets and analyst actions remain defensive simulations.
- Audit-schema changes preserve or explicitly migrate historical evidence.

For vulnerabilities, follow [SECURITY.md](SECURITY.md) instead of opening a detailed public issue.
