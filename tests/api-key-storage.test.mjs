import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const storageKey = 'sketch-air.gemini-api-key';
const now = 1_800_000_000_000;
const compiled = ts.transpileModule(
  readFileSync(new URL('../services/apiKeyStorage.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

function setup() {
  const local = new Map();
  const session = new Map();
  const blocked = { read: false, write: false, remove: false, silentRemove: false,
    readAfterWrite: false, removeAfterWrite: false };
  const storage = (values) => ({
    getItem(key) {
      if (blocked.read) throw new Error('Blocked read');
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      if (blocked.write) throw new Error('Blocked write');
      values.set(key, value);
      if (blocked.readAfterWrite) blocked.read = true;
      if (blocked.removeAfterWrite) blocked.remove = true;
    },
    removeItem(key) {
      if (blocked.remove) throw new Error('Blocked removal');
      if (blocked.silentRemove) return;
      values.delete(key);
    },
  });
  const localStorage = storage(local);
  const sessionStorage = storage(session);
  const context = vm.createContext({
    exports: {}, localStorage, window: { localStorage, sessionStorage },
    Date: { now: () => now },
  });
  vm.runInContext(compiled, context);
  return { ...context.exports, local, session, blocked };
}

test('memory-only activation removes a previously remembered key without persisting the replacement', () => {
  const s = setup();
  s.storeApiKey('dummy-old', true);
  assert.equal(s.storeApiKey('dummy-new', false), 'memory');
  assert.equal(s.local.size, 0);
  assert.equal(s.session.size, 0);
  assert.equal(s.readApiKey(), '');
});

test('remember saves a trimmed key with a 30-day expiry, only in local storage', () => {
  const s = setup();
  assert.equal(s.storeApiKey('  dummy-key  ', true), 'remembered');
  assert.deepEqual(JSON.parse(s.local.get(storageKey)), {
    key: 'dummy-key', expiresAt: 1_802_592_000_000,
  });
  assert.equal(s.session.size, 0);
  assert.equal(s.readApiKey(), 'dummy-key');
});

test('removal clears both stores and leaves unrelated browser data intact', () => {
  const s = setup();
  s.storeApiKey('dummy-key', true);
  s.session.set(storageKey, 'legacy-key');
  s.local.set('unrelated', 'keep');
  assert.equal(s.clearApiKey(), true);
  assert.equal(s.local.has(storageKey), false);
  assert.equal(s.session.has(storageKey), false);
  assert.equal(s.local.get('unrelated'), 'keep');
  assert.equal(s.readApiKey(), '');
});

test('blocked removal reports failure rather than claiming a persisted key is gone', () => {
  const s = setup();
  s.storeApiKey('dummy-old', true);
  s.blocked.remove = true;
  assert.equal(s.clearApiKey(), false);
  assert.equal(s.readApiKey(), 'dummy-old');
  assert.equal(s.storeApiKey('dummy-new', false), 'removal-failed');
  assert.equal(s.storeApiKey('dummy-new', true), 'removal-failed');
});

test('silent no-op deletion is detected', () => {
  const s = setup();
  s.storeApiKey('dummy-old', true);
  // Some embedded storage implementations can fail without throwing.
  s.blocked.silentRemove = true;
  assert.equal(s.clearApiKey(), false);
});

test('blocked writes report failure after the previous key has been cleared', () => {
  const s = setup();
  s.storeApiKey('dummy-old', true);
  s.blocked.write = true;
  assert.equal(s.storeApiKey('dummy-new', true), 'write-failed');
  assert.equal(s.local.size, 0);
});

test('blocked storage reads do not crash startup and prevent a false deletion confirmation', () => {
  const s = setup();
  s.blocked.read = true;
  assert.equal(s.readApiKey(), '');
  assert.equal(s.clearApiKey(), false);
});

test('loss of storage access after a write does not falsely promise memory-only retention', () => {
  const s = setup();
  s.blocked.readAfterWrite = true;
  s.blocked.removeAfterWrite = true;
  assert.equal(s.storeApiKey('dummy-new', true), 'removal-failed');
  assert.equal(s.local.has(storageKey), true);
});

for (const raw of ['null', '{bad json', '{}', JSON.stringify({ key: 'dummy', expiresAt: now }),
  JSON.stringify({ key: 'dummy', expiresAt: now - 1 }), JSON.stringify({ key: ' ', expiresAt: now + 1 })]) {
  test(`startup discards malformed or expired storage: ${raw}`, () => {
    const s = setup();
    s.local.set(storageKey, raw);
    assert.equal(s.readApiKey(), '');
    assert.equal(s.local.has(storageKey), false);
  });
}
