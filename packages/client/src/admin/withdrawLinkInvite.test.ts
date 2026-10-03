import { afterEach, describe, expect, it, vi } from 'vitest';
import { aServerAnswering } from '@ValenceClient/testing/aServerAnswering';
import { withdrawLinkInvite } from './withdrawLinkInvite';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('withdrawLinkInvite', () => {
  it('withdraws an invite by its id', async () => {
    const asked = aServerAnswering(null, 204);

    expect(await withdrawLinkInvite('an-invite')).toBeNull();
    expect(asked.mock.calls[0]?.[0]).toBe('/api/linked-servers/invites/an-invite');
    expect(asked.mock.calls[0]?.[1]).toMatchObject({ method: 'DELETE' });
  });
});
