// Utility for Serial Number Generation & Verification

// A salt key used to compute cryptographic checksum for offline serial numbers
const SECRET_SALT = 'BOSP_KBB_2026_MASTER_KEY_SECRET';

/**
 * Generates a Hardware/Machine ID based on school details or browser signature
 */
export function getMachineId(schoolName?: string, schoolAddress?: string): string {
  let raw = localStorage.getItem('bosp_machine_id');
  if (!raw) {
    const randomSeed = Math.random().toString(36).substring(2, 10).toUpperCase();
    raw = `KBB-${randomSeed}`;
    localStorage.setItem('bosp_machine_id', raw);
  }

  // Combine school name or address for a unique hardware/school fingerprint
  const cleanName = (schoolName || 'SEKOLAH').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanAddr = (schoolAddress || 'KBB').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  return `${cleanName.substring(0, 8) || 'BOSP'}-${cleanAddr.substring(0, 4) || 'SCH'}-${raw}`;
}

/**
 * Simple hash function for client-side serial validation without external heavy deps
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate valid Serial Number for a given Machine ID or School NPSN
 */
export function generateSerialNumber(machineId: string, expiryDays: number = 365): string {
  const cleanId = machineId.trim().toUpperCase();
  const hash1 = simpleHash(`${cleanId}:${SECRET_SALT}:PART1`).toString(16).toUpperCase().padStart(4, '0').slice(-4);
  const hash2 = simpleHash(`${cleanId}:${SECRET_SALT}:PART2`).toString(16).toUpperCase().padStart(4, '0').slice(-4);
  const hash3 = simpleHash(`${cleanId}:${SECRET_SALT}:PART3`).toString(16).toUpperCase().padStart(4, '0').slice(-4);
  const hash4 = simpleHash(`${cleanId}:${SECRET_SALT}:PART4`).toString(16).toUpperCase().padStart(4, '0').slice(-4);

  return `BOSP-${hash1}-${hash2}-${hash3}-${hash4}`;
}

/**
 * Verify if a serial number is valid for a given Machine ID
 * Accepts standard algorithmic serials OR a master dev serial 'BOSP-PRO-ACTIVATED-2026'
 */
export function verifySerialNumber(serialKey: string, machineId: string): boolean {
  if (!serialKey) return false;

  const cleanSerial = serialKey.trim().toUpperCase().replace(/\s+/g, '');

  // Master bypass key for app owner/testing
  if (cleanSerial === 'BOSP-PRO-ACTIVATED-2026' || cleanSerial === 'BOSP-ADMIN-PASS-9999') {
    return true;
  }

  const expected = generateSerialNumber(machineId);
  return cleanSerial === expected;
}

export interface LicenseInfo {
  isActivated: boolean;
  serialKey: string;
  activatedAt?: string;
  activatedForSchool?: string;
}

export function getStoredLicenseInfo(): LicenseInfo {
  try {
    const saved = localStorage.getItem('bosp_license_info');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse stored license info:', e);
  }
  return {
    isActivated: false,
    serialKey: '',
  };
}

export function saveLicenseInfo(info: LicenseInfo): void {
  localStorage.setItem('bosp_license_info', JSON.stringify(info));
}
