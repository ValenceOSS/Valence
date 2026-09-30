import { useQuery } from '@tanstack/react-query';
import { lyricLineAt } from '@ValenceClient/music/lyricLineAt';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import { useWhatIsPlaying } from '@ValenceClient/music/useWhatIsPlaying';
import type { MusicPlayer, MusicPlayerState } from '@ValenceClient/music/createMusicPlayer';
import type { WhatIsPlaying } from '@ValenceClient/music/useWhatIsPlaying';
import type { Lyrics } from '@ValenceContracts/schemas/Music';

/**
 * Follows the song playing and its words: which song it is, its lyrics once they are read, and the
 * line being sung now. Every place that shows the words — their own page, the panel beside the music
 * and the immersive view — reads them the same way through this.
 *
 * @param player - The player to follow, which is the window's own unless a test says otherwise.
 * @param isWanted - Whether the words are needed yet, so none are asked for while nothing shows them.
 * @returns The player and its state, what is playing, its lyrics or null, whether they are still
 *   being read, and the line being sung or -1.
 */
const useSongLyrics = (
  player: MusicPlayer = theMusicPlayer(),
  isWanted = true,
): {
  state: MusicPlayerState;
  player: MusicPlayer;
  shown: WhatIsPlaying | null;
  lyrics: Lyrics | null;
  isReading: boolean;
  at: number;
} => {
  const followed = useMusicPlayer(player, { followsPosition: true });
  const shown = useWhatIsPlaying(followed.state);
  const trackId = shown?.trackId ?? null;
  const asked = useQuery({
    ...musicQueries.lyrics(trackId ?? ''),
    enabled: isWanted && trackId !== null,
  });
  const lyrics = asked.data ?? null;
  const at =
    lyrics === null || !lyrics.isSynced
      ? -1
      : lyricLineAt(lyrics.lines, (shown?.positionSeconds ?? 0) * 1000);

  return { ...followed, shown, lyrics, isReading: asked.isPending, at };
};

export { useSongLyrics };
