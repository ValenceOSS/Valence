import { Check as CheckIcon } from '@keyline-icons/react';
import { REQUEST_KIND_NAMES } from '@ValenceScreens/requests/REQUEST_KIND_NAMES';
import { describeStanding } from '@ValenceClient/requests/describeStanding';
import type { MediaCardCorner } from '@ValenceUI/MediaCard.types';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';

/**
 * Says how a title to ask for is drawn on a card: the kind of thing it is, how far its request has
 * got, and that it is already in the library, as badges — and, where whoever is watching has seen
 * it through, a tick in the corner. The tick means watched everywhere in Valence, so being in the
 * library is said in words beside the kind rather than with it.
 *
 * @param title - The title.
 * @param isWatched - Whether whoever is watching has seen it to the end.
 * @returns The badges and, where it is watched, the corner mark.
 */
const describeCatalogueCard = (
  title: CatalogueTitle,
  isWatched = false,
): { badges: string[]; corner?: MediaCardCorner } => {
  if (title.standing.status === 'library') {
    return {
      badges: [REQUEST_KIND_NAMES[title.kind], 'In library'],
      ...(isWatched ? { corner: { icon: CheckIcon, label: 'Watched' } } : {}),
    };
  }

  const standing = describeStanding(title.standing);

  return {
    badges: [REQUEST_KIND_NAMES[title.kind], ...(standing === null ? [] : [standing.label])],
  };
};

export { describeCatalogueCard };
