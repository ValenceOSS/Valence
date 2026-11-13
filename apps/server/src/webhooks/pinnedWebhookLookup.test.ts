import type { LookupAddress } from 'node:dns';
import { describe, expect, it } from 'vitest';
import { pinnedWebhookLookup } from './pinnedWebhookLookup';

const lookedUp = (hostname: string, reachesLocalNetwork: boolean, all: boolean) =>
  new Promise<{
    error: Error | null;
    address: string | LookupAddress[];
    family: number | undefined;
  }>((resolve) => {
    pinnedWebhookLookup(reachesLocalNetwork)(hostname, { all }, (error, address, family) => {
      resolve({ error, address, family });
    });
  });

describe('pinnedWebhookLookup', () => {
  it('refuses a private address unless the local network is allowed', async () => {
    expect((await lookedUp('127.0.0.1', false, false)).error).toBeInstanceOf(Error);
    expect((await lookedUp('127.0.0.1', false, true)).error).toBeInstanceOf(Error);
  });

  it('answers a single address when one is asked for', async () => {
    const answer = await lookedUp('127.0.0.1', true, false);

    expect(answer).toStrictEqual({ error: null, address: '127.0.0.1', family: 4 });
  });

  it('answers a list when all addresses are asked for', async () => {
    const answer = await lookedUp('127.0.0.1', true, true);

    expect(answer.address).toStrictEqual([{ address: '127.0.0.1', family: 4 }]);
  });

  it('refuses a link-local address even with the local network allowed', async () => {
    expect((await lookedUp('169.254.169.254', true, false)).error).toBeInstanceOf(Error);
  });
});
