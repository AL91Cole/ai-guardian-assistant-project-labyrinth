# Changelog

All notable changes to Project Labyrinth are documented here. The project follows [Semantic Versioning](https://semver.org/).

## [0.2.0] - Unreleased

### Added

- Eight replayable detection and authorization scenarios with expected outcomes
- Identity status, device compliance, network zone, session age, failed-attempt, and owner-key inputs
- Explainable policy traces and advisory analyst briefs
- MITRE ATT&CK and D3FEND mappings for routed events
- Alert assignment, status, disposition, containment, notes, and closure workflow
- Hash-linked audit records, integrity verification, and JSON/CSV exports
- Health, scenarios, alerts, and audit-export API routes
- Modular dashboard components, keyboard focus styles, skip navigation, and reduced-motion support
- Vitest regression suite, ESLint configuration, and GitHub Actions CI
- Architecture, threat-model, security, contribution, and run documentation

### Changed

- Upgraded the application and developer dependencies for the v0.2 release line
- Made successful MFA mandatory for all allowed access
- Expanded trust evaluation and separated entitlement from contextual risk
- Changed vault previews to `POST` and made locked output the default
- Replaced the single dashboard component with focused feature modules
- Moved generated SQLite databases out of version control

### Security

- Unknown actions and vault owners now fail closed instead of falling back to permissive defaults
- Private-vault access requires the known owner and a simulated owner-key signal, with no admin or executive bypass
- API handlers validate JSON content types, body shapes, enums, numbers, and update identifiers
- Added response security headers, bounded process-local rate limiting, sanitized API errors, and spreadsheet-formula-safe CSV output
- Added audit-chain tamper detection and regression coverage for core authorization invariants

[0.2.0]: https://github.com/AL91Cole/ai-guardian-assistant-project-labyrinth/compare/main...agent/project-labyrinth-v0.2.0
