import { afterEach, describe, expect, it, vi } from 'vitest';
import { aLinkSharing } from '@ValenceClient/testing/aLinkSharing';
import { aServerAnswering } from '@ValenceClient/testing/aServerAnswering';
import { fetchLinkSharing } from './fetchLinkSharing';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchLinkSharing', () => {
  it('reads what a linked server is shared', async () => {
    const asked = aServerAnswering(aLinkSharing());

    expect((await fetchLinkSharing('a-server')).namesTravel).toBe(true);
    expect(asked.mock.calls[0]?.[0]).toBe('/api/linked-servers/a-server/sharing');
  });
});
