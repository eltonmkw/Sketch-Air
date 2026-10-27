const STORAGE_KEY = 'sketch-air.gemini-api-key';
const KEY_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

export function readApiKey(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return '';
    const saved = JSON.parse(raw);
    if (typeof saved.key === 'string' && saved.key.trim() &&
        typeof saved.expiresAt === 'number' && Number.isFinite(saved.expiresAt) && saved.expiresAt > Date.now()) {
      return saved.key.trim();
    }
  } catch { /* Invalid or blocked storage falls back to memory. */ }
  clearApiKey();
  return '';
}

// A removal attempt is not a confirmation: blocked storage can throw or ignore it.
export function clearApiKey(): boolean {
  let cleared = true;
  for (const storage of ['localStorage', 'sessionStorage'] as const) {
    try {
      window[storage].removeItem(STORAGE_KEY);
      if (window[storage].getItem(STORAGE_KEY) !== null) cleared = false;
    } catch {
      cleared = false;
    }
  }
  return cleared;
}

export type KeyStorageResult = 'memory' | 'remembered' | 'write-failed' | 'removal-failed';

export function storeApiKey(key: string, remember: boolean): KeyStorageResult {
  if (!clearApiKey()) return 'removal-failed';
  if (!remember || !key.trim()) return 'memory';
  try {
    const record = JSON.stringify({key: key.trim(), expiresAt: Date.now() + KEY_LIFETIME_MS});
    localStorage.setItem(STORAGE_KEY, record);
    if (localStorage.getItem(STORAGE_KEY) === record) return 'remembered';
  } catch {
    // A write/read failure can occur after a record was stored. Confirm cleanup
    // before promising that the key is only in memory.
  }
  return clearApiKey() ? 'write-failed' : 'removal-failed';
}
