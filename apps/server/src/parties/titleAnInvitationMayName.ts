import type { Viewer } from '@ValenceServer/visibility/Viewer';

type Invitation = {
  mediaId: string;
  inviter: Viewer;
  invitee: Viewer;
  isOutOfReach: (viewer: Viewer, mediaId: string) => Promise<boolean>;
  titleOf: (mediaId: string) => Promise<string | null>;
};

type Naming = { kind: 'refused' } | { kind: 'named'; title: string | null };

/**
 * Decides whether somebody may invite another to a party for an item, and whether the invitation
 * may carry the item's title.
 *
 * An item the inviter cannot reach is never invited to, and its title goes only to somebody who
 * can reach it themselves.
 *
 * @param invitation - Who invites whom to which item, and how reach and titles are read.
 * @returns Refused, or the title the invitation may name, which is null where it may name none.
 */
const titleAnInvitationMayName = async (invitation: Invitation): Promise<Naming> => {
  const { mediaId, inviter, invitee, isOutOfReach, titleOf } = invitation;

  if (await isOutOfReach(inviter, mediaId)) {
    return { kind: 'refused' };
  }

  if (await isOutOfReach(invitee, mediaId)) {
    return { kind: 'named', title: null };
  }

  return { kind: 'named', title: await titleOf(mediaId) };
};

export type { Invitation, Naming };

export { titleAnInvitationMayName };
