import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { getResourceLabel } from '@/lib/policies'

const dataDirectory = path.join(process.cwd(), 'data')
const databasePath = path.join(dataDirectory, 'labyrinth.sqlite')

function ensureDataDirectory() {
  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true })
  }
}

function createConnection() {
  ensureDataDirectory()
  const connection = new Database(databasePath)
  connection.pragma('journal_mode = WAL')
  connection.pragma('busy_timeout = 5000')
  return connection
}

const globalForDb = globalThis
const db = globalForDb.__labyrinthDb ?? createConnection()

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__labyrinthDb = db
}

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function mapRow(row) {
  return {
    id: row.id,
    timestamp: row.created_at,
    requesterName: row.requester_name,
    requesterRole: row.requester_role,
    resource: row.resource,
    resourceLabel: getResourceLabel(row.resource),
    action: row.action,
    mfaPassed: Boolean(row.mfa_passed),
    trustedDevice: Boolean(row.trusted_device),
    unusualLocation: Boolean(row.unusual_location),
    anomalyScore: row.anomaly_score,
    trustScore: row.trust_score,
    decision: row.decision,
    explanation: row.explanation,
    labyrinth: Boolean(row.labyrinth),
    severity: row.severity,
    indicators: safeParse(row.indicators, []),
    fakeAssetsVisited: safeParse(row.fake_assets, []),
    timeline: safeParse(row.timeline, []),
    containment: row.containment,
  }
}

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      requester_name TEXT NOT NULL,
      requester_role TEXT NOT NULL,
      resource TEXT NOT NULL,
      action TEXT NOT NULL,
      mfa_passed INTEGER NOT NULL,
      trusted_device INTEGER NOT NULL,
      unusual_location INTEGER NOT NULL,
      anomaly_score INTEGER NOT NULL,
      trust_score INTEGER NOT NULL,
      decision TEXT NOT NULL,
      explanation TEXT NOT NULL,
      labyrinth INTEGER NOT NULL DEFAULT 0,
      severity TEXT,
      indicators TEXT,
      fake_assets TEXT,
      timeline TEXT,
      containment TEXT
    )
  `)

  const total = db.prepare('SELECT COUNT(*) AS count FROM audit_log').get().count
  if (total > 0) return

  const insert = db.prepare(`
    INSERT INTO audit_log (
      created_at,
      requester_name,
      requester_role,
      resource,
      action,
      mfa_passed,
      trusted_device,
      unusual_location,
      anomaly_score,
      trust_score,
      decision,
      explanation,
      labyrinth,
      severity,
      indicators,
      fake_assets,
      timeline,
      containment
    ) VALUES (
      @created_at,
      @requester_name,
      @requester_role,
      @resource,
      @action,
      @mfa_passed,
      @trusted_device,
      @unusual_location,
      @anomaly_score,
      @trust_score,
      @decision,
      @explanation,
      @labyrinth,
      @severity,
      @indicators,
      @fake_assets,
      @timeline,
      @containment
    )
  `)

  const seedRows = [
    {
      created_at: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
      requester_name: 'Jordan',
      requester_role: 'Manager',
      resource: 'semi-secret-files',
      action: 'Write',
      mfa_passed: 1,
      trusted_device: 1,
      unusual_location: 0,
      anomaly_score: 18,
      trust_score: 71,
      decision: 'Allow',
      explanation:
        'Allowed because Managers have Full Control on Semi Secret Files and the session context stayed within the trust threshold.',
      labyrinth: 0,
      severity: null,
      indicators: JSON.stringify(['No high-risk indicators were observed']),
      fake_assets: JSON.stringify([]),
      timeline: JSON.stringify([]),
      containment: null,
    },
    {
      created_at: new Date(Date.now() - 1000 * 60 * 16).toISOString(),
      requester_name: 'Casey',
      requester_role: 'Employee',
      resource: 'super-secret-files',
      action: 'Read',
      mfa_passed: 1,
      trusted_device: 1,
      unusual_location: 0,
      anomaly_score: 14,
      trust_score: 93,
      decision: 'Deny',
      explanation:
        'Denied because Employees do not have standing access to Super Secret Files, even when the session context is otherwise healthy.',
      labyrinth: 0,
      severity: null,
      indicators: JSON.stringify(['No standing permission for requested action']),
      fake_assets: JSON.stringify([]),
      timeline: JSON.stringify([]),
      containment: null,
    },
    {
      created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
      requester_name: 'Unknown Session',
      requester_role: 'Admin',
      resource: 'user-private-vault',
      action: 'Read',
      mfa_passed: 0,
      trusted_device: 0,
      unusual_location: 1,
      anomaly_score: 87,
      trust_score: 6,
      decision: 'Route to Labyrinth',
      explanation:
        'Routed to The Labyrinth because a protected private vault was targeted under suspicious conditions.',
      labyrinth: 1,
      severity: 'Critical',
      indicators: JSON.stringify([
        'MFA challenge not passed',
        'Request came from an untrusted device',
        'Geo-context does not match normal behavior',
        'High anomaly score: 87',
        'No standing permission for requested action',
      ]),
      fake_assets: JSON.stringify([
        'decoy://vault/recovery-phrases.txt',
        'decoy://vault/private-keys.kdbx',
        'decoy://vault/identity-scans.enc',
      ]),
      timeline: JSON.stringify([
        'Session fingerprint mirrored into decoy segment',
        'Decoy assets for User Private Vault exposed',
        'Honeytoken beacons armed and monitored',
        'Lateral movement blocked from production resources',
      ]),
      containment:
        'Production data remained isolated while the session was observed inside The Labyrinth.',
    },
  ]

  const seed = db.transaction((rows) => {
    for (const row of rows) {
      insert.run(row)
    }
  })

  seed(seedRows)
}

initializeDatabase()

export function recordDecision(evaluation) {
  const labyrinth = evaluation.labyrinthEvent ?? null
  const result = db
    .prepare(`
      INSERT INTO audit_log (
        created_at,
        requester_name,
        requester_role,
        resource,
        action,
        mfa_passed,
        trusted_device,
        unusual_location,
        anomaly_score,
        trust_score,
        decision,
        explanation,
        labyrinth,
        severity,
        indicators,
        fake_assets,
        timeline,
        containment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      new Date().toISOString(),
      evaluation.input.requesterName,
      evaluation.input.requesterRole,
      evaluation.input.resource,
      evaluation.input.action,
      evaluation.input.mfaPassed ? 1 : 0,
      evaluation.input.trustedDevice ? 1 : 0,
      evaluation.input.unusualLocation ? 1 : 0,
      evaluation.input.anomalyScore,
      evaluation.trustScore,
      evaluation.decision,
      evaluation.explanation,
      labyrinth ? 1 : 0,
      labyrinth?.severity ?? null,
      JSON.stringify(labyrinth?.indicators ?? []),
      JSON.stringify(labyrinth?.fakeAssetsVisited ?? []),
      JSON.stringify(labyrinth?.timeline ?? []),
      labyrinth?.containment ?? null,
    )

  return getLogById(result.lastInsertRowid)
}

export function getLogById(id) {
  const row = db.prepare('SELECT * FROM audit_log WHERE id = ?').get(id)
  return row ? mapRow(row) : null
}

export function getRecentLogs(limit = 12) {
  const rows = db
    .prepare('SELECT * FROM audit_log ORDER BY datetime(created_at) DESC, id DESC LIMIT ?')
    .all(limit)
  return rows.map(mapRow)
}

export function getLabyrinthEvents(limit = 6) {
  const rows = db
    .prepare(
      "SELECT * FROM audit_log WHERE decision = 'Route to Labyrinth' ORDER BY datetime(created_at) DESC, id DESC LIMIT ?",
    )
    .all(limit)
  return rows.map(mapRow)
}

export function getDecisionSummary() {
  const row = db
    .prepare(`
      SELECT
        COUNT(*) AS total_requests,
        SUM(CASE WHEN decision = 'Allow' THEN 1 ELSE 0 END) AS allow_count,
        SUM(CASE WHEN decision = 'Deny' THEN 1 ELSE 0 END) AS deny_count,
        SUM(CASE WHEN decision = 'Route to Labyrinth' THEN 1 ELSE 0 END) AS labyrinth_count,
        ROUND(AVG(trust_score)) AS average_trust_score
      FROM audit_log
    `)
    .get()

  const totalRequests = row?.total_requests ?? 0
  const allowCount = row?.allow_count ?? 0
  const denyCount = row?.deny_count ?? 0
  const labyrinthCount = row?.labyrinth_count ?? 0

  return {
    totalRequests,
    allowCount,
    denyCount,
    labyrinthCount,
    averageTrustScore: row?.average_trust_score ?? 0,
    allowRate: totalRequests ? Math.round((allowCount / totalRequests) * 100) : 0,
  }
}
