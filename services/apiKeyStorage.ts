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

export function clearApiKey(): void {
  for (const storage of ['localStorage', 'sessionStorage'] as const) {
    try { window[storage].removeItem(STORAGE_KEY); } catch { /* Storage may be blocked. */ }
  }
}

export function storeApiKey(key: string, remember: boolean): boolean {
  clearApiKey();
  if (!remember || !key.trim()) return true;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({key: key.trim(), expiresAt: Date.now() + KEY_LIFETIME_MS}));
    return true;
  } catch {
    return false;
  }
}
