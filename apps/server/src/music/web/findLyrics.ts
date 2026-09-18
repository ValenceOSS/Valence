import { z } from 'zod';
import type { MusicWeb } from './createMusicWeb';

const LyricsSchema = z.object({
  syncedLyrics: z.string().nullable().catch(null),
  plainLyrics: z.string().nullable().catch(null),
});

type SongToFind = {
  title: string;
  artistName: string;
  albumTitle: string;
  durationSeconds: number;
};

/**
 * Finds a song's words on LRCLIB, timed to the music where they have been timed.
 *
 * LRCLIB matches on the song's length as well as its names, so a live cut or a radio edit is not
 * given the album version's timings. Timed words are taken over plain ones, since those are what
 * the lyrics page follows along with.
 *
 * @param web - The way out to the web.
 * @param song - What the song is called, who it is by, what it is on and how long it runs.
 * @returns The words, as an LRC file where timed, or nothing where none were found.
 */
const findLyrics = async (web: MusicWeb, song: SongToFind): Promise<string | null> => {
  const query = new URLSearchParams({
    artist_name: song.artistName,
    track_name: song.title,
    album_name: song.albumTitle,
    duration: Math.round(song.durationSeconds).toString(),
  });

  const found = LyricsSchema.safeParse(
    await web.json(`https://lrclib.net/api/get?${query.toString()}`),
  );

  if (!found.success) {
    return null;
  }

  const words = found.data.syncedLyrics ?? found.data.plainLyrics;

  return words === null || words.trim() === '' ? null : words;
};

export type { SongToFind };

export { findLyrics };
