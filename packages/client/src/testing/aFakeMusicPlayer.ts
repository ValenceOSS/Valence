import { vi } from 'vitest';
import { aFakeMusicPlayerWith } from '@ValenceClient/testing/aFakeMusicPlayerWith';
import type { MusicPlayer, MusicPlayerState } from '@ValenceClient/music/createMusicPlayer';

/**
 * A music player that plays nothing and records what it was told, with Vitest's spies.
 *
 * @param start - What it should say it is doing.
 * @returns The player, and a way to change what it says it is doing.
 */
const aFakeMusicPlayer = (
  start: Partial<MusicPlayerState> = {},
): { player: MusicPlayer; set: (change: Partial<MusicPlayerState>) => void } =>
  aFakeMusicPlayerWith(vi.fn, start);

export { aFakeMusicPlayer };
