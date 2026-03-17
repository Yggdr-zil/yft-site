import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { unlinkSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const FUNDS = [
  { id: '1517',      name: '1517 Fund',         deckPath: '/1517-deck/' },
  { id: 'iv',        name: 'Industry Ventures',  deckPath: '/industry-ventures-deck/' },
  { id: 'contrary',  name: 'Contrary Capital',    deckPath: '/contrary-deck/' },
  { id: 'lux',       name: 'Lux Capital',         deckPath: '/lux-deck/' },
  { id: 'precursor', name: 'Precursor Ventures',  deckPath: '/precursor-deck/' },
  { id: 'qed',       name: 'QED Investors',       deckPath: '/qed-deck/' },
  { id: 'nyca',      name: 'NYCA Partners',       deckPath: '/nyca-deck/' },
  { id: 'ribbit',    name: 'Ribbit Capital',       deckPath: '/ribbit-deck/' },
];

async function getTelemetry(request: APIRequestContext): Promise<any[]> {
  const resp = await request.get('/api/admin/log', {
    headers: {
      Authorization: 'Basic ' + Buffer.from('admin:ygg2026').toString('base64'),
    },
  });
  if (!resp.ok()) return [];
  const data = await resp.json();
  return data.events || [];
}

/** Inject stored token into sessionStorage so the portal auto-auths without a login API call. */
async function injectSession(page: Page, fundId: string, token: string) {
  await page.goto(`/portal/${fundId}/`);
  await page.evaluate(
    ({ key, tok, fid }) => {
      sessionStorage.setItem(key, JSON.stringify({ token: tok, fundId: fid }));
    },
    { key: `yft_portal_${fundId}`, tok: token, fid: fundId },
  );
  await page.reload();
  await expect(page.locator('#auth-gate')).toHaveClass(/hidden/);
  await expect(page.locator('#portal')).toHaveClass(/active/);
}

// Wipe telemetry before the entire suite so old events don't pollute assertions
test.beforeAll(async () => {
  const telemPath = join(__dirname, '..', 'server', 'telemetry.ndjson');
  if (existsSync(telemPath)) {
    try { unlinkSync(telemPath); } catch { /* ok */ }
  }
});

for (const fund of FUNDS) {
  test.describe(`${fund.name} (${fund.id})`, () => {
    // Serial mode: tests share the `token` variable; login test runs first
    test.describe.configure({ mode: 'serial' });

    let token: string;

    test('portal login + telemetry', async ({ page, request }) => {
      await page.goto(`/portal/${fund.id}/`);
      await page.fill('#auth-uid', fund.id);
      await page.fill('#auth-pw', 'ygg2026');
      await page.click('#auth-submit');
      await expect(page.locator('#auth-gate')).toHaveClass(/hidden/, { timeout: 10000 });
      await expect(page.locator('#portal')).toHaveClass(/active/);

      // Extract the token stored by the portal's login handler
      token = await page.evaluate((key: string) => {
        const s = sessionStorage.getItem(key);
        return s ? JSON.parse(s).token : null;
      }, `yft_portal_${fund.id}`);
      expect(token).toBeTruthy();

      // Verify the server logged a login event
      const events = await getTelemetry(request);
      const loginEvent = events.find(
        (e: any) => e.event === 'login' && e.fund === fund.id,
      );
      expect(loginEvent).toBeTruthy();
    });

    test('deck tab loads correct deck', async ({ page }) => {
      test.skip(!token, 'login test must pass first');
      await injectSession(page, fund.id, token);

      const deckIframe = page.locator('#iframe-deck');
      await expect(deckIframe).toHaveAttribute('src', new RegExp(fund.deckPath));
    });

    test('playbook tab loads PDF', async ({ page }) => {
      test.skip(!token, 'login test must pass first');
      await injectSession(page, fund.id, token);

      await page.click('button[data-tab="playbook"]');
      const playbookIframe = page.locator('#panel-playbook iframe');
      await expect(playbookIframe).toHaveAttribute(
        'src',
        '/docs/yggdrasil-playbook.pdf',
      );
    });

    test('one-pager tab loads PDF', async ({ page }) => {
      test.skip(!token, 'login test must pass first');
      await injectSession(page, fund.id, token);

      await page.click('button[data-tab="onepager"]');
      const onepagerIframe = page.locator('#panel-onepager iframe');
      await expect(onepagerIframe).toHaveAttribute(
        'src',
        '/docs/yggdrasil-one-pager-v2.pdf',
      );
    });

    test('dashboard button opens new tab + cross-tab auth', async ({ page, context }) => {
      test.skip(!token, 'login test must pass first');
      await injectSession(page, fund.id, token);

      // Listen for popup before clicking
      const popupPromise = context.waitForEvent('page');
      await page.click('#btn-dashboard');

      // Read localStorage immediately — the dashboard popup's LoginGate may
      // consume (promote + delete) the token from localStorage on load.
      const storedToken = await page.evaluate(() =>
        localStorage.getItem('ygg_vc_token'),
      );

      const popup = await popupPromise;

      // If the popup's LoginGate already consumed the token, check popup's
      // sessionStorage instead (cross-tab promotion succeeded).
      let tokenFound = !!storedToken;
      if (!tokenFound) {
        try {
          await popup.waitForLoadState('domcontentloaded');
          const popupToken = await popup.evaluate(() =>
            sessionStorage.getItem('ygg_vc_token'),
          );
          tokenFound = !!popupToken;
        } catch { /* popup may have closed or navigated */ }
      }

      expect(tokenFound).toBeTruthy();
      await popup.close();
    });

    test('session persistence', async ({ page }) => {
      test.skip(!token, 'login test must pass first');
      await injectSession(page, fund.id, token);

      // Navigate away
      await page.goto('/');

      // Return to portal — should auto-auth (sessionStorage persists in same tab)
      await page.goto(`/portal/${fund.id}/`);
      await expect(page.locator('#auth-gate')).toHaveClass(/hidden/);
      await expect(page.locator('#portal')).toHaveClass(/active/);
    });
  });
}
