import { expect, test as base, type Page, type Request, type Route } from '@playwright/test';

// Synthetic sentinel, deliberately not a valid credential. Never use real keys here.
export const key = 'qa-synthetic-gemini-key';
export const storageKey = 'sketch-air.gemini-api-key';
const googleHost = 'generativelanguage.googleapis.com';
export const modelPath = '/v1beta/models/gemini-2.5-flash-image';

export async function modelResponse(route: Route) {
  await route.fulfill({ json: { name: 'models/gemini-2.5-flash-image' } });
}

type Provider = {
  respond: (route: Route) => Promise<void>;
  requests: Request[];
};

export const test = base.extend<{ provider: Provider }>({
  provider: async ({ context, page, baseURL }, use) => {
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
      if (url.origin === new URL(baseURL!).origin) return route.continue();
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

export async function expectNoStoredKey(page: Page) {
  expect(await page.evaluate(name => ({
    local: localStorage.getItem(name), session: sessionStorage.getItem(name),
  }), storageKey)).toEqual({ local: null, session: null });
}

