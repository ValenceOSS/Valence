import { Tick02Icon } from '@hugeicons/core-free-icons';
import { REQUEST_KIND_NAMES } from '@ValenceScreens/requests/REQUEST_KIND_NAMES';
import { describeStanding } from './describeStanding';
import type { MediaCardCorner } from '@ValenceUI/MediaCard.types';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';

/**
 * Says how a title to ask for is drawn on a card: the kind of thing it is and how far its request
 * has got as badges, and that it is already in the library as a mark in the corner, which is a fact
 * to glance at rather than to read.
 *
 * @param title - The title.
 * @returns The badges and, where it is already held, the corner mark.
 */
const describeCatalogueCard = (
  title: CatalogueTitle,
): { badges: string[]; corner?: MediaCardCorner } => {
  if (title.standing.status === 'library') {
    return {
      badges: [REQUEST_KIND_NAMES[title.kind]],
      corner: { icon: Tick02Icon, label: 'In your library' },
    };
  }

  const standing = describeStanding(title.standing);

  return {
    badges: [REQUEST_KIND_NAMES[title.kind], ...(standing === null ? [] : [standing.label])],
  };
};

export { describeCatalogueCard };
