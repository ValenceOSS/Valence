import type { Viewer } from '@ValenceServer/visibility/Viewer';

/**
 * Whether somebody may invite another to a party for an item, which they may only where they can
 * reach the item themselves, wherever the invitee is.
 *
 * @param inviter - Who is inviting.
 * @param mediaId - The item the party is for.
 * @param isOutOfReach - How reach is read.
 * @returns Whether the invitation may go out.
 */
const mayInviteTo = async (
  inviter: Viewer,
  mediaId: string,
  isOutOfReach: (viewer: Viewer, mediaId: string) => Promise<boolean>,
): Promise<boolean> => !(await isOutOfReach(inviter, mediaId));

export { mayInviteTo };
