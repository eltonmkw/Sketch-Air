import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadConfigFromFile } from 'vite';

async function serviceAlias(command, testing, mode = 'development', nodeEnv = 'development') {
  const previousTesting = process.env.TESTING;
  const previousNodeEnv = process.env.NODE_ENV;
  try {
    if (testing === undefined) delete process.env.TESTING;
    else process.env.TESTING = testing;
    process.env.NODE_ENV = nodeEnv;
    const result = await loadConfigFromFile({ command, mode }, './vite.config.ts');
    const aliases = result.config.resolve.alias;
    const entries = Array.isArray(aliases) ? aliases : Object.entries(aliases).map(([find, replacement]) => ({ find, replacement }));
    return entries.find(({ find }) => find instanceof RegExp && find.test('../services/geminiService'));
  } finally {
    if (previousTesting === undefined) delete process.env.TESTING;
    else process.env.TESTING = previousTesting;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
}

test('Node TESTING=true selects the local mock only for the development server', async () => {
  const alias = await serviceAlias('serve', 'true');
  assert.ok(alias, 'TESTING development server must select the offline Gemini mock');
  assert.match(alias.replacement, /tests\/mocks\/geminiService\.ts$/);
});

for (const [command, flag, mode, nodeEnv] of [
  ['serve', undefined, 'development', 'development'],
  ['serve', 'false', 'test', 'test'],
  ['serve', 'true', 'production', 'development'],
  ['serve', 'true', 'test', 'production'],
  ['build', 'true', 'test', 'test'],
  ['build', 'true', 'production', 'production'],
]) {
  test(`real Gemini service remains selected: ${command}, TESTING=${flag}, mode=${mode}, NODE_ENV=${nodeEnv}`, async () => {
    assert.equal(await serviceAlias(command, flag, mode, nodeEnv), undefined);
  });
}
