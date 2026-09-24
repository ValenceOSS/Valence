import { requireOptionalNativeModule } from 'expo';
import { speakerAudio } from '@ValencePhone/audio/speakerAudio';
import type { MusicAudio } from '@ValenceClient/platform/Platform.types';
import type { NativeMusic } from '@ValencePhone/music/NativeMusic.types';

/**
 * What the client's music player plays through on a phone: the phone's own speaker for music,
 * which cannot play Ogg, so a track kept as Opus or Vorbis is played from the server's high-quality
 * encode.
 *
 * @param speaker - The phone's music module, or nothing in a build without one.
 * @returns The speaker, and what it can play.
 */
const thePhonesMusicOut = (
  speaker: NativeMusic | null = requireOptionalNativeModule<NativeMusic>('ValenceMusic'),
): MusicAudio => {
  if (speaker === null) {
    throw new Error('This build of Valence cannot play music.');
  }

  return {
    audio: speakerAudio(speaker, 'music'),
    canPlay: (type) => !type.startsWith('audio/ogg'),
  };
};

export { thePhonesMusicOut };
