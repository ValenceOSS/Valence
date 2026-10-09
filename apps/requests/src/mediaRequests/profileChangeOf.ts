import { isProfileAbove } from '@ValenceContracts/functions/isProfileAbove';
import { chooseProfile } from '@ValenceRequests/mediaRequests/chooseProfile';
import type { z } from 'zod';
import type { MediaRequestDraftSchema } from '@ValenceContracts/schemas/MediaRequest';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';

/**
 * What a later ask at a quality profile does to the request already kept for the same title.
 *
 * Its only asker asking again at another profile changes it, as it always did. Somebody else asking
 * at the same profile or a lower one just joins: one person's ask never quietly downgrades another's.
 * Somebody asking at a higher one — higher in the operator's order — goes the way the library says:
 * the request moves up to it, stays where it is, keeps both versions where it is a film, or waits for
 * the operator to say which — as a film keeping both would where it is not one.
 *
 * @param kept - The request kept.
 * @param draft - The later ask.
 * @param profiles - Every profile, to say which is higher.
 * @returns The change to the request.
 */
const profileChangeOf = (
  kept: MediaRequestRecord,
  draft: z.infer<typeof MediaRequestDraftSchema>,
  profiles: readonly QualityProfile[],
): Partial<MediaRequestRecord> => {
  if (draft.profileId === null || draft.profileId === kept.profileId) {
    return {};
  }

  if (kept.requestedById === draft.requestedBy.id && kept.alsoAskedBy.length === 0) {
    return { profileId: draft.profileId, profileAsk: null };
  }

  const asked = profiles.find((profile) => profile.id === draft.profileId);
  const current = chooseProfile(kept, profiles);

  if (asked === undefined || (current !== null && !isProfileAbove(asked, current))) {
    return {};
  }

  switch (draft.higherProfileAsks) {
    case 'upgrade':
      return { profileId: asked.id, profileAsk: null };
    case 'keep':
      return {};
    case 'both':
      if (kept.kind === 'film') {
        return (kept.versions ?? []).includes(asked.id)
          ? {}
          : { versions: [...(kept.versions ?? []), asked.id] };
      }

      return {
        profileAsk: {
          asker: { id: draft.requestedBy.id, name: draft.requestedBy.name },
          profileId: asked.id,
          profileName: asked.name,
        },
      };
    case 'ask':
      return {
        profileAsk: {
          asker: { id: draft.requestedBy.id, name: draft.requestedBy.name },
          profileId: asked.id,
          profileName: asked.name,
        },
      };
  }
};

export { profileChangeOf };
