import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import type { MusicPlayer, MusicPlayerState } from '@ValenceClient/music/createMusicPlayer';

/**
 * The phone's music player, and what it is doing now, kept current as it changes — but for how far
 * through the song it is, which only what shows it asks to follow.
 *
 * @param following - Whether to draw again as the song's position moves.
 * @returns The player, to tell it what to do, and its state, to draw.
 */
const useTheMusic = (
  following: { followsPosition?: boolean } = {},
): { player: MusicPlayer; state: MusicPlayerState } =>
  useMusicPlayer(thePhonesMusicPlayer(), following);

export { useTheMusic };
