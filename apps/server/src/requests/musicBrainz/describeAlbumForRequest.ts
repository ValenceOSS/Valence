import { creditedArtistOf } from '@ValenceServer/requests/musicBrainz/creditedArtistOf';
import { catalogueAlbumOf } from '@ValenceServer/requests/musicBrainz/catalogueAlbumOf';
import { MusicBrainzReleaseGroupSchema } from '@ValenceServer/requests/musicBrainz/MusicBrainzReleaseGroupSchema';
import { releaseGroupCoverUrl } from '@ValenceServer/requests/musicBrainz/releaseGroupCoverUrl';
import type { RequestCatalogue } from '@ValenceContracts/schemas/MediaRequest';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';

/**
 * What MusicBrainz knows of an album that a request for it needs: its title, who it is credited
 * to, when it came out, and its cover.
 *
 * @param web - The way out to the web, paced as MusicBrainz asks.
 * @param musicBrainzId - The album's release group's MusicBrainz id.
 * @returns What a request keeps of it, or null where MusicBrainz does not know it or cannot be
 *   asked.
 */
const describeAlbumForRequest = async (
  web: MusicWeb,
  musicBrainzId: string,
): Promise<RequestCatalogue | null> => {
  const read = MusicBrainzReleaseGroupSchema.safeParse(
    await web.json(
      `https://musicbrainz.org/ws/2/release-group/${encodeURIComponent(musicBrainzId)}?inc=artist-credits&fmt=json`,
    ),
  );

  if (!read.success) {
    return null;
  }

  const album = catalogueAlbumOf(read.data);

  return {
    title: album.title,
    year: album.firstReleased === null ? null : Number(album.firstReleased.slice(0, 4)),
    aliases: [],
    overview: read.data.disambiguation === '' ? null : read.data.disambiguation,
    posterUrl: releaseGroupCoverUrl(album.id),
    runtimeMinutes: null,
    releaseDates: { theatrical: null, digital: null, physical: null },
    episodes: [],
    isEnded: false,
    artist: creditedArtistOf(read.data),
    albums: [album],
  };
};

export { describeAlbumForRequest };
