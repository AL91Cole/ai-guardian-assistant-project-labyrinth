const csvColumns = [
  ['id', 'ID'],
  ['timestamp', 'Timestamp'],
  ['requesterName', 'Requester'],
  ['requesterRole', 'Role'],
  ['resourceLabel', 'Resource'],
  ['resourceClassification', 'Classification'],
  ['action', 'Action'],
  ['decision', 'Decision'],
  ['trustScore', 'Trust Score'],
  ['severity', 'Severity'],
  ['scenarioId', 'Scenario'],
  ['policyVersion', 'Policy Version'],
  ['eventHash', 'Event Hash'],
  ['previousHash', 'Previous Hash'],
  ['explanation', 'Explanation'],
]

function safeSpreadsheetValue(value) {
  const text = value === null || value === undefined ? '' : String(value)
  return /^[=+\-@]/.test(text) ? `'${text}` : text
}

function csvCell(value) {
  const safe = safeSpreadsheetValue(value)
  return `"${safe.replaceAll('"', '""')}"`
}

export function logsToCsv(logs) {
  const header = csvColumns.map(([, label]) => csvCell(label)).join(',')
  const rows = logs.map((log) => csvColumns.map(([key]) => csvCell(log[key])).join(','))
  return [header, ...rows].join('\n')
}
