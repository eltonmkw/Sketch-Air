import { expect, test as base, type Page, type Request, type Route } from '@playwright/test';

// Synthetic sentinel, deliberately not a valid credential. Never use real keys here.
const key = 'qa-synthetic-gemini-key';
const storageKey = 'sketch-air.gemini-api-key';
const origin = 'http://127.0.0.1:4174';
const googleHost = 'generativelanguage.googleapis.com';
const modelPath = '/v1beta/models/gemini-2.5-flash-image';

async function modelResponse(route: Route) {
  await route.fulfill({ json: { name: 'models/gemini-2.5-flash-image' } });
}

type Provider = {
  respond: (route: Route) => Promise<void>;
  requests: Request[];
};

const test = base.extend<{ provider: Provider }>({
  provider: async ({ context, page }, use) => {
    const requests: Request[] = [];
    const messages: string[] = [];
    const provider: Provider = {
      // Fail closed unless the scenario deliberately supplies a response.
      respond: route => route.abort('blockedbyclient'),
      requests: [],
    };
    context.on('request', request => requests.push(request));
    page.on('console', message => messages.push(message.text()));
    page.on('pageerror', error => messages.push(error.message));
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin === origin) return route.continue();
      if (url.hostname === googleHost) {
        provider.requests.push(route.request());
        return provider.respond(route);
      }
      if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.endsWith('/+esm')) {
        return route.fulfill({ contentType: 'application/javascript', body: `
          export const FilesetResolver = { forVisionTasks: async () => ({}) };
          export const HandLandmarker = { createFromOptions: async () => ({
            close() {}, detectForVideo() { return { landmarks: [], handednesses: [] }; }
          }) };
        ` });
      }
      if (url.hostname === 'cdn.tailwindcss.com') {
        return route.fulfill({ contentType: 'application/javascript', body: '' });
      }
      if (url.hostname === 'fonts.googleapis.com') {
        return route.fulfill({ contentType: 'text/css', body: '' });
      }
      return route.abort('blockedbyclient');
    });
    await use(provider);

    // Inspect actual requests emitted by the app/SDK, including non-Google traffic.
    for (const request of requests) {
      expect(request.url(), 'key must not appear in a URL').not.toContain(key);
      expect(request.postData() ?? '', 'key must not appear in a request body').not.toContain(key);
      if (new URL(request.url()).hostname !== googleHost) {
        expect(JSON.stringify(await request.allHeaders()), 'key must not reach another origin').not.toContain(key);
      }
    }
    for (const request of provider.requests) {
      expect(request.method()).toBe('GET');
      expect(new URL(request.url()).pathname).toBe(modelPath);
      expect((await request.allHeaders())['x-goog-api-key']).toBe(key);
    }
    expect(messages.join('\n'), 'key must not appear in console output or uncaught errors').not.toContain(key);
    await expect(page.locator('body')).not.toContainText(key);
  },
});

async function expectNoStoredKey(page: Page) {
  expect(await page.evaluate(name => ({
    local: localStorage.getItem(name), session: sessionStorage.getItem(name),
  }), storageKey)).toEqual({ local: null, session: null });
}

test.beforeEach(async ({ page, provider }) => {
  await page.goto(origin);
  await expect(page.getByRole('dialog', { name: 'Bring Your Own AI API Key' })).toBeVisible();
});

for (const [title, value] of [['empty', ''], ['whitespace', '   ']]) {
  test(`BYOK-01: submission stays disabled when the key is ${title}`, async ({ page, provider }) => {
    const field = page.getByLabel('Gemini API key', { exact: true });
    await field.fill(value);
    await expect(page.getByRole('button', { name: 'Test Connection', exact: true })).toBeDisabled();
    await field.press('Enter');
    await expect(page.getByRole('button', { name: 'Done', exact: true })).toHaveCount(0);
    expect(provider.requests).toHaveLength(0);
    await expectNoStoredKey(page);
  });
}

test('BYOK-02: setup reopens when Transform is used without a key', async ({ page, provider }) => {
  for (const close of ['X', 'Escape']) {
    if (close === 'X') await page.getByRole('button', { name: 'Close API key dialog' }).click();
    else await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Transform', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  }
  expect(provider.requests).toHaveLength(0);
  await expectNoStoredKey(page);
});

for (const remember of [false, true]) {
  test(`BYOK-03: activation waits for Done when remember is ${remember}`, async ({ page, provider }) => {
    provider.respond = modelResponse;
    await page.getByLabel('Gemini API key', { exact: true }).fill(`  ${key}  `);
    if (remember) await page.getByRole('checkbox', { name: 'Remember on this device' }).check();
    await page.getByRole('button', { name: 'Test Connection', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Done', exact: true })).toBeVisible();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('button', { name: 'API key', exact: true })).toHaveCount(1);
    await expectNoStoredKey(page);
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'API key ✓', exact: true })).toBeVisible();
    if (remember) {
      const record = await page.evaluate(name => JSON.parse(localStorage.getItem(name)!), storageKey);
      expect(record.key).toBe(key);
      expect(await page.evaluate(name => sessionStorage.getItem(name), storageKey)).toBeNull();
    } else await expectNoStoredKey(page);
    await page.reload();
    if (remember) {
      await expect(page.getByRole('dialog')).not.toBeVisible();
      await page.getByRole('button', { name: 'API key ✓', exact: true }).click();
      await page.getByRole('button', { name: 'Remove saved key', exact: true }).click();
      await expect(page.getByText('API key removed. You can continue drawing.', { exact: true })).toBeVisible();
      await expectNoStoredKey(page);
      await page.getByRole('button', { name: 'Close API key dialog' }).click();
      await page.getByRole('button', { name: 'Transform', exact: true }).click();
    }
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(provider.requests).toHaveLength(1);
  });
}

for (const [status, apiStatus, message] of [
  [400, 'INVALID_ARGUMENT', /Google rejected this key/],
  [401, 'UNAUTHENTICATED', /Google rejected this key/],
  [403, 'PERMISSION_DENIED', /Access denied.*restrictions/],
  [429, 'RESOURCE_EXHAUSTED', /rate limiting/],
  [500, 'INTERNAL', /Connection test failed/],
  [503, 'UNAVAILABLE', /Connection test failed/],
] as const) {
  test(`BYOK-04: validation recovers when Google returns ${status}`, async ({ page, provider }) => {
    // Deliberately echo the sentinel: provider diagnostics must not leak into UI/logs.
    provider.respond = route => route.fulfill({ status, json: {
      error: { code: status, status: apiStatus, message: `Rejected credential ${key}` },
    } });
    const field = page.getByLabel('Gemini API key', { exact: true });
    await field.fill(key);
    await page.getByRole('button', { name: 'Test Connection', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText(message);
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(field).toHaveAccessibleDescription(message);
    await expect(field).toBeFocused();
    await expect(page.getByRole('button', { name: 'Done', exact: true })).toHaveCount(0);
    await expectNoStoredKey(page);
    provider.respond = modelResponse;
    await field.fill(` ${key} `);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(field).toHaveAttribute('aria-invalid', 'false');
    await page.getByRole('button', { name: 'Test Connection', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Done', exact: true })).toBeVisible();
    await expectNoStoredKey(page);
    expect(provider.requests).toHaveLength(2);
  });
}

test('BYOK-05: validation recovers when the network fails', async ({ page, provider }) => {
  provider.respond = route => route.abort('internetdisconnected');
  await page.getByLabel('Gemini API key', { exact: true }).fill(key);
  await page.getByRole('button', { name: 'Test Connection', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Connection test failed');
  await expect(page.getByRole('button', { name: 'Test Connection', exact: true })).toBeEnabled();
  await expectNoStoredKey(page);
  provider.respond = modelResponse;
  await page.getByRole('button', { name: 'Test Connection', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Done', exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(provider.requests).toHaveLength(2);
});

test('BYOK-06: validation times out when Google never responds', async ({ page, provider }) => {
  await page.clock.install();
  // Leave the intercepted request pending; exercise the SDK's real AbortController.
  provider.respond = async () => {};
  await page.getByLabel('Gemini API key', { exact: true }).fill(key);
  await page.getByRole('button', { name: 'Test Connection', exact: true }).click();
  await expect.poll(() => provider.requests.length).toBe(1);
  await expect(page.getByRole('button', { name: 'Testing…', exact: true })).toBeDisabled();
  await page.clock.fastForward(15_001);
  await expect(page.getByRole('alert')).toContainText('Connection test failed');
  await expect(page.getByRole('button', { name: 'Test Connection', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Done', exact: true })).toHaveCount(0);
  await expectNoStoredKey(page);
});

for (const staleStatus of [200, 403]) {
  test(`BYOK-07: pending validation stays current when a closed dialog receives ${staleStatus}`, async ({ page, provider }) => {
    const pending: Route[] = [];
    provider.respond = async route => { pending.push(route); };
    const field = page.getByLabel('Gemini API key', { exact: true });
    await field.fill(key);
    await page.getByRole('button', { name: 'Test Connection', exact: true }).click();
    await expect.poll(() => pending.length).toBe(1);
    await expect(field).toBeDisabled();
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Close API key dialog' }).click();
    await page.getByRole('button', { name: 'API key', exact: true }).click();
    await expect(field).toHaveValue('');
    await field.fill(key);
    await page.getByRole('button', { name: 'Test Connection', exact: true }).click();
    await expect.poll(() => pending.length).toBe(2);
    const oldResponse = page.waitForResponse(response => response.url().includes(modelPath));
    await pending[0].fulfill({ status: staleStatus, json: staleStatus === 200
      ? { name: 'models/gemini-2.5-flash-image' }
      : { error: { code: 403, status: 'PERMISSION_DENIED', message: `Old request ${key}` } },
    });
    await (await oldResponse).finished();
    // Synchronize with a render frame after response consumption, not elapsed time.
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
    await expect(page.getByRole('button', { name: 'Testing…', exact: true })).toBeDisabled();
    await expect(field).toBeDisabled();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Done', exact: true })).toHaveCount(0);
    await modelResponse(pending[1]);
    await expect(page.getByRole('button', { name: 'Done', exact: true })).toBeVisible();
    expect(provider.requests).toHaveLength(2);
    await expectNoStoredKey(page);
  });
}
