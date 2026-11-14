import { describe, expect, it } from 'vitest';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import { mayInviteTo } from './mayInviteTo';

const inviter: Viewer = {
  kind: 'account',
  accountId: 'inviter',
  profileId: null,
  isAdministrator: false,
};

describe('mayInviteTo', () => {
  it('lets somebody invite to an item they can reach', async () => {
    expect(await mayInviteTo(inviter, 'film-1', () => Promise.resolve(false))).toBe(true);
  });

  it('refuses an item the inviter cannot reach', async () => {
    expect(await mayInviteTo(inviter, 'film-1', () => Promise.resolve(true))).toBe(false);
  });
});
