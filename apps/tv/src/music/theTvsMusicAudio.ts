import { createAudioPlayer } from 'expo-audio';
import { dressTheSystemsPlayer } from '@ValenceTv/audio/dressTheSystemsPlayer';
import { playInTheBackground } from '@ValenceTv/audio/playInTheBackground';
import type { AudioPlayer } from 'expo-audio';
import type { MusicAudio } from '@ValenceClient/platform/Platform.types';

const STATUS_EVERY_MS = 250;

const UNPLAYABLE = new Set(['audio/ogg; codecs="opus"', 'audio/ogg; codecs="vorbis"']);

let made: MusicAudio | null = null;

let player: AudioPlayer | null = null;

/**
 * The television's music audio: a player of the system's own, kept for music alone, played in the
 * background too.
 *
 * @returns The audio, and whether the television plays a kind of file as it is.
 */
const theTvsMusicAudio = (): MusicAudio => {
  if (made !== null) {
    return made;
  }

  const system = createAudioPlayer(null, { updateInterval: STATUS_EVERY_MS });

  player = system;
  playInTheBackground();
  made = { audio: dressTheSystemsPlayer(system), canPlay: (type) => !UNPLAYABLE.has(type) };

  return made;
};

/**
 * The system's player the television's music plays through, for telling the system what is
 * playing.
 *
 * @returns The player, made along with the audio if nothing had asked for either yet.
 */
const theTvsMusicPlayer = (): AudioPlayer => {
  theTvsMusicAudio();

  return player ?? createAudioPlayer(null);
};

export { theTvsMusicAudio, theTvsMusicPlayer };
