import { afterEach, describe, expect, it, vi } from 'vitest';
import { aLinkSharing } from '@ValenceClient/testing/aLinkSharing';
import { aServerAnswering } from '@ValenceClient/testing/aServerAnswering';
import { changeLinkSharing } from './changeLinkSharing';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('changeLinkSharing', () => {
  it('changes what a linked server is shared', async () => {
    const asked = aServerAnswering(aLinkSharing({ showsActivity: true }));

    expect(
      (await changeLinkSharing('a-server', { showsActivity: true })).value?.showsActivity,
    ).toBe(true);
    expect(asked.mock.calls[0]?.[0]).toBe('/api/linked-servers/a-server/sharing');
    expect(asked.mock.calls[0]?.[1]).toMatchObject({
      method: 'PATCH',
      body: JSON.stringify({ showsActivity: true }),
    });
  });
});
