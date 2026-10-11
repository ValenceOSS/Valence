import { canEncodeAudio } from 'mediabunny';
import type { InputAudioTrack } from 'mediabunny';

const SURROUND = 6;

const SAMPLE_RATE = 48_000;

type SoundRoute =
  | { kind: 'carried'; parameter: string }
  | {
      kind: 'encoded';
      codec: 'opus' | 'aac';
      parameter: string;
      numberOfChannels: number;
      isReordered: boolean;
    };

/**
 * How a sound track reaches the media element: as it is, where the element plays its codec from
 * fragmented MP4, or decoded here and encoded again. Surround sound stays 5.1 as AAC where this
 * browser encodes six channels of it and the order its encoder reads them in is known — reordered
 * into AAC's own order where that is the one it reads — and is folded into stereo Opus otherwise,
 * since a guessed order puts the dialogue in the wrong speaker.
 *
 * @param track - The sound track.
 * @param plays - What the element plays through Media Source Extensions.
 * @param aacOrder - The order this browser's AAC encoder reads six channels in, where known.
 * @returns The route.
 */
const chooseSoundRoute = async (
  track: Pick<InputAudioTrack, 'getCodecParameterString' | 'getNumberOfChannels'>,
  plays: (mimeType: string) => boolean,
  aacOrder: 'wave' | 'aac' | null,
): Promise<SoundRoute> => {
  const own = await track.getCodecParameterString();

  if (own !== null && plays(`audio/mp4; codecs="${own}"`)) {
    return { kind: 'carried', parameter: own };
  }

  const channels = await track.getNumberOfChannels();

  if (
    channels === SURROUND &&
    aacOrder !== null &&
    plays('audio/mp4; codecs="mp4a.40.2"') &&
    (await canEncodeAudio('aac', { numberOfChannels: SURROUND, sampleRate: SAMPLE_RATE }))
  ) {
    return {
      kind: 'encoded',
      codec: 'aac',
      parameter: 'mp4a.40.2',
      numberOfChannels: SURROUND,
      isReordered: aacOrder === 'aac',
    };
  }

  return {
    kind: 'encoded',
    codec: 'opus',
    parameter: 'opus',
    numberOfChannels: 2,
    isReordered: false,
  };
};

export type { SoundRoute };

export { chooseSoundRoute };
