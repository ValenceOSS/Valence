import { Check as CheckIcon } from '@keyline-icons/react';
import { IN_LIBRARY_BADGE } from '@ValenceScreens/library/IN_LIBRARY_BADGE';
import { describeStanding } from '@ValenceClient/requests/describeStanding';
import type { MediaCardBadge, MediaCardCorner } from '@ValenceUI/MediaCard.types';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import { say } from '@ValenceI18n/say';

/**
 * Says how a title to ask for is drawn on a card: how far its request has got, or that it is already
 * in the library, as a badge — and, where whoever is watching has seen it through, a tick in the
 * corner. The tick means watched everywhere in Valence, so being in the library is said in words
 * rather than with it. What kind of thing it is goes unsaid, the shelf it is on saying so, and being
 * on a linked server is the server's own mark, from `useStandingOrigin`, rather than words.
 *
 * @param title - The title.
 * @param isWatched - Whether whoever is watching has seen it to the end.
 * @returns The badges and, where it is watched, the corner mark.
 */
const describeCatalogueCard = (
  title: CatalogueTitle,
  isWatched = false,
): { badges: MediaCardBadge[]; corner?: MediaCardCorner } => {
  if (title.standing.status === 'library') {
    return {
      badges: [IN_LIBRARY_BADGE],
      ...(isWatched ? { corner: { icon: CheckIcon, label: say('common.watched') } } : {}),
    };
  }

  const standing = title.standing.status === 'linked' ? null : describeStanding(title.standing);

  return { badges: standing === null ? [] : [standing] };
};

export { describeCatalogueCard };
