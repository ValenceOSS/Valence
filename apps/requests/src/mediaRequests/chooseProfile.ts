import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';

/**
 * The quality profile a request is judged by: the one chosen for it, or else the one its library
 * names, of the profiles for films and series.
 *
 * @param request - The request.
 * @param profiles - Every profile.
 * @returns The profile, or null where there is none for it.
 */
const chooseProfile = (
  request: Pick<MediaRequestRecord, 'profileId' | 'libraryId'>,
  profiles: readonly QualityProfile[],
): QualityProfile | null => {
  const video = profiles.filter((profile) => profile.kind === 'video');

  return (
    video.find((profile) => profile.id === request.profileId) ??
    video.find((profile) => profile.libraryIds.includes(request.libraryId)) ??
    null
  );
};

export { chooseProfile };
