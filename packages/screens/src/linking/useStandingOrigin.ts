import { useQuery } from '@tanstack/react-query';
import { inkFor } from '@ValenceClient/library/inkFor';
import { linkingQueries } from '@ValenceClient/query/linkingQueries';
import { serverPictureUrl } from '@ValenceClient/linking/serverPictureUrl';
import type { CatalogueStanding } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaCardOrigin } from '@ValenceUI/MediaCard.types';
import { say } from '@ValenceI18n/say';

/**
 * The mark a card for a title to ask for carries where a linked server already has it, as a set of
 * props to spread onto the card: that server's picture, or its initial in its colour, named on hover, as a title
 * from a linked server is marked on the library's own pages. A title no linked server has spreads
 * nothing.
 *
 * @returns A reader of the props, by where the title stands.
 */
const useStandingOrigin = () => {
  const faces = useQuery(linkingQueries.faces());

  return (standing: CatalogueStanding): { origin?: MediaCardOrigin } => {
    const name = standing.status === 'linked' ? (standing.fromServer ?? null) : null;

    if (name === null) {
      return {};
    }

    const face = faces.data?.find((one) => one.name === name);
    const colour = face?.colour ?? 'var(--color-text-muted)';

    return {
      origin: {
        initial: name.trim().slice(0, 1).toUpperCase(),
        colour,
        ink: colour.startsWith('#') ? inkFor(colour) : 'light',
        label: say('common.fromName', { name }),
        pictureUrl: face === undefined ? null : serverPictureUrl(face.id, face.pictureAt),
      },
    };
  };
};

export { useStandingOrigin };
