import { test, expect } from '@playwright/test';

test('GET /docs/yggdrasil-playbook.pdf returns 200', async ({ request }) => {
  const resp = await request.get('/docs/yggdrasil-playbook.pdf');
  expect(resp.status()).toBe(200);
});

test('GET /docs/yggdrasil-one-pager-v2.pdf returns 200', async ({ request }) => {
  const resp = await request.get('/docs/yggdrasil-one-pager-v2.pdf');
  expect(resp.status()).toBe(200);
});
