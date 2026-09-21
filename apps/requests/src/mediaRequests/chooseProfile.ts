import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { isForLibrary } from '@ValenceContracts/functions/profilesOnOffer';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';

/**
 * The quality profile a request is judged by: the one chosen for it, or else the one its library
 * names — of the profiles for music where it is an artist or an album, and of those for films and
 * series where it is not.
 *
 * A profile written for this library beats one written for every library. Both apply, so the one
 * an operator went to the trouble of naming this library on is the one they meant.
 *
 * @param request - The request.
 * @param profiles - Every profile.
 * @returns The profile, or null where there is none for it.
 */
const chooseProfile = (
  request: Pick<MediaRequestRecord, 'kind' | 'profileId' | 'libraryId'>,
  profiles: readonly QualityProfile[],
): QualityProfile | null => {
  const kind = isMusicRequest(request.kind) ? 'music' : 'video';
  const fitting = profiles.filter((profile) => profile.kind === kind);

  return (
    fitting.find((profile) => profile.id === request.profileId) ??
    fitting.find((profile) => profile.libraryIds.includes(request.libraryId)) ??
    fitting.find((profile) => isForLibrary(profile, request.libraryId)) ??
    null
  );
};

export { chooseProfile };
