import { useCallback, useRef, useSyncExternalStore } from 'react';
import { theMusicPlayer } from './theMusicPlayer';
import type { MusicPlayer, MusicPlayerState } from '@ValenceClient/music/createMusicPlayer';

type Following = {
  followsPosition?: boolean;
};

type BeyondPosition = Exclude<keyof MusicPlayerState, 'positionSeconds'>;

const COMPARED: readonly BeyondPosition[] = [
  'queue',
  'current',
  'isPlaying',
  'isLoading',
  'durationSeconds',
  'volume',
  'isMuted',
  'quality',
  'playingQuality',
  'problem',
  'remote',
];

/**
 * Whether two readings of the player differ in anything but how far through the song it is. A
 * field added to what the player says must be added to the fields compared here, or a change to it
 * alone will not draw anything again.
 *
 * @param one - One reading.
 * @param other - The other.
 * @returns Whether anything else changed.
 */
const differsBeyondPosition = (one: MusicPlayerState, other: MusicPlayerState): boolean =>
  COMPARED.some((key) => one[key] !== other[key]);

/**
 * Reads the window's music player, drawing again whenever it changes.
 *
 * The song's position moves several times a second while it plays, and almost nothing on the page
 * shows it — a list of songs, a shelf of albums, the menu beside every row. So by default a change
 * in the position alone draws nothing again, and the reading keeps the position it last drew with;
 * only what shows where the song has got to — the bar's scrubber, the words — asks to follow it.
 * Without this every song, tile and menu on the page was drawn again with every tick.
 *
 * @param player - The player to read, which is the window's own unless a test says otherwise.
 * @param following - Whether to draw again as the song's position moves.
 * @returns What it is doing, and the player to tell what to do.
 */
const useMusicPlayer = (
  player: MusicPlayer = theMusicPlayer(),
  { followsPosition = false }: Following = {},
): { state: MusicPlayerState; player: MusicPlayer } => {
  const drawnRef = useRef<MusicPlayerState | null>(null);

  const read = useCallback((): MusicPlayerState => {
    const now = player.read();
    const drawn = drawnRef.current;

    if (followsPosition || drawn === null || differsBeyondPosition(drawn, now)) {
      drawnRef.current = now;

      return now;
    }

    return drawn;
  }, [player, followsPosition]);

  const state = useSyncExternalStore(player.subscribe, read, read);

  return { state, player };
};

export { useMusicPlayer };
