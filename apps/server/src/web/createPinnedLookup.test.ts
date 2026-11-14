import type { LookupAddress } from 'node:dns';
import { describe, expect, it } from 'vitest';
import { createPinnedLookup } from './createPinnedLookup';

const lookedUp = (hostname: string, allowed: readonly string[], all: boolean) =>
  new Promise<{
    error: Error | null;
    address: string | LookupAddress[];
    family: number | undefined;
  }>((resolve) => {
    createPinnedLookup(
      (address) => allowed.includes(address),
      (addresses) => new Error(addresses.join(',')),
    )(hostname, { all }, (error, address, family) => {
      resolve({ error, address, family });
    });
  });

describe('createPinnedLookup', () => {
  it('refuses an address that is not allowed, saying which were found', async () => {
    const answer = await lookedUp('127.0.0.1', [], false);

    expect(answer.error?.message).toBe('127.0.0.1');
    expect((await lookedUp('127.0.0.1', [], true)).error).toBeInstanceOf(Error);
  });

  it('answers a single address when one is asked for', async () => {
    const answer = await lookedUp('127.0.0.1', ['127.0.0.1'], false);

    expect(answer).toStrictEqual({ error: null, address: '127.0.0.1', family: 4 });
  });

  it('answers a list when all addresses are asked for', async () => {
    const answer = await lookedUp('127.0.0.1', ['127.0.0.1'], true);

    expect(answer.address).toStrictEqual([{ address: '127.0.0.1', family: 4 }]);
  });
});
