import { describe, expect, it } from 'vitest';
import { createPinnedWebhookFetcher } from './createPinnedWebhookFetcher';

const init = {
  method: 'POST',
  headers: {},
  body: '{}',
  signal: AbortSignal.timeout(1000),
};

describe('createPinnedWebhookFetcher', () => {
  it('refuses a private address written out, before connecting', async () => {
    await expect(createPinnedWebhookFetcher(false)('http://127.0.0.1:9/x', init)).rejects.toThrow();
    await expect(createPinnedWebhookFetcher(false)('http://[::1]:9/x', init)).rejects.toThrow();
  });

  it('refuses a link-local address written out even with the local network allowed', async () => {
    await expect(
      createPinnedWebhookFetcher(true)('http://169.254.169.254/latest/meta-data/', init),
    ).rejects.toThrow();
  });

  it('refuses a name that resolves to a private address', async () => {
    await expect(createPinnedWebhookFetcher(false)('http://localhost:9/x', init)).rejects.toThrow();
  });
});
