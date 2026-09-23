import { requireOptionalNativeModule } from 'expo';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { showIdOf } from '@ValenceClient/library/showIdOf';
import { onTheServer } from '@ValenceTv/platform/theServersOrigin';
import { signedHeaders } from '@ValenceTv/platform/theSessionToken';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const SHELVED = 10;

const shelf = requireOptionalNativeModule<{
  publish: (
    entries: { id: string; title: string; kind: string; imageUrl: string }[],
    headers: Record<string, string>,
  ) => Promise<void>;
}>('ValenceTopShelf');

/**
 * Hands the television the titles to show above Valence in its top row: the newest to arrive, each
 * with its picture, fetched now as whoever is watching so the shelf never has to sign in itself.
 * Titles without a picture are left off, since the shelf is nothing but pictures.
 *
 * @param titles - The titles newest first, as the front page's shelf of recent arrivals has them.
 */
const putOnTheTopShelf = (titles: readonly MediaSummary[]): void => {
  const entries = titles
    .filter((media) => media.hasBackdrop)
    .slice(0, SHELVED)
    .map((media) => ({
      id: media.id,
      title: media.seriesTitle ?? media.title,
      kind: showIdOf(media) === null ? 'film' : 'show',
      imageUrl: onTheServer(artworkUrl(media.id, 'backdrop')),
    }));

  void shelf?.publish(entries, signedHeaders()).catch(() => undefined);
};

export { putOnTheTopShelf };
