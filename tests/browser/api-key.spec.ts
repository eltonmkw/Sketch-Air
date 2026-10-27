import { expect, test, type Page } from '@playwright/test';

const storageKey = 'sketch-air.gemini-api-key';
const dummy = 'sketch-air-test-key';

async function activate(page: Page, remember = false) {
  await page.getByLabel('Gemini API key', { exact: true }).fill(dummy);
  if (remember) await page.getByRole('checkbox', { name: 'Remember on this device' }).check();
  await page.getByRole('button', { name: 'Test Connection', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Done', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  // Only key-dialog behavior is in scope; do not fetch CDN tracking models or Google.
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1') return route.continue();
    if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.endsWith('/+esm')) {
      // The app imports MediaPipe at module load. Stub its network boundary so
      // the real App/dialog can mount without a model download or camera.
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
    if (url.hostname === 'generativelanguage.googleapis.com') {
      return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({
        error: { code: 401, status: 'UNAUTHENTICATED', message: 'Dummy key rejected' },
      }) });
    }
    return route.abort();
  });
});

test('dummy key stays memory-only until refresh and is never sent to Google in TESTING mode', async ({ page }) => {
  const googleRequests: string[] = [];
  page.on('request', request => {
    if (request.url().includes('generativelanguage.googleapis.com')) googleRequests.push(request.url());
  });
  await page.goto('/');
  await activate(page);
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
  expect(await page.evaluate(key => sessionStorage.getItem(key), storageKey)).toBeNull();
  await page.reload();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(googleRequests).toEqual([]);
});

test('testing rejects other values and Escape leaves no saved key', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Gemini API key', { exact: true }).fill('another-dummy-value');
  await page.getByRole('button', { name: 'Test Connection', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('accepts only the dummy key');
  await expect(page.getByRole('button', { name: 'Done', exact: true })).not.toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
});

test('remember persists only after Done, survives refresh, and removal survives another refresh', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Gemini API key', { exact: true }).fill(dummy);
  await page.getByRole('checkbox', { name: 'Remember on this device' }).check();
  await page.getByRole('button', { name: 'Test Connection', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Done', exact: true })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
  const before = Date.now();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  const record = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), storageKey);
  expect(record.key).toBe(dummy);
  expect(record.expiresAt).toBeGreaterThanOrEqual(before + 2_592_000_000);
  expect(record.expiresAt).toBeLessThanOrEqual(Date.now() + 2_592_000_000);
  await page.reload();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'API key' }).click();
  await page.getByRole('button', { name: 'Remove saved key' }).click();
  await expect(page.getByText('API key removed. You can continue drawing.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove saved key' })).not.toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
  expect(await page.evaluate(key => sessionStorage.getItem(key), storageKey)).toBeNull();
  await page.reload();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('blocked writes give an honest memory fallback with an explicit acknowledgement', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
  });
  await page.goto('/');
  await activate(page, true);
  await expect(page.getByText(/Browser storage is blocked/)).toBeVisible();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.reload();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('blocked removal clears the active key but warns that browser data may remain', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await activate(page, true);
  await page.evaluate(() => {
    Storage.prototype.removeItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
  });
  await page.getByRole('button', { name: 'API key' }).click();
  await page.getByRole('button', { name: 'Remove saved key' }).click();
  await expect(page.getByText(/could not remove the saved browser data/)).toBeVisible();
  await expect(page.getByText('API key removed. You can continue drawing.', { exact: true })).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove saved key' })).not.toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('removal-warning.png') });
  await page.getByRole('button', { name: 'Close API key dialog' }).click();
  await expect(page.getByRole('button', { name: 'API key', exact: true })).toBeVisible();
});

test('memory fallback warns when an older remembered key could not be removed', async ({ page }) => {
  await page.goto('/');
  await activate(page, true);
  await page.getByRole('button', { name: 'API key' }).click();
  await page.evaluate(() => { Storage.prototype.removeItem = () => {}; });
  await page.getByRole('button', { name: 'Test Connection', exact: true }).click();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByText(/previously saved key may return after refresh/)).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('production build rejects the dummy key even with ENV=TESTING and mode=test', async ({ page }) => {
  let requests = 0;
  page.on('request', request => {
    if (request.url().includes('generativelanguage.googleapis.com')) requests++;
  });
  await page.goto('http://127.0.0.1:4174');
  await page.getByLabel('Gemini API key', { exact: true }).fill(dummy);
  await page.getByRole('button', { name: 'Test Connection', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Google rejected this key');
  await expect(page.getByRole('button', { name: 'Done', exact: true })).not.toBeVisible();
  expect(requests).toBeGreaterThan(0);
});
