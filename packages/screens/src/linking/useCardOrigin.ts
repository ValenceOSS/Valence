import { inkFor } from '@ValenceClient/library/inkFor';
import { useOriginOf } from '@ValenceClient/linking/useOriginOf';
import type { MediaCardOrigin } from '@ValenceUI/MediaCard.types';

/**
 * The mark a card carries for something from a linked server, as a set of props to spread onto it:
 * that server's initial in its colour, named on hover. Something from this server spreads nothing.
 *
 * @returns A reader of the props, by the library the thing is in.
 */
const useCardOrigin = () => {
  const originOf = useOriginOf();

  return (libraryId: string): { origin?: MediaCardOrigin } => {
    const origin = originOf(libraryId);

    return origin === null
      ? {}
      : {
          origin: {
            initial: origin.initial,
            colour: origin.colour,
            ink: inkFor(origin.colour),
            label: origin.label,
          },
        };
  };
};

export { useCardOrigin };
