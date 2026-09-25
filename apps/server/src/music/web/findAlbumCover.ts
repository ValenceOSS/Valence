import { z } from 'zod';
import { quotedForMusicBrainz } from './quotedForMusicBrainz';
import { tidyAlbumTitle } from './tidyAlbumTitle';
import type { MusicWeb } from './createMusicWeb';

const SURE_ENOUGH = 90;

const ReleaseGroupsSchema = z.object({
  'release-groups': z
    .array(z.object({ id: z.string().min(1), score: z.number().catch(0) }))
    .catch([]),
});

type AlbumToFind = {
  title: string;
  artistName: string;
  musicbrainzId: string | null;
};

/**
 * Finds an album's front cover on the Cover Art Archive.
 *
 * An album whose tags carry its MusicBrainz release is asked for by that, which cannot pick the
 * wrong record. Otherwise MusicBrainz is searched for the album by title and artist, and the cover
 * is only taken where it is sure of the match — a near miss would put another record's cover on
 * this one, which is worse than none. A title a ripper has added a year or an edition to is searched
 * for again without it, since the catalogue names the record itself.
 *
 * @param web - The way out to the web.
 * @param album - What the album is called, who it is by, and its MusicBrainz release where tagged.
 * @returns The cover, or nothing where none was found.
 */
const findAlbumCover = async (web: MusicWeb, album: AlbumToFind): Promise<Uint8Array | null> => {
  if (album.musicbrainzId !== null) {
    const tagged = await web.bytes(
      `https://coverartarchive.org/release/${encodeURIComponent(album.musicbrainzId)}/front-1200`,
    );

    if (tagged !== null) {
      return tagged;
    }
  }

  const titles = [...new Set([album.title, tidyAlbumTitle(album.title)])].filter(
    (title) => title !== '',
  );

  let best: { id: string } | undefined;

  for (const title of titles) {
    // eslint-disable-next-line valence/no-hard-coded-strings -- MusicBrainz query syntax
    const query = `releasegroup:${quotedForMusicBrainz(title)} AND artist:${quotedForMusicBrainz(album.artistName)}`;
    const found = ReleaseGroupsSchema.safeParse(
      await web.json(
        `https://musicbrainz.org/ws/2/release-group/?query=${encodeURIComponent(query)}&fmt=json&limit=3`,
      ),
    );

    best = found.success
      ? found.data['release-groups'].find((group) => group.score >= SURE_ENOUGH)
      : undefined;

    if (best !== undefined) {
      break;
    }
  }

  return best === undefined
    ? null
    : web.bytes(
        `https://coverartarchive.org/release-group/${encodeURIComponent(best.id)}/front-1200`,
      );
};

export type { AlbumToFind };

export { findAlbumCover };
