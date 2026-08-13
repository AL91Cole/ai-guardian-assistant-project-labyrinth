import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { AUDIT_GENESIS_HASH, createAuditHash, verifyAuditChain } from './audit-integrity.js'
import { evaluateRequest } from './guardian.js'
import { getResourceLabel } from './policies.js'
import { getScenarioById } from './scenarios.js'

const configuredDataDirectory = process.env.LABYRINTH_DATA_DIR
const dataDirectory = configuredDataDirectory
  ? path.resolve(configuredDataDirectory)
  : path.join(process.cwd(), 'data')
const databasePath = path.join(dataDirectory, 'labyrinth.sqlite')

function ensureDataDirectory() {
  if (!fs.existsSync(dataDirectory)) fs.mkdirSync(dataDirectory, { recursive: true })
}

function createConnection() {
  ensureDataDirectory()
  const connection = new Database(databasePath)
  connection.pragma('journal_mode = WAL')
  connection.pragma('busy_timeout = 5000')
  connection.pragma('foreign_keys = ON')
  return connection
}

const globalForDb = globalThis
const db = globalForDb.__labyrinthDb ?? createConnection()

if (process.env.NODE_ENV !== 'production' && !configuredDataDirectory) {
  globalForDb.__labyrinthDb = db
}

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function ensureColumn(table, name, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all()
  if (!columns.some((column) => column.name === name)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`)
  }
}

function ensureSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      requester_name TEXT NOT NULL,
      requester_role TEXT NOT NULL,
      resource TEXT NOT NULL,
      resource_classification TEXT NOT NULL DEFAULT 'Unknown',
      action TEXT NOT NULL,
      identity_status TEXT NOT NULL DEFAULT 'Active',
      device_compliance TEXT NOT NULL DEFAULT 'Compliant',
      network_zone TEXT NOT NULL DEFAULT 'Corporate',
      mfa_passed INTEGER NOT NULL,
      trusted_device INTEGER NOT NULL,
      unusual_location INTEGER NOT NULL,
      anomaly_score INTEGER NOT NULL,
      session_age_minutes INTEGER NOT NULL DEFAULT 0,
      failed_attempts INTEGER NOT NULL DEFAULT 0,
      owner_key_present INTEGER NOT NULL DEFAULT 0,
      trust_score INTEGER NOT NULL,
      decision TEXT NOT NULL,
      explanation TEXT NOT NULL,
      labyrinth INTEGER NOT NULL DEFAULT 0,
      severity TEXT,
      indicators TEXT,
      fake_assets TEXT,
      timeline TEXT,
      containment TEXT,
      policy_version TEXT NOT NULL DEFAULT 'legacy',
      scenario_id TEXT,
      risk_factors TEXT,
      policy_trace TEXT,
      attack_techniques TEXT,
      defensive_techniques TEXT,
      analyst_brief TEXT,
      previous_hash TEXT,
      event_hash TEXT
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audit_log_id INTEGER NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'New',
      severity TEXT NOT NULL,
      assignee TEXT NOT NULL DEFAULT 'Unassigned',
      disposition TEXT NOT NULL DEFAULT 'Unreviewed',
      notes TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (audit_log_id) REFERENCES audit_log(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS audit_created_at_idx ON audit_log(created_at DESC);
    CREATE INDEX IF NOT EXISTS audit_decision_idx ON audit_log(decision);
    CREATE INDEX IF NOT EXISTS alerts_status_idx ON alerts(status, updated_at DESC);
  `)

  const additions = [
    ['resource_classification', "TEXT NOT NULL DEFAULT 'Unknown'"],
    ['identity_status', "TEXT NOT NULL DEFAULT 'Active'"],
    ['device_compliance', "TEXT NOT NULL DEFAULT 'Compliant'"],
    ['network_zone', "TEXT NOT NULL DEFAULT 'Corporate'"],
    ['session_age_minutes', 'INTEGER NOT NULL DEFAULT 0'],
    ['failed_attempts', 'INTEGER NOT NULL DEFAULT 0'],
    ['owner_key_present', 'INTEGER NOT NULL DEFAULT 0'],
    ['policy_version', "TEXT NOT NULL DEFAULT 'legacy'"],
    ['scenario_id', 'TEXT'],
    ['risk_factors', 'TEXT'],
    ['policy_trace', 'TEXT'],
    ['attack_techniques', 'TEXT'],
    ['defensive_techniques', 'TEXT'],
    ['analyst_brief', 'TEXT'],
    ['previous_hash', 'TEXT'],
    ['event_hash', 'TEXT'],
  ]

  for (const [name, definition] of additions) ensureColumn('audit_log', name, definition)
  db.pragma('user_version = 2')
}

function mapRow(row) {
  return {
    id: row.id,
    timestamp: row.created_at,
    requesterName: row.requester_name,
    requesterRole: row.requester_role,
    resource: row.resource,
    resourceLabel: getResourceLabel(row.resource),
    resourceClassification: row.resource_classification,
    action: row.action,
    identityStatus: row.identity_status,
    deviceCompliance: row.device_compliance,
    networkZone: row.network_zone,
    mfaPassed: Boolean(row.mfa_passed),
    trustedDevice: Boolean(row.trusted_device),
    unusualLocation: Boolean(row.unusual_location),
    anomalyScore: row.anomaly_score,
    sessionAgeMinutes: row.session_age_minutes,
    failedAttempts: row.failed_attempts,
    ownerKeyPresent: Boolean(row.owner_key_present),
    trustScore: row.trust_score,
    decision: row.decision,
    explanation: row.explanation,
    labyrinth: Boolean(row.labyrinth),
    severity: row.severity,
    indicators: safeParse(row.indicators, []),
    fakeAssetsVisited: safeParse(row.fake_assets, []),
    timeline: safeParse(row.timeline, []),
    containment: row.containment,
    policyVersion: row.policy_version,
    scenarioId: row.scenario_id,
    riskFactors: safeParse(row.risk_factors, []),
    policyTrace: safeParse(row.policy_trace, []),
    attackTechniques: safeParse(row.attack_techniques, []),
    defensiveTechniques: safeParse(row.defensive_techniques, []),
    analystBrief: safeParse(row.analyst_brief, null),
    previousHash: row.previous_hash,
    eventHash: row.event_hash,
  }
}

const migrateSchema = db.transaction(ensureSchema)
migrateSchema.immediate()

const insertLog = db.prepare(`
  INSERT INTO audit_log (
    created_at, requester_name, requester_role, resource, resource_classification, action,
    identity_status, device_compliance, network_zone, mfa_passed, trusted_device,
    unusual_location, anomaly_score, session_age_minutes, failed_attempts, owner_key_present,
    trust_score, decision, explanation, labyrinth, severity, indicators, fake_assets,
    timeline, containment, policy_version, scenario_id, risk_factors, policy_trace,
    attack_techniques, defensive_techniques, analyst_brief, previous_hash, event_hash
  ) VALUES (
    @created_at, @requester_name, @requester_role, @resource, @resource_classification, @action,
    @identity_status, @device_compliance, @network_zone, @mfa_passed, @trusted_device,
    @unusual_location, @anomaly_score, @session_age_minutes, @failed_attempts, @owner_key_present,
    @trust_score, @decision, @explanation, @labyrinth, @severity, @indicators, @fake_assets,
    @timeline, @containment, @policy_version, @scenario_id, @risk_factors, @policy_trace,
    @attack_techniques, @defensive_techniques, @analyst_brief, @previous_hash, @event_hash
  )
`)

function makeEvent(evaluation, timestamp, id = null) {
  const labyrinth = evaluation.labyrinthEvent ?? null
  return {
    id,
    timestamp,
    requesterName: evaluation.input.requesterName,
    requesterRole: evaluation.input.requesterRole,
    resource: evaluation.input.resource,
    resourceClassification: evaluation.resourceClassification,
    action: evaluation.input.action,
    identityStatus: evaluation.input.identityStatus,
    deviceCompliance: evaluation.input.deviceCompliance,
    networkZone: evaluation.input.networkZone,
    mfaPassed: evaluation.input.mfaPassed,
    trustedDevice: evaluation.input.trustedDevice,
    unusualLocation: evaluation.input.unusualLocation,
    anomalyScore: evaluation.input.anomalyScore,
    sessionAgeMinutes: evaluation.input.sessionAgeMinutes,
    failedAttempts: evaluation.input.failedAttempts,
    ownerKeyPresent: evaluation.input.ownerKeyPresent,
    trustScore: evaluation.trustScore,
    decision: evaluation.decision,
    explanation: evaluation.explanation,
    labyrinth: Boolean(labyrinth),
    severity: labyrinth?.severity ?? null,
    indicators: labyrinth?.indicators ?? [],
    fakeAssetsVisited: labyrinth?.fakeAssetsVisited ?? [],
    timeline: labyrinth?.timeline ?? [],
    containment: labyrinth?.containment ?? null,
    policyVersion: evaluation.policyVersion,
    scenarioId: evaluation.input.scenarioId,
    riskFactors: evaluation.riskFactors,
    policyTrace: evaluation.policyTrace,
    attackTechniques: labyrinth?.attackTechniques ?? evaluation.scenario?.attackTechniques ?? [],
    defensiveTechniques: labyrinth?.defensiveTechniques ?? [],
    analystBrief: evaluation.analystBrief,
  }
}

const insertDecision = db.transaction((evaluation, timestamp) => {
  const previous = db.prepare('SELECT event_hash FROM audit_log ORDER BY id DESC LIMIT 1').get()
  const previousHash = previous?.event_hash || AUDIT_GENESIS_HASH
  const nextId = db.prepare("SELECT seq + 1 AS id FROM sqlite_sequence WHERE name = 'audit_log'").get()?.id ?? 1
  const event = makeEvent(evaluation, timestamp, nextId)
  const eventHash = createAuditHash(event, previousHash)
  const labyrinth = evaluation.labyrinthEvent ?? null
  const result = insertLog.run({
    created_at: timestamp,
    requester_name: event.requesterName,
    requester_role: event.requesterRole,
    resource: event.resource,
    resource_classification: event.resourceClassification,
    action: event.action,
    identity_status: event.identityStatus,
    device_compliance: event.deviceCompliance,
    network_zone: event.networkZone,
    mfa_passed: event.mfaPassed ? 1 : 0,
    trusted_device: event.trustedDevice ? 1 : 0,
    unusual_location: event.unusualLocation ? 1 : 0,
    anomaly_score: event.anomalyScore,
    session_age_minutes: event.sessionAgeMinutes,
    failed_attempts: event.failedAttempts,
    owner_key_present: event.ownerKeyPresent ? 1 : 0,
    trust_score: event.trustScore,
    decision: event.decision,
    explanation: event.explanation,
    labyrinth: event.labyrinth ? 1 : 0,
    severity: event.severity,
    indicators: JSON.stringify(event.indicators),
    fake_assets: JSON.stringify(event.fakeAssetsVisited),
    timeline: JSON.stringify(event.timeline),
    containment: event.containment,
    policy_version: event.policyVersion,
    scenario_id: event.scenarioId,
    risk_factors: JSON.stringify(event.riskFactors),
    policy_trace: JSON.stringify(event.policyTrace),
    attack_techniques: JSON.stringify(event.attackTechniques),
    defensive_techniques: JSON.stringify(event.defensiveTechniques),
    analyst_brief: JSON.stringify(event.analystBrief),
    previous_hash: previousHash,
    event_hash: eventHash,
  })

  if (labyrinth) {
    db.prepare(`
      INSERT OR IGNORE INTO alerts (
        audit_log_id, created_at, updated_at, status, severity, assignee, disposition, notes
      ) VALUES (?, ?, ?, 'New', ?, 'Unassigned', 'Unreviewed', '')
    `).run(result.lastInsertRowid, timestamp, timestamp, labyrinth.severity)
  }

  return Number(result.lastInsertRowid)
})

function backfillLegacyAuditHashes() {
  const backfill = db.transaction(() => {
    const rows = db.prepare('SELECT * FROM audit_log ORDER BY id ASC').all()
    let previousHash = AUDIT_GENESIS_HASH
    const update = db.prepare('UPDATE audit_log SET previous_hash = ?, event_hash = ? WHERE id = ?')

    for (const row of rows) {
      const event = mapRow(row)
      if (event.previousHash && event.eventHash) {
        previousHash = event.eventHash
      } else {
        const eventHash = createAuditHash(event, previousHash)
        update.run(previousHash, eventHash, event.id)
        previousHash = eventHash
      }
    }
  })
  backfill.immediate()
}

function seedDatabase() {
  const seed = db.transaction(() => {
    const total = db.prepare('SELECT COUNT(*) AS count FROM audit_log').get().count
    if (total > 0) return

    const seedIds = ['baseline-manager-write', 'healthy-unauthorized-read', 'credential-replay']
    seedIds.forEach((scenarioId, index) => {
      const scenario = getScenarioById(scenarioId)
      const timestamp = new Date(Date.now() - (seedIds.length - index) * 10 * 60 * 1000).toISOString()
      const evaluation = evaluateRequest({ ...scenario.input, scenarioId })
      insertDecision(evaluation, timestamp)
    })
  })

  seed.immediate()
}

seedDatabase()
backfillLegacyAuditHashes()
db.prepare(`
  INSERT OR IGNORE INTO alerts (
    audit_log_id, created_at, updated_at, status, severity, assignee, disposition, notes
  )
  SELECT id, created_at, created_at, 'New', COALESCE(severity, 'Medium'), 'Unassigned', 'Unreviewed', ''
  FROM audit_log
  WHERE decision = 'Route to Labyrinth'
`).run()

export function recordDecision(evaluation, { timestamp = new Date().toISOString() } = {}) {
  const id = insertDecision.immediate(evaluation, timestamp)
  return getLogById(id)
}

export function getLogById(id) {
  const row = db.prepare('SELECT * FROM audit_log WHERE id = ?').get(id)
  return row ? mapRow(row) : null
}

export function getRecentLogs(limit = 20) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 500))
  return db
    .prepare('SELECT * FROM audit_log ORDER BY datetime(created_at) DESC, id DESC LIMIT ?')
    .all(safeLimit)
    .map(mapRow)
}

export function getAllLogs(limit = 500) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 500, 5_000))
  return db.prepare('SELECT * FROM audit_log ORDER BY id ASC LIMIT ?').all(safeLimit).map(mapRow)
}

export function getLabyrinthEvents(limit = 10) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 100))
  return db
    .prepare("SELECT * FROM audit_log WHERE decision = 'Route to Labyrinth' ORDER BY datetime(created_at) DESC, id DESC LIMIT ?")
    .all(safeLimit)
    .map(mapRow)
}

export function getRecentAlerts(limit = 20) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100))
  const rows = db.prepare('SELECT * FROM alerts ORDER BY datetime(updated_at) DESC, id DESC LIMIT ?').all(safeLimit)
  return rows.map((row) => ({
    id: row.id,
    auditLogId: row.audit_log_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    severity: row.severity,
    assignee: row.assignee,
    disposition: row.disposition,
    notes: row.notes,
    event: getLogById(row.audit_log_id),
  }))
}

export function updateAlert(id, changes) {
  const allowedColumns = {
    status: 'status',
    severity: 'severity',
    assignee: 'assignee',
    disposition: 'disposition',
    notes: 'notes',
  }
  const entries = Object.entries(changes).filter(([key]) => allowedColumns[key])
  if (!entries.length) return null

  const assignments = entries.map(([key]) => `${allowedColumns[key]} = @${key}`)
  assignments.push('updated_at = @updatedAt')
  const result = db
    .prepare(`UPDATE alerts SET ${assignments.join(', ')} WHERE id = @id`)
    .run({ id, updatedAt: new Date().toISOString(), ...Object.fromEntries(entries) })

  if (!result.changes) return null
  return getRecentAlerts(100).find((alert) => alert.id === id) ?? null
}

export function getDecisionSummary() {
  const row = db.prepare(`
    SELECT
      COUNT(*) AS total_requests,
      SUM(CASE WHEN decision = 'Allow' THEN 1 ELSE 0 END) AS allow_count,
      SUM(CASE WHEN decision = 'Deny' THEN 1 ELSE 0 END) AS deny_count,
      SUM(CASE WHEN decision = 'Route to Labyrinth' THEN 1 ELSE 0 END) AS labyrinth_count,
      ROUND(AVG(trust_score)) AS average_trust_score
    FROM audit_log
  `).get()
  const openAlerts = db.prepare("SELECT COUNT(*) AS count FROM alerts WHERE status != 'Closed'").get().count
  const totalRequests = row?.total_requests ?? 0
  const allowCount = row?.allow_count ?? 0

  return {
    totalRequests,
    allowCount,
    denyCount: row?.deny_count ?? 0,
    labyrinthCount: row?.labyrinth_count ?? 0,
    averageTrustScore: row?.average_trust_score ?? 0,
    allowRate: totalRequests ? Math.round((allowCount / totalRequests) * 100) : 0,
    openAlerts,
  }
}

export function getAuditIntegrity() {
  const logs = db.prepare('SELECT * FROM audit_log ORDER BY id ASC').all().map(mapRow)
  return verifyAuditChain(logs)
}
