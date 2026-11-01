import { asc, sql } from 'drizzle-orm';
import { mediaItem, musicTrack } from '#dialect/Schema';

const IN_ALBUM_ORDER = [
  asc(sql`coalesce(${musicTrack.discNumber}, 1)`),
  asc(sql`coalesce(${musicTrack.trackNumber}, 9999)`),
  asc(mediaItem.title),
  asc(mediaItem.id),
];

export { IN_ALBUM_ORDER };
