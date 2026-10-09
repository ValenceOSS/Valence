import { say } from '@ValenceI18n/say';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

/**
 * What became of the quality profile somebody asked at, where it is not the one the request is
 * fetched with: still waiting for an admin to say, or kept at the request's own — never put as a
 * refusal, because they still get the title. Nothing where they got what they asked for, as the
 * request's own profile or as a further version kept beside it.
 *
 * @param request - The request.
 * @param meId - Whoever is looking, by their account.
 * @returns What to say, or null.
 */
const describeMyProfileAsk = (
  request: Pick<
    MediaRequest,
    'alsoAskedBy' | 'profileAsk' | 'profileId' | 'profileName' | 'versions'
  >,
  meId: string | null | undefined,
): string | null => {
  const mine = request.alsoAskedBy.find((asker) => asker.id === meId);
  const askedId = mine?.profileId ?? null;

  if (askedId === null || askedId === request.profileId || request.versions?.includes(askedId)) {
    return null;
  }

  const asked = mine?.profileName ?? null;

  if (asked === null) {
    return null;
  }

  return request.profileAsk?.asker.id === meId
    ? say('common.youAskedForProfileWaiting', { asked })
    : say('common.youAskedForProfileKept', {
        asked,
        current: request.profileName ?? say('common.itsLibrarysProfile'),
      });
};

export { describeMyProfileAsk };
