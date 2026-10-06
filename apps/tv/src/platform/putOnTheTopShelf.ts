import { requireOptionalNativeModule } from 'expo';
import { shelfEntryOf } from '@ValenceTv/platform/shelfEntryOf';
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
    .map(shelfEntryOf);

  void shelf?.publish(entries, signedHeaders()).catch(() => undefined);
};

export { putOnTheTopShelf };
