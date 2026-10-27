import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadConfigFromFile } from 'vite';

async function serviceAlias(command, envValue, mode = 'development', nodeEnv = 'development') {
  const previousEnv = process.env.ENV;
  const previousNodeEnv = process.env.NODE_ENV;
  try {
    if (envValue === undefined) delete process.env.ENV;
    else process.env.ENV = envValue;
    process.env.NODE_ENV = nodeEnv;
    const result = await loadConfigFromFile({ command, mode }, './vite.config.ts');
    const aliases = result.config.resolve.alias;
    const entries = Array.isArray(aliases) ? aliases : Object.entries(aliases).map(([find, replacement]) => ({ find, replacement }));
    return entries.find(({ find }) => find instanceof RegExp && find.test('../services/geminiService'));
  } finally {
    if (previousEnv === undefined) delete process.env.ENV;
    else process.env.ENV = previousEnv;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
}

test('Node ENV=TESTING selects the local mock only for the development server', async () => {
  const alias = await serviceAlias('serve', 'TESTING');
  assert.ok(alias, 'TESTING development server must select the offline Gemini mock');
  assert.match(alias.replacement, /tests\/mocks\/geminiService\.ts$/);
});

for (const [command, flag, mode, nodeEnv] of [
  ['serve', undefined, 'development', 'development'],
  ['serve', 'testing', 'development', 'development'],
  ['serve', 'invalid', 'development', 'development'],
  ['serve', 'PRODUCTION', 'test', 'test'],
  ['serve', 'TESTING', 'production', 'development'],
  ['serve', 'TESTING', 'test', 'production'],
  ['build', 'TESTING', 'test', 'test'],
  ['build', 'TESTING', 'production', 'production'],
]) {
  test(`real Gemini service remains selected: ${command}, ENV=${flag}, mode=${mode}, NODE_ENV=${nodeEnv}`, async () => {
    assert.equal(await serviceAlias(command, flag, mode, nodeEnv), undefined);
  });
}
