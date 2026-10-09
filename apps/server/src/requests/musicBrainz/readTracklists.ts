import { MusicBrainzReleasePageSchema } from '@ValenceServer/requests/musicBrainz/MusicBrainzReleasePageSchema';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';

type Tracklist = { trackCount: number; recordings: readonly string[] };

const PAGE = 100;

const MOST_PAGES = 10;

/**
 * The tracks of every official release an artist or a release group has, kept as the longest
 * edition of each release group: how many tracks it has, and which recordings they are. Read a
 * page at a time, since MusicBrainz answers once a second.
 *
 * @param web - The way out to the web, paced as MusicBrainz asks.
 * @param of - The artist, or the one release group, whose releases to read.
 * @returns Each release group's longest edition, by its id; empty where MusicBrainz cannot be
 *   asked.
 */
const readTracklists = async (
  web: MusicWeb,
  of: { artist: string } | { releaseGroup: string },
): Promise<Map<string, Tracklist>> => {
  const filter =
    'artist' in of
      ? `artist=${encodeURIComponent(of.artist)}`
      : `release-group=${encodeURIComponent(of.releaseGroup)}`;
  const longest = new Map<string, Tracklist>();

  for (let page = 0; page < MOST_PAGES; page += 1) {
    const read = MusicBrainzReleasePageSchema.safeParse(
      await web.json(
        `https://musicbrainz.org/ws/2/release?${filter}&status=official&inc=recordings+release-groups&limit=${PAGE.toString()}&offset=${(page * PAGE).toString()}&fmt=json`,
      ),
    );

    if (!read.success) {
      break;
    }

    for (const release of read.data.releases) {
      const group =
        release?.['release-group']?.id ?? ('releaseGroup' in of ? of.releaseGroup : null);

      if (release === null || group === null) {
        continue;
      }

      const trackCount = release.media.reduce((sum, medium) => sum + medium['track-count'], 0);
      const known = longest.get(group);

      if (known === undefined || trackCount > known.trackCount) {
        longest.set(group, {
          trackCount,
          recordings: release.media.flatMap((medium) =>
            medium.tracks.flatMap((track) =>
              track.recording === null ? [] : [track.recording.id],
            ),
          ),
        });
      }
    }

    if ((page + 1) * PAGE >= read.data['release-count']) {
      break;
    }
  }

  return longest;
};

export type { Tracklist };

export { readTracklists };
