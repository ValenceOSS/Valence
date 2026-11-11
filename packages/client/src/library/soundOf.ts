import { describeChannels } from '@ValenceCore/functions/describeTrack';
import { describeAudioCodec } from '@ValenceClient/library/describeAudioCodec';
import type { AudioStreamFacts, Sound } from './soundOf.types';

const NAMED_SOUNDS: ReadonlySet<string> = new Set(['truehd', 'eac3', 'ac3']);

/**
 * How a soundtrack is sold: Dolby Atmos on its own where there is Atmos, since that says more than
 * a channel count; otherwise the format by name, Dolby Digital+ or DTS-HD MA, and its channels,
 * 5.1 or 7.1. Stereo and an unremarkable format are left unsaid, since everything has them.
 *
 * @param stream - The soundtrack, where there is one.
 * @returns Its format and its channels, each where it is worth saying.
 */
const soundOf = (stream: AudioStreamFacts | null | undefined): Sound => {
  if (stream === null || stream === undefined) {
    return { format: null, channels: null };
  }

  if (stream.isAtmos) {
    return { format: describeAudioCodec('atmos'), channels: null };
  }

  return {
    format:
      stream.codec === 'dts'
        ? stream.profile?.includes('MA') === true
          ? 'DTS-HD MA'
          : 'DTS'
        : NAMED_SOUNDS.has(stream.codec)
          ? describeAudioCodec(stream.codec)
          : null,
    channels: stream.channels > 2 ? describeChannels(stream.channels) : null,
  };
};

export { soundOf };
