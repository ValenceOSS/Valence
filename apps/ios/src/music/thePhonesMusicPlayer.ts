import { requireOptionalNativeModule } from 'expo';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { RemoteCommandSchema } from '@ValencePhone/audio/RemoteCommandSchema';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import type { MusicPlayer } from '@ValenceClient/music/createMusicPlayer';
import type { NativeMusic } from '@ValencePhone/music/NativeMusic.types';

let made: MusicPlayer | null = null;

let unwire: (() => void) | null = null;

/**
 * The one music player this phone has, made the first time it is asked for and kept for as long
 * as the app runs, so music carries on from screen to screen and with the app closed.
 *
 * It is the client's player, which plays through the phone's speaker. Whatever is playing is put on
 * the lock screen and in Control Centre with its album's cover, and their buttons — and a pair of
 * headphones' — do what the same buttons in the app do.
 *
 * The client's player is let go on signing out, and a new one made for whoever signs in next, so
 * this follows it: the old one's buttons are let go and the new one is wired in its place.
 *
 * @returns The player.
 */
const thePhonesMusicPlayer = (): MusicPlayer => {
  const player = theMusicPlayer();

  if (player === made) {
    return player;
  }

  unwire?.();

  const speaker = requireOptionalNativeModule<NativeMusic>('ValenceMusic');

  if (speaker === null) {
    throw new Error('This build of Valence cannot play music.');
  }

  let described: string | null = null;

  const unsubscribe = player.subscribe(() => {
    const current = player.read().current;

    if (current === null || current.id === described) {
      described = current?.id ?? null;

      return;
    }

    described = current.id;
    speaker.describe('music', {
      title: current.title,
      artist: current.artists.map((artist) => artist.name).join(', '),
      album: current.album.title,
      artwork: current.album.hasArtwork ? onThisServer(albumArtworkUrl(current.album.id)) : null,
      from: null,
      lasts: null,
    });
  });

  const listening = speaker.addListener('onRemote', (said) => {
    const read = RemoteCommandSchema.safeParse(said);

    if (!read.success || read.data.channel !== 'music') {
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
      case 'back':
      case 'forward':
      case 'rate':
        break;
    }
  });

  unwire = () => {
    unsubscribe();
    listening.remove();
  };
  made = player;

  return player;
};

export { thePhonesMusicPlayer };
