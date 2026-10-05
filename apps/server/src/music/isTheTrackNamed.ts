import { and } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { mediaItem, musicArtist } from '#dialect/Schema';
import { containsInsensitively } from '@ValenceDatabase/containsInsensitively';
import { likeLiterally } from '@ValenceDatabase/likeLiterally';

/**
 * A condition that holds for a song with this title, credited to this artist, whatever the case of
 * either — how a song named by another service, which knows nothing of the library's ids, is found.
 * The query joins each track to its credited artists for it.
 *
 * @param title - The song's title.
 * @param artist - One artist it is credited to.
 * @returns The condition, on the media item and the artist being read.
 */
const isTheTrackNamed = (title: string, artist: string): SQL | undefined =>
  and(
    containsInsensitively(mediaItem.title, likeLiterally(title)),
    containsInsensitively(musicArtist.name, likeLiterally(artist)),
  );

export { isTheTrackNamed };
