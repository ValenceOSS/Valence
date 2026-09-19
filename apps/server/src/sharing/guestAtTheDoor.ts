import type { ShareService } from './ShareService';

type GuestAtTheDoor = {
  shareId: string;
  guestOf: string | null;
};

/**
 * Who is arriving on a share link, for a request that has already been let in.
 *
 * Only the name is worked out here. Whether the link still works — withdrawn, expired, full — was
 * settled by the share gate before this runs, and settling it a second time would get it wrong:
 * the cap counts people rather than requests, so a check without the joiner cookie beside it would
 * refuse the very guest the gate had just admitted.
 *
 * @param token - What the share cookie holds, where it holds anything.
 * @param shares - Where links are resolved.
 * @returns Which link they hold and whose it is, or nothing where they hold none.
 */
const guestAtTheDoor = async (
  token: string | undefined,
  shares: Pick<ShareService, 'resolve'>,
): Promise<GuestAtTheDoor | null> => {
  if (token === undefined || token === '') {
    return null;
  }

  const found = await shares.resolve(token);

  return found === null ? null : { shareId: found.id, guestOf: found.createdByName };
};

export type { GuestAtTheDoor };

export { guestAtTheDoor };
