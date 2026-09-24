import { requireOptionalNativeModule } from 'expo';
import { speakerAudio } from '@ValencePhone/audio/speakerAudio';
import type { ListeningAudio } from '@ValenceClient/books/createAudiobookPlayer';
import type { NativeMusic } from '@ValencePhone/music/NativeMusic.types';

/**
 * What the client's audiobook player plays through on a phone: the phone's own speaker for books,
 * beside the music's, so a book and a song each keep their place.
 *
 * @param speaker - The phone's music module, or nothing in a build without one.
 * @returns The speaker.
 */
const thePhonesListeningAudio = (
  speaker: NativeMusic | null = requireOptionalNativeModule<NativeMusic>('ValenceMusic'),
): ListeningAudio => {
  if (speaker === null) {
    throw new Error('This build of Valence cannot play audiobooks.');
  }

  return speakerAudio(speaker, 'book');
};

export { thePhonesListeningAudio };
