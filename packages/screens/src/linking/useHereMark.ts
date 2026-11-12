import { useQuery } from '@tanstack/react-query';
import { inkFor } from '@ValenceClient/library/inkFor';
import { linkingQueries } from '@ValenceClient/query/linkingQueries';
import { serverPictureUrl } from '@ValenceClient/linking/serverPictureUrl';
import type { MediaCardOrigin } from '@ValenceUI/MediaCard.types';
import { say } from '@ValenceI18n/say';

/**
 * The mark a card carries for this server, beside the marks of the linked servers that have the same
 * title: its picture, or its initial in its colour, named on hover.
 *
 * @returns The mark, or null until this server says how it is shown, or where it is too old to.
 */
const useHereMark = (): MediaCardOrigin | null => {
  const here = useQuery(linkingQueries.here());
  const face = here.data ?? null;

  return face === null
    ? null
    : {
        initial: face.name.trim().slice(0, 1).toUpperCase(),
        colour: face.colour,
        ink: inkFor(face.colour),
        label: say('common.fromName', { name: face.name }),
        pictureUrl: serverPictureUrl(null, face.pictureAt),
      };
};

export { useHereMark };
