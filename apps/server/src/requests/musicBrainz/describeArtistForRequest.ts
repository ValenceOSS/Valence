import { z } from 'zod';
import { catalogueAlbumOf } from '@ValenceServer/requests/musicBrainz/catalogueAlbumOf';
import { MusicBrainzReleaseGroupSchema } from '@ValenceServer/requests/musicBrainz/MusicBrainzReleaseGroupSchema';
import { releaseGroupCoverUrl } from '@ValenceServer/requests/musicBrainz/releaseGroupCoverUrl';
import type { RequestCatalogue } from '@ValenceContracts/schemas/MediaRequest';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';

const PAGE = 100;

const MOST_PAGES = 20;

const MOST_ALIASES = 20;

const ArtistSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  disambiguation: z.string().catch(''),
  'life-span': z.object({ ended: z.boolean().nullable().catch(null) }).catch({ ended: null }),
  aliases: z.array(z.object({ name: z.string() }).catch({ name: '' })).catch([]),
});

const ReleaseGroupPageSchema = z.object({
  'release-group-count': z.number().int().nonnegative(),
  'release-groups': z.array(MusicBrainzReleaseGroupSchema.nullable().catch(null)).catch([]),
});

/**
 * What MusicBrainz knows of an artist that a request for them needs: their name and the others they
 * go by, whether they have stopped making records, and every release group they are credited on —
 * read a page at a time — each with its kind and when it came out. The newest album's cover stands
 * for the artist.
 *
 * @param web - The way out to the web, paced as MusicBrainz asks.
 * @param musicBrainzId - The artist's MusicBrainz id.
 * @returns What a request keeps of them, or null where MusicBrainz does not know them or cannot be
 *   asked.
 */
const describeArtistForRequest = async (
  web: MusicWeb,
  musicBrainzId: string,
): Promise<RequestCatalogue | null> => {
  const id = encodeURIComponent(musicBrainzId);
  const artist = ArtistSchema.safeParse(
    await web.json(`https://musicbrainz.org/ws/2/artist/${id}?inc=aliases&fmt=json`),
  );

  if (!artist.success) {
    return null;
  }

  const groups = [];

  for (let page = 0; page < MOST_PAGES; page += 1) {
    const read = ReleaseGroupPageSchema.safeParse(
      await web.json(
        `https://musicbrainz.org/ws/2/release-group?artist=${id}&limit=${PAGE.toString()}&offset=${(page * PAGE).toString()}&fmt=json`,
      ),
    );

    if (!read.success) {
      return null;
    }

    groups.push(...read.data['release-groups'].flatMap((group) => (group === null ? [] : [group])));

    if ((page + 1) * PAGE >= read.data['release-group-count']) {
      break;
    }
  }

  const albums = groups.map(catalogueAlbumOf);
  const newest = albums
    .filter((album) => album.type === 'album' && album.firstReleased !== null)
    .toSorted((left, right) => (right.firstReleased ?? '').localeCompare(left.firstReleased ?? ''))
    .at(0);
  const { name } = artist.data;

  return {
    title: name,
    year: null,
    aliases: [
      ...new Set(
        artist.data.aliases
          .map((alias) => alias.name.trim())
          .filter((alias) => alias !== '' && alias !== name),
      ),
    ].slice(0, MOST_ALIASES),
    overview: artist.data.disambiguation === '' ? null : artist.data.disambiguation,
    posterUrl: newest === undefined ? null : releaseGroupCoverUrl(newest.id),
    runtimeMinutes: null,
    releaseDates: { theatrical: null, digital: null, physical: null },
    episodes: [],
    isEnded: artist.data['life-span'].ended === true,
    artist: name,
    albums,
  };
};

export { describeArtistForRequest };
