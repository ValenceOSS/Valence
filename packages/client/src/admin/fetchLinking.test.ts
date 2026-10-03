import { afterEach, describe, expect, it, vi } from 'vitest';
import { aServerAnswering } from '@ValenceClient/testing/aServerAnswering';
import { aLinkIdentity } from '@ValenceClient/testing/aLinkIdentity';
import { aLinkedServer } from '@ValenceClient/testing/aLinkedServer';
import { fetchLinking } from './fetchLinking';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchLinking', () => {
  it('reads the identity, the invites and the servers', async () => {
    aServerAnswering({ identity: aLinkIdentity(), invites: [], servers: [aLinkedServer()] });

    expect((await fetchLinking()).servers[0]?.name).toBe('Films');
  });
});
