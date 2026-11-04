import { describeAudioCodec } from '@ValenceClient/library/describeAudioCodec';
import { describeChannels } from '@ValenceCore/functions/describeTrack';
import { say } from '@ValenceI18n/say';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Says a file's main sound track the way it is sold: its format, its channels, and Atmos where it
 * carries it.
 *
 * @param file - The file.
 * @returns Such as "Dolby Digital+ 5.1 · Atmos", or a dash where the file has no sound.
 */
const describeAudio = (file: MediaSummary): string =>
  file.audio === null || file.audio === undefined
    ? '—'
    : [
        `${describeAudioCodec(file.audio.codec.toLowerCase())} ${describeChannels(file.audio.channels)}`,
        ...(file.audio.isAtmos ? [say('phone.theBadges.shortenedForAPhone.atmos')] : []),
      ].join(' · ');

export { describeAudio };
