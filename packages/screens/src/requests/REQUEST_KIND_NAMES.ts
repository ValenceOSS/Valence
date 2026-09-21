import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

const REQUEST_KIND_NAMES: Readonly<Record<MediaRequestKind, string>> = {
  film: 'Film',
  series: 'Series',
  artist: 'Artist',
  album: 'Album',
  book: 'Book',
};

export { REQUEST_KIND_NAMES };
