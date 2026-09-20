import { z } from 'zod';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';

const MOST_CHARTED = 20;

const AlbumChartSchema = z.object({
  data: z
    .array(
      z
        .object({
          id: z.number().int().positive(),
          title: z.string(),
          cover_medium: z.string().nullable().catch(null),
          artist: z.object({ name: z.string() }),
        })
        .nullable()
        .catch(null),
    )
    .catch([]),
});

const ArtistChartSchema = z.object({
  data: z
    .array(
      z
        .object({
          id: z.number().int().positive(),
          name: z.string(),
          picture_medium: z.string().nullable().catch(null),
        })
        .nullable()
        .catch(null),
    )
    .catch([]),
});

type ChartedAlbum = { deezerId: number; title: string; artist: string; coverUrl: string | null };

type ChartedArtist = { deezerId: number; name: string; pictureUrl: string | null };

type DeezerCharts = { albums: ChartedAlbum[]; artists: ChartedArtist[] };

/**
 * Reads what is popular in music now, from Deezer's public charts, which need no key and are told
 * nothing about who is asking: the albums and artists most listened to, with their covers and
 * pictures. MusicBrainz, which everything else about music comes from, keeps no such thing.
 *
 * @param web - The way out to the web.
 * @returns The charted albums and artists, or none of either where Deezer could not be asked.
 */
const readDeezerCharts = async (web: MusicWeb): Promise<DeezerCharts> => {
  const [albums, artists] = await Promise.all([
    web.json(`https://api.deezer.com/chart/0/albums?limit=${MOST_CHARTED.toString()}`),
    web.json(`https://api.deezer.com/chart/0/artists?limit=${MOST_CHARTED.toString()}`),
  ]);
  const readAlbums = AlbumChartSchema.safeParse(albums);
  const readArtists = ArtistChartSchema.safeParse(artists);

  return {
    albums: readAlbums.success
      ? readAlbums.data.data.flatMap((album) =>
          album === null
            ? []
            : [
                {
                  deezerId: album.id,
                  title: album.title,
                  artist: album.artist.name,
                  coverUrl: album.cover_medium,
                },
              ],
        )
      : [],
    artists: readArtists.success
      ? readArtists.data.data.flatMap((artist) =>
          artist === null
            ? []
            : [{ deezerId: artist.id, name: artist.name, pictureUrl: artist.picture_medium }],
        )
      : [],
  };
};

export type { ChartedAlbum, ChartedArtist, DeezerCharts };

export { readDeezerCharts };
