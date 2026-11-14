import { describe, expect, it } from 'vitest';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import { titleAnInvitationMayName } from './titleAnInvitationMayName';

const viewer = (accountId: string): Viewer => ({
  kind: 'account',
  accountId,
  profileId: null,
  isAdministrator: false,
});

const invite = (refused: readonly string[]) =>
  titleAnInvitationMayName({
    mediaId: 'film-1',
    inviter: viewer('inviter'),
    invitee: viewer('invitee'),
    isOutOfReach: (asking) =>
      Promise.resolve(asking.kind === 'account' && refused.includes(asking.accountId)),
    titleOf: () => Promise.resolve('A Film'),
  });

describe('titleAnInvitationMayName', () => {
  it('names the title when both of them may reach the item', async () => {
    expect(await invite([])).toEqual({ kind: 'named', title: 'A Film' });
  });

  it('refuses an item the inviter may not reach', async () => {
    expect(await invite(['inviter'])).toEqual({ kind: 'refused' });
  });

  it('names no title to somebody who may not reach the item', async () => {
    expect(await invite(['invitee'])).toEqual({ kind: 'named', title: null });
  });
});
