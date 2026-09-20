import { isSameTitle } from '@ValenceRequests/mediaRequests/isSameTitle';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

type Matchable = Pick<RequestItemRecord, 'id' | 'title'>;

const DASHES = /\s*-\s*/g;

const TRAILING_EDITION = /\s*[([][^()[\]]*[)\]]\s*$/;

/**
 * A title without the editions, remasters and years bracketed on its end, as in
 * `The Dark Side of the Moon (50th Anniversary Edition)`.
 *
 * @param title - The title.
 * @returns It without them.
 */
const withoutEditions = (title: string): string => {
  const shorter = title.replace(TRAILING_EDITION, '');

  return shorter === title || shorter === '' ? title : withoutEditions(shorter);
};

/**
 * Every way a release's title could split into an artist and what follows them, at each dash —
 * `Artist - Album` as most name it, and `Artist-Album-Tags` as scene releases do, where an artist
 * such as Jay-Z has a dash of their own.
 *
 * @param title - The release's title.
 * @returns Each artist and the rest, first dash first.
 */
const splitsOf = (title: string): Array<{ artist: string; rest: string }> =>
  [...title.matchAll(DASHES)].map((dash) => ({
    artist: title.slice(0, dash.index),
    rest: title.slice(dash.index + dash[0].length),
  }));

/**
 * The album a release's name could be, from what follows its artist: all of it, or only up to one
 * of its later dashes, where scene tags follow — without bracketed editions either way.
 *
 * @param rest - What follows the artist.
 * @returns The titles it could be.
 */
const albumsOf = (rest: string): string[] => [
  withoutEditions(rest),
  ...[...rest.matchAll(DASHES)].map((dash) => withoutEditions(rest.slice(0, dash.index))),
];

/**
 * Which of a music request's albums a release holds: one named `Artist - Album` for the artist
 * asked for, or one they go by, and an album waited for — whatever edition or year it names, since
 * a remaster is still the album. Where the artist is not checked, as when a release was picked by
 * hand, the album alone is.
 *
 * @param request - What was asked for.
 * @param items - Its albums.
 * @param title - The title the release's name gives.
 * @param isArtistChecked - Whether the release must name the artist.
 * @returns The albums it holds.
 */
const albumsInRelease = <Item extends Matchable>(
  request: Pick<MediaRequestRecord, 'title' | 'artistName' | 'aliases'>,
  items: readonly Item[],
  title: string,
  isArtistChecked = true,
): Item[] => {
  const artists = [request.artistName ?? request.title, ...request.aliases];
  const albums = splitsOf(title)
    .filter(
      (split) => !isArtistChecked || artists.some((artist) => isSameTitle(split.artist, artist)),
    )
    .flatMap((split) => albumsOf(split.rest));

  return items.filter((item) =>
    albums.some(
      (album) => isSameTitle(album, item.title) || isSameTitle(album, withoutEditions(item.title)),
    ),
  );
};

export { albumsInRelease };
