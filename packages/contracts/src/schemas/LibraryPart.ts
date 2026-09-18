import { z } from 'zod';
import type { LibraryKind } from './Library';

const LIBRARY_PARTS = [
  'descriptions',
  'cast',
  'ageRatings',
  'trailers',
  'artwork',
  'logos',
  'previews',
  'scrubPreviews',
  'intros',
  'albumCovers',
  'artistPictures',
  'lyrics',
  'musicVideos',
] as const;

const LibraryPartSchema = z.enum(LIBRARY_PARTS);

type LibraryPart = z.infer<typeof LibraryPartSchema>;

const WATCHABLE_PARTS: readonly LibraryPart[] = [
  'descriptions',
  'cast',
  'ageRatings',
  'trailers',
  'artwork',
  'logos',
  'previews',
  'scrubPreviews',
  'intros',
];

const LIBRARY_PARTS_BY_KIND: Record<LibraryKind, readonly LibraryPart[]> = {
  movies: WATCHABLE_PARTS,
  shows: WATCHABLE_PARTS,
  music: ['albumCovers', 'artistPictures', 'lyrics', 'musicVideos'],
  books: [],
};

export type { LibraryPart };

export { LIBRARY_PARTS, LIBRARY_PARTS_BY_KIND, LibraryPartSchema };
