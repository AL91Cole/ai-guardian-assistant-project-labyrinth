export const roleOptions = ['Admin', 'Executive', 'Manager', 'Employee']

export const actionOptions = ['Read', 'Write', 'Delete', 'Share', 'Manage Permissions']

export const resourceOptions = [
  { value: 'shared-files', label: 'Shared Files' },
  { value: 'super-secret-files', label: 'Super Secret Files' },
  { value: 'semi-secret-files', label: 'Semi Secret Files' },
  { value: 'not-so-secret-files', label: 'Not so Secret Files' },
  { value: 'user-private-vault', label: 'User Private Vault' },
]

export const permissionWeight = {
  none: 0,
  read: 1,
  full: 2,
  'owner only': 3,
}

export const actionRequirement = {
  Read: 'read',
  Write: 'full',
  Delete: 'full',
  Share: 'full',
  'Manage Permissions': 'full',
}

const defaultPermissions = {
  Admin: 'none',
  Executive: 'none',
  Manager: 'none',
  Employee: 'none',
}

const policyDefinitions = [
  {
    resource: 'shared-files',
    label: 'Shared Files',
    inheritsFrom: null,
    note: 'Executives have Full Control. Managers have Read only. No one else has standing access.',
    permissions: {
      Executive: 'full',
      Manager: 'read',
    },
  },
  {
    resource: 'super-secret-files',
    label: 'Super Secret Files',
    inheritsFrom: 'shared-files',
    note: 'Inherits the Shared Files model. Executives keep Full Control. Managers keep Read only.',
    permissions: {},
  },
  {
    resource: 'semi-secret-files',
    label: 'Semi Secret Files',
    inheritsFrom: null,
    note: 'Managers have Full Control. Employees have Read only. Least privilege applies to everyone else.',
    permissions: {
      Manager: 'full',
      Employee: 'read',
    },
  },
  {
    resource: 'not-so-secret-files',
    label: 'Not so Secret Files',
    inheritsFrom: null,
    note: 'Executives, Managers, and Employees have Full Control. Technical admins still do not get automatic data access in this simulation.',
    permissions: {
      Executive: 'full',
      Manager: 'full',
      Employee: 'full',
    },
  },
  {
    resource: 'user-private-vault',
    label: 'User Private Vault',
    inheritsFrom: null,
    note: 'Specific user only. Client-side encryption is simulated. Admins and Executives are blocked from direct access.',
    permissions: {
      Manager: 'owner only',
      Employee: 'owner only',
    },
  },
]

const policyLookup = Object.fromEntries(policyDefinitions.map((policy) => [policy.resource, policy]))

function resolvePermissions(resource, visited = new Set()) {
  const policy = policyLookup[resource]

  if (!policy || visited.has(resource)) {
    return { ...defaultPermissions }
  }

  const nextVisited = new Set(visited)
  nextVisited.add(resource)

  const inherited = policy.inheritsFrom ? resolvePermissions(policy.inheritsFrom, nextVisited) : defaultPermissions

  return {
    ...defaultPermissions,
    ...inherited,
    ...policy.permissions,
  }
}

export const basePermissionMap = Object.fromEntries(
  policyDefinitions.map((policy) => [policy.resource, resolvePermissions(policy.resource)]),
)

export const policyMatrix = policyDefinitions.map((policy) => ({
  ...policy,
  permissions: basePermissionMap[policy.resource],
}))

export function getResourceLabel(resource) {
  return resourceOptions.find((item) => item.value === resource)?.label ?? resource
}

export function getPermissionLevel(role, resource) {
  return basePermissionMap[resource]?.[role] ?? 'none'
}

export function describePermission(level) {
  if (level === 'full') return 'Full Control'
  if (level === 'read') return 'Read'
  if (level === 'owner only') return 'Owner Only'
  return 'No Standing Access'
}
