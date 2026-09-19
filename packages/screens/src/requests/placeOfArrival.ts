import type { Place } from '@ValenceClient/navigation/readLocation';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Where to go to open something asked for once it is in the library: a film's page, a series'
 * page, or — for an album, or the album of an artist's that arrived — the album in the music
 * section.
 *
 * @param kind - What kind of thing was asked for.
 * @param mediaId - What the library found it as.
 * @returns The change of place that opens it.
 */
const placeOfArrival = (kind: MediaRequestKind, mediaId: string): Partial<Place> => {
  switch (kind) {
    case 'film':
      return { inspecting: mediaId, asking: null };
    case 'series':
      return { show: mediaId, asking: null };
    case 'artist':
    case 'album':
      return { section: 'music', listen: `album:${mediaId}`, asking: null };
  }
};

export { placeOfArrival };
