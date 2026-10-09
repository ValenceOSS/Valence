import { isProfileAbove } from '@ValenceContracts/functions/isProfileAbove';
import type { MediaRequest, Requester } from '@ValenceContracts/schemas/MediaRequest';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

/**
 * Those who joined a request asking at a higher quality profile than it was fetched with, so they
 * can be told on arrival that their version wasn't added — and nobody where the profile it was
 * fetched with, or theirs, is no longer known.
 *
 * @param request - The request, as it arrived.
 * @param profiles - Every profile, to say which is higher.
 * @returns Who asked higher, with the profile they asked at named.
 */
const askersKeptBelow = (
  request: Pick<MediaRequest, 'alsoAskedBy' | 'profileId' | 'profileName'>,
  profiles: readonly QualityProfile[],
): Requester[] => {
  const current =
    profiles.find((profile) => profile.id === request.profileId) ??
    profiles.find((profile) => profile.name === request.profileName);

  if (current === undefined) {
    return [];
  }

  return request.alsoAskedBy.filter((asker) => {
    const asked = profiles.find((profile) => profile.id === asker.profileId);

    return asked !== undefined && asked.kind === current.kind && isProfileAbove(asked, current);
  });
};

export { askersKeptBelow };
