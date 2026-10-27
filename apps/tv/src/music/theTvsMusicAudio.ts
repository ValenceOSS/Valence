import { createAudioPlayer } from 'expo-audio';
import { pairTheSystemsPlayers } from '@ValenceTv/audio/pairTheSystemsPlayers';
import { playInTheBackground } from '@ValenceTv/audio/playInTheBackground';
import type { AudioPlayer } from 'expo-audio';
import type { MusicAudio } from '@ValenceClient/platform/Platform.types';

const STATUS_EVERY_MS = 250;

const UNPLAYABLE = new Set(['audio/ogg; codecs="opus"', 'audio/ogg; codecs="vorbis"']);

const swapListeners = new Set<(playing: AudioPlayer) => void>();

let made: MusicAudio | null = null;

let player: AudioPlayer | null = null;

/**
 * The television's music audio: two players of the system's own, kept for music alone and played
 * in the background too, the next song made ready on one while the other plays so the two run
 * straight on, or fade into each other, with no gap while it loads.
 *
 * @returns The audio, and whether the television plays a kind of file as it is.
 */
const theTvsMusicAudio = (): MusicAudio => {
  if (made !== null) {
    return made;
  }

  const first = createAudioPlayer(null, { updateInterval: STATUS_EVERY_MS });
  const second = createAudioPlayer(null, { updateInterval: STATUS_EVERY_MS });

  player = first;
  playInTheBackground();
  made = {
    audio: pairTheSystemsPlayers(first, second, (playing) => {
      const was = player;

      player = playing;
      was?.clearLockScreenControls();
      swapListeners.forEach((listener) => {
        listener(playing);
      });
    }),
    canPlay: (type) => !UNPLAYABLE.has(type),
  };

  return made;
};

/**
 * The system's player the television's music plays through now, for telling the system what is
 * playing — one of the two, whichever the song playing is on.
 *
 * @returns The player, made along with the audio if nothing had asked for either yet.
 */
const theTvsMusicPlayer = (): AudioPlayer => {
  theTvsMusicAudio();

  return player ?? createAudioPlayer(null);
};

/**
 * Hears each time the music moves on to the other of the television's two players, so whatever
 * follows the one playing can follow it there.
 *
 * @param listener - Told the player that plays now.
 * @returns A way to stop hearing.
 */
const whenTheTvsMusicPlayerChanges = (listener: (playing: AudioPlayer) => void): (() => void) => {
  swapListeners.add(listener);

  return () => {
    swapListeners.delete(listener);
  };
};

export { theTvsMusicAudio, theTvsMusicPlayer, whenTheTvsMusicPlayerChanges };
