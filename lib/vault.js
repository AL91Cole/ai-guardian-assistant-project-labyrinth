function normalize(value) {
  return String(value || '').trim().toLowerCase()
}

const vaultFixtures = {
  jordan: {
    owner: 'Jordan',
    entries: [
      {
        alias: 'Identity Bundle',
        ciphertext: 'enc::4D7A-1F92-0BCA-7EE1::persona.profile',
        plaintext: 'Passport scan, residency note, emergency contacts',
        integrityTag: 'sha3:7c2f90d0',
      },
      {
        alias: 'Recovery Set',
        ciphertext: 'enc::91AB-77C0-E2F8-1140::recovery.keys',
        plaintext: 'Recovery codes, hardware-token backup seed, lockout checklist',
        integrityTag: 'sha3:34af66f2',
      },
      {
        alias: 'Medical Privacy Packet',
        ciphertext: 'enc::AB81-DA20-5F45-CC12::privacy.med',
        plaintext: 'Insurance copy, medication list, physician notes',
        integrityTag: 'sha3:0df214ab',
      },
    ],
  },
  casey: {
    owner: 'Casey',
    entries: [
      {
        alias: 'Family Archive',
        ciphertext: 'enc::7BC3-19DE-4472-00EA::family.archive',
        plaintext: 'Birth records, photos, next-of-kin records',
        integrityTag: 'sha3:7b21f098',
      },
      {
        alias: 'Financial Folder',
        ciphertext: 'enc::C0F2-88F9-2D04-9931::finance.private',
        plaintext: 'Tax forms, bank statements, savings notes',
        integrityTag: 'sha3:2c8ee719',
      },
      {
        alias: 'Personal Journal',
        ciphertext: 'enc::002A-A141-3B0D-6F50::journal.locked',
        plaintext: 'Daily reflections, therapy notes, personal goals',
        integrityTag: 'sha3:90de7713',
      },
    ],
  },
  alex: {
    owner: 'Alex',
    entries: [
      {
        alias: 'Developer Secrets',
        ciphertext: 'enc::D4F0-CC81-731D-70D0::app.keys',
        plaintext: 'Non-production API keys, token rotation notes, secret hygiene checklist',
        integrityTag: 'sha3:11ace731',
      },
      {
        alias: 'Research Notes',
        ciphertext: 'enc::11F0-9B0E-62AF-4123::lab.notes',
        plaintext: 'AI safety sketches, experiment notes, model guardrail ideas',
        integrityTag: 'sha3:aa093b55',
      },
      {
        alias: 'Legal Hold Packet',
        ciphertext: 'enc::FF02-1CA9-3E40-4991::legal.hold',
        plaintext: 'Disclosure memos, draft statements, retention notice',
        integrityTag: 'sha3:5f2ab91c',
      },
    ],
  },
}

export const defaultVaultOwner = 'Jordan'

export function getVaultSimulation({ requesterRole, requesterName, vaultOwner, allowed }) {
  const normalizedOwner = normalize(vaultOwner)
  const selectedVault = vaultFixtures[normalizedOwner] ?? vaultFixtures[normalize(defaultVaultOwner)]
  const isOwner = normalize(requesterName) === normalize(selectedVault.owner)
  const directAccessBlocked = requesterRole === 'Admin' || requesterRole === 'Executive' || !isOwner

  return {
    owner: selectedVault.owner,
    requesterName,
    requesterRole,
    encryptionMode: 'Client-side encryption simulated. The user-held key never leaves the browser session.',
    directAccessBlocked,
    decrypted: Boolean(allowed),
    banner: allowed
      ? `Vault opened for ${selectedVault.owner}. Ciphertext was decrypted locally with the owner key simulation.`
      : `Vault remains sealed. Only the named owner can decrypt this vault. Admins and Executives are explicitly blocked.`,
    entries: selectedVault.entries.map((entry) => ({
      alias: entry.alias,
      ciphertext: entry.ciphertext,
      integrityTag: entry.integrityTag,
      plaintext: allowed ? entry.plaintext : null,
    })),
  }
}

export function getVaultOwners() {
  return Object.values(vaultFixtures).map((vault) => vault.owner)
}
