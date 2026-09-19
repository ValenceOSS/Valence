import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { PlayableSource } from '@ValenceCore/functions/chooseSource';

type SourcesOfOptions = {
  item: MediaItem;
  path: string;
  renditions?: readonly { id: string; item: MediaItem; path: string }[];
};

/**
 * Every file an item can be served from: the original, and anything somebody chose to keep beside
 * it.
 *
 * The original comes first and is marked as such, because it is the one thing always there and the
 * one thing encoded from when nothing else will do.
 *
 * @param options - What the library holds for the item.
 * @returns The files to choose between.
 */
const sourcesOf = ({ item, path, renditions = [] }: SourcesOfOptions): PlayableSource[] => [
  { id: 'original', isOriginal: true, item, path },
  ...renditions.map((one) => ({ id: one.id, isOriginal: false, item: one.item, path: one.path })),
];

export type { SourcesOfOptions };

export { sourcesOf };
