import { useOriginOf } from '@ValenceClient/linking/useOriginOf';
import { IN_LIBRARY_BADGE } from '@ValenceScreens/library/IN_LIBRARY_BADGE';
import type { MediaCardBadge } from '@ValenceUI/MediaCard.types';

/**
 * What a card says of something the libraries hold, beside things to ask for: that it is in the
 * library, in the same badge every page draws it with — or nothing where it is on a linked server,
 * whose mark in the corner already says where it is.
 *
 * @returns A reader of the badges, by the library the thing is in.
 */
const useHeldBadges = () => {
  const originOf = useOriginOf();

  return (libraryId: string): MediaCardBadge[] =>
    originOf(libraryId) === null ? [IN_LIBRARY_BADGE] : [];
};

export { useHeldBadges };
