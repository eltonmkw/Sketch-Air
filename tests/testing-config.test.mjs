import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadConfigFromFile } from 'vite';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const configFile = path.resolve('vite.config.ts');

async function serviceAlias(command, envValue, mode = 'development', nodeEnv = 'development', vercelEnv = undefined) {
  const previousEnv = process.env.ENV;
  const previousNodeEnv = process.env.NODE_ENV;
  const previousVercelEnv = process.env.VERCEL_ENV;
  const previousTargetEnv = process.env.VERCEL_TARGET_ENV;
  try {
    if (envValue === undefined) delete process.env.ENV;
    else process.env.ENV = envValue;
    process.env.NODE_ENV = nodeEnv;
    delete process.env.VERCEL_TARGET_ENV;
    if (vercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = vercelEnv;
    const result = await loadConfigFromFile({ command, mode }, configFile);
    const aliases = result.config.resolve.alias;
    const entries = Array.isArray(aliases) ? aliases : Object.entries(aliases).map(([find, replacement]) => ({ find, replacement }));
    return entries.find(({ find }) => find instanceof RegExp && find.test('../services/geminiService'));
  } finally {
    if (previousVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previousVercelEnv;
    if (previousTargetEnv === undefined) delete process.env.VERCEL_TARGET_ENV;
    else process.env.VERCEL_TARGET_ENV = previousTargetEnv;
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
  ['serve', 'DEVELOPMENT', 'development', 'development'],
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

test('local env file selects testing, shell overrides it, and Production vetoes it', async () => {
  const originalDirectory = process.cwd();
  const directory = await mkdtemp(path.join(tmpdir(), 'sketch-air-env-'));
  try {
    await writeFile(path.join(directory, '.env.local'), 'ENV=TESTING\n');
    process.chdir(directory);
    assert.ok(await serviceAlias('serve', undefined), '.env.local must enable local testing');
    assert.equal(await serviceAlias('serve', 'DEVELOPMENT'), undefined);
    assert.equal(await serviceAlias('serve', 'PRODUCTION'), undefined);
    assert.equal(await serviceAlias('build', undefined, 'production', 'production', 'production'), undefined);
  } finally {
    process.chdir(originalDirectory);
    await rm(directory, { recursive: true, force: true });
  }
});

test('Vercel Preview build accepts the explicit testing selector', async () => {
  assert.ok(await serviceAlias('build', 'TESTING', 'production', 'production', 'preview'));
});

for (const [env, target] of [['TESTING', 'production'], ['PRODUCTION', 'preview'], [undefined, 'preview']]) {
  test(`Vercel ${target} ENV=${env} keeps real validation`, async () => {
    assert.equal(await serviceAlias('build', env, 'production', 'production', target), undefined);
  });
}
