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
        plaintext: 'Simulated passport scan, residency note, and emergency contacts',
        integrityTag: 'sha3:7c2f90d0',
      },
      {
        alias: 'Recovery Set',
        ciphertext: 'enc::91AB-77C0-E2F8-1140::recovery.keys',
        plaintext: 'Simulated recovery codes, backup seed, and lockout checklist',
        integrityTag: 'sha3:34af66f2',
      },
      {
        alias: 'Medical Privacy Packet',
        ciphertext: 'enc::AB81-DA20-5F45-CC12::privacy.med',
        plaintext: 'Simulated insurance copy, medication list, and physician notes',
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
        plaintext: 'Simulated family records, photos, and next-of-kin records',
        integrityTag: 'sha3:7b21f098',
      },
      {
        alias: 'Financial Folder',
        ciphertext: 'enc::C0F2-88F9-2D04-9931::finance.private',
        plaintext: 'Simulated tax forms, bank statements, and savings notes',
        integrityTag: 'sha3:2c8ee719',
      },
      {
        alias: 'Personal Journal',
        ciphertext: 'enc::002A-A141-3B0D-6F50::journal.locked',
        plaintext: 'Simulated reflections, wellbeing notes, and personal goals',
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
        plaintext: 'Simulated non-production keys, rotation notes, and secret-hygiene checklist',
        integrityTag: 'sha3:11ace731',
      },
      {
        alias: 'Research Notes',
        ciphertext: 'enc::11F0-9B0E-62AF-4123::lab.notes',
        plaintext: 'Simulated AI safety sketches, experiment notes, and guardrail ideas',
        integrityTag: 'sha3:aa093b55',
      },
      {
        alias: 'Legal Hold Packet',
        ciphertext: 'enc::FF02-1CA9-3E40-4991::legal.hold',
        plaintext: 'Simulated disclosure memos, draft statements, and retention notice',
        integrityTag: 'sha3:5f2ab91c',
      },
    ],
  },
}

export const defaultVaultOwner = 'Jordan'

export function isKnownVaultOwner(vaultOwner) {
  return Boolean(vaultFixtures[normalize(vaultOwner)])
}

export function getVaultSimulation({
  requesterRole,
  requesterName,
  vaultOwner,
  ownerKeyPresent = false,
  allowed = false,
}) {
  const selectedVault = vaultFixtures[normalize(vaultOwner)] ?? null
  const isOwner = Boolean(selectedVault && normalize(requesterName) === normalize(selectedVault.owner))
  const roleBlocked = requesterRole === 'Admin' || requesterRole === 'Executive'
  const keyPresent = ownerKeyPresent === true
  const decrypted = Boolean(allowed && selectedVault && isOwner && !roleBlocked && keyPresent)
  const directAccessBlocked = !selectedVault || !isOwner || roleBlocked || !keyPresent

  if (!selectedVault) {
    return {
      owner: String(vaultOwner || 'Unknown'),
      requesterName,
      requesterRole,
      ownerKnown: false,
      ownerKeyPresent: keyPresent,
      encryptionMode: 'Simulation only. No real secrets or cryptographic keys are stored by Project Labyrinth.',
      directAccessBlocked: true,
      decrypted: false,
      banner: 'Vault remains sealed because the requested owner does not exist in the simulation.',
      entries: [],
    }
  }

  return {
    owner: selectedVault.owner,
    requesterName,
    requesterRole,
    ownerKnown: true,
    ownerKeyPresent: keyPresent,
    encryptionMode:
      'Client-side encryption is simulated. In a real design, the user-held key would never leave the client.',
    directAccessBlocked,
    decrypted,
    banner: decrypted
      ? `Vault opened for ${selectedVault.owner}. Simulated ciphertext was decrypted with the owner-key signal.`
      : 'Vault remains sealed. The named owner, owner-key signal, MFA, and a healthy device context are all required.',
    entries: selectedVault.entries.map((entry) => ({
      alias: entry.alias,
      ciphertext: entry.ciphertext,
      integrityTag: entry.integrityTag,
      plaintext: decrypted ? entry.plaintext : null,
    })),
  }
}

export function getVaultOwners() {
  return Object.values(vaultFixtures).map((vault) => vault.owner)
}
