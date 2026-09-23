import { requireOptionalNativeModule } from 'expo';
import { z } from 'zod';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import type { MusicPlayer } from '@ValenceClient/music/createMusicPlayer';
import type { NativeMusic } from './NativeMusic.types';

const RemoteSchema = z.object({
  command: z.enum(['play', 'pause', 'toggle', 'next', 'previous', 'seek']),
  seconds: z.number().optional(),
});

let made: MusicPlayer | null = null;

/**
 * The one music player this phone has, made the first time it is asked for and kept for as long
 * as the app runs, so music carries on from screen to screen and with the app closed.
 *
 * It is the client's player, which plays through the phone's speaker. Whatever is playing is put on
 * the lock screen and in Control Centre with its album's cover, and their buttons — and a pair of
 * headphones' — do what the same buttons in the app do.
 *
 * @returns The player.
 */
const thePhonesMusicPlayer = (): MusicPlayer => {
  if (made !== null) {
    return made;
  }

  const speaker = requireOptionalNativeModule<NativeMusic>('ValenceMusic');

  if (speaker === null) {
    throw new Error('This build of Valence cannot play music.');
  }

  const player = theMusicPlayer();
  let described: string | null = null;

  player.subscribe(() => {
    const current = player.read().current;

    if (current === null || current.id === described) {
      described = current?.id ?? null;

      return;
    }

    described = current.id;
    speaker.describe({
      title: current.title,
      artist: current.artists.map((artist) => artist.name).join(', '),
      album: current.album.title,
      artwork: current.album.hasArtwork ? onThisServer(albumArtworkUrl(current.album.id)) : null,
    });
  });

  speaker.addListener('onRemote', (said) => {
    const read = RemoteSchema.safeParse(said);

    if (!read.success) {
      return;
    }

    switch (read.data.command) {
      case 'play':
        player.resume();
        break;
      case 'pause':
        player.pause();
        break;
      case 'toggle':
        player.toggle();
        break;
      case 'next':
        player.next();
        break;
      case 'previous':
        player.previous();
        break;
      case 'seek':
        player.seek(read.data.seconds ?? 0);
        break;
    }
  });

  made = player;

  return player;
};

export { thePhonesMusicPlayer };
