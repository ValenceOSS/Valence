import { createAudioPlayer } from 'expo-audio';
import { dressTheSystemsPlayer } from '@ValenceTv/audio/dressTheSystemsPlayer';
import { playInTheBackground } from '@ValenceTv/audio/playInTheBackground';
import type { AudioPlayer } from 'expo-audio';
import type { ListeningAudio } from '@ValenceClient/books/createAudiobookPlayer';

const STATUS_EVERY_MS = 500;

let made: ListeningAudio | null = null;

let player: AudioPlayer | null = null;

/**
 * The television's audiobook audio: a player of the system's own beside the music's, so a book and
 * a song each keep their place, played in the background too.
 *
 * @returns The audio.
 */
const theTvsListeningAudio = (): ListeningAudio => {
  if (made !== null) {
    return made;
  }

  const system = createAudioPlayer(null, { updateInterval: STATUS_EVERY_MS });

  player = system;
  playInTheBackground();
  made = dressTheSystemsPlayer(system);

  return made;
};

/**
 * The system's player the television's audiobooks play through, for telling the system what is
 * playing.
 *
 * @returns The player, made along with the audio if nothing had asked for either yet.
 */
const theTvsListeningPlayer = (): AudioPlayer => {
  theTvsListeningAudio();

  return player ?? createAudioPlayer(null);
};

export { theTvsListeningAudio, theTvsListeningPlayer };
