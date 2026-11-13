import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * The pictures a card draws for a title: the wide one it opens into, and the one it rests on, which
 * is the poster for a card that stands upright and the wide one otherwise. Large cards, as a grid
 * that stretches them draws, take the poster at its middle size; a rail's smaller cards take its
 * small one.
 *
 * @param media - The title.
 * @param look - Whether the card stands upright on the poster, whether it is a programme, and
 *   whether it is drawn large.
 * @returns The wide picture and the resting one, each where the title has one.
 */
const cardArtworkOf = (
  media: Pick<MediaSummary, 'id' | 'hasBackdrop' | 'hasPoster'>,
  look: { shape: string; isSeries: boolean; drawsLarge: boolean },
): { wide: string | undefined; resting: string | undefined } => {
  const wide = media.hasBackdrop
    ? artworkUrl(media.id, 'backdrop', { isOfTitle: look.isSeries, size: 'medium' })
    : media.hasPoster
      ? artworkUrl(media.id, 'poster', { size: 'medium' })
      : undefined;

  return {
    wide,
    resting:
      look.shape === 'poster' && media.hasPoster
        ? artworkUrl(media.id, 'poster', { size: look.drawsLarge ? 'medium' : 'small' })
        : wide,
  };
};

export { cardArtworkOf };
