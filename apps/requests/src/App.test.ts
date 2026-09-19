import { describe, expect, it } from 'vitest';
import { RequestsStatusSchema } from '@ValenceContracts/schemas/Requests';
import type { RequestsVpn } from '@ValenceContracts/schemas/Requests';
import { createApp } from './App';

const A_SECRET = 'a-secret-long-enough-to-be-worth-keeping';

const A_VPN: RequestsVpn = {
  isConfigured: true,
  isUp: true,
  publicAddress: '203.0.113.7',
  country: 'Netherlands',
  checkedAt: '2026-09-19T12:00:00.000Z',
  problem: null,
};

/**
 * The service, with its database answering or not.
 */
const aService = (isDatabaseUp = true) =>
  createApp({
    secret: A_SECRET,
    version: '0.4.0',
    readVpn: () => A_VPN,
    isDatabaseUp: () => Promise.resolve(isDatabaseUp),
  });

describe('createApp', () => {
  it('answers a health check without the secret', async () => {
    const response = await aService().request('/health');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it('fails the health check when the database does not answer', async () => {
    const response = await aService(false).request('/health');

    expect(response.status).toBe(503);
  });

  it('says what it is and how the VPN is to whoever holds the secret', async () => {
    const response = await aService().request('/api/status', {
      headers: { Authorization: `Bearer ${A_SECRET}` },
    });

    expect(response.status).toBe(200);
    expect(RequestsStatusSchema.parse(await response.json())).toEqual({
      version: '0.4.0',
      vpn: A_VPN,
    });
  });

  it('turns away anybody without the secret', async () => {
    const response = await aService().request('/api/status');

    expect(response.status).toBe(401);
  });

  it('turns away the wrong secret', async () => {
    const response = await aService().request('/api/status', {
      headers: { Authorization: 'Bearer a-guess-that-is-not-the-secret-at-all' },
    });

    expect(response.status).toBe(401);
  });
});
