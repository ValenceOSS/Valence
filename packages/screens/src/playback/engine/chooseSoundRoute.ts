import { canEncodeAudio } from 'mediabunny';
import type { InputAudioTrack } from 'mediabunny';

const RE_ENCODINGS = [
  { codec: 'opus', parameter: 'opus' },
  { codec: 'aac', parameter: 'mp4a.40.2' },
] as const;

const SAMPLE_RATE = 48_000;

type SoundRoute =
  | { kind: 'carried'; parameter: string }
  | { kind: 'encoded'; codec: 'opus' | 'aac'; parameter: string; numberOfChannels: number };

/**
 * How a sound track reaches the media element: as it is, where the element plays its codec from
 * fragmented MP4, or decoded here and encoded again — as Opus or AAC with every channel it has
 * where this browser can encode that many, and as stereo Opus where it cannot.
 *
 * @param track - The sound track.
 * @param plays - What the element plays through Media Source Extensions.
 * @returns The route.
 */
const chooseSoundRoute = async (
  track: Pick<InputAudioTrack, 'getCodecParameterString' | 'getNumberOfChannels'>,
  plays: (mimeType: string) => boolean,
): Promise<SoundRoute> => {
  const own = await track.getCodecParameterString();

  if (own !== null && plays(`audio/mp4; codecs="${own}"`)) {
    return { kind: 'carried', parameter: own };
  }

  const channels = await track.getNumberOfChannels();

  for (const { codec, parameter } of RE_ENCODINGS) {
    if (
      channels > 2 &&
      plays(`audio/mp4; codecs="${parameter}"`) &&
      (await canEncodeAudio(codec, { numberOfChannels: channels, sampleRate: SAMPLE_RATE }))
    ) {
      return { kind: 'encoded', codec, parameter, numberOfChannels: channels };
    }
  }

  return { kind: 'encoded', codec: 'opus', parameter: 'opus', numberOfChannels: 2 };
};

export type { SoundRoute };

export { chooseSoundRoute };
