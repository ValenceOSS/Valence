import { z } from 'zod';
import type { MusicWeb } from './createMusicWeb';

const ArtistsSchema = z.object({
  artists: z
    .array(
      z.object({
        idArtist: z.string().min(1),
        strArtist: z.string().catch(''),
        strArtistThumb: z.string().nullable().catch(null),
      }),
    )
    .nullable()
    .catch(null),
});

const VideosSchema = z.object({
  mvids: z
    .array(
      z.object({ strTrack: z.string().catch(''), strMusicVid: z.string().nullable().catch(null) }),
    )
    .nullable()
    .catch(null),
});

type ArtistVideo = {
  title: string;
  youtubeId: string;
};

type ArtistLooks = {
  picture: Uint8Array | null;
  videos: ArtistVideo[];
};

/**
 * Reads the YouTube video a link points at, however it was written — a watch page, a short link or
 * an embed.
 *
 * @param link - The link.
 * @returns The video's id, or nothing where the link is not to a YouTube video.
 */
const youtubeIdIn = (link: string): string | null => {
  const found = /(?:youtu\.be\/|[?&]v=|\/embed\/)([\w-]{11})/.exec(link);

  return found?.[1] ?? null;
};

/**
 * Finds an artist's photograph and music videos on TheAudioDB.
 *
 * The artist is only taken where the name found is the name asked for, so an artist sharing most of
 * a name with somebody better known is not given their face. Videos come back with the song each is
 * for, to be matched to the library's songs by title.
 *
 * @param web - The way out to the web.
 * @param key - The TheAudioDB key to ask with.
 * @param name - The artist.
 * @returns Their photograph and videos, where any were found.
 */
const findArtistLooks = async (web: MusicWeb, key: string, name: string): Promise<ArtistLooks> => {
  const base = `https://www.theaudiodb.com/api/v1/json/${encodeURIComponent(key)}`;
  const found = ArtistsSchema.safeParse(
    await web.json(`${base}/search.php?s=${encodeURIComponent(name)}`),
  );

  const artist = found.success
    ? (found.data.artists ?? []).find(
        (one) => one.strArtist.trim().toLowerCase() === name.trim().toLowerCase(),
      )
    : undefined;

  if (artist === undefined) {
    return { picture: null, videos: [] };
  }

  const picture =
    artist.strArtistThumb === null || artist.strArtistThumb === ''
      ? null
      : await web.bytes(artist.strArtistThumb);

  const listed = VideosSchema.safeParse(
    await web.json(`${base}/mvid.php?i=${encodeURIComponent(artist.idArtist)}`),
  );

  const videos = (listed.success ? (listed.data.mvids ?? []) : []).flatMap((video) => {
    const youtubeId = video.strMusicVid === null ? null : youtubeIdIn(video.strMusicVid);

    return youtubeId === null || video.strTrack === ''
      ? []
      : [{ title: video.strTrack, youtubeId }];
  });

  return { picture, videos };
};

export type { ArtistLooks, ArtistVideo };

export { findArtistLooks, youtubeIdIn };
